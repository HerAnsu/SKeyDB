import publicTalentsFull from '@/data/public-v2/full/talents.json'

import {awakenerTalentsDatasetSchema, type AwakenerTalentRecord} from './awakener-source-schema'

interface PublicTalentsEnvelope {
  records: (Omit<AwakenerTalentRecord, 'ownerAwakenerId'> & {ownerAwakenerId: string})[]
}

let awakenerTalentsCache: AwakenerTalentRecord[] | null = null

function numericAwakenerId(publicAwakenerId: string): number {
  return Number(/^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1] ?? 0)
}

function adaptPublicTalent(record: PublicTalentsEnvelope['records'][number]): AwakenerTalentRecord {
  return {
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId),
  }
}

export function getAwakenerTalents(): AwakenerTalentRecord[] {
  if (awakenerTalentsCache) {
    return awakenerTalentsCache
  }

  awakenerTalentsCache = awakenerTalentsDatasetSchema.parse(
    (publicTalentsFull as unknown as PublicTalentsEnvelope).records.map(adaptPublicTalent),
  )
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
