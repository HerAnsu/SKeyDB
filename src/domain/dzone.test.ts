import {describe, expect, it} from 'vitest'

import {
  getCurrentDzoneSeason,
  getDzoneEnemyCharacteristicById,
  getDzoneMonsterById,
  getDzoneMonsters,
  getDzoneSeasonAlertOptions,
  getDzoneSeasonById,
  getDzoneSeasons,
  getDzoneSeasonSharedInitialRelicIds,
  getDzoneSeasonSummaries,
  getLatestDzoneSeason,
  getLatestDzoneSeasonSummary,
  getLatestDzoneWaveViewModels,
} from './dzone'
import {getDzoneSeasonRealmName} from './dzone-season-realm'
import {loadRelicRecordById} from './relics'

describe('D-zone domain boundary', () => {
  it('loads all D-zone summary records and full season archives', () => {
    expect(getDzoneSeasonSummaries()).toHaveLength(60)
    expect(getDzoneSeasons()).toHaveLength(60)
    expect(getLatestDzoneSeasonSummary()).toMatchObject({
      id: 'dzone-0060',
      period: 60,
      realm: 'AEQUOR',
      stageEffect: 'Astral Reign',
    })
    expect(getDzoneSeasonById('dzone-0001')).toMatchObject({
      id: 'dzone-0001',
      period: 1,
      stageEffect: 'Faded Legacy',
    })
  })

  it('loads the latest season as dzone-0060 with 5 resolved waves', () => {
    const latestSeason = getLatestDzoneSeason()

    expect(getDzoneSeasons().length).toBeGreaterThan(0)
    expect(latestSeason.id).toBe('dzone-0060')
    expect(latestSeason.waves).toHaveLength(5)
    expect(getLatestDzoneWaveViewModels()).toHaveLength(5)
  })

  it('preserves per-alert monster stats from season archives', () => {
    const [waveOne] = getLatestDzoneSeason().waves

    expect(waveOne.alerts.map((alert) => alert.name)).toEqual([
      'Alert I',
      'Alert II',
      'Alert III',
      'Alert IV',
      'Alert V',
    ])
    expect(waveOne.alerts[0]?.monsters[0]).toMatchObject({
      monsterId: 'dzone-monster-0034',
      level: 38,
      hp: 24474,
      hpBars: 3,
    })
  })

  it('resolves selected alert stats onto alert wave monsters', () => {
    const [waveOne] = getLatestDzoneWaveViewModels()
    const alertFourBlesser = waveOne.alerts
      .find((alert) => alert.id === 'alert-4')
      ?.monsters.find((monster) => monster.id === 'dzone-monster-0034')

    expect(alertFourBlesser).toMatchObject({
      id: 'dzone-monster-0034',
      alertStats: {
        alertId: 'alert-4',
        alertName: 'Alert IV',
        level: 73,
        hp: 401964,
        hpBars: 3,
      },
    })
  })

  it('loads dzone-0060 as the current season during its active window', () => {
    expect(getCurrentDzoneSeason(new Date('2026-05-12T12:00:00Z'))?.id).toBe('dzone-0060')
  })

  it('resolves every wave monster reference', () => {
    for (const season of getDzoneSeasons()) {
      for (const wave of season.waves) {
        for (const monsterId of wave.monsterIds) {
          expect(getDzoneMonsterById(monsterId), `${wave.id} monster ${monsterId}`).toBeDefined()
        }
        for (const alert of wave.alerts) {
          expect(
            alert.monsters.map((monster) => monster.monsterId),
            `${season.id} ${wave.id} ${alert.id}`,
          ).toEqual(wave.monsterIds)
          for (const monster of alert.monsters) {
            expect(
              getDzoneMonsterById(monster.monsterId),
              `${wave.id} ${alert.id} monster ${monster.monsterId}`,
            ).toBeDefined()
          }
        }
      }
    }
  })

  it('keeps alert options consistent across every wave in a season', () => {
    for (const season of getDzoneSeasons()) {
      const seasonAlertOptions = getDzoneSeasonAlertOptions(season)
      const alertIds = seasonAlertOptions.map((alert) => alert.id)

      expect(new Set(alertIds).size, `${season.id} unique alert ids`).toBe(alertIds.length)

      for (const wave of season.waves) {
        expect(
          wave.alerts.map((alert) => ({id: alert.id, name: alert.name})),
          `${season.id} ${wave.id} alert set`,
        ).toEqual(seasonAlertOptions)
      }
    }
  })

  it('resolves every monster characteristic reference', () => {
    for (const monster of getDzoneMonsters()) {
      for (const characteristicId of monster.characteristicIds) {
        expect(
          getDzoneEnemyCharacteristicById(characteristicId),
          `${monster.id} characteristic ${characteristicId}`,
        ).toBeDefined()
      }
    }
  })

  it('loads every monster with a description template', () => {
    for (const monster of getDzoneMonsters()) {
      expect(monster.descriptionTemplate.trim(), monster.id).not.toBe('')
    }
  })

  it('preserves initial relic ids without resolving relic records', () => {
    expect(getLatestDzoneWaveViewModels()[0]?.initialRelicIds).toEqual(['relic-9001', 'relic-9004'])
  })

  it('identifies the latest season-wide initial relic used by every wave', () => {
    const sharedInitialRelicIds = getDzoneSeasonSharedInitialRelicIds(getLatestDzoneSeason())

    expect(
      getLatestDzoneSeason().waves.every((wave) =>
        wave.initialRelicIds.includes(sharedInitialRelicIds[0]),
      ),
    ).toBe(true)
    expect(getDzoneSeasonSharedInitialRelicIds(getLatestDzoneSeason())).toEqual(['relic-9004'])
  })

  it('resolves modern season realms and falls back for legacy seasons', () => {
    const legacySeason = getDzoneSeasonById('dzone-0001')

    if (!legacySeason) {
      throw new Error('Expected dzone-0001 to be loaded')
    }

    expect(getDzoneSeasonRealmName(getLatestDzoneSeason())).toBe('Aequor Ring')
    expect(getDzoneSeasonRealmName(legacySeason)).toBe('Dissoluted Abyss')
  })

  it('preserves wave monster ids as the authoritative display order', () => {
    const latestSeason = getLatestDzoneSeason()
    const resolvedWaves = getLatestDzoneWaveViewModels()

    for (const [index, wave] of latestSeason.waves.entries()) {
      expect(
        resolvedWaves[index]?.monsters.map((monster) => monster.id),
        wave.id,
      ).toEqual(wave.monsterIds)
    }
  })

  it('resolves every initial relic to a public relic detail record', async () => {
    const relicIds = new Set(
      getDzoneSeasons().flatMap((season) => season.waves.flatMap((wave) => wave.initialRelicIds)),
    )

    for (const relicId of relicIds) {
      await expect(loadRelicRecordById(relicId), relicId).resolves.toMatchObject({
        id: relicId,
        kind: 'relic',
        relicType: 'D-Zone Initial Relic',
      })
    }
  })
})
