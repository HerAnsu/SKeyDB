import wheelsLite from '@/data/wheels/compiled/wheels-lite.v1.json'

import {getMainstatByKey, type WheelMainstatKey} from './mainstats'
import {wheelsLiteV1DatasetSchema, type WheelLiteV1Record} from './wheels-lite-v1-compiler'

export type WheelRarity = 'SSR' | 'SR' | 'R'
export type WheelRealm = 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL'

export type Wheel = WheelLiteV1Record & {
  rarity: WheelRarity
  realm: WheelRealm
  mainstatKey: WheelMainstatKey
}

const parsedWheels: Wheel[] = wheelsLiteV1DatasetSchema.parse(wheelsLite)
const wheelById = new Map(parsedWheels.map((wheel) => [wheel.id, wheel]))

export function getWheels(): Wheel[] {
  return parsedWheels
}

export function getWheelById(wheelId: string): Wheel | undefined {
  return wheelById.get(wheelId)
}

export function getWheelMainstatLabel(wheel: Wheel): string {
  return getMainstatByKey(wheel.mainstatKey)?.label ?? ''
}
