import {resolveAccountLevelCurveEntry} from './gameplay-math-metadata'
import {buildPublicFormulaContext, type PublicFormulaContext} from './public-formula-context'

export type {PublicFormulaContext} from './public-formula-context'
export type PublicFormulaKey = keyof PublicFormulaContext
export type PublicScaledBaseFormula =
  | 'accountStageGrowth'
  | 'somaticResearchHpMultiplier'
  | 'esotericResearchDepth'
  | 'occultResearchDepth'

export type PublicDescriptionArgStat = 'ATK' | 'DEF' | 'CON'

export interface PublicDescriptionArgSubstatBonus {
  substat: string
  multiplier: string
  suffix?: string
  mode?: 'additive' | 'scale_base' | 'additive_factor'
  baseMultiplier?: string
}

export interface PublicFixedDescriptionArg {
  kind: 'fixed'
  value?: string
  displayFormula?: string
  channel?: string
  suffix?: string
  stat?: PublicDescriptionArgStat
  substatBonus?: PublicDescriptionArgSubstatBonus
}

export interface PublicLinearDescriptionArg {
  kind: 'linear'
  base: string
  gainPerLevel: string
  channel?: string
  suffix?: string
  stat?: PublicDescriptionArgStat
  substatBonus?: PublicDescriptionArgSubstatBonus
}

export interface PublicScalingDescriptionArg {
  kind: 'scaling'
  values: string[]
  channel?: string
  suffix?: string
  stat?: PublicDescriptionArgStat
  substatBonus?: PublicDescriptionArgSubstatBonus
}

export interface PublicScaledComputedDescriptionArg {
  kind: 'computed'
  formulaKey: 'scaled'
  baseFormula: PublicScaledBaseFormula
  multiplier?: number
  rounding?: 'ceil'
  inputs: PublicFormulaKey[]
  channel?: string
  suffix?: string
  stat?: PublicDescriptionArgStat
  substatBonus?: PublicDescriptionArgSubstatBonus
}

export interface PublicWheelRefinementLinearComputedDescriptionArg {
  kind: 'computed'
  formulaKey: 'wheelRefinementLinear'
  baseValue: number
  perLevel: number
  inputs: ['wheelRefinementLevel']
  channel?: string
  suffix?: string
  stat?: PublicDescriptionArgStat
  substatBonus?: PublicDescriptionArgSubstatBonus
}

export type PublicComputedDescriptionArg =
  | PublicScaledComputedDescriptionArg
  | PublicWheelRefinementLinearComputedDescriptionArg

export type PublicDescriptionArg =
  | PublicFixedDescriptionArg
  | PublicLinearDescriptionArg
  | PublicScalingDescriptionArg
  | PublicComputedDescriptionArg

export interface PublicFormulaEvaluation {
  resolved: boolean
  value: number | null
}

function unresolved(): PublicFormulaEvaluation {
  return {
    resolved: false,
    value: null,
  }
}

function resolved(value: number): PublicFormulaEvaluation {
  if (!Number.isFinite(value)) {
    return unresolved()
  }

  return {
    resolved: true,
    value,
  }
}

function isPublicComputedDescriptionArg(value: unknown): value is PublicComputedDescriptionArg {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {kind?: unknown; formulaKey?: unknown}
  return (
    candidate.kind === 'computed' &&
    (candidate.formulaKey === 'scaled' || candidate.formulaKey === 'wheelRefinementLinear')
  )
}

function resolveScaledBaseFormula(
  baseFormula: PublicScaledBaseFormula,
  context: PublicFormulaContext,
): PublicFormulaEvaluation {
  const resolvedContext = {...buildPublicFormulaContext(), ...context}
  const curve = resolveAccountLevelCurveEntry(resolvedContext.accountLevel)
  const ownedPosseCount = Math.min(resolvedContext.ownedPosseCount ?? 0, 50)
  const ownedPosseMultiplier = 1 + ownedPosseCount * 0.01

  switch (baseFormula) {
    case 'accountStageGrowth':
      return resolved(curve.stageGrow)
    case 'somaticResearchHpMultiplier':
      return resolved(curve.hpMultiplier)
    case 'esotericResearchDepth':
      return resolved(curve.stageGrow * ownedPosseMultiplier)
    case 'occultResearchDepth':
      return resolved(curve.stageGrow * (curve.accountDamagePower / 100) * ownedPosseMultiplier)
  }

  return unresolved()
}

export function evaluatePublicFormulaExpression(
  arg: unknown,
  context: PublicFormulaContext = {},
): PublicFormulaEvaluation {
  if (!isPublicComputedDescriptionArg(arg)) {
    return unresolved()
  }

  if (arg.formulaKey === 'scaled') {
    const base = resolveScaledBaseFormula(arg.baseFormula, context)
    if (!base.resolved || base.value === null) {
      return unresolved()
    }

    const scaledValue =
      typeof arg.multiplier === 'number' && Number.isFinite(arg.multiplier)
        ? base.value * arg.multiplier
        : base.value
    return resolved(arg.rounding === 'ceil' ? Math.ceil(scaledValue) : scaledValue)
  }

  const wheelRefinementLevel = context.wheelRefinementLevel
  if (typeof wheelRefinementLevel !== 'number' || !Number.isFinite(wheelRefinementLevel)) {
    return unresolved()
  }

  return resolved(arg.baseValue + wheelRefinementLevel * arg.perLevel)
}
