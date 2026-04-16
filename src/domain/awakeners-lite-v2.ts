import compiledAwakenersLiteV2Json from '@/data/awakeners/compiled/awakeners-lite.v2.json'

import {awakenersLiteV2DatasetSchema, type AwakenerLiteV2Record} from './awakeners-lite-v2-compiler'

export {awakenersLiteV2DatasetSchema, type AwakenerLiteV2Record} from './awakeners-lite-v2-compiler'

let awakenersLiteV2Cache: AwakenerLiteV2Record[] | null = null

export function getAwakenersLiteV2(): AwakenerLiteV2Record[] {
  if (awakenersLiteV2Cache) {
    return awakenersLiteV2Cache
  }

  awakenersLiteV2Cache = awakenersLiteV2DatasetSchema.parse(compiledAwakenersLiteV2Json)
  return awakenersLiteV2Cache
}
