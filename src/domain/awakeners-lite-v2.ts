import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

export const awakenersLiteV2RecordSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  ingameId: z.string().trim().min(1).optional(),
  faction: z.string().trim().min(1),
  realm: z.string().trim().min(1),
  rarity: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  aliases: z.array(z.string().trim().min(1)),
  stats: liteStatsSchema,
  tags: z.array(z.string().trim().min(1)),
  unreleased: z.boolean().optional(),
})

export const awakenersLiteV2DatasetSchema = z.array(awakenersLiteV2RecordSchema)

export type AwakenerLiteV2Record = z.infer<typeof awakenersLiteV2RecordSchema>

let awakenersLiteV2Cache: AwakenerLiteV2Record[] | null = null

interface PublicAwakenerLiteEnvelope {
  id: string
  numericId: number
  name: string
  ingameId?: string
  faction: string
  realm: string
  rarity?: string
  type?: string
  route?: {
    slug?: string
  }
  aliases?: string[]
  searchTags?: string[]
  baseStatsLv1: AwakenerLiteV2Record['stats']
}

function resolveCanonicalAwakenerName(record: PublicAwakenerLiteEnvelope) {
  const alias = record.aliases?.find((entry) => !entry.trim().startsWith('g-'))?.trim()
  if (alias) {
    return alias
  }
  const portraitKey = record.route?.slug?.trim()
  if (portraitKey) {
    return portraitKey.replace(/-/g, ': ')
  }
  return record.name.trim().toLowerCase()
}

function adaptPublicAwakenerLite(record: PublicAwakenerLiteEnvelope): AwakenerLiteV2Record {
  const name = resolveCanonicalAwakenerName(record)

  return {
    id: record.numericId,
    name,
    ingameId: record.ingameId,
    faction: record.faction,
    realm: record.realm,
    rarity: record.rarity,
    type: record.type,
    aliases: Array.from(new Set([name, record.name, ...(record.aliases ?? [])])),
    stats: record.baseStatsLv1,
    tags: record.searchTags ?? [],
  }
}

export function getAwakenersLiteV2(): AwakenerLiteV2Record[] {
  if (awakenersLiteV2Cache) {
    return awakenersLiteV2Cache
  }

  awakenersLiteV2Cache = awakenersLiteV2DatasetSchema.parse(
    (getPublicCatalogRecords('awakeners') as unknown as PublicAwakenerLiteEnvelope[]).map(
      adaptPublicAwakenerLite,
    ),
  )
  return awakenersLiteV2Cache
}
