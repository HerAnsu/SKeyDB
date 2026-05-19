import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {DatabaseBrowseState} from '@/domain/database-browse-state'

import {filterAwakenersForDatabase, useDatabaseViewModel} from './useDatabaseViewModel'

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

function makeBrowseState(overrides: Partial<DatabaseBrowseState> = {}): DatabaseBrowseState {
  return {
    query: '',
    realmFilter: 'ALL',
    rarityFilter: 'ALL',
    typeFilter: 'ALL',
    availabilityFilter: 'ALL',
    sortKey: 'ALPHABETICAL',
    sortDirection: 'ASC',
    groupByRealm: false,
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

describe('useDatabaseViewModel', () => {
  it('keeps active search relevance ahead of the selected sort', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Alpha',
        aliases: ['Alpha'],
        tags: ['vuln'],
        stats: {CON: 100, ATK: 200, DEF: 100},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Vulcan',
        aliases: ['Vulcan'],
        tags: [],
        stats: {CON: 100, ATK: 50, DEF: 100},
      }),
    ]

    const {result} = renderHook(() =>
      useDatabaseViewModel(
        awakeners,
        makeBrowseState({query: 'vul', sortKey: 'ATK', sortDirection: 'DESC'}),
      ),
    )

    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual(['Vulcan', 'Alpha'])
  })

  it('uses the selected sort inside equal relevance buckets', () => {
    const awakeners = [
      makeAwakener({
        id: 'awakener-0001',
        name: 'Lower ATK',
        aliases: ['Lower ATK'],
        tags: ['Draw'],
        stats: {CON: 100, ATK: 50, DEF: 100},
      }),
      makeAwakener({
        id: 'awakener-0002',
        name: 'Higher ATK',
        aliases: ['Higher ATK'],
        tags: ['Draw'],
        stats: {CON: 100, ATK: 200, DEF: 100},
      }),
    ]

    const {result} = renderHook(() =>
      useDatabaseViewModel(
        awakeners,
        makeBrowseState({query: 'draw', sortKey: 'ATK', sortDirection: 'DESC'}),
      ),
    )

    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual([
      'Higher ATK',
      'Lower ATK',
    ])
  })
})
