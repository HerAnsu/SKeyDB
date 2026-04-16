import awakenersSkillsJson from '@/data/awakeners/awakener-skills.json'

import {awakenerSkillsDatasetSchema, type AwakenerSkillRecord} from './awakener-source-schema'

let awakenerSkillsCache: AwakenerSkillRecord[] | null = null

export function getAwakenerSkills(): AwakenerSkillRecord[] {
  if (awakenerSkillsCache) {
    return awakenerSkillsCache
  }

  awakenerSkillsCache = awakenerSkillsDatasetSchema.parse(awakenersSkillsJson)
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
