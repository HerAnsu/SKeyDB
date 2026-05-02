import publicEnlightensFull from '@/data/public-v2/full/enlightens.json'
import publicSkillsFull from '@/data/public-v2/full/skills.json'
import publicTalentsFull from '@/data/public-v2/full/talents.json'
import publicAwakenersLite from '@/data/public-v2/lite/awakeners.json'

import {awakenerKitsDatasetSchema, type AwakenerKitRecord} from './awakener-source-schema'

interface PublicOwnedRecord {
  id: string
  ownerAwakenerId: string
  slot?: string
  family?: string
}

interface PublicAwakenerEnvelope {
  records: Array<{id: string; numericId: number}>
}

interface PublicOwnedEnvelope {
  records: PublicOwnedRecord[]
}

let awakenerKitsCache: AwakenerKitRecord[] | null = null

function requireOwnedRecord(records: PublicOwnedRecord[], slot: string, ownerId: string): string {
  const record = records.find((entry) => entry.ownerAwakenerId === ownerId && entry.slot === slot)
  if (!record) {
    throw new Error(`Missing public V2 kit record for ${ownerId} slot ${slot}.`)
  }
  return record.id
}

function optionalOwnedRecord(
  records: PublicOwnedRecord[],
  slot: string,
  ownerId: string,
): string | undefined {
  return records.find((entry) => entry.ownerAwakenerId === ownerId && entry.slot === slot)?.id
}

function adaptPublicAwakenerToKit(record: {id: string; numericId: number}): AwakenerKitRecord {
  const skills = (publicSkillsFull as unknown as PublicOwnedEnvelope).records
  const talents = (publicTalentsFull as unknown as PublicOwnedEnvelope).records
  const enlightens = (publicEnlightensFull as unknown as PublicOwnedEnvelope).records
  const ownerTalents = talents.filter((entry) => entry.ownerAwakenerId === record.id)
  const passiveTalents = ownerTalents.filter((entry) => entry.family === 'passive')

  return {
    awakenerId: record.numericId,
    cards: {
      C1: requireOwnedRecord(skills, 'Rouse', record.id),
      C2: requireOwnedRecord(skills, 'Strike', record.id),
      C3: requireOwnedRecord(skills, 'Defense', record.id),
      C4: requireOwnedRecord(skills, 'Skill1', record.id),
      C5: requireOwnedRecord(skills, 'Skill2', record.id),
      Exalt: requireOwnedRecord(skills, 'Exalt', record.id),
      OverExalt: optionalOwnedRecord(skills, 'OverExalt', record.id),
      promotedExtras: [],
    },
    talents: {
      T1: passiveTalents[0]?.id,
      T2: ownerTalents.find((entry) => entry.family === 'madness_omen')?.id,
      T3: ownerTalents.find((entry) => entry.family === 'soulforge_aptitude')?.id,
      T4: passiveTalents[1]?.id,
      extraTalentIds: passiveTalents.slice(2).map((entry) => entry.id),
    },
    enlightens: {
      E1: requireOwnedRecord(enlightens, 'E1', record.id),
      E2: requireOwnedRecord(enlightens, 'E2', record.id),
      E3: requireOwnedRecord(enlightens, 'E3', record.id),
      OverExalt: optionalOwnedRecord(enlightens, 'OverExalt', record.id),
      AbsoluteAxiom: optionalOwnedRecord(enlightens, 'AbsoluteAxiom', record.id),
    },
  }
}

export function getAwakenerKits(): AwakenerKitRecord[] {
  if (awakenerKitsCache) {
    return awakenerKitsCache
  }

  awakenerKitsCache = awakenerKitsDatasetSchema.parse(
    (publicAwakenersLite as unknown as PublicAwakenerEnvelope).records.map(
      adaptPublicAwakenerToKit,
    ),
  )
  return awakenerKitsCache
}

export function getAwakenerKitById(
  awakenerId: number,
  kits: AwakenerKitRecord[],
): AwakenerKitRecord | undefined {
  return kits.find((entry) => entry.awakenerId === awakenerId)
}
