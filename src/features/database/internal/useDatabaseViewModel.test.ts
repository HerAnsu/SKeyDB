import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {filterAwakenersForDatabase} from './useDatabaseViewModel'

function makeAwakener(overrides: Partial<Awakener>): Awakener {
  return {
    id: 'awakener-0001',
    numericId: 1,
    name: 'Alpha',
    faction: 'Test',
    realm: 'AEQUOR',
    rarity: 'SSR',
    type: 'ASSAULT',
    availabilityType: 'PERMANENT',
    releaseDate: '2023-11-29',
    aliases: ['Alpha'],
    tags: [],
    lineupToken: 'a',
    stats: {
      CON: 100,
      ATK: 100,
      DEF: 100,
    },
    ...overrides,
  }
}

describe('filterAwakenersForDatabase', () => {
  it('filters limited as both Faded Legacy and Astral Reign availability types', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'Permanent', availabilityType: 'PERMANENT'}),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Faded',
        availabilityType: 'LIMITED_FADED_LEGACY',
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'Astral',
        availabilityType: 'LIMITED_ASTRAL_REIGN',
      }),
      makeAwakener({id: 'awakener-0004', name: 'Welfare', availabilityType: 'WELFARE'}),
    ]

    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'LIMITED').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Faded', 'Astral'])
  })

  it('filters exact permanent, welfare, and limited banner availability types', () => {
    const awakeners = [
      makeAwakener({id: 'awakener-0001', name: 'Permanent', availabilityType: 'PERMANENT'}),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Faded',
        availabilityType: 'LIMITED_FADED_LEGACY',
      }),
      makeAwakener({
        id: 'awakener-0003',
        name: 'Astral',
        availabilityType: 'LIMITED_ASTRAL_REIGN',
      }),
      makeAwakener({id: 'awakener-0004', name: 'Welfare', availabilityType: 'WELFARE'}),
    ]

    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'PERMANENT').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Permanent'])
    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'WELFARE').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Welfare'])
    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'LIMITED_FADED_LEGACY').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Faded'])
    expect(
      filterAwakenersForDatabase(awakeners, 'ALL', 'ALL', 'ALL', 'LIMITED_ASTRAL_REIGN').map(
        (awakener) => awakener.name,
      ),
    ).toEqual(['Astral'])
  })
})
