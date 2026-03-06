import {getAwakenerIdentityKey} from '@/domain/awakener-identity';
import type {DecodedImport} from '@/domain/import-export';
import {createEmptyTeamSlots} from '@/pages/builder/constants';
import {MAX_TEAMS} from '@/pages/builder/team-collection';
import {
  getNonDuplicateRuleViolations,
  validateBuilderTeams,
  validateBuilderTeamsStrict,
} from '@/pages/builder/team-validation';
import type {Team} from '@/pages/builder/types';

export interface ImportConflict {
  readonly kind: 'awakener' | 'wheel' | 'posse';
  readonly value: string;
  readonly fromTeamId: string;
  readonly fromTeamName: string;
}

export type SingleImportStrategy = 'move' | 'skip' | 'cancel';

export type PreparedImport =
  | {readonly status: 'error'; readonly message: string}
  | {readonly status: 'requires_duplicate_override'}
  | {
      readonly status: 'requires_replace';
      readonly teams: readonly Team[];
      readonly activeTeamIndex: number;
    }
  | {
      readonly status: 'requires_strategy';
      readonly team: Team;
      readonly conflicts: readonly ImportConflict[];
    }
  | {readonly status: 'ready'; readonly teams: readonly Team[]};

interface PrepareImportOptions {
  readonly allowDupes?: boolean;
}

interface TeamUsageSnapshot {
  readonly awakenerKeys: Set<string>;
  readonly wheelIds: Set<string>;
  readonly posseIds: Set<string>;
}

function cloneTeam(team: Team): Team {
  return {
    ...team,
    slots: team.slots.map((slot) => ({
      ...slot,
      wheels: [...slot.wheels] as [string | null, string | null],
    })),
  };
}

function cloneTeams(teams: readonly Team[]): readonly Team[] {
  return teams.map(cloneTeam);
}

function stripSlotAwakener(slot: Team['slots'][number]) {
  return {
    ...slot,
    awakenerName: undefined,
    realm: undefined,
    level: undefined,
    wheels: [null, null] as [null, null],
  };
}

function collectTeamUsage(teams: readonly Team[]): TeamUsageSnapshot {
  const usage: TeamUsageSnapshot = {
    awakenerKeys: new Set<string>(),
    wheelIds: new Set<string>(),
    posseIds: new Set<string>(),
  };

  teams.forEach((team) => {
    if (team.posseId) {
      usage.posseIds.add(team.posseId);
    }
    team.slots.forEach((slot) => {
      if (slot.awakenerName) {
        usage.awakenerKeys.add(getAwakenerIdentityKey(slot.awakenerName));
      }
      slot.wheels.forEach((wheelId) => {
        if (wheelId) {
          usage.wheelIds.add(wheelId);
        }
      });
    });
  });

  return usage;
}

function collectImportedAwakenerKeys(team: Team): Set<string> {
  return new Set(
    team.slots
      .map((slot) => slot.awakenerName)
      .filter((name): name is string => Boolean(name))
      .map((name) => getAwakenerIdentityKey(name)),
  );
}

function collectImportedWheels(team: Team): Set<string> {
  return new Set(
    team.slots
      .flatMap((slot) => slot.wheels)
      .filter((wheelId): wheelId is string => Boolean(wheelId)),
  );
}

function normalizeImportedTeamName(
  currentTeams: readonly Team[],
  preferredName: string,
): string {
  const base = preferredName.trim() || 'Imported Team';
  const names = new Set(currentTeams.map((team) => team.name));
  const defaultTeamMatch = /^Team\s+(\d+)$/i.exec(base);
  if (defaultTeamMatch) {
    let nextDefaultIndex = 1;
    for (const name of names) {
      const match = /^Team\s+(\d+)$/i.exec(name);
      if (!match) {
        continue;
      }
      nextDefaultIndex = Math.max(nextDefaultIndex, Number(match[1]) + 1);
    }
    return `Team ${String(nextDefaultIndex)}`;
  }
  if (!names.has(base)) {
    return base;
  }
  let suffix = 2;
  while (names.has(`${base} (${String(suffix)})`)) {
    suffix += 1;
  }
  return `${base} (${String(suffix)})`;
}

