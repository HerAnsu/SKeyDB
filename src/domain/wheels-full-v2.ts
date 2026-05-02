import publicWheelsFull from '@/data/public-v2/full/wheels.json'

import type {DescriptionArg} from './awakener-source-schema'
import {buildWheelMainstatSeriesKey, type WheelMainstatKey} from './wheel-mainstat-scaling'

export interface WheelFullV2Record {
  id: string
  assetId: string
  name: string
  rarity: 'SSR' | 'SR' | 'R' | 'N'
  realm: 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL' | 'OTHER'
  awakener?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  aliases: string[]
  searchTags: string[]
  mainstatKey: WheelMainstatKey
  mainstatSeriesKey: string
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
  lore?: string
}

interface PublicWheelEnvelope {
  records: Array<{
    id: string
    assetId: string
    name: string
    rarity: WheelFullV2Record['rarity']
    realm: WheelFullV2Record['realm']
    ownerAwakenerId?: string
    ownerAwakenerName?: string
    aliases?: string[]
    searchTags?: string[]
    mainstatKey: WheelMainstatKey
    mainstatSeriesKey?: string
    descriptionTemplate: string
    descriptionArgs: Record<string, DescriptionArg>
    lore?: string
  }>
}

let wheelsFullV2Cache: WheelFullV2Record[] | null = null

function adaptPublicWheel(record: PublicWheelEnvelope['records'][number]): WheelFullV2Record {
  return {
    ...record,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    awakener: record.ownerAwakenerName,
    mainstatSeriesKey:
      record.mainstatSeriesKey ?? buildWheelMainstatSeriesKey(record.rarity, record.mainstatKey),
  }
}

export function getWheelsFullV2(): WheelFullV2Record[] {
  if (wheelsFullV2Cache) {
    return wheelsFullV2Cache
  }

  wheelsFullV2Cache = (publicWheelsFull as PublicWheelEnvelope).records.map(adaptPublicWheel)
  return wheelsFullV2Cache
}

export function getWheelFullV2ById(
  wheelId: string,
  records: WheelFullV2Record[],
): WheelFullV2Record | undefined {
  return records.find((record) => record.id === wheelId)
}
