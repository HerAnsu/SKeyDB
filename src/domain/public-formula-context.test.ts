import {describe, expect, it} from 'vitest'

import type {CollectionOwnershipState} from './collection-ownership'
import {getPosses} from './posses'
import {evaluatePublicFormulaExpression} from './public-description-args'
import {buildPublicFormulaContext, type PublicFormulaContext} from './public-formula-context'

function createOwnership(ownedPosses: Record<string, number>): CollectionOwnershipState {
  return {
    ownedAwakeners: {},
    awakenerLevels: {},
    ownedWheels: {},
    ownedPosses,
    displayUnowned: true,
  }
}

describe('public-formula-context', () => {
  it('exposes only the conservative public formula keys', () => {
    const context = buildPublicFormulaContext({
      collectionOwnership: createOwnership({[getPosses()[0].id]: 1}),
      wheelEnhanceLevel: 4,
      accountStageGrowth: 120,
      accountDamagePower: 8.5,
      somaticResearchHpMultiplier: 1.25,
      occultResearchDepth: 7,
    })

    expect(Object.keys(context).sort()).toEqual([
      'accountDamagePower',
      'accountStageGrowth',
      'occultResearchDepth',
      'ownedPosseCount',
      'somaticResearchHpMultiplier',
      'wheelRefinementLevel',
    ])
    expect(context).toEqual({
      accountDamagePower: 8.5,
      accountStageGrowth: 120,
      occultResearchDepth: 7,
      ownedPosseCount: 1,
      somaticResearchHpMultiplier: 1.25,
      wheelRefinementLevel: 4,
    })
  })

  it('counts only current public owned posses when collection ownership is configured', () => {
    const currentPosses = getPosses()
    const context = buildPublicFormulaContext({
      collectionOwnership: createOwnership({
        [currentPosses[0].id]: 0,
        [currentPosses[1].id]: 0,
        [currentPosses[2].id]: 0,
        'legacy-posse-id': 1,
      }),
    })

    expect(context.ownedPosseCount).toBe(3)
  })

  it('defaults owned posse count to all current public posses without collection ownership', () => {
    expect(buildPublicFormulaContext().ownedPosseCount).toBe(getPosses().length)
    expect(buildPublicFormulaContext({collectionOwnership: null}).ownedPosseCount).toBe(
      getPosses().length,
    )
  })

  it('uses the existing wheel enhancement clamp for wheel refinement level', () => {
    expect(buildPublicFormulaContext({wheelEnhanceLevel: 999}).wheelRefinementLevel).toBe(15)
    expect(buildPublicFormulaContext({wheelEnhanceLevel: -3}).wheelRefinementLevel).toBe(0)
    expect(buildPublicFormulaContext({wheelEnhanceLevel: 2.9}).wheelRefinementLevel).toBe(2)
  })

  it('omits missing and non-finite account-level research values', () => {
    const context = buildPublicFormulaContext({
      accountStageGrowth: null,
      somaticResearchHpMultiplier: Number.NaN,
      occultResearchDepth: undefined,
    })

    expect(context).not.toHaveProperty('accountStageGrowth')
    expect(context).not.toHaveProperty('somaticResearchHpMultiplier')
    expect(context).not.toHaveProperty('occultResearchDepth')
    expect(
      evaluatePublicFormulaExpression({var: 'accountStageGrowth'}, context),
    ).toStrictEqual({
      resolved: false,
      value: null,
    })
  })

  it('keeps the public formula context type closed to reviewed keys', () => {
    const context = {
      accountStageGrowth: 1,
      accountDamagePower: 6,
      ownedPosseCount: 2,
      wheelRefinementLevel: 3,
      somaticResearchHpMultiplier: 4,
      occultResearchDepth: 5,
    } satisfies PublicFormulaContext

    expect(context.ownedPosseCount).toBe(2)
  })
})