function validateOrError(
  teams: readonly Team[],
  options?: PrepareImportOptions,
): PreparedImport | null {
  const strictValidation = validateBuilderTeamsStrict(teams);
  if (!strictValidation.isValid) {
    const nonDuplicateViolations = getNonDuplicateRuleViolations(
      strictValidation.violations,
    );
    if (nonDuplicateViolations.length > 0) {
      return {
        status: 'error',
        message:
          nonDuplicateViolations[0]?.message ?? 'Import validation failed.',
      };
    }
    if (!options?.allowDupes) {
      return {status: 'requires_duplicate_override'};
    }
  }

  const validation = validateBuilderTeams(teams, {
    allowDupes: options?.allowDupes,
  });
  if (validation.isValid) {
    return null;
  }
  return {
    status: 'error',
    message: validation.violations[0]?.message ?? 'Import validation failed.',
  };
}

function withFreshImportedTeam(
  currentTeams: readonly Team[],
  team: Team,
): Team {
  const nextSlots = createEmptyTeamSlots().map((slot, index) => ({
    ...slot,
    ...team.slots[index],
    slotId: slot.slotId,
    wheels: [...(team.slots[index]?.wheels ?? [null, null])] as [
      string | null,
      string | null,
    ],
  }));
  return {
    ...team,
    id: `team-${crypto.randomUUID()}`,
    name: normalizeImportedTeamName(currentTeams, team.name),
    slots: nextSlots,
  };
}

