import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

const publicV3AwakenerCatalogRecordSchema = z
  .object({
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
    baseStatsLv1: liteStatsSchema,
    lineupToken: z.string().trim().min(1),
  })
  .loose()

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
  lineupToken: string
}

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

function resolveCanonicalAwakenerName(awakener: {name: string; aliases?: string[]}): string {
  const alias = awakener.aliases?.find((entry) => !entry.trim().startsWith('g-'))?.trim()
  if (alias) {
    return alias
  }
  return awakener.name.trim().toLowerCase()
}

const parsedAwakeners = getPublicCatalogRecords('awakeners')
  .map((record) => publicV3AwakenerCatalogRecordSchema.parse(record))
  .map((awakener): Awakener => {
    const name = resolveCanonicalAwakenerName(awakener)
    const aliases = Array.from(new Set([name, awakener.name, ...(awakener.aliases ?? [])]))
    const tags = Array.from(new Set(awakener.searchTags ?? []))

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
      stats: awakener.baseStatsLv1,
      tags,
      lineupToken: awakener.lineupToken,
    }
  })
assertUniqueIngameIds(parsedAwakeners)

export function getAwakeners(): Awakener[] {
  return parsedAwakeners
}
