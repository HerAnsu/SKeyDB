import {
  decodeImportCode,
  encodeMultiTeamCode,
  encodeSingleTeamCode,
  type DecodedImport,
} from '@/domain/import-export';
import {encodeIngameTeamCode} from '@/domain/ingame-codec';
import {
  applySingleImportStrategy,
  prepareImport,
  type ImportConflict,
  type PreparedImport,
  type SingleImportStrategy,
} from '@/pages/builder/import-planner';
import {
  hasDuplicateRuleViolation,
  validateBuilderTeamsStrict,
} from '@/pages/builder/team-validation';
import type {Team, TeamSlot} from '@/pages/builder/types';
import {useMemo, useState, type Dispatch, type SetStateAction} from 'react';

interface ReplaceTargetTeam {
  readonly id: string;
  readonly name: string;
}

interface PendingReplaceImport {
  readonly teams: readonly Team[];
  readonly activeTeamIndex: number;
  readonly importWarningMessage?: string;
}

interface PendingStrategyImport {
  readonly team: Team;
  readonly conflicts: readonly ImportConflict[];
  readonly plannerBaseTeams: readonly Team[];
  readonly replaceIntoTeam?: ReplaceTargetTeam;
  readonly importWarningMessage?: string;
}

type PendingDuplicateOverrideImport =
  | {
      readonly kind: 'decoded';
      readonly decoded: DecodedImport;
      readonly plannerBaseTeams: readonly Team[];
      readonly replaceIntoTeam?: ReplaceTargetTeam;
      readonly importWarningMessage?: string;
    }
  | {
      readonly kind: 'strategy';
      readonly plannerBaseTeams: readonly Team[];
      readonly importedTeam: Team;
      readonly strategy: Exclude<SingleImportStrategy, 'cancel'>;
      readonly replaceIntoTeam?: ReplaceTargetTeam;
      readonly importWarningMessage?: string;
    };

interface ExportDialogState {
  readonly title: string;
  readonly code: string;
  readonly kind: 'standard' | 'ingame';
  readonly duplicateWarning?: string;
}

interface HandlePreparedImportOptions {
  readonly decoded: DecodedImport;
  readonly plannerBaseTeams?: readonly Team[];
  readonly replaceIntoTeam?: ReplaceTargetTeam;
  readonly importWarningMessage?: string;
}

interface UseBuilderImportExportOptions {
  readonly teams: readonly Team[];
  readonly setTeams: Dispatch<SetStateAction<readonly Team[]>>;
  readonly effectiveActiveTeamId: string;
  readonly activeTeam: Team | undefined;
  readonly teamSlots: readonly TeamSlot[];
  readonly allowDupes: boolean;
  readonly setAllowDupes: (allowDupes: boolean) => void;
  readonly setActiveTeamId: (teamId: string) => void;
  readonly setActiveSelection: (selection: null) => void;
  readonly clearTransfer: () => void;
  readonly clearPendingDelete: () => void;
  readonly showToast: (message: string) => void;
}

