import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

import {
  publicDescriptionArgsSchema,
  type PublicDescriptionArg,
} from './public-description-args.schema'

export interface CovenantSetEffectRecord {
  set: number
  descriptionTemplate: string
  descriptionArgs: Record<string, PublicDescriptionArg>
}

export interface CovenantFullRecord {
  id: string
  name: string
  assetId: string
  setEffects: CovenantSetEffectRecord[]
  lore?: string
  acquisitionSource?: string
}

const publicCovenantRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  setEffects: z
    .array(
      z.object({
        set: z.number(),
        descriptionTemplate: z.string(),
        descriptionArgs: publicDescriptionArgsSchema,
      }),
    )
    .default([]),
  lore: z.string().optional(),
  acquisitionSource: z.string().optional(),
})

const publicCovenantRecordsSchema = z.array(publicCovenantRecordSchema)

type PublicCovenantRecord = z.infer<typeof publicCovenantRecordSchema>

let covenantsFullCache: CovenantFullRecord[] | null = null

function getCovenantPublicAssetId(covenantId: string): string {
  const assetIndexId = resolvePublicEntityAsset(covenantId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''
}

function adaptPublicCovenant(record: PublicCovenantRecord): CovenantFullRecord {
  return {
    ...record,
    assetId: getCovenantPublicAssetId(record.id),
  }
}

export function getCovenantsFull(): CovenantFullRecord[] {
  if (covenantsFullCache) {
    return covenantsFullCache
  }

  covenantsFullCache = publicCovenantRecordsSchema
    .parse(getPublicCatalogRecords('covenants'))
    .map(adaptPublicCovenant)
  return covenantsFullCache
}
