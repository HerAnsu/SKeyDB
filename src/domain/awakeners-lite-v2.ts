import {z} from 'zod'

import publicAwakenersFull from '@/data/public-v2/full/awakeners.json'
import publicAwakenersLite from '@/data/public-v2/lite/awakeners.json'

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
  records: Array<{
    id: string
    numericId: number
    name: string
    ingameId?: string
    faction: string
    realm: string
    rarity?: string
    type?: string
    aliases?: string[]
    searchTags?: string[]
  }>
}

interface PublicAwakenerFullEnvelope {
  records: Array<{
    id: string
    baseStatsLv1: AwakenerLiteV2Record['stats']
  }>
}

const publicFullById = new Map(
  (publicAwakenersFull as PublicAwakenerFullEnvelope).records.map((record) => [record.id, record]),
)

function adaptPublicAwakenerLite(
  record: PublicAwakenerLiteEnvelope['records'][number],
): AwakenerLiteV2Record {
  const fullRecord = publicFullById.get(record.id)
  if (!fullRecord) {
    throw new Error(`Missing public V2 full awakener stats for "${record.id}".`)
  }

  return {
    id: record.numericId,
    name: record.name,
    ingameId: record.ingameId,
    faction: record.faction,
    realm: record.realm,
    rarity: record.rarity,
    type: record.type,
    aliases: record.aliases ?? [record.name],
    stats: fullRecord.baseStatsLv1,
    tags: record.searchTags ?? [],
  }
}

export function getAwakenersLiteV2(): AwakenerLiteV2Record[] {
  if (awakenersLiteV2Cache) {
    return awakenersLiteV2Cache
  }

  awakenersLiteV2Cache = awakenersLiteV2DatasetSchema.parse(
    (publicAwakenersLite as PublicAwakenerLiteEnvelope).records.map(adaptPublicAwakenerLite),
  )
  return awakenersLiteV2Cache
}
