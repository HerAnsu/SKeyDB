import {describe, expect, it} from 'vitest'

import {
  parsePublicV3DerivedSkillCatalogRecord,
  parsePublicV3EnlightenCatalogRecord,
  parsePublicV3OverlayCatalogRecord,
  parsePublicV3SkillCatalogRecord,
  parsePublicV3SkillRecord,
  parsePublicV3TalentCatalogRecord,
} from './public-v3-awakener-record-adapters'

describe('public V3 awakener record adapters', () => {
  it('parses child catalog records without detail schema metadata', () => {
    expect(
      parsePublicV3SkillCatalogRecord({
        kind: 'skill',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
        ownerAwakenerId: 'awakener-0001',
        slot: 'Rouse',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3TalentCatalogRecord({
        kind: 'talent',
        id: 'talent.cached.passive',
        name: 'Cached Passive',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3EnlightenCatalogRecord({
        kind: 'enlighten',
        id: 'enlighten.cached.one',
        name: 'Cached Enlighten',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3DerivedSkillCatalogRecord({
        kind: 'derivedSkill',
        id: 'derived.cached.extra',
        name: 'Cached Derived',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
    expect(
      parsePublicV3OverlayCatalogRecord({
        kind: 'overlay',
        id: 'overlay.cached.mark',
        name: 'Cached Overlay',
        ownerAwakenerId: 'awakener-0001',
      }),
    ).not.toHaveProperty('schemaVersion')
  })

  it('rejects malformed child catalog records before adaptation', () => {
    expect(() =>
      parsePublicV3SkillCatalogRecord({
        kind: 'talent',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
      }),
    ).toThrow()
    expect(() =>
      parsePublicV3OverlayCatalogRecord({
        kind: 'overlay',
        id: 'overlay.cached.mark',
      }),
    ).toThrow()
  })

  it('keeps detail record parsing stricter than catalog parsing', () => {
    expect(() =>
      parsePublicV3SkillRecord({
        kind: 'skill',
        id: 'skill.cached.rouse',
        name: 'Cached Rouse',
      }),
    ).toThrow()
  })
})
