import {describe, expect, it} from 'vitest'

import publicAwakeners from '../data/public-v2/lite/awakeners.json'
import publicCovenants from '../data/public-v2/lite/covenants.json'
import publicPosses from '../data/public-v2/lite/posses.json'
import publicWheels from '../data/public-v2/lite/wheels.json'
import v1Contract from './persistence-contract.v1.json'
import v2Contract from './persistence-contract.v2.json'
import {
  AWAKENER_ID_V1_TO_V2,
  AWAKENER_NAME_V1_TO_V2,
  COVENANT_ID_V1_TO_V2,
  migrateAwakenerIdV1ToV2,
  migrateAwakenerNameV1ToV2,
  migrateCovenantIdV1ToV2,
  migratePosseIdV1ToV2,
  migrateWheelIdV1ToV2,
  POSSE_ID_V1_TO_V2,
  WHEEL_ID_V1_TO_V2,
} from './persistence-id-migration.v2'

function publicIds(records: {records: {id: string}[]}): Set<string> {
  return new Set(records.records.map((record) => record.id))
}

function contractIds(records: {id: string}[]): Set<string> {
  return new Set(records.map((record) => record.id))
}

function expectNoValueCollisions(map: Readonly<Record<string, string>>): void {
  expect(new Set(Object.values(map)).size).toBe(Object.values(map).length)
}

describe('persistence V1 to V2 id migration', () => {
  it('maps plan examples to canonical public ids', () => {
    expect(migrateWheelIdV1ToV2('B01')).toBe('wheel-0001')
    expect(migrateWheelIdV1ToV2('D10')).toBe('wheel-0128')
    expect(migrateWheelIdV1ToV2('N02')).toBe('wheel-0049')
    expect(migrateWheelIdV1ToV2('O11')).toBe('wheel-0131')
    expect(migrateWheelIdV1ToV2('O112')).toBe('wheel-0060')
    expect(migrateWheelIdV1ToV2('P15')).toBe('wheel-0136')
    expect(migrateCovenantIdV1ToV2('001')).toBe('covenant-0001')
    expect(migrateCovenantIdV1ToV2('016')).toBe('covenant-0014')
    expect(migratePosseIdV1ToV2('24-all-of-her')).toBe('posse-0022')
  })

  it('uses explicit aliases and returns undefined for unknown values', () => {
    expect(migrateAwakenerIdV1ToV2(1)).toBe('awakener-0001')
    expect(migrateAwakenerNameV1ToV2('24')).toBe('awakener-0001')
    expect(migrateAwakenerNameV1ToV2('"24"')).toBe('awakener-0001')
    expect(migrateAwakenerNameV1ToV2('jenkins')).toBe('awakener-0025')
    expect(migrateAwakenerNameV1ToV2('Jenkin')).toBe('awakener-0025')

    expect(migrateAwakenerIdV1ToV2(999)).toBeUndefined()
    expect(migrateAwakenerNameV1ToV2('Jenkins ')).toBeUndefined()
    expect(migrateWheelIdV1ToV2('unknown')).toBeUndefined()
    expect(migrateCovenantIdV1ToV2('999')).toBeUndefined()
    expect(migratePosseIdV1ToV2('unknown')).toBeUndefined()
  })

  it('covers every frozen V1 persistence id', () => {
    const contract = v1Contract as {
      awakeners: {id: number; name: string}[]
      wheels: string[]
      covenants: string[]
      posses: {id: string}[]
    }

    expect(contract.awakeners.every((entry) => migrateAwakenerIdV1ToV2(entry.id))).toBe(true)
    expect(contract.awakeners.every((entry) => migrateAwakenerNameV1ToV2(entry.name))).toBe(true)
    expect(contract.wheels.every((id) => migrateWheelIdV1ToV2(id))).toBe(true)
    expect(contract.covenants.every((id) => migrateCovenantIdV1ToV2(id))).toBe(true)
    expect(contract.posses.every((entry) => migratePosseIdV1ToV2(entry.id))).toBe(true)
  })

  it('points every generated map value at an existing V2 contract and public record', () => {
    const v2 = v2Contract as {
      awakeners: {id: string}[]
      wheels: {id: string}[]
      covenants: {id: string}[]
      posses: {id: string}[]
    }
    const contractAwakenerIds = contractIds(v2.awakeners)
    const contractWheelIds = contractIds(v2.wheels)
    const contractCovenantIds = contractIds(v2.covenants)
    const contractPosseIds = contractIds(v2.posses)
    const awakenerIds = publicIds(publicAwakeners)
    const wheelIds = publicIds(publicWheels)
    const covenantIds = publicIds(publicCovenants)
    const posseIds = publicIds(publicPosses)

    expect(Object.values(AWAKENER_ID_V1_TO_V2).every((id) => contractAwakenerIds.has(id))).toBe(
      true,
    )
    expect(Object.values(AWAKENER_NAME_V1_TO_V2).every((id) => contractAwakenerIds.has(id))).toBe(
      true,
    )
    expect(Object.values(WHEEL_ID_V1_TO_V2).every((id) => contractWheelIds.has(id))).toBe(true)
    expect(Object.values(COVENANT_ID_V1_TO_V2).every((id) => contractCovenantIds.has(id))).toBe(
      true,
    )
    expect(Object.values(POSSE_ID_V1_TO_V2).every((id) => contractPosseIds.has(id))).toBe(true)
    expect(Object.values(AWAKENER_ID_V1_TO_V2).every((id) => awakenerIds.has(id))).toBe(true)
    expect(Object.values(AWAKENER_NAME_V1_TO_V2).every((id) => awakenerIds.has(id))).toBe(true)
    expect(Object.values(WHEEL_ID_V1_TO_V2).every((id) => wheelIds.has(id))).toBe(true)
    expect(Object.values(COVENANT_ID_V1_TO_V2).every((id) => covenantIds.has(id))).toBe(true)
    expect(Object.values(POSSE_ID_V1_TO_V2).every((id) => posseIds.has(id))).toBe(true)
  })

  it('does not collapse distinct V1 ids within a migration scope', () => {
    expectNoValueCollisions(AWAKENER_ID_V1_TO_V2)
    expectNoValueCollisions(WHEEL_ID_V1_TO_V2)
    expectNoValueCollisions(COVENANT_ID_V1_TO_V2)
    expectNoValueCollisions(POSSE_ID_V1_TO_V2)
  })
})
