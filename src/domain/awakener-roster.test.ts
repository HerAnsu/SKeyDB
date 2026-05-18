import {describe, expect, it} from 'vitest'

import {resolveAwakenerStatsForLevel} from './awakener-level-scaling'
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

    expect(roster.find((entry) => entry.displayName === '"24"')).toEqual(
      expect.objectContaining({
        key: '24',
        assets: expect.objectContaining({
          portraitKey: '24',
        }),
      }),
    )

    expect(roster.find((entry) => entry.displayName === 'Ramona: Timeworn')).toEqual(
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

  it('stores Arachne primary scaling that reproduces the provided level breakpoints', () => {
    const roster = getAwakenerRoster()
    const arachne = roster.find((entry) => entry.displayName === 'Arachne')

    expect(arachne).toEqual(
      expect.objectContaining({
        primaryScalingBase: 20,
        statScaling: {
          CON: 1.6,
          ATK: 1.15,
          DEF: 1.55,
        },
      }),
    )

    if (!arachne) {
      throw new Error('Expected arachne in the source roster')
    }

    expect(
      [1, 10, 20, 30, 40, 50, 60].map((level) => resolveAwakenerStatsForLevel(arachne, level).CON),
    ).toEqual(['34', '48', '64', '80', '96', '112', '128'])

    expect(
      [1, 10, 20, 30, 40, 50, 60].map((level) => resolveAwakenerStatsForLevel(arachne, level).ATK),
    ).toEqual(['25', '35', '46', '58', '69', '81', '92'])

    expect(
      [1, 10, 20, 30, 40, 50, 60].map((level) => resolveAwakenerStatsForLevel(arachne, level).DEF),
    ).toEqual(['33', '47', '62', '78', '93', '109', '124'])
  })
})
