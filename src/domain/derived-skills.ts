import publicDerivedSkillsFull from '@/data/public-v2/full/derived-skills.json'

import {derivedSkillsDatasetSchema, type DerivedSkillRecord} from './awakener-source-schema'

interface PublicDerivedSkillsEnvelope {
  records: (Omit<DerivedSkillRecord, 'ownerAwakenerId'> & {ownerAwakenerId?: string})[]
}

let derivedSkillsCache: DerivedSkillRecord[] | null = null

function numericAwakenerId(publicAwakenerId: string): number | undefined {
  const suffix = /^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1]
  return suffix ? Number(suffix) : undefined
}

function adaptPublicDerivedSkill(
  record: PublicDerivedSkillsEnvelope['records'][number],
): DerivedSkillRecord {
  const derivedFromId = record.derivedFromId ?? undefined
  const rootSkillId = record.rootSkillId ?? undefined

  return {
    ...record,
    derivedFromId,
    rootSkillId,
    ownerAwakenerId: record.ownerAwakenerId ? numericAwakenerId(record.ownerAwakenerId) : undefined,
  }
}

export function getDerivedSkills(): DerivedSkillRecord[] {
  if (derivedSkillsCache) {
    return derivedSkillsCache
  }

  derivedSkillsCache = derivedSkillsDatasetSchema.parse(
    (publicDerivedSkillsFull as unknown as PublicDerivedSkillsEnvelope).records.map(
      adaptPublicDerivedSkill,
    ),
  )
  return derivedSkillsCache
}

export function loadDerivedSkills(): Promise<DerivedSkillRecord[]> {
  return Promise.resolve(getDerivedSkills())
}

export function getDerivedSkillById(
  derivedSkillId: string,
  derivedSkills: DerivedSkillRecord[],
): DerivedSkillRecord | undefined {
  return derivedSkills.find((entry) => entry.id === derivedSkillId)
}

export function getDerivedSkillsForAwakener(
  awakenerId: number,
  derivedSkills: DerivedSkillRecord[],
): DerivedSkillRecord[] {
  return derivedSkills.filter((entry) => entry.ownerAwakenerId === awakenerId)
}

export function getDerivedSkillsForRootSkill(
  rootSkillId: string,
  derivedSkills: DerivedSkillRecord[],
): DerivedSkillRecord[] {
  return derivedSkills.filter((entry) => entry.rootSkillId === rootSkillId)
}