export function useBuilderImportExport({
  teams,
  setTeams,
  effectiveActiveTeamId,
  activeTeam,
  teamSlots,
  allowDupes,
  setAllowDupes,
  setActiveTeamId,
  setActiveSelection,
  clearTransfer,
  clearPendingDelete,
  showToast,
}: UseBuilderImportExportOptions) {
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialog, setExportDialog] = useState<ExportDialogState | null>(
    null,
  );
  const [pendingReplaceImport, setPendingReplaceImport] =
    useState<PendingReplaceImport | null>(null);
  const [pendingStrategyImport, setPendingStrategyImport] =
    useState<PendingStrategyImport | null>(null);
  const [pendingDuplicateOverrideImport, setPendingDuplicateOverrideImport] =
    useState<PendingDuplicateOverrideImport | null>(null);

  const pendingStrategyConflictSummary = useMemo(() => {
    if (!pendingStrategyImport) {
      return '';
    }
    const teamNames = Array.from(
      new Set(
        pendingStrategyImport.conflicts.map((entry) => entry.fromTeamName),
      ),
    );
    return `Import conflicts with ${teamNames.join(', ')}. Choose how to handle duplicates.`;
  }, [pendingStrategyImport]);

  function clearImportFlow() {
    setImportDialogOpen(false);
    setPendingReplaceImport(null);
    setPendingStrategyImport(null);
    setPendingDuplicateOverrideImport(null);
  }

  function applyImportedTeams(
    nextTeams: readonly Team[],
    nextActiveTeamId: string,
  ) {
    setTeams(nextTeams);
    setActiveTeamId(nextActiveTeamId);
    setActiveSelection(null);
  }

  function finalizePreparedImport(
    nextTeams: readonly Team[],
    importWarningMessage?: string,
  ) {
    const importedTeam = nextTeams.at(-1);
    const nextActiveTeamId = importedTeam?.id ?? effectiveActiveTeamId;
    applyImportedTeams(nextTeams, nextActiveTeamId);
    clearTransfer();
    clearPendingDelete();
    clearImportFlow();
    showToast(
      importWarningMessage
        ? `Team imported. ${importWarningMessage}`
        : 'Team imported.',
    );
  }

  function mergeImportedIntoExistingTeam(
    plannerResultTeams: readonly Team[],
    plannerBaseTeams: readonly Team[],
    targetTeam: ReplaceTargetTeam,
  ): readonly Team[] {
    const importedTeam = plannerResultTeams.at(-1);
    if (!importedTeam) {
      return teams;
    }

    const transformedImported: Team = {
      ...importedTeam,
      id: targetTeam.id,
      name: targetTeam.name,
    };

    const updatedBaseTeamsById = new Map(
      plannerResultTeams
        .filter((team) =>
          plannerBaseTeams.some((baseTeam) => baseTeam.id === team.id),
        )
        .map((team) => [team.id, team]),
    );

    return teams.map((team) => {
      if (team.id === targetTeam.id) {
        return transformedImported;
      }
      return updatedBaseTeamsById.get(team.id) ?? team;
    });
  }

  function handlePreparedImport(
    result: PreparedImport,
    options: HandlePreparedImportOptions,
  ) {
    if (result.status === 'error') {
      showToast(result.message);
      clearImportFlow();
      return;
    }

    if (result.status === 'requires_duplicate_override') {
      setImportDialogOpen(false);
      setPendingDuplicateOverrideImport({
        kind: 'decoded',
        decoded: options.decoded,
        plannerBaseTeams: options.plannerBaseTeams ?? teams,
        replaceIntoTeam: options.replaceIntoTeam,
        importWarningMessage: options.importWarningMessage,
      });
      return;
    }

    if (result.status === 'requires_replace') {
      setImportDialogOpen(false);
      setPendingReplaceImport({
        teams: result.teams,
        activeTeamIndex: result.activeTeamIndex,
        importWarningMessage: options.importWarningMessage,
      });
      return;
    }

    if (result.status === 'requires_strategy') {
      setImportDialogOpen(false);
      setPendingStrategyImport({
        team: result.team,
        conflicts: result.conflicts,
        plannerBaseTeams: options.plannerBaseTeams ?? teams,
        replaceIntoTeam: options.replaceIntoTeam,
        importWarningMessage: options.importWarningMessage,
      });
      return;
    }

    if (options.replaceIntoTeam && options.plannerBaseTeams) {
      const nextTeams = mergeImportedIntoExistingTeam(
        result.teams,
        options.plannerBaseTeams,
        options.replaceIntoTeam,
      );
      applyImportedTeams(nextTeams, options.replaceIntoTeam.id);
      clearTransfer();
      clearPendingDelete();
      clearImportFlow();
      showToast(
        options.importWarningMessage
          ? `Team imported. ${options.importWarningMessage}`
          : 'Team imported.',
      );
      return;
    }

    finalizePreparedImport(result.teams, options.importWarningMessage);
  }

  function getIngameImportWarningMessage(
    warnings: Exclude<
      ReturnType<typeof decodeImportCode>,
      {kind: 'multi'}
    >['warnings'],
  ) {
    if (!warnings || warnings.length === 0) {
      return undefined;
    }

    const surfaced = warnings.filter(
      (warning) =>
        warning.reason === 'unknown_token' &&
        (warning.section === 'awakener' || warning.section === 'wheel'),
    );
    if (surfaced.length === 0) {
      return undefined;
    }

    const detailParts = surfaced.slice(0, 2).map((warning) => {
      const slotLabel =
        warning.slotIndex === undefined
          ? 'unknown slot'
          : `slot ${String(warning.slotIndex + 1)}`;
      if (warning.section === 'awakener') {
        return `${slotLabel} awakener`;
      }
      const wheelLabel = warning.field === 'wheelTwo' ? 'wheel 2' : 'wheel 1';
      return `${slotLabel} ${wheelLabel}`;
    });
    const suffix = surfaced.length > 2 ? '; ...' : '';
    const details = detailParts.join('; ');
    const tokenLabel = surfaced.length === 1 ? 'token' : 'tokens';

    return `In-game note: ${String(surfaced.length)} unsupported awakener/wheel ${tokenLabel} imported as empty (${details}${suffix}).`;
  }

  function getDuplicateExportWarning(
    exportTeams: readonly Team[],
  ): string | undefined {
    const validation = validateBuilderTeamsStrict(exportTeams);
    const hasDuplicateViolation = hasDuplicateRuleViolation(
      validation.violations,
    );
    if (!hasDuplicateViolation) {
      return undefined;
    }
    return exportTeams.length > 1
      ? 'These teams reuse units, wheels, or posses across teams and are not in-game legal together.'
      : 'This team reuses units or wheels and is not in-game legal.';
  }

  function submitImportCode(code: string) {
    let decoded;
    try {
      decoded = decodeImportCode(code);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to decode import code.',
      );
      return;
    }

    let ingameImportWarningMessage: string | undefined;
    if (decoded.kind === 'single') {
      ingameImportWarningMessage = getIngameImportWarningMessage(
        decoded.warnings,
      );
    }

    const shouldImportIntoActiveEmptyTeam =
      decoded.kind === 'single' &&
      teamSlots.every((slot) => !slot.awakenerName);
    if (shouldImportIntoActiveEmptyTeam && activeTeam) {
      const plannerBaseTeams = teams.filter(
        (team) => team.id !== activeTeam.id,
      );
      handlePreparedImport(
        prepareImport(decoded, plannerBaseTeams, {allowDupes}),
        {
          decoded,
          plannerBaseTeams,
          replaceIntoTeam: {id: activeTeam.id, name: activeTeam.name},
          importWarningMessage: ingameImportWarningMessage,
        },
      );
      return;
    }

    handlePreparedImport(prepareImport(decoded, teams, {allowDupes}), {
      decoded,
      importWarningMessage: ingameImportWarningMessage,
    });
  }

  function openExportAllDialog() {
    setExportDialog({
      title: 'Export All Teams',
      code: encodeMultiTeamCode(teams, effectiveActiveTeamId),
      kind: 'standard',
      duplicateWarning: getDuplicateExportWarning(teams),
    });
  }

  function openTeamExportDialog(teamId: string) {
    const team = teams.find((entry) => entry.id === teamId);
    if (!team) {
      showToast('Unable to export: team not found.');
      return;
    }
    setExportDialog({
      title: `Export ${team.name}`,
      code: encodeSingleTeamCode(team),
      kind: 'standard',
      duplicateWarning: getDuplicateExportWarning([team]),
    });
  }

  function openTeamIngameExportDialog(teamId: string) {
    const team = teams.find((entry) => entry.id === teamId);
    if (!team) {
      showToast('Unable to export: team not found.');
      return;
    }
    setExportDialog({
      title: `Export In-Game ${team.name}`,
      code: encodeIngameTeamCode(team),
      kind: 'ingame',
      duplicateWarning: getDuplicateExportWarning([team]),
    });
  }

  function confirmDuplicateOverrideImport() {
    if (!pendingDuplicateOverrideImport) {
      return;
    }

    setAllowDupes(true);
    if (pendingDuplicateOverrideImport.kind === 'decoded') {
      const result = prepareImport(
        pendingDuplicateOverrideImport.decoded,
        pendingDuplicateOverrideImport.plannerBaseTeams,
        {
          allowDupes: true,
        },
      );
      handlePreparedImport(result, {
        decoded: pendingDuplicateOverrideImport.decoded,
        plannerBaseTeams: pendingDuplicateOverrideImport.plannerBaseTeams,
        replaceIntoTeam: pendingDuplicateOverrideImport.replaceIntoTeam,
        importWarningMessage:
          pendingDuplicateOverrideImport.importWarningMessage,
      });
      return;
    }

    const result = applySingleImportStrategy(
      pendingDuplicateOverrideImport.plannerBaseTeams,
      pendingDuplicateOverrideImport.importedTeam,
      pendingDuplicateOverrideImport.strategy,
      {allowDupes: true},
    );

    if (result.status !== 'ready') {
      showToast('Import strategy failed validation.');
      clearImportFlow();
      return;
    }

    if (pendingDuplicateOverrideImport.replaceIntoTeam) {
      const nextTeams = mergeImportedIntoExistingTeam(
        result.teams,
        pendingDuplicateOverrideImport.plannerBaseTeams,
        pendingDuplicateOverrideImport.replaceIntoTeam,
      );
      applyImportedTeams(
        nextTeams,
        pendingDuplicateOverrideImport.replaceIntoTeam.id,
      );
      clearTransfer();
      clearPendingDelete();
      clearImportFlow();
      showToast(
        pendingDuplicateOverrideImport.importWarningMessage
          ? `Team imported. ${pendingDuplicateOverrideImport.importWarningMessage}`
          : 'Team imported.',
      );
      return;
    }

    finalizePreparedImport(
      result.teams,
      pendingDuplicateOverrideImport.importWarningMessage,
    );
  }

  function confirmReplaceImport() {
    if (!pendingReplaceImport) {
      return;
    }
    const nextActive =
      pendingReplaceImport.teams[pendingReplaceImport.activeTeamIndex];
    const nextActiveTeamId = nextActive.id;
    applyImportedTeams(pendingReplaceImport.teams, nextActiveTeamId);
    clearImportFlow();
    clearTransfer();
    clearPendingDelete();
    showToast(
      pendingReplaceImport.importWarningMessage
        ? `All teams imported. ${pendingReplaceImport.importWarningMessage}`
        : 'All teams imported.',
    );
  }

  function applyStrategy(strategy: Exclude<SingleImportStrategy, 'cancel'>) {
    if (!pendingStrategyImport) {
      return;
    }
    const result = applySingleImportStrategy(
      pendingStrategyImport.plannerBaseTeams,
      pendingStrategyImport.team,
      strategy,
      {allowDupes},
    );
    if (result.status === 'error') {
      showToast(result.message);
      clearImportFlow();
      return;
    }
    if (result.status === 'requires_duplicate_override') {
      setPendingStrategyImport(null);
      setPendingDuplicateOverrideImport({
        kind: 'strategy',
        plannerBaseTeams: pendingStrategyImport.plannerBaseTeams,
        importedTeam: pendingStrategyImport.team,
        strategy,
        replaceIntoTeam: pendingStrategyImport.replaceIntoTeam,
        importWarningMessage: pendingStrategyImport.importWarningMessage,
      });
      return;
    }
    if (result.status !== 'ready') {
      showToast('Import strategy failed validation.');
      clearImportFlow();
      return;
    }

    if (pendingStrategyImport.replaceIntoTeam) {
      const nextTeams = mergeImportedIntoExistingTeam(
        result.teams,
        pendingStrategyImport.plannerBaseTeams,
        pendingStrategyImport.replaceIntoTeam,
      );
      applyImportedTeams(nextTeams, pendingStrategyImport.replaceIntoTeam.id);
      clearTransfer();
      clearPendingDelete();
      clearImportFlow();
      showToast(
        pendingStrategyImport.importWarningMessage
          ? `Team imported. ${pendingStrategyImport.importWarningMessage}`
          : 'Team imported.',
      );
      return;
    }

    finalizePreparedImport(
      result.teams,
      pendingStrategyImport.importWarningMessage,
    );
  }

  return {
    isImportDialogOpen,
    openImportDialog: () => {
      setImportDialogOpen(true);
    },
    submitImportCode,
    closeImportFlow: clearImportFlow,
    exportDialog,
    closeExportDialog: () => {
      setExportDialog(null);
    },
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    pendingDuplicateOverrideImport,
    cancelDuplicateOverrideImport: clearImportFlow,
    confirmDuplicateOverrideImport,
    pendingReplaceImport,
    cancelReplaceImport: () => {
      setPendingReplaceImport(null);
    },
    confirmReplaceImport,
    pendingStrategyImport,
    pendingStrategyConflictSummary,
    cancelStrategyImport: clearImportFlow,
    applyMoveStrategyImport: () => {
      applyStrategy('move');
    },
    applySkipStrategyImport: () => {
      applyStrategy('skip');
    },
  };
}
