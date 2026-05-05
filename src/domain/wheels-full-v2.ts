import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicRecordSnapshots} from '@/data-access/public-data/recordSnapshots'

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

interface PublicWheelRecord {
  id: string
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
}

let wheelsFullV2Cache: WheelFullV2Record[] | null = null

function getWheelPublicAssetId(wheelId: string): string {
  const assetIndexId = resolvePublicEntityAsset(wheelId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? 'TBD') : 'TBD'
}

function adaptPublicWheel(record: PublicWheelRecord): WheelFullV2Record {
  return {
    ...record,
    assetId: getWheelPublicAssetId(record.id),
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

  wheelsFullV2Cache = (getPublicRecordSnapshots('wheels') as unknown as PublicWheelRecord[]).map(
    adaptPublicWheel,
  )
  return wheelsFullV2Cache
}

export function getWheelFullV2ById(
  wheelId: string,
  records: WheelFullV2Record[],
): WheelFullV2Record | undefined {
  return records.find((record) => record.id === wheelId)
}
