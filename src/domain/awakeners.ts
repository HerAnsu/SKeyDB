import { z } from 'zod'
import awakenersLite from '../data/awakeners-lite.json'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

const rawAwakenersSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1),
    faction: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    rarity: z.string().trim().min(1).optional(),
    type: z.string().trim().min(1).optional(),
    aliases: z.array(z.string().trim().min(1)).optional(),
    stats: liteStatsSchema.optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
  }),
)

export type AwakenerLiteStats = {
  CON: number
  ATK: number
  DEF: number
}

export type Awakener = {
  id: number
  name: string
  faction: string
  realm: string
  rarity?: string
  type?: string
  aliases: string[]
  stats?: AwakenerLiteStats
  tags: string[]
}

const parsedAwakeners = rawAwakenersSchema.parse(awakenersLite).map((awakener): Awakener => {
  const aliases = Array.from(new Set([awakener.name, ...(awakener.aliases ?? [])]))

  return {
    id: awakener.id,
    name: awakener.name,
    faction: awakener.faction,
    realm: awakener.realm,
    rarity: awakener.rarity,
    type: awakener.type,
    aliases,
    stats: awakener.stats,
    tags: awakener.tags ?? [],
  }
})

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}
