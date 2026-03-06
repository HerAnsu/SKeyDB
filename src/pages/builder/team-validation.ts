import {validateTeamPlan, type RuleViolation} from '@/domain/team-rules';
import {toTeamPlan} from '@/pages/builder/team-plan';
import type {Team} from '@/pages/builder/types';

interface ValidateBuilderTeamsOptions {
  readonly allowDupes?: boolean;
}

export function validateBuilderTeams(
  teams: readonly Team[],
  options?: ValidateBuilderTeamsOptions,
) {
  return validateTeamPlan(toTeamPlan(teams), {
    enforceUniqueAwakeners: !options?.allowDupes,
    enforceUniqueWheels: !options?.allowDupes,
    enforceUniquePosses: !options?.allowDupes,
  });
}

export function validateBuilderTeamsStrict(teams: readonly Team[]) {
  return validateBuilderTeams(teams, {allowDupes: false});
}

export function getNonDuplicateRuleViolations(violations: RuleViolation[]) {
  return violations.filter(
    (violation) =>
      violation.code !== 'DUPLICATE_AWAKENER' &&
      violation.code !== 'DUPLICATE_WHEEL' &&
      violation.code !== 'DUPLICATE_POSSE',
  );
}

export function hasDuplicateRuleViolation(violations: RuleViolation[]) {
  return violations.some(
    (violation) =>
      violation.code === 'DUPLICATE_AWAKENER' ||
      violation.code === 'DUPLICATE_WHEEL' ||
      violation.code === 'DUPLICATE_POSSE',
  );
}
