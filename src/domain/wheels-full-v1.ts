import compiledWheelsFullV1Json from '@/data/wheels/compiled/wheels-full.v1.json'

import {WHEEL_ID_V1_TO_V2} from './persistence-id-migration.v2'
import {wheelsFullV1DatasetSchema, type WheelFullV1Record} from './wheels-full-v1-compiler.ts'

export {wheelsFullV1DatasetSchema, type WheelFullV1Record} from './wheels-full-v1-compiler'

let wheelsFullV1Cache: WheelFullV1Record[] | null = null
const WHEEL_ID_V2_TO_V1: ReadonlyMap<string, string> = new Map(
  Object.entries(WHEEL_ID_V1_TO_V2).map(([v1Id, v2Id]) => [v2Id, v1Id]),
)

export function resolveWheelFullV1Id(wheelId: string): string {
  return WHEEL_ID_V2_TO_V1.get(wheelId) ?? wheelId
}

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
  const fullV1Id = resolveWheelFullV1Id(wheelId)
  return records.find((record) => record.id === fullV1Id)
}
