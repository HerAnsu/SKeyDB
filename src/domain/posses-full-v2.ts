import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicRecordSnapshots} from '@/data-access/public-data/recordSnapshots'

import type {DescriptionArg} from './awakener-source-schema'

export interface PosseFullV2Record {
  id: string
  name: string
  realm: string
  assetId: string
  assetCrystalId?: string
  assetBadgeId?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
  lore?: string
}

interface PublicPosseRecord {
  id: string
  name: string
  realm: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
  lore?: string
}

let possesFullV2Cache: PosseFullV2Record[] | null = null

function getPossePublicAssetId(posseId: string, slot: string): string | undefined {
  const assetIndexId = resolvePublicEntityAsset(posseId, slot)
  return assetIndexId ? resolvePublicAsset(assetIndexId)?.assetId : undefined
}

function adaptPublicPosse(record: PublicPosseRecord): PosseFullV2Record {
  return {
    ...record,
    assetId: getPossePublicAssetId(record.id, 'icon') ?? '',
    assetCrystalId: getPossePublicAssetId(record.id, 'crystal'),
    assetBadgeId: getPossePublicAssetId(record.id, 'badge'),
  }
}

export function getPossesFullV2(): PosseFullV2Record[] {
  if (possesFullV2Cache) {
    return possesFullV2Cache
  }

  possesFullV2Cache = (getPublicRecordSnapshots('posses') as unknown as PublicPosseRecord[]).map(
    adaptPublicPosse,
  )
  return possesFullV2Cache
}

export function getPosseFullV2ById(
  posseId: string,
  records: PosseFullV2Record[],
): PosseFullV2Record | undefined {
  return records.find((record) => record.id === posseId)
}
