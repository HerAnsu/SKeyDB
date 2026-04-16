import {z} from 'zod'

import {type AwakenerOverlayRecord} from './awakener-source-schema.ts'
import {type AwakenerFullV2Record} from './awakeners-full-v2-compiler.ts'

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

const OVERLAY_TAG_BY_NAME = new Map<string, string[]>([
  ['Aftershock', ['Aftershock']],
  ['Bleed', ['Bleed']],
  ['Blighten', ['Blighten']],
  ['Counter', ['Counter']],
  ['Embryo Fusion', ['Embryo Fusion']],
  ['Fainted', ['Stun']],
  ['Fixed DMG', ['Fixed DMG']],
  ['Fortress', ['Fortress']],
  ['Fragile', ['Fragile']],
  ['Petrify', ['Stun']],
  ['Pierce DMG', ['Pierce DMG']],
  ['Poison', ['Poison']],
  ['Pursuit', ['Pursuit']],
  ['Quasar', ['Quasar']],
  ['Resonance', ['Resonance']],
  ['Sealed', ['Sealed']],
  ['Stagnation', ['Stagnation']],
  ['STR', ['STR Up']],
  ['STR⯆', ['STR Down']],
  ['Vulnerable', ['Vulnerability']],
  ['Vulnerability', ['Vulnerability']],
  ['Weakness', ['Weakness']],
])

const DESCRIPTION_REFERENCE_PATTERN = /\{([^}]+)\}/g

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function extractDescriptionReferences(descriptionTemplate: string): string[] {
  const matches = descriptionTemplate.matchAll(DESCRIPTION_REFERENCE_PATTERN)
  return Array.from(new Set(Array.from(matches, (match) => match[1].trim()).filter(Boolean)))
}

function buildOverlayLookup(
  overlayRecords: AwakenerOverlayRecord[],
): Map<string, AwakenerOverlayRecord> {
  const byName = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlayRecords) {
    byName.set(normalize(overlay.displayName), overlay)
    for (const alias of overlay.aliases) {
      byName.set(normalize(alias), overlay)
    }
  }

  return byName
}

function buildRecordTextBuckets(record: AwakenerFullV2Record): string[] {
  const buckets: string[] = [
    record.cards.C1.descriptionTemplate,
    record.cards.C2.descriptionTemplate,
    record.cards.C3.descriptionTemplate,
    record.cards.C4.descriptionTemplate,
    record.cards.C5.descriptionTemplate,
    record.cards.Exalt.descriptionTemplate,
    ...record.cards.promotedExtras.map((entry) => entry.descriptionTemplate),
    ...record.derivedSkills.map((entry) => entry.descriptionTemplate),
    ...record.talents.extraTalents.map((entry) => entry.descriptionTemplate),
    record.enlightens.E1.descriptionTemplate,
    record.enlightens.E2.descriptionTemplate,
    record.enlightens.E3.descriptionTemplate,
  ]

  if (record.cards.OverExalt) {
    buckets.push(record.cards.OverExalt.descriptionTemplate)
  }

  for (const talent of [
    record.talents.T1,
    record.talents.T2,
    record.talents.T3,
    record.talents.T4,
  ]) {
    if (talent) {
      buckets.push(talent.descriptionTemplate)
    }
  }

  if (record.enlightens.AbsoluteAxiom) {
    buckets.push(record.enlightens.AbsoluteAxiom.descriptionTemplate)
  }

  return buckets
}

function inferOverlayTags(
  record: AwakenerFullV2Record,
  overlayRecords: AwakenerOverlayRecord[],
  overlayLookup: Map<string, AwakenerOverlayRecord>,
): string[] {
  const ownedOverlays = overlayRecords.filter((entry) => entry.ownerAwakenerId === record.id)
  const inferredTags = new Set<string>()

  for (const descriptionTemplate of buildRecordTextBuckets(record)) {
    for (const reference of extractDescriptionReferences(descriptionTemplate)) {
      const overlay = overlayLookup.get(normalize(reference))
      if (!overlay) {
        continue
      }

      for (const tag of OVERLAY_TAG_BY_NAME.get(overlay.displayName) ?? []) {
        inferredTags.add(tag)
      }
    }
  }

  for (const overlay of ownedOverlays) {
    for (const tag of OVERLAY_TAG_BY_NAME.get(overlay.displayName) ?? []) {
      inferredTags.add(tag)
    }

    for (const reference of extractDescriptionReferences(overlay.descriptionTemplate)) {
      const referencedOverlay = overlayLookup.get(normalize(reference))
      if (!referencedOverlay) {
        continue
      }

      for (const tag of OVERLAY_TAG_BY_NAME.get(referencedOverlay.displayName) ?? []) {
        inferredTags.add(tag)
      }
    }
  }

  return Array.from(inferredTags)
}

function parsePrimaryStat(value: string): number {
  return Number.parseInt(value, 10)
}

interface CompileAwakenersLiteV2Input {
  fullRecords: AwakenerFullV2Record[]
  overlayRecords: AwakenerOverlayRecord[]
}

function buildKnownLiteTags(fullRecords: AwakenerFullV2Record[]): Set<string> {
  const knownTags = new Set<string>()

  for (const record of fullRecords) {
    for (const tag of record.searchTags ?? []) {
      knownTags.add(normalize(tag))
    }
  }

  for (const tags of OVERLAY_TAG_BY_NAME.values()) {
    for (const tag of tags) {
      knownTags.add(normalize(tag))
    }
  }

  return knownTags
}

export function compileAwakenersLiteV2({
  fullRecords,
  overlayRecords,
}: CompileAwakenersLiteV2Input): AwakenerLiteV2Record[] {
  const overlayLookup = buildOverlayLookup(overlayRecords)
  const normalizedKnownTags = buildKnownLiteTags(fullRecords)

  const compiled = fullRecords.map((record) => {
    const tags = Array.from(
      new Set([
        ...(record.searchTags ?? []),
        ...inferOverlayTags(record, overlayRecords, overlayLookup),
      ]),
    ).sort((left, right) => left.localeCompare(right))

    for (const tag of tags) {
      if (!normalizedKnownTags.has(normalize(tag))) {
        throw new Error(`Unknown lite V2 tag "${tag}" on awakener "${record.displayName}".`)
      }
    }

    return {
      id: record.id,
      name: record.displayName,
      ingameId: record.ingameId,
      faction: record.faction,
      realm: record.realm,
      rarity: record.rarity,
      type: record.type,
      aliases: record.aliases,
      stats: {
        CON: parsePrimaryStat(record.stats.CON),
        ATK: parsePrimaryStat(record.stats.ATK),
        DEF: parsePrimaryStat(record.stats.DEF),
      },
      tags,
      unreleased: record.unreleased,
    }
  })

  return awakenersLiteV2DatasetSchema.parse(compiled)
}
