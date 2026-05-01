import type {CollectionOwnershipState} from './collection-ownership'
import {getPosses} from './posses'
import {clampWheelEnhanceLevel} from './wheel-enhance'

export interface PublicFormulaContext {
  accountStageGrowth?: number
  accountDamagePower?: number
  ownedPosseCount?: number
  wheelRefinementLevel?: number
  somaticResearchHpMultiplier?: number
  occultResearchDepth?: number
}

export interface PublicFormulaContextInput {
  collectionOwnership?: CollectionOwnershipState | null
  wheelEnhanceLevel?: number | null
  accountStageGrowth?: number | null
  accountDamagePower?: number | null
  somaticResearchHpMultiplier?: number | null
  occultResearchDepth?: number | null
}

const CURRENT_PUBLIC_POSSE_IDS = new Set(getPosses().map((posse) => posse.id))

function assignFiniteNumber(
  context: PublicFormulaContext,
  key: keyof PublicFormulaContext,
  value: number | null | undefined,
): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    context[key] = value
  }
}

function countOwnedCurrentPublicPosses(collectionOwnership: CollectionOwnershipState): number {
  let count = 0
  for (const id of Object.keys(collectionOwnership.ownedPosses)) {
    if (CURRENT_PUBLIC_POSSE_IDS.has(id)) {
      count += 1
    }
  }
  return count
}

export function buildPublicFormulaContext(
  input: PublicFormulaContextInput = {},
): PublicFormulaContext {
  const context: PublicFormulaContext = {
    ownedPosseCount: input.collectionOwnership
      ? countOwnedCurrentPublicPosses(input.collectionOwnership)
      : CURRENT_PUBLIC_POSSE_IDS.size,
  }

  assignFiniteNumber(context, 'accountStageGrowth', input.accountStageGrowth)
  assignFiniteNumber(context, 'accountDamagePower', input.accountDamagePower)
  assignFiniteNumber(context, 'somaticResearchHpMultiplier', input.somaticResearchHpMultiplier)
  assignFiniteNumber(context, 'occultResearchDepth', input.occultResearchDepth)

  if (typeof input.wheelEnhanceLevel === 'number') {
    context.wheelRefinementLevel = clampWheelEnhanceLevel(input.wheelEnhanceLevel)
  }

  return context
}
