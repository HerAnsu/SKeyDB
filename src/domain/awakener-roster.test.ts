import {describe, expect, it} from 'vitest'

import {buildAwakenerRosterMap, getAwakenerRoster, getAwakenerRosterById} from './awakener-roster'

describe('awakener-roster', () => {
  it('loads canonical roster records from the normalized dataset', () => {
    const roster = getAwakenerRoster()

    expect(roster.length).toBeGreaterThan(0)
    expect(roster[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        key: expect.any(String),
        displayName: expect.any(String),
        faction: expect.any(String),
        realm: expect.any(String),
        stats: expect.objectContaining({
          CON: expect.any(String),
          ATK: expect.any(String),
          DEF: expect.any(String),
        }),
        assets: expect.objectContaining({
          portraitKey: expect.any(String),
          iconKey: expect.any(String),
        }),
      }),
    )
  })

  it('keeps ids and keys unique', () => {
    const roster = getAwakenerRoster()
    const ids = roster.map((entry) => entry.id)
    const keys = roster.map((entry) => entry.key)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('supports lookup and mapping by awakener id', () => {
    const roster = getAwakenerRoster()
    const first = roster[0]
    const byId = getAwakenerRosterById(first.id, roster)
    const map = buildAwakenerRosterMap(roster)

    expect(byId).toEqual(first)
    expect(map.get(first.id)).toEqual(first)
  })

  it('preserves known asset and key edge cases', () => {
    const roster = getAwakenerRoster()

    expect(roster.find((entry) => entry.displayName === '24')).toEqual(
      expect.objectContaining({
        key: '24',
        assets: expect.objectContaining({
          portraitKey: 'mason',
        }),
      }),
    )

    expect(roster.find((entry) => entry.displayName === 'ramona: timeworn')).toEqual(
      expect.objectContaining({
        key: 'ramona-timeworn',
      }),
    )
  })

  it('allows authored search tags to live on roster records', () => {
    const roster = getAwakenerRoster()

    expect(
      roster.every((entry) => entry.searchTags === undefined || Array.isArray(entry.searchTags)),
    ).toBe(true)
  })
})
