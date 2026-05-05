import type {PublicRecord} from '@/data-access/public-data/contract'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'

export type PublicV3OwnedRecord = PublicRecord & {
  ownerAwakenerId?: string
  ownerAwakenerName?: string
}

export type PublicV3SkillRecord = PublicV3OwnedRecord & {
  cardKeywords?: unknown[]
  slot?: string
}

export type PublicV3TalentRecord = PublicV3OwnedRecord & {
  family?: string
  maxLevel?: number
}

export type PublicV3EnlightenRecord = PublicV3OwnedRecord & {
  slot?: string
}

export type PublicV3DerivedSkillRecord = PublicV3OwnedRecord & {
  cardKeywords?: unknown[]
  childDerivedSkillIds?: string[]
}

export type PublicV3OverlayRecord = PublicV3OwnedRecord & {
  aliases?: string[]
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
  return {
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    kind: skillKindFromPublicSlot(record.slot),
    displayName: record.name,
    cardKeywords: record.cardKeywords ?? [],
    variants: [],
  } as unknown as AwakenerSkillRecord
}

export function adaptPublicV3TalentRecord(record: PublicV3TalentRecord): AwakenerTalentRecord {
  return {
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    displayName: record.name,
    hasLevelScaledDescription: record.maxLevel !== undefined,
  } as unknown as AwakenerTalentRecord
}

export function adaptPublicV3EnlightenRecord(
  record: PublicV3EnlightenRecord,
): AwakenerEnlightenRecord {
  return {
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    displayName: record.name,
  } as unknown as AwakenerEnlightenRecord
}

export function adaptPublicV3DerivedSkillRecord(
  record: PublicV3DerivedSkillRecord,
): DerivedSkillRecord {
  return {
    ...record,
    ownerAwakenerId: optionalNumericAwakenerId(record.ownerAwakenerId),
    displayName: record.name,
    childDerivedSkillIds: record.childDerivedSkillIds ?? [],
    cardKeywords: record.cardKeywords ?? [],
    variants: [],
  } as unknown as DerivedSkillRecord
}

export function adaptPublicV3OverlayRecord(record: PublicV3OverlayRecord): AwakenerOverlayRecord {
  return {
    ...record,
    ownerAwakenerId: optionalNumericAwakenerId(record.ownerAwakenerId),
    displayName: record.name,
    aliases: record.aliases ?? [],
  } as unknown as AwakenerOverlayRecord
}
