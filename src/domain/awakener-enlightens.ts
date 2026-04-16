import awakenersEnlightensJson from '@/data/awakeners/awakener-enlightens.json'

import {
  awakenerEnlightensDatasetSchema,
  type AwakenerEnlightenRecord,
} from './awakener-source-schema'

let awakenerEnlightensCache: AwakenerEnlightenRecord[] | null = null

export function getAwakenerEnlightens(): AwakenerEnlightenRecord[] {
  if (awakenerEnlightensCache) {
    return awakenerEnlightensCache
  }

  awakenerEnlightensCache = awakenerEnlightensDatasetSchema.parse(awakenersEnlightensJson)
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
