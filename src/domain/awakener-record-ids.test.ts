import {describe, expect, it} from 'vitest'

import {
  buildAwakenerEnlightenRecordId,
  buildAwakenerSkillRecordId,
  buildAwakenerTalentRecordId,
  normalizeAwakenerRecordKey,
} from './awakener-record-ids'

describe('awakener-record-ids', () => {
  it('normalizes record keys consistently', () => {
    expect(normalizeAwakenerRecordKey('24')).toBe('24')
    expect(normalizeAwakenerRecordKey('ramona: timeworn')).toBe('ramona-timeworn')
    expect(normalizeAwakenerRecordKey('"24"')).toBe('24')
    expect(normalizeAwakenerRecordKey('Dirge of the Unbroken')).toBe('dirge-of-the-unbroken')
  })

  it('builds stable skill, talent, and enlighten ids', () => {
    expect(buildAwakenerSkillRecordId('tawil', 'The Silver Key Gate')).toBe(
      'skill.tawil.the-silver-key-gate',
    )
    expect(buildAwakenerTalentRecordId('castor', 'Cleansing Feathers')).toBe(
      'talent.castor.cleansing-feathers',
    )
    expect(buildAwakenerEnlightenRecordId('erica', 'Final Decree')).toBe(
      'enlighten.erica.final-decree',
    )
  })
})
