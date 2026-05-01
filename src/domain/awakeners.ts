import {z} from 'zod'

import awakenersCompatLite from '@/data/awakeners/compiled/awakeners-lite.v2.json'
import publicAwakenersLite from '@/data/public-v2/lite/awakeners.json'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

const rawAwakenersSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1),
    ingameId: z.string().trim().min(1).optional(),
    faction: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    rarity: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
    stats: liteStatsSchema.optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    unreleased: z.boolean().optional(),
  }),
)

const publicAwakenersLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('awakeners'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^awakener-\d{4}$/),
        numericId: z.number().int().positive(),
        name: z.string().trim().min(1),
        ingameId: z.string().trim().min(1).optional(),
        faction: z.string().trim().min(1),
        realm: z.string().trim().min(1),
        rarity: z.string().trim().min(1).optional(),
        type: z.string().trim().min(1).optional(),
        aliases: z.array(z.string().trim().min(1)).optional(),
        searchTags: z.array(z.string().trim().min(1)).optional(),
      }),
    ),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

export interface AwakenerLiteStats {
  CON: number
  ATK: number
  DEF: number
}

export interface Awakener {
  id: string
  numericId?: number
  name: string
  ingameId?: string
  faction: string
  realm: string
  rarity?: string
  type?: string
  aliases: string[]
  stats?: AwakenerLiteStats
  tags: string[]
  unreleased?: boolean
}

const compatAwakenerByNumericId = new Map(
  rawAwakenersSchema.parse(awakenersCompatLite).map((awakener) => [awakener.id, awakener] as const),
)

function assertUniqueIngameIds(awakeners: Awakener[]) {
  const awakenerNameByIngameId = new Map<string, string>()
  for (const awakener of awakeners) {
    if (!awakener.ingameId) {
      continue
    }
    const existingName = awakenerNameByIngameId.get(awakener.ingameId)
    if (existingName) {
      throw new Error(
        `Duplicate awakener ingameId "${awakener.ingameId}" for "${existingName}" and "${awakener.name}".`,
      )
    }
    awakenerNameByIngameId.set(awakener.ingameId, awakener.name)
  }
}

function getCompatStats(publicId: string, numericId: number): AwakenerLiteStats {
  const stats = compatAwakenerByNumericId.get(numericId)?.stats
  if (!stats) {
    throw new Error(`Missing compatibility stats for public awakener "${publicId}".`)
  }
  return stats
}

const parsedAwakeners = publicAwakenersLiteSchema
  .parse(publicAwakenersLite)
  .records.map((awakener): Awakener => {
    const compatAwakener = compatAwakenerByNumericId.get(awakener.numericId)
    const name = compatAwakener?.name ?? awakener.name
    const aliases = Array.from(new Set([name, ...(awakener.aliases ?? [])]))
    const tags = Array.from(
      new Set([...(compatAwakener?.tags ?? []), ...(awakener.searchTags ?? [])]),
    )

    return {
      id: awakener.id,
      numericId: awakener.numericId,
      name,
      ingameId: awakener.ingameId?.toUpperCase(),
      faction: awakener.faction,
      realm: awakener.realm,
      rarity: awakener.rarity,
      type: awakener.type,
      aliases,
      stats: getCompatStats(awakener.id, awakener.numericId),
      tags,
    }
  })
assertUniqueIngameIds(parsedAwakeners)

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}
