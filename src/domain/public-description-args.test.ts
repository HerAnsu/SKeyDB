import {describe, expect, it} from 'vitest'

import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  resolveDescriptionArg,
  resolveDescriptionTemplate,
} from './description-args'
import {
  evaluatePublicFormulaExpression,
  type ComputedExpression,
  type PublicDescriptionArg,
} from './public-description-args'

describe('public-description-args', () => {
  it('renders fixed args through the public arg contract', () => {
    const arg: PublicDescriptionArg = {
      kind: 'fixed',
      value: '12',
      suffix: '%',
      stat: 'ATK',
    }

    expect(resolveDescriptionArg(arg).formattedTotalValue).toBe('12% {ATK}')
    expect(resolveDescriptionTemplate('Deal [Arg1] DMG.', {Arg1: arg})).toBe('Deal 12% {ATK} DMG.')
    expect(buildDescriptionArgHover(arg)).toBe('')
  })

  it('renders linear args through the public arg contract', () => {
    const arg: PublicDescriptionArg = {
      kind: 'linear',
      base: '5',
      gainPerLevel: '3',
      suffix: '%',
    }

    expect(resolveDescriptionArg(arg, {rank: 4}).formattedTotalValue).toBe('14%')
    expect(formatDescriptionArgProgression(arg, {maxRank: 3})).toBe('5% (+3%/Lv)')
    expect(buildDescriptionArgHover(arg, {maxRank: 2})).toBe('Lv1: 5%\nLv2: 8%')
  })

  it('renders scaling args through the public arg contract', () => {
    const arg: PublicDescriptionArg = {
      kind: 'scaling',
      values: ['10', '20', '35'],
      suffix: '%',
      stat: 'DEF',
    }

    expect(resolveDescriptionArg(arg, {rank: 2}).formattedTotalValue).toBe('20% {DEF}')
    expect(formatDescriptionArgProgression(arg)).toBe('10/20/35% {DEF}')
    expect(buildDescriptionArgHover(arg, {maxRank: 2})).toBe('Lv1: 10% DEF\nLv2: 20% DEF')
  })

  it('resolves reviewed computed args with producer-shaped expressions', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      expression: {
        op: 'ceil',
        args: [{op: 'mul', args: [{var: 'accountStageGrowth'}, {const: 0.0125}]}],
      },
      inputs: ['accountStageGrowth'],
      suffix: '%',
    }

    expect(
      evaluatePublicFormulaExpression(arg.expression, {accountStageGrowth: 241}),
    ).toStrictEqual({
      resolved: true,
      value: 4,
    })
    expect(
      resolveDescriptionTemplate(
        'Increase final DMG by [Arg1].',
        {Arg1: arg},
        {
          formulaContext: {accountStageGrowth: 241},
        },
      ),
    ).toBe('Increase final DMG by 4%.')
  })

  it('resolves account damage power as an explicit reviewed public input', () => {
    expect(
      evaluatePublicFormulaExpression({var: 'accountDamagePower'}, {accountDamagePower: 17}),
    ).toStrictEqual({
      resolved: true,
      value: 17,
    })
  })

  it('leaves unknown computed variables unresolved', () => {
    const expression = {var: 'privateRuntimeValue'} as unknown as ComputedExpression

    expect(evaluatePublicFormulaExpression(expression, {accountDamagePower: 17})).toStrictEqual({
      resolved: false,
      value: null,
    })
  })

  it('falls back gracefully when computed arg context is missing', () => {
    const arg: PublicDescriptionArg = {
      kind: 'computed',
      expression: {
        op: 'ceil',
        args: [{op: 'mul', args: [{var: 'accountStageGrowth'}, {const: 0.0125}]}],
      },
      inputs: ['accountStageGrowth'],
      suffix: '%',
    }

    const resolved = resolveDescriptionArg(arg)

    expect(evaluatePublicFormulaExpression(arg.expression)).toStrictEqual({
      resolved: false,
      value: null,
    })
    expect(resolved.resolved).toBe(false)
    expect(resolved.baseValue).toBeNull()
    expect(resolved.totalValue).toBeNull()
    expect(resolved.formattedTotalValue).toBe('—%')
    expect(resolveDescriptionTemplate('Increase final DMG by [Arg1].', {Arg1: arg})).toBe(
      'Increase final DMG by [Arg1].',
    )
  })

  it('treats unknown computed operators as unresolved', () => {
    const expression = {
      op: 'div',
      args: [{const: 10}, {const: 2}],
    } as unknown as ComputedExpression

    expect(evaluatePublicFormulaExpression(expression)).toStrictEqual({
      resolved: false,
      value: null,
    })
  })
})
