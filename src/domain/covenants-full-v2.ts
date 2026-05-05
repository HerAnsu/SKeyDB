import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicRecordSnapshots} from '@/data-access/public-data/recordSnapshots'

import type {DescriptionArg} from './awakener-source-schema'

export interface CovenantSetEffectRecord {
  set: number
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
}

export interface CovenantFullV2Record {
  id: string
  name: string
  assetId: string
  setEffects: CovenantSetEffectRecord[]
  lore?: string
}

interface PublicCovenantRecord {
  id: string
  name: string
  setEffects: CovenantSetEffectRecord[]
  lore?: string
}

let covenantsFullV2Cache: CovenantFullV2Record[] | null = null

function getCovenantPublicAssetId(covenantId: string): string {
  const assetIndexId = resolvePublicEntityAsset(covenantId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''
}

function adaptPublicCovenant(record: PublicCovenantRecord): CovenantFullV2Record {
  return {
    ...record,
    assetId: getCovenantPublicAssetId(record.id),
  }
}

export function getCovenantsFullV2(): CovenantFullV2Record[] {
  if (covenantsFullV2Cache) {
    return covenantsFullV2Cache
  }

  covenantsFullV2Cache = (
    getPublicRecordSnapshots('covenants') as unknown as PublicCovenantRecord[]
  ).map(adaptPublicCovenant)
  return covenantsFullV2Cache
}
