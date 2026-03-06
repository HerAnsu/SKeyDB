export interface TeamMember {
  readonly awakenerId: string;
  readonly realm: string;
  readonly wheelIds: readonly string[];
  readonly isSupport?: boolean;
}

export interface TeamPlan {
  readonly id: string;
  readonly posseId?: string;
  readonly members: readonly TeamMember[];
}

export type RuleViolationCode =
  | 'TEAM_COUNT_EXCEEDED'
  | 'TOO_MANY_REALMS_IN_TEAM'
  | 'DUPLICATE_AWAKENER'
  | 'DUPLICATE_WHEEL'
  | 'DUPLICATE_POSSE'
  | 'MULTIPLE_SUPPORT_AWAKENERS';

export interface RuleViolation {
  readonly code: RuleViolationCode;
  readonly message: string;
  readonly teamId?: string;
  readonly value?: string;
}

export interface TeamRulesConfig {
  readonly maxTeams: number;
  readonly maxRealmsPerTeam: number;
  readonly enforceUniqueAwakeners: boolean;
  readonly enforceUniqueWheels: boolean;
  readonly enforceUniquePosses: boolean;
}

export const DEFAULT_TEAM_RULES_CONFIG: TeamRulesConfig = {
  maxTeams: 10,
  maxRealmsPerTeam: 2,
  enforceUniqueAwakeners: true,
  enforceUniqueWheels: true,
  enforceUniquePosses: true,
};

export function getDistinctRealmsForTeam(
  members: readonly Pick<TeamMember, 'realm'>[],
): Set<string> {
  return new Set(
    members.map((member) => member.realm.trim().toUpperCase()).filter(Boolean),
  );
}

export function exceedsRealmLimitForTeam(
  members: readonly Pick<TeamMember, 'realm'>[],
  maxRealmsPerTeam: number,
): boolean {
  return getDistinctRealmsForTeam(members).size > maxRealmsPerTeam;
}

function validatePosseRestrictions(
  team: TeamPlan,
  settings: TeamRulesConfig,
  seenPosses: Set<string>,
  violations: RuleViolation[],
) {
  if (!team.posseId) return;
  if (settings.enforceUniquePosses && seenPosses.has(team.posseId)) {
    violations.push({
      code: 'DUPLICATE_POSSE',
      message: `Posse ${team.posseId} is used more than once across teams.`,
      teamId: team.id,
      value: team.posseId,
    });
  } else {
    seenPosses.add(team.posseId);
  }
}

function validateTeamMemberUniqueness(
  member: TeamMember,
  team: TeamPlan,
  settings: TeamRulesConfig,
  buildContext: {
    seenAwakeners: Set<string>;
    seenWheels: Set<string>;
    teamSeenAwakeners: Set<string>;
    teamSeenWheels: Set<string>;
  },
  violations: RuleViolation[],
) {
  const {seenAwakeners, seenWheels, teamSeenAwakeners, teamSeenWheels} =
    buildContext;

  // Awakener Uniqueness
  if (
    settings.enforceUniqueAwakeners &&
    teamSeenAwakeners.has(member.awakenerId)
  ) {
    violations.push({
      code: 'DUPLICATE_AWAKENER',
      message: `Awakener ${member.awakenerId} is used more than once in team ${team.id}.`,
      teamId: team.id,
      value: member.awakenerId,
    });
  } else if (
    settings.enforceUniqueAwakeners &&
    !member.isSupport &&
    seenAwakeners.has(member.awakenerId)
  ) {
    violations.push({
      code: 'DUPLICATE_AWAKENER',
      message: `Awakener ${member.awakenerId} is used more than once across teams.`,
      teamId: team.id,
      value: member.awakenerId,
    });
  }
  teamSeenAwakeners.add(member.awakenerId);
  if (!member.isSupport) seenAwakeners.add(member.awakenerId);

  // Wheel Uniqueness
  for (const wheelId of member.wheelIds) {
    if (settings.enforceUniqueWheels && teamSeenWheels.has(wheelId)) {
      violations.push({
        code: 'DUPLICATE_WHEEL',
        message: `Wheel ${wheelId} is used more than once in team ${team.id}.`,
        teamId: team.id,
        value: wheelId,
      });
    } else if (
      settings.enforceUniqueWheels &&
      !member.isSupport &&
      seenWheels.has(wheelId)
    ) {
      violations.push({
        code: 'DUPLICATE_WHEEL',
        message: `Wheel ${wheelId} is used more than once across teams.`,
        teamId: team.id,
        value: wheelId,
      });
    }
    teamSeenWheels.add(wheelId);
    if (!member.isSupport) seenWheels.add(wheelId);
  }
}

export function validateTeamPlan(
  teamPlan: TeamPlan[],
  config: Partial<TeamRulesConfig> = {},
): {isValid: boolean; violations: RuleViolation[]} {
  const settings = {...DEFAULT_TEAM_RULES_CONFIG, ...config};
  const violations: RuleViolation[] = [];

  if (teamPlan.length > settings.maxTeams) {
    violations.push({
      code: 'TEAM_COUNT_EXCEEDED',
      message: `A maximum of ${String(settings.maxTeams)} teams is allowed.`,
    });
  }

  const seenAwakeners = new Set<string>();
  const seenWheels = new Set<string>();
  const seenPosses = new Set<string>();
  let supportCount = 0;

  for (const team of teamPlan) {
    validatePosseRestrictions(team, settings, seenPosses, violations);

    const realmsInTeam = getDistinctRealmsForTeam(team.members);
    if (realmsInTeam.size > settings.maxRealmsPerTeam) {
      violations.push({
        code: 'TOO_MANY_REALMS_IN_TEAM',
        message: `Team ${team.id} has ${String(realmsInTeam.size)} realms, max is ${String(settings.maxRealmsPerTeam)}.`,
        teamId: team.id,
      });
    }

    const teamSeenAwakeners = new Set<string>();
    const teamSeenWheels = new Set<string>();
    const buildContext = {
      seenAwakeners,
      seenWheels,
      teamSeenAwakeners,
      teamSeenWheels,
    };

    for (const member of team.members) {
      if (member.isSupport) supportCount += 1;
      validateTeamMemberUniqueness(
        member,
        team,
        settings,
        buildContext,
        violations,
      );
    }
  }

  if (supportCount > 1) {
    violations.push({
      code: 'MULTIPLE_SUPPORT_AWAKENERS',
      message: 'Only one support awakener is allowed across the whole build.',
    });
  }

  return {isValid: violations.length === 0, violations};
}
