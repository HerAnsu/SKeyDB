import {describe, expect, it} from 'vitest'

import {
  DATABASE_BROWSE_DEFAULTS,
  parseDatabaseBrowseState,
  patchDatabaseBrowseState,
} from './database-browse-state'

describe('database-browse-state', () => {
  it('parses known browse params and falls back safely for invalid values', () => {
    const state = parseDatabaseBrowseState(
      new URLSearchParams('q=beta&realm=AEQUOR&rarity=SR&type=WARDEN&sort=ATK&dir=DESC&group=1'),
    )

    expect(state).toEqual({
      query: 'beta',
      realmFilter: 'AEQUOR',
      rarityFilter: 'SR',
      typeFilter: 'WARDEN',
      sortKey: 'ATK',
      sortDirection: 'DESC',
      groupByRealm: true,
    })

    expect(parseDatabaseBrowseState(new URLSearchParams('realm=missing&dir=sideways'))).toEqual(
      DATABASE_BROWSE_DEFAULTS,
    )
  })

  it('patches browse params while preserving unrelated query values', () => {
    const nextParams = patchDatabaseBrowseState(new URLSearchParams('foo=bar&q=alpha'), {
      realmFilter: 'CHAOS',
      sortKey: 'ATK',
      sortDirection: 'DESC',
    })

    expect(nextParams.toString()).toBe('foo=bar&q=alpha&realm=CHAOS&sort=ATK&dir=DESC')
  })

  it('elides default values when patching browse params', () => {
    const nextParams = patchDatabaseBrowseState(
      new URLSearchParams('q=alpha&realm=CHAOS&sort=ATK&dir=DESC&group=1'),
      DATABASE_BROWSE_DEFAULTS,
    )

    expect(nextParams.toString()).toBe('')
  })
})