function findSingleTeamConflicts(
  currentTeams: readonly Team[],
  importedTeam: Team,
  options?: PrepareImportOptions,
): readonly ImportConflict[] {
  if (options?.allowDupes) return [];

  const conflicts: ImportConflict[] = [];
  const seen = new Set<string>();

  const importedAwakeners = collectImportedAwakenerKeys(importedTeam);
  const importedWheels = collectImportedWheels(importedTeam);

  const addConflict = (
    kind: ImportConflict['kind'],
    value: string,
    team: Team,
  ) => {
    const key = `${kind}:${value}:${team.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      conflicts.push({
        kind,
        value,
        fromTeamId: team.id,
        fromTeamName: team.name,
      });
    }
  };

  const checkTeamSlots = (team: Team) => {
    for (const slot of team.slots) {
      if (
        slot.awakenerName &&
        importedAwakeners.has(getAwakenerIdentityKey(slot.awakenerName))
      ) {
        addConflict(
          'awakener',
          getAwakenerIdentityKey(slot.awakenerName),
          team,
        );
      }

      for (const wheelId of slot.wheels) {
        if (wheelId && importedWheels.has(wheelId)) {
          addConflict('wheel', wheelId, team);
        }
      }
    }
  };

  currentTeams.forEach(checkTeamSlots);
  const posseOwner =
    importedTeam.posseId &&
    currentTeams.find((t) => t.posseId === importedTeam.posseId);
  if (posseOwner && importedTeam.posseId) {
    conflicts.push({
      kind: 'posse',
      value: importedTeam.posseId,
      fromTeamId: posseOwner.id,
      fromTeamName: posseOwner.name,
    });
  }

  return conflicts;
}

function applyMoveStrategy(
  currentTeams: readonly Team[],
  importedTeam: Team,
): readonly Team[] {
  const importedAwakenerKeys = collectImportedAwakenerKeys(importedTeam);
  const importedWheels = collectImportedWheels(importedTeam);

  return currentTeams.map((team) => {
    const nextSlots = team.slots.map((slot) => {
      const slotAwakenerKey = slot.awakenerName
        ? getAwakenerIdentityKey(slot.awakenerName)
        : null;
      const shouldClearAwakener = slotAwakenerKey
        ? importedAwakenerKeys.has(slotAwakenerKey)
        : false;
      const nextWheels: [string | null, string | null] = [
        slot.wheels[0] && importedWheels.has(slot.wheels[0])
          ? null
          : slot.wheels[0],
        slot.wheels[1] && importedWheels.has(slot.wheels[1])
          ? null
          : slot.wheels[1],
      ];

      if (shouldClearAwakener) {
        return stripSlotAwakener(slot);
      }
      return {
        ...slot,
        wheels: nextWheels,
      };
    });

    return {
      ...team,
      posseId: team.posseId === importedTeam.posseId ? undefined : team.posseId,
      slots: nextSlots,
    };
  });
}

function applySkipStrategy(
  currentTeams: readonly Team[],
  importedTeam: Team,
): Team {
  const usage = collectTeamUsage(currentTeams);

  const nextSlots = importedTeam.slots.map((slot) => {
    if (
      slot.awakenerName &&
      usage.awakenerKeys.has(getAwakenerIdentityKey(slot.awakenerName))
    ) {
      return stripSlotAwakener(slot);
    }

    return {
      ...slot,
      wheels: [
        slot.wheels[0] && usage.wheelIds.has(slot.wheels[0])
          ? null
          : slot.wheels[0],
        slot.wheels[1] && usage.wheelIds.has(slot.wheels[1])
          ? null
          : slot.wheels[1],
      ] as [string | null, string | null],
    };
  });

  return {
    ...importedTeam,
    posseId:
      importedTeam.posseId && usage.posseIds.has(importedTeam.posseId)
        ? undefined
        : importedTeam.posseId,
    slots: nextSlots,
  };
}

export function prepareImport(
  decoded: DecodedImport,
  currentTeams: readonly Team[],
  options?: PrepareImportOptions,
): PreparedImport {
  if (decoded.kind === 'multi') {
    if (decoded.teams.length > MAX_TEAMS) {
      return {
        status: 'error',
        message: `A maximum of ${String(MAX_TEAMS)} teams is allowed.`,
      };
    }
    const importedTeams: Team[] = [];
    decoded.teams.forEach((team) => {
      importedTeams.push(withFreshImportedTeam(importedTeams, team));
    });
    const maybeInvalid = validateOrError(importedTeams, options);
    if (maybeInvalid) {
      return maybeInvalid;
    }
    return {
      status: 'requires_replace',
      teams: importedTeams,
      activeTeamIndex: Math.min(
        decoded.activeTeamIndex,
        importedTeams.length - 1,
      ),
    };
  }

  if (currentTeams.length >= MAX_TEAMS) {
    return {
      status: 'error',
      message: `Cannot import: team limit (${String(MAX_TEAMS)}) reached.`,
    };
  }
  const importedTeam = withFreshImportedTeam(currentTeams, decoded.team);
  const conflicts = findSingleTeamConflicts(
    currentTeams,
    importedTeam,
    options,
  );
  if (conflicts.length > 0) {
    return {
      status: 'requires_strategy',
      team: importedTeam,
      conflicts,
    };
  }

  const nextTeams = [...currentTeams.map(cloneTeam), importedTeam];
  const maybeInvalid = validateOrError(nextTeams, options);
  if (maybeInvalid) {
    return maybeInvalid;
  }
  return {
    status: 'ready',
    teams: nextTeams,
  };
}

export function applySingleImportStrategy(
  currentTeams: readonly Team[],
  importedTeam: Team,
  strategy: SingleImportStrategy,
  options?: PrepareImportOptions,
): PreparedImport {
  if (strategy === 'cancel') {
    return {status: 'error', message: 'Import cancelled.'};
  }

  const baseTeams = cloneTeams(currentTeams);
  const preparedTeam =
    strategy === 'move'
      ? importedTeam
      : applySkipStrategy(baseTeams, importedTeam);
  const movedTeams =
    strategy === 'move'
      ? applyMoveStrategy(baseTeams, importedTeam)
      : baseTeams;
  const nextTeams = [...movedTeams, preparedTeam];
  const maybeInvalid = validateOrError(nextTeams, options);
  if (maybeInvalid) {
    return maybeInvalid;
  }
  return {status: 'ready', teams: nextTeams};
}
