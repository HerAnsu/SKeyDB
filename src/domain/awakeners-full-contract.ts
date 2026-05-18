import {z} from 'zod'

import {ENLIGHTEN_SLOT_KEYS, type AwakenerTalentRecord} from './awakener-source-schema'
import type {AwakenerFullRecord} from './awakeners-full'

export const selectedEnlightenSlotSchema = z.enum(ENLIGHTEN_SLOT_KEYS).nullable()
export const GNOSTIC_POTENTIAL_FAMILY = 'gnostic_potential'
export const SOULFORGE_APTITUDE_FAMILY = 'soulforge_aptitude'

function getTalentEntries(talents: AwakenerFullRecord['talents']): AwakenerTalentRecord[] {
  return [talents.T1, talents.T2, talents.T3, talents.T4, ...talents.extraTalents].filter(
    (entry): entry is AwakenerTalentRecord => Boolean(entry),
  )
}

export function isSoulforgeTalent(record: Pick<AwakenerTalentRecord, 'id' | 'family'>): boolean {
  return record.family === SOULFORGE_APTITUDE_FAMILY || record.id.endsWith('.soulforge-aptitude')
}

export function isGnosticPotentialTalent(
  record: Pick<AwakenerTalentRecord, 'id' | 'family'>,
): boolean {
  return record.family === GNOSTIC_POTENTIAL_FAMILY || record.id.endsWith('.gnostic-potential')
}

export function getSoulforgeTalents(
  talents: AwakenerFullRecord['talents'],
): AwakenerTalentRecord[] {
  return getTalentEntries(talents).filter(isSoulforgeTalent)
}

export function getGnosticPotentialTalents(
  talents: AwakenerFullRecord['talents'],
): AwakenerTalentRecord[] {
  return getTalentEntries(talents).filter(isGnosticPotentialTalent)
}
