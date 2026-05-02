import publicSkillsFull from '@/data/public-v2/full/skills.json'

import {awakenerSkillsDatasetSchema, type AwakenerSkillRecord} from './awakener-source-schema'

interface PublicSkillsEnvelope {
  records: (Omit<AwakenerSkillRecord, 'ownerAwakenerId' | 'variants'> & {
    ownerAwakenerId: string
  })[]
}

let awakenerSkillsCache: AwakenerSkillRecord[] | null = null

function numericAwakenerId(publicAwakenerId: string): number {
  return Number(/^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1] ?? 0)
}

function adaptPublicSkill(record: PublicSkillsEnvelope['records'][number]): AwakenerSkillRecord {
  return {
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId),
    variants: [],
  }
}

export function getAwakenerSkills(): AwakenerSkillRecord[] {
  if (awakenerSkillsCache) {
    return awakenerSkillsCache
  }

  awakenerSkillsCache = awakenerSkillsDatasetSchema.parse(
    (publicSkillsFull as unknown as PublicSkillsEnvelope).records.map(adaptPublicSkill),
  )
  return awakenerSkillsCache
}

export function getAwakenerSkillById(
  skillId: string,
  skills: AwakenerSkillRecord[],
): AwakenerSkillRecord | undefined {
  return skills.find((entry) => entry.id === skillId)
}

export function getAwakenerSkillsForAwakener(
  awakenerId: number,
  skills: AwakenerSkillRecord[],
): AwakenerSkillRecord[] {
  return skills.filter((entry) => entry.ownerAwakenerId === awakenerId)
}
