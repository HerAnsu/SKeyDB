import {z} from 'zod'

import dzoneSummaryData from '@/data/dzone/dzones.json'
import enemyCharacteristicData from '@/data/dzone/enemy-characteristics.json'
import monsterData from '@/data/dzone/monsters.json'

const dzoneSeasonCatalogModules = import.meta.glob<unknown>('../data/dzone/seasons/*.json', {
  eager: true,
  import: 'default',
})

const nonEmptyStringSchema = z.string().trim().min(1)
const dzoneIdSchema = z.string().regex(/^dzone-\d{4}$/)
const waveIdSchema = z.string().regex(/^(d-effect-zone-wave|wave)-\d+$/)
const monsterIdSchema = z.string().regex(/^dzone-monster-\d{4}$/)
const characteristicIdSchema = z.string().regex(/^enemy-characteristic-\d{4}$/)
const relicIdSchema = z.string().regex(/^relic-\d{4}$/)
const alertIdSchema = z.string().regex(/^alert-\d+$/)
const dzoneStageEffectSchema = z.enum(['Astral Reign', 'Faded Legacy'])
const dzoneRealmSchema = z.enum(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA'])

const catalogSchemaBase = {
  schemaVersion: z.literal(3),
  recordCount: z.number().int().nonnegative(),
}

const dzoneAlertMonsterSchema = z.object({
  monsterId: monsterIdSchema,
  level: z.number().int().nonnegative(),
  hp: z.number().int().nonnegative(),
  hpBars: z.number().int().positive().optional(),
})

const dzoneAlertSchema = z.object({
  id: alertIdSchema,
  name: nonEmptyStringSchema,
  monsters: z.array(dzoneAlertMonsterSchema),
})

const dzoneWaveSchema = z.object({
  id: waveIdSchema,
  name: nonEmptyStringSchema,
  initialRelicIds: z.array(relicIdSchema),
  monsterIds: z.array(monsterIdSchema),
  alerts: z.array(dzoneAlertSchema).min(1),
})

const dzoneSeasonSchema = z.object({
  id: dzoneIdSchema,
  period: z.number().int().positive(),
  name: nonEmptyStringSchema,
  start: z.iso.datetime(),
  end: z.iso.datetime(),
  stageEffect: dzoneStageEffectSchema,
  waves: z.array(dzoneWaveSchema),
})

const dzoneSeasonSummarySchema = z.object({
  id: dzoneIdSchema,
  period: z.number().int().positive(),
  name: nonEmptyStringSchema,
  start: z.iso.datetime(),
  end: z.iso.datetime(),
  stageEffect: dzoneStageEffectSchema,
  realm: dzoneRealmSchema.nullable(),
  seasonPath: nonEmptyStringSchema,
})

const monsterSchema = z.object({
  id: monsterIdSchema,
  name: nonEmptyStringSchema,
  characteristicIds: z.array(characteristicIdSchema),
  descriptionTemplate: nonEmptyStringSchema,
  assetName: nonEmptyStringSchema,
  badges: z.array(nonEmptyStringSchema).optional(),
})

const enemyCharacteristicSchema = z.object({
  id: characteristicIdSchema,
  name: nonEmptyStringSchema,
  descriptionTemplate: z.string(),
})

const dzoneSeasonCatalogSchema = z.object({
  ...catalogSchemaBase,
  scope: z.literal('dzone-season'),
  records: z.array(dzoneSeasonSchema).min(1),
})

const dzoneSeasonSummaryCatalogSchema = z.object({
  ...catalogSchemaBase,
  scope: z.literal('dzones'),
  records: z.array(dzoneSeasonSummarySchema).min(1),
})

const monsterCatalogSchema = z.object({
  ...catalogSchemaBase,
  scope: z.literal('monsters'),
  records: z.array(monsterSchema),
})

const enemyCharacteristicCatalogSchema = z.object({
  ...catalogSchemaBase,
  scope: z.literal('enemy-characteristics'),
  records: z.array(enemyCharacteristicSchema),
})

export type DzoneWave = z.infer<typeof dzoneWaveSchema>
export type DzoneSeason = z.infer<typeof dzoneSeasonSchema>
export type DzoneSeasonSummary = z.infer<typeof dzoneSeasonSummarySchema>
export type DzoneRealm = z.infer<typeof dzoneRealmSchema>
export type DzoneStageEffect = z.infer<typeof dzoneStageEffectSchema>
export type DzoneMonster = z.infer<typeof monsterSchema>
export type DzoneEnemyCharacteristic = z.infer<typeof enemyCharacteristicSchema>
export type DzoneAlert = z.infer<typeof dzoneAlertSchema>
export type DzoneAlertMonster = z.infer<typeof dzoneAlertMonsterSchema>

export interface DzoneAlertOption {
  id: string
  name: string
}

export interface DzoneMonsterAlertStats {
  alertId: string
  alertName: string
  level: number
  hp: number
  hpBars?: number
}

export interface DzoneResolvedMonster extends DzoneMonster {
  alertStats?: DzoneMonsterAlertStats
  characteristics: DzoneEnemyCharacteristic[]
}

export interface DzoneResolvedAlert {
  id: string
  name: string
  monsters: DzoneResolvedMonster[]
}

export interface DzoneResolvedWave {
  id: string
  name: string
  initialRelicIds: string[]
  monsters: DzoneResolvedMonster[]
  alerts: DzoneResolvedAlert[]
}

function parseCatalog<T extends {records: unknown[]; recordCount: number}>(
  catalog: unknown,
  schema: z.ZodType<T>,
  label: string,
): T {
  const parsed = schema.parse(catalog)
  if (parsed.recordCount !== parsed.records.length) {
    throw new Error(
      `${label} recordCount ${String(parsed.recordCount)} does not match records length ${String(
        parsed.records.length,
      )}.`,
    )
  }
  return parsed
}

function buildUniqueIdMap<T extends {id: string}>(records: T[], label: string): Map<string, T> {
  const byId = new Map<string, T>()
  for (const record of records) {
    const existing = byId.get(record.id)
    if (existing) {
      throw new Error(`Duplicate ${label} id "${record.id}".`)
    }
    byId.set(record.id, record)
  }
  return byId
}

function sortDzoneSeasonsByPeriod<T extends {period: number}>(seasons: T[]): T[] {
  return [...seasons].sort((left, right) => left.period - right.period)
}

function parseDzoneSeasonCatalogs(): DzoneSeason[] {
  return sortDzoneSeasonsByPeriod(
    Object.entries(dzoneSeasonCatalogModules).flatMap(
      ([modulePath, catalog]) =>
        parseCatalog(catalog, dzoneSeasonCatalogSchema, `D-zone seasons ${modulePath}`).records,
    ),
  )
}

const parsedSeasonSummaries = sortDzoneSeasonsByPeriod(
  parseCatalog(dzoneSummaryData, dzoneSeasonSummaryCatalogSchema, 'D-zone season summaries')
    .records,
)
const parsedSeasons = parseDzoneSeasonCatalogs()
const parsedMonsters = parseCatalog(monsterData, monsterCatalogSchema, 'D-zone monsters').records
const parsedCharacteristics = parseCatalog(
  enemyCharacteristicData,
  enemyCharacteristicCatalogSchema,
  'D-zone enemy characteristics',
).records

const seasonSummaryById = buildUniqueIdMap(parsedSeasonSummaries, 'D-zone season summary')
const seasonById = buildUniqueIdMap(parsedSeasons, 'D-zone season')
const monsterById = buildUniqueIdMap(parsedMonsters, 'D-zone monster')
const characteristicById = buildUniqueIdMap(parsedCharacteristics, 'D-zone enemy characteristic')

function assertDzoneSeasonCatalogsAlign() {
  if (parsedSeasonSummaries.length !== parsedSeasons.length) {
    throw new Error(
      `D-zone summary count ${String(parsedSeasonSummaries.length)} does not match season count ${String(
        parsedSeasons.length,
      )}.`,
    )
  }

  for (const summary of parsedSeasonSummaries) {
    const season = seasonById.get(summary.id)
    if (!season) {
      throw new Error(`D-zone summary "${summary.id}" references a missing season archive.`)
    }

    for (const field of ['period', 'name', 'start', 'end', 'stageEffect'] as const) {
      if (summary[field] !== season[field]) {
        throw new Error(
          `D-zone summary "${summary.id}" ${field} "${String(
            summary[field],
          )}" does not match season archive "${String(season[field])}".`,
        )
      }
    }
  }
}

function assertDzoneReferencesResolve() {
  for (const season of parsedSeasons) {
    const seasonAlertOptions = getDzoneSeasonAlertOptions(season)

    for (const wave of season.waves) {
      for (const monsterId of wave.monsterIds) {
        if (!monsterById.has(monsterId)) {
          throw new Error(`D-zone wave "${wave.id}" references unknown monster id "${monsterId}".`)
        }
      }
      if (wave.alerts.length !== seasonAlertOptions.length) {
        throw new Error(`D-zone wave "${wave.id}" alert count does not match the season alert set.`)
      }

      const waveAlertIds = new Set<string>()
      for (const [alertIndex, alert] of wave.alerts.entries()) {
        if (waveAlertIds.has(alert.id)) {
          throw new Error(`D-zone wave "${wave.id}" has duplicate alert id "${alert.id}".`)
        }
        waveAlertIds.add(alert.id)

        const expectedSeasonAlert = seasonAlertOptions[alertIndex]
        if (alert.id !== expectedSeasonAlert.id || alert.name !== expectedSeasonAlert.name) {
          throw new Error(
            `D-zone wave "${wave.id}" alert "${alert.id}" does not match season alert order.`,
          )
        }

        const alertMonsterIds = alert.monsters.map((monster) => monster.monsterId)
        if (
          alertMonsterIds.length !== wave.monsterIds.length ||
          alertMonsterIds.some((monsterId, index) => monsterId !== wave.monsterIds[index])
        ) {
          throw new Error(
            `D-zone wave "${wave.id}" alert "${alert.id}" monster ids do not match wave monster order.`,
          )
        }

        for (const monster of alert.monsters) {
          if (!monsterById.has(monster.monsterId)) {
            throw new Error(
              `D-zone wave "${wave.id}" alert "${alert.id}" references unknown monster id "${monster.monsterId}".`,
            )
          }
        }
      }
    }
  }

  for (const monster of parsedMonsters) {
    for (const characteristicId of monster.characteristicIds) {
      if (!characteristicById.has(characteristicId)) {
        throw new Error(
          `D-zone monster "${monster.id}" references unknown characteristic id "${characteristicId}".`,
        )
      }
    }
  }
}

assertDzoneSeasonCatalogsAlign()
assertDzoneReferencesResolve()

export function getDzoneSeasons(): DzoneSeason[] {
  return parsedSeasons
}

export function getDzoneSeasonSummaries(): DzoneSeasonSummary[] {
  return parsedSeasonSummaries
}

export function getDzoneSeasonById(seasonId: string): DzoneSeason | undefined {
  return seasonById.get(seasonId)
}

export function getDzoneSeasonSummaryById(seasonId: string): DzoneSeasonSummary | undefined {
  return seasonSummaryById.get(seasonId)
}

export function getLatestDzoneSeason(): DzoneSeason {
  return parsedSeasons.reduce((latest, season) => (season.period > latest.period ? season : latest))
}

export function getLatestDzoneSeasonSummary(): DzoneSeasonSummary {
  return parsedSeasonSummaries.reduce((latest, season) =>
    season.period > latest.period ? season : latest,
  )
}

export function getCurrentDzoneSeason(referenceDate = new Date()): DzoneSeason | undefined {
  const timestamp = referenceDate.getTime()
  return parsedSeasons.find(
    (season) => Date.parse(season.start) <= timestamp && timestamp <= Date.parse(season.end),
  )
}

export function getCurrentDzoneSeasonSummary(
  referenceDate = new Date(),
): DzoneSeasonSummary | undefined {
  const timestamp = referenceDate.getTime()
  return parsedSeasonSummaries.find(
    (season) => Date.parse(season.start) <= timestamp && timestamp <= Date.parse(season.end),
  )
}

export function getDzoneMonsterById(monsterId: string): DzoneMonster | undefined {
  return monsterById.get(monsterId)
}

export function getDzoneEnemyCharacteristicById(
  characteristicId: string,
): DzoneEnemyCharacteristic | undefined {
  return characteristicById.get(characteristicId)
}

export function getDzoneMonsters(): DzoneMonster[] {
  return parsedMonsters
}

export function getDzoneEnemyCharacteristics(): DzoneEnemyCharacteristic[] {
  return parsedCharacteristics
}

export function getDzoneSeasonSharedInitialRelicIds(season: DzoneSeason): string[] {
  if (season.waves.length === 0) return []

  const firstWave = season.waves[0]

  return firstWave.initialRelicIds.filter((relicId) =>
    season.waves.every((wave) => wave.initialRelicIds.includes(relicId)),
  )
}

export function getDzoneSeasonAlertOptions(season: DzoneSeason): DzoneAlertOption[] {
  return season.waves[0]?.alerts.map(({id, name}) => ({id, name})) ?? []
}

function resolveDzoneMonster(monsterId: string, alertStats?: DzoneMonsterAlertStats) {
  const monster = monsterById.get(monsterId)
  if (!monster) {
    throw new Error(`D-zone wave references unknown monster id "${monsterId}".`)
  }
  return {
    ...monster,
    alertStats,
    characteristics: monster.characteristicIds.map((characteristicId) => {
      const characteristic = characteristicById.get(characteristicId)
      if (!characteristic) {
        throw new Error(
          `D-zone monster "${monster.id}" references unknown characteristic id "${characteristicId}".`,
        )
      }
      return characteristic
    }),
  }
}

export function resolveDzoneWaveViewModel(wave: DzoneWave): DzoneResolvedWave {
  return {
    id: wave.id,
    name: wave.name,
    initialRelicIds: wave.initialRelicIds,
    monsters: wave.monsterIds.map((monsterId) => resolveDzoneMonster(monsterId)),
    alerts: wave.alerts.map((alert) => ({
      id: alert.id,
      name: alert.name,
      monsters: alert.monsters.map((alertMonster) =>
        resolveDzoneMonster(alertMonster.monsterId, {
          alertId: alert.id,
          alertName: alert.name,
          level: alertMonster.level,
          hp: alertMonster.hp,
          hpBars: alertMonster.hpBars,
        }),
      ),
    })),
  }
}

export function getLatestDzoneWaveViewModels(): DzoneResolvedWave[] {
  return getLatestDzoneSeason().waves.map(resolveDzoneWaveViewModel)
}
