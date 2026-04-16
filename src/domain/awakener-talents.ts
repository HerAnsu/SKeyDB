import awakenersTalentsJson from '@/data/awakeners/awakener-talents.json'

import {awakenerTalentsDatasetSchema, type AwakenerTalentRecord} from './awakener-source-schema'

let awakenerTalentsCache: AwakenerTalentRecord[] | null = null

export function getAwakenerTalents(): AwakenerTalentRecord[] {
  if (awakenerTalentsCache) {
    return awakenerTalentsCache
  }

  awakenerTalentsCache = awakenerTalentsDatasetSchema.parse(awakenersTalentsJson)
  return awakenerTalentsCache
}

export function getAwakenerTalentById(
  talentId: string,
  talents: AwakenerTalentRecord[],
): AwakenerTalentRecord | undefined {
  return talents.find((entry) => entry.id === talentId)
}

export function getAwakenerTalentsForAwakener(
  awakenerId: number,
  talents: AwakenerTalentRecord[],
): AwakenerTalentRecord[] {
  return talents.filter((entry) => entry.ownerAwakenerId === awakenerId)
}
