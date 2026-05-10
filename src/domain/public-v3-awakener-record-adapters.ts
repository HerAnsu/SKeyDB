import {resolvePublicAsset} from '@/data-access/public-data/assetRepository'
import type {PublicRecord} from '@/data-access/public-data/contract'

import {
  awakenerOverlaySchema,
  awakenersEnlightenSchema,
  awakenerSkillSchema,
  awakenerTalentSchema,
  derivedSkillSchema,
  type AwakenerEnlightenRecord,
  type AwakenerOverlayRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type DerivedSkillRecord,
} from './awakener-source-schema'

const publicV3AwakenerSkillSchema = awakenerSkillSchema.loose()
const publicV3AwakenerTalentSchema = awakenerTalentSchema.loose()
const publicV3AwakenerEnlightenSchema = awakenersEnlightenSchema.loose()
const publicV3DerivedSkillSchema = derivedSkillSchema.loose()
const publicV3AwakenerOverlaySchema = awakenerOverlaySchema.loose()

export type PublicV3OwnedRecord = PublicRecord & {
  ownerAwakenerId?: string
  ownerAwakenerName?: string
}

export type PublicV3SkillRecord = PublicV3OwnedRecord & {
  cardKeywords?: unknown[]
  descriptionArgs?: unknown
  descriptionTemplate?: string
  slot?: string
}

export type PublicV3TalentRecord = PublicV3OwnedRecord & {
  descriptionArgs?: unknown
  descriptionTemplate?: string
  family?: string
  maxLevel?: number
}

export type PublicV3EnlightenRecord = PublicV3OwnedRecord & {
  descriptionArgs?: unknown
  descriptionTemplate?: string
  slot?: string
}

export type PublicV3DerivedSkillRecord = PublicV3OwnedRecord & {
  cardKeywords?: unknown[]
  childDerivedSkillIds?: string[]
  descriptionArgs?: unknown
  descriptionTemplate?: string
}

export type PublicV3OverlayRecord = PublicV3OwnedRecord & {
  aliases?: string[]
  descriptionArgs?: unknown
  descriptionTemplate?: string
  iconId?: string
  overlayType?: string
}

export function numericAwakenerId(publicAwakenerId: string): number {
  return Number(/^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1] ?? 0)
}

export function optionalNumericAwakenerId(
  publicAwakenerId: string | undefined,
): number | undefined {
  return publicAwakenerId ? numericAwakenerId(publicAwakenerId) : undefined
}

export function skillKindFromPublicSlot(slot: string | undefined): AwakenerSkillRecord['kind'] {
  switch (slot) {
    case 'Rouse':
      return 'rouse'
    case 'Strike':
      return 'strike'
    case 'Defense':
      return 'defense'
    case 'Skill1':
    case 'Skill2':
      return 'command'
    case 'Exalt':
      return 'exalt'
    case 'OverExalt':
      return 'over_exalt'
    default:
      return 'other'
  }
}

export function adaptPublicV3SkillRecord(record: PublicV3SkillRecord): AwakenerSkillRecord {
  return publicV3AwakenerSkillSchema.parse({
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    kind: skillKindFromPublicSlot(record.slot),
    displayName: record.name,
    cardKeywords: record.cardKeywords ?? [],
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    variants: [],
  })
}

export function adaptPublicV3TalentRecord(record: PublicV3TalentRecord): AwakenerTalentRecord {
  return publicV3AwakenerTalentSchema.parse({
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    hasLevelScaledDescription: record.maxLevel !== undefined,
  })
}

export function adaptPublicV3EnlightenRecord(
  record: PublicV3EnlightenRecord,
): AwakenerEnlightenRecord {
  return publicV3AwakenerEnlightenSchema.parse({
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
  })
}

export function adaptPublicV3DerivedSkillRecord(
  record: PublicV3DerivedSkillRecord,
): DerivedSkillRecord {
  return publicV3DerivedSkillSchema.parse({
    ...record,
    ownerAwakenerId: optionalNumericAwakenerId(record.ownerAwakenerId),
    displayName: record.name,
    childDerivedSkillIds: record.childDerivedSkillIds ?? [],
    cardKeywords: record.cardKeywords ?? [],
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    variants: [],
  })
}

export function adaptPublicV3OverlayRecord(record: PublicV3OverlayRecord): AwakenerOverlayRecord {
  const iconId =
    record.iconId ??
    (record.assets?.icon ? resolvePublicAsset(record.assets.icon)?.assetId : undefined)

  return publicV3AwakenerOverlaySchema.parse({
    ...record,
    ownerAwakenerId: optionalNumericAwakenerId(record.ownerAwakenerId),
    displayName: record.name,
    aliases: record.aliases ?? [],
    iconId,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
  })
}
