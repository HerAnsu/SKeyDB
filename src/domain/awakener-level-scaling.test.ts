import { describe, expect, it } from 'vitest'
import { loadAwakenersFull, type AwakenerFull } from './awakeners-full'
import {
  clampAwakenerDatabaseLevel,
  resolveAwakenerStatsForLevel,
} from './awakener-level-scaling'

function makeAwakener(overrides?: Partial<AwakenerFull>): AwakenerFull {
  return {
    id: 999,
    name: 'test awakener',
    aliases: ['test awakener'],
    faction: 'Test',
    realm: 'CHAOS',
    rarity: 'SSR',
    type: 'ASSAULT',
    tags: [],
    stats: {
      CON: '140',
      ATK: '135',
      DEF: '126',
      CritRate: '14.6%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    },
    statScaling: {
      CON: 1.55,
      ATK: 1.5,
      DEF: 1.4,
    },
    substatScaling: {
      CritRate: '1.6%',
    },
    cards: {},
    exalts: {
      exalt: { name: 'Exalt', description: 'x' },
      over_exalt: { name: 'Over Exalt', description: 'x' },
    },
    talents: {},
    enlightens: {},
    ...overrides,
  } as AwakenerFull
}

describe('clampAwakenerDatabaseLevel', () => {
  it('clamps database levels to the 1-90 range', () => {
    expect(clampAwakenerDatabaseLevel(-5)).toBe(1)
    expect(clampAwakenerDatabaseLevel(1)).toBe(1)
    expect(clampAwakenerDatabaseLevel(60)).toBe(60)
    expect(clampAwakenerDatabaseLevel(90)).toBe(90)
    expect(clampAwakenerDatabaseLevel(999)).toBe(90)
  })
})

describe('resolveAwakenerStatsForLevel', () => {
  it('computes primary per-level growth from the Lv. 60 anchor and rewinds substats by 10-level steps', () => {
    const awakener = makeAwakener()

    expect(resolveAwakenerStatsForLevel(awakener, 90)).toEqual({
      CON: '186',
      ATK: '180',
      DEF: '168',
      CritRate: '14.6%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    })

    expect(resolveAwakenerStatsForLevel(awakener, 1)).toEqual({
      CON: '48',
      ATK: '46',
      DEF: '43',
      CritRate: '5%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    })
  })

  it('caps substat step gains after level 60', () => {
    const awakener = makeAwakener({
      stats: {
        CON: '140',
        ATK: '135',
        DEF: '126',
        CritRate: '5%',
        CritDamage: '50%',
        AliemusRegen: '2.4',
        KeyflareRegen: '15',
        RealmMastery: '0',
        SigilYield: '0%',
        DamageAmplification: '0%',
        DeathResistance: '0%',
      },
      substatScaling: {
        AliemusRegen: '0.4',
      },
    })

    expect(resolveAwakenerStatsForLevel(awakener, 60).AliemusRegen).toBe('2.4')
    expect(resolveAwakenerStatsForLevel(awakener, 90).AliemusRegen).toBe('2.4')
    expect(resolveAwakenerStatsForLevel(awakener, 1).AliemusRegen).toBe('0')
  })
})

describe('awakeners full data', () => {
  it('stores explicit level scaling metadata instead of embedding growth hints in stat strings', async () => {
    const data = await loadAwakenersFull()

    for (const awakener of data) {
      const typedAwakener = awakener as AwakenerFull & {
        statScaling?: { CON: number; ATK: number; DEF: number }
        substatScaling?: Record<string, string>
      }

      expect(typedAwakener.statScaling).toEqual({
        CON: expect.any(Number),
        ATK: expect.any(Number),
        DEF: expect.any(Number),
      })
      expect(typedAwakener.substatScaling).toEqual(expect.any(Object))
      expect(Object.values(typedAwakener.stats).some((value) => value.includes('(+'))).toBe(false)
    }
  })
})
