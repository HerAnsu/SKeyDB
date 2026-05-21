import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {getAwakenerCardMetaData, resolveAwakenerCardMetaIntent} from './awakener-card-meta-model'

function makeAwakener(overrides: Partial<Awakener> = {}): Awakener {
  return {
    aliases: [],
    faction: 'Test',
    id: 'awakener-0001',
    lineupToken: 'test',
    name: 'Test',
    numericId: 1,
    realm: 'CHAOS',
    tags: [],
    ...overrides,
  }
}

describe('resolveAwakenerCardMetaIntent', () => {
  it('prioritizes scaling evidence over other card meta intents', () => {
    expect(
      resolveAwakenerCardMetaIntent({
        availabilityFilter: 'LIMITED',
        rarityFilter: 'SSR',
        scalingSubstatFilters: [{key: 'CritRate', role: 'ANY'}],
        sortKey: 'RELEASE_DATE',
      }),
    ).toBe('scaling')
  })

  it('uses release date meta for release date sorting', () => {
    expect(
      resolveAwakenerCardMetaIntent({
        availabilityFilter: 'ALL',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [],
        sortKey: 'RELEASE_DATE',
      }),
    ).toBe('release-date')
  })

  it('uses rarity source meta for rarity sorting or source and rarity filters', () => {
    expect(
      resolveAwakenerCardMetaIntent({
        availabilityFilter: 'ALL',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [],
        sortKey: 'RARITY',
      }),
    ).toBe('rarity-source')
    expect(
      resolveAwakenerCardMetaIntent({
        availabilityFilter: 'WELFARE',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [],
        sortKey: 'BEST_MATCH',
      }),
    ).toBe('rarity-source')
    expect(
      resolveAwakenerCardMetaIntent({
        availabilityFilter: 'ALL',
        rarityFilter: 'Genesis',
        scalingSubstatFilters: [],
        sortKey: 'BEST_MATCH',
      }),
    ).toBe('rarity-source')
  })

  it('omits rarity and source axes that are already implied by filters', () => {
    const astralSsr = makeAwakener({
      availabilityType: 'LIMITED_ASTRAL_REIGN',
      rarity: 'SSR',
    })

    expect(
      getAwakenerCardMetaData(astralSsr, {
        availabilityFilter: 'LIMITED',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [],
        sortKey: 'BEST_MATCH',
      }),
    ).toEqual({kind: 'text', label: 'SSR · Astral Reign'})
    expect(
      getAwakenerCardMetaData(astralSsr, {
        availabilityFilter: 'ALL',
        rarityFilter: 'SSR',
        scalingSubstatFilters: [],
        sortKey: 'BEST_MATCH',
      }),
    ).toEqual({kind: 'text', label: 'Limited · Astral Reign'})
    expect(
      getAwakenerCardMetaData(astralSsr, {
        availabilityFilter: 'LIMITED_ASTRAL_REIGN',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [],
        sortKey: 'BEST_MATCH',
      }),
    ).toBeNull()
  })

  it('keeps the rarity source ladder visible for rarity sorting except filtered axes', () => {
    const astralSsr = makeAwakener({
      availabilityType: 'LIMITED_ASTRAL_REIGN',
      rarity: 'SSR',
    })

    expect(
      getAwakenerCardMetaData(astralSsr, {
        availabilityFilter: 'ALL',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [],
        sortKey: 'RARITY',
      }),
    ).toEqual({kind: 'text', label: 'SSR · Limited · Astral Reign'})
    expect(
      getAwakenerCardMetaData(astralSsr, {
        availabilityFilter: 'ALL',
        rarityFilter: 'SSR',
        scalingSubstatFilters: [],
        sortKey: 'RARITY',
      }),
    ).toEqual({kind: 'text', label: 'Limited · Astral Reign'})
  })

  it('renders both scaling roles when scaling meta is active', () => {
    const awakener = makeAwakener({
      substatScaling: {CritRate: 1.6, CritDamage: 1.2},
    })

    expect(
      getAwakenerCardMetaData(awakener, {
        availabilityFilter: 'ALL',
        rarityFilter: 'ALL',
        scalingSubstatFilters: [{key: 'CritRate', role: 'ANY'}],
        sortKey: 'BEST_MATCH',
      }),
    ).toMatchObject({
      ariaLabel: 'Primary scaling: Crit Rate; Secondary scaling: Crit DMG',
      entries: [
        {key: 'CritRate', role: 'MAIN'},
        {key: 'CritDamage', role: 'SUB'},
      ],
      kind: 'scaling',
    })
  })
})
