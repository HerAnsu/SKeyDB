import awakenersKitsJson from '@/data/awakeners/awakener-kits.json'

import {awakenerKitsDatasetSchema, type AwakenerKitRecord} from './awakener-source-schema'

let awakenerKitsCache: AwakenerKitRecord[] | null = null

export function getAwakenerKits(): AwakenerKitRecord[] {
  if (awakenerKitsCache) {
    return awakenerKitsCache
  }

  awakenerKitsCache = awakenerKitsDatasetSchema.parse(awakenersKitsJson)
  return awakenerKitsCache
}

export function getAwakenerKitById(
  awakenerId: number,
  kits: AwakenerKitRecord[],
): AwakenerKitRecord | undefined {
  return kits.find((entry) => entry.awakenerId === awakenerId)
}
