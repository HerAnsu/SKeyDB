import publicEnlightensFull from '@/data/public-v2/full/enlightens.json'

import {
  awakenerEnlightensDatasetSchema,
  type AwakenerEnlightenRecord,
} from './awakener-source-schema'

interface PublicEnlightensEnvelope {
  records: Array<Omit<AwakenerEnlightenRecord, 'ownerAwakenerId'> & {ownerAwakenerId: string}>
}

let awakenerEnlightensCache: AwakenerEnlightenRecord[] | null = null

function numericAwakenerId(publicAwakenerId: string): number {
  return Number(/^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1] ?? 0)
}

function adaptPublicEnlighten(
  record: PublicEnlightensEnvelope['records'][number],
): AwakenerEnlightenRecord {
  return {
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId),
  }
}

export function getAwakenerEnlightens(): AwakenerEnlightenRecord[] {
  if (awakenerEnlightensCache) {
    return awakenerEnlightensCache
  }

  awakenerEnlightensCache = awakenerEnlightensDatasetSchema.parse(
    (publicEnlightensFull as unknown as PublicEnlightensEnvelope).records.map(adaptPublicEnlighten),
  )
  return awakenerEnlightensCache
}

export function getAwakenerEnlightenById(
  enlightenId: string,
  enlightens: AwakenerEnlightenRecord[],
): AwakenerEnlightenRecord | undefined {
  return enlightens.find((entry) => entry.id === enlightenId)
}

export function getAwakenerEnlightensForAwakener(
  awakenerId: number,
  enlightens: AwakenerEnlightenRecord[],
): AwakenerEnlightenRecord[] {
  return enlightens.filter((entry) => entry.ownerAwakenerId === awakenerId)
}
