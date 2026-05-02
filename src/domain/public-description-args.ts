import type {PublicFormulaContext} from './public-formula-context'

export type {PublicFormulaContext} from './public-formula-context'
export type PublicFormulaKey = keyof PublicFormulaContext

export type PublicDescriptionArgStat = 'ATK' | 'DEF' | 'CON'

export interface PublicDescriptionArgSubstatBonus {
  substat: string
  multiplier: string
  suffix?: string
  mode?: 'additive' | 'scale_base'
}

export interface PublicFixedDescriptionArg {
  kind: 'fixed'
  value?: string
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

export type ComputedExpression =
  | {const: number}
  | {var: PublicFormulaKey}
  | {op: 'add' | 'mul' | 'min' | 'max'; args: ComputedExpression[]}
  | {op: 'ceil' | 'floor'; args: [ComputedExpression]}

export interface PublicComputedDescriptionArg {
  kind: 'computed'
  expression: ComputedExpression
  inputs: PublicFormulaKey[]
  channel?: string
  suffix?: string
  stat?: PublicDescriptionArgStat
  substatBonus?: PublicDescriptionArgSubstatBonus
}

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

function evaluateAll(
  args: ComputedExpression[],
  context: PublicFormulaContext,
): PublicFormulaEvaluation[] | null {
  const values = args.map((arg) => evaluatePublicFormulaExpression(arg, context))
  return values.every((value) => value.resolved) ? values : null
}

function getPublicFormulaInput(context: PublicFormulaContext, key: string): number | undefined {
  switch (key) {
    case 'accountStageGrowth':
      return context.accountStageGrowth
    case 'accountDamagePower':
      return context.accountDamagePower
    case 'ownedPosseCount':
      return context.ownedPosseCount
    case 'wheelRefinementLevel':
      return context.wheelRefinementLevel
    case 'somaticResearchHpMultiplier':
      return context.somaticResearchHpMultiplier
    case 'occultResearchDepth':
      return context.occultResearchDepth
    default:
      return undefined
  }
}

export function evaluatePublicFormulaExpression(
  expression: ComputedExpression,
  context: PublicFormulaContext = {},
): PublicFormulaEvaluation {
  if ('const' in expression) {
    return resolved(expression.const)
  }

  if ('var' in expression) {
    const value = getPublicFormulaInput(context, expression.var)
    return typeof value === 'number' ? resolved(value) : unresolved()
  }

  switch (expression.op) {
    case 'add': {
      const values = evaluateAll(expression.args, context)
      return values
        ? resolved(values.reduce((total, value) => total + (value.value ?? 0), 0))
        : unresolved()
    }

    case 'mul': {
      const values = evaluateAll(expression.args, context)
      return values
        ? resolved(values.reduce((total, value) => total * (value.value ?? 1), 1))
        : unresolved()
    }

    case 'min': {
      const values = evaluateAll(expression.args, context)
      return values ? resolved(Math.min(...values.map((value) => value.value ?? 0))) : unresolved()
    }

    case 'max': {
      const values = evaluateAll(expression.args, context)
      return values ? resolved(Math.max(...values.map((value) => value.value ?? 0))) : unresolved()
    }

    case 'ceil': {
      const value = evaluatePublicFormulaExpression(expression.args[0], context)
      return value.resolved && value.value !== null
        ? resolved(Math.ceil(value.value))
        : unresolved()
    }

    case 'floor': {
      const value = evaluatePublicFormulaExpression(expression.args[0], context)
      return value.resolved && value.value !== null
        ? resolved(Math.floor(value.value))
        : unresolved()
    }

    default:
      return unresolved()
  }
}
