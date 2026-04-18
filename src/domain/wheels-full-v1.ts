import compiledWheelsFullV1Json from '@/data/wheels/compiled/wheels-full.v1.json'

import {wheelsFullV1DatasetSchema, type WheelFullV1Record} from './wheels-full-v1-compiler.ts'

export {wheelsFullV1DatasetSchema, type WheelFullV1Record} from './wheels-full-v1-compiler'

let wheelsFullV1Cache: WheelFullV1Record[] | null = null

export function getWheelsFullV1(): WheelFullV1Record[] {
  if (wheelsFullV1Cache) {
    return wheelsFullV1Cache
  }

  wheelsFullV1Cache = wheelsFullV1DatasetSchema.parse(compiledWheelsFullV1Json)
  return wheelsFullV1Cache
}

export function getWheelFullV1ById(
  wheelId: string,
  records: WheelFullV1Record[],
): WheelFullV1Record | undefined {
  return records.find((record) => record.id === wheelId)
}
