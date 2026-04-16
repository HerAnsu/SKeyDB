import compiledAwakenersFullV2Json from '@/data/awakeners/compiled/awakeners-full.v2.json'

import {awakenersFullV2DatasetSchema, type AwakenerFullV2Record} from './awakeners-full-v2-compiler'

export {awakenersFullV2DatasetSchema, type AwakenerFullV2Record} from './awakeners-full-v2-compiler'

let awakenersFullV2Cache: AwakenerFullV2Record[] | null = null

export function getAwakenersFullV2(): AwakenerFullV2Record[] {
  if (awakenersFullV2Cache) {
    return awakenersFullV2Cache
  }

  awakenersFullV2Cache = awakenersFullV2DatasetSchema.parse(compiledAwakenersFullV2Json)

  return awakenersFullV2Cache
}

export function getAwakenerFullV2ById(
  awakenerId: number,
  records: AwakenerFullV2Record[],
): AwakenerFullV2Record | undefined {
  return records.find((entry) => entry.id === awakenerId)
}
