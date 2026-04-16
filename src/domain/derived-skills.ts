import derivedSkillsJson from '@/data/awakeners/derived-skills.json'

import {derivedSkillsDatasetSchema, type DerivedSkillRecord} from './awakener-source-schema'

let derivedSkillsCache: DerivedSkillRecord[] | null = null

export function getDerivedSkills(): DerivedSkillRecord[] {
  if (derivedSkillsCache) {
    return derivedSkillsCache
  }

  derivedSkillsCache = derivedSkillsDatasetSchema.parse(derivedSkillsJson)
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
