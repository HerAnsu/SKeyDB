import {describe, expect, it} from 'vitest'

import publicAwakeners from '../data/public-v2/lite/awakeners.json'
import publicCovenants from '../data/public-v2/lite/covenants.json'
import publicPosses from '../data/public-v2/lite/posses.json'
import publicWheels from '../data/public-v2/lite/wheels.json'
import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import frozenContract from './persistence-contract.v1.json'
import v2Contract from './persistence-contract.v2.json'
import {
  migrateAwakenerIdV1ToV2,
  migrateCovenantIdV1ToV2,
  migratePosseIdV1ToV2,
  migrateWheelIdV1ToV2,
} from './persistence-id-migration.v2'
import {getPosses} from './posses'
import standardCodeContract from './standard-code-contract.v1.json'
import {getWheels} from './wheels'

interface PersistenceContractAwakenerEntry {
  name: string
  id: string | number
}

interface PersistenceContractPosseEntry {
  id: string
  index: number
}

interface PersistenceContract {
  version: number
  awakeners: PersistenceContractAwakenerEntry[]
  wheels: string[]
  posses: PersistenceContractPosseEntry[]
  covenants: string[]
}

interface V2ContractEntry {
  id: string
}

interface StandardCodeEntry {
  codecIndex: number
  legacyId: number | string
  id: string
}

interface StandardCodeContract {
  version: number
  layout: string
  awakeners: StandardCodeEntry[]
  wheels: StandardCodeEntry[]
  posses: StandardCodeEntry[]
  covenants: StandardCodeEntry[]
}

interface PublicLiteRecords {
  records: V2ContractEntry[]
}

function buildCurrentContract(): PersistenceContract {
  return {
    version: 1,
    awakeners: getAwakeners()
      .map((awakener) => ({name: awakener.name, id: awakener.id}))
      .sort((left, right) => left.name.localeCompare(right.name)),
    wheels: getWheels().map((wheel) => wheel.id),
    posses: getPosses()
      .map((posse) => ({id: posse.id, index: posse.index}))
      .sort((left, right) => left.id.localeCompare(right.id)),
    covenants: getCovenants().map((covenant) => covenant.id),
  }
}

function liteIds(lite: PublicLiteRecords): string[] {
  return lite.records.map((record) => record.id)
}

function contractIds(records: V2ContractEntry[]): string[] {
  return records.map((record) => record.id)
}

function expectUniqueCodecIndices(records: StandardCodeEntry[]): void {
  expect(new Set(records.map((entry) => entry.codecIndex)).size).toBe(records.length)
}

describe('persistence contract', () => {
  it('keeps current runtime identifiers aligned with the V2 persistence contract', () => {
    const current = buildCurrentContract()
    const expectedV2 = v2Contract as {
      awakeners: V2ContractEntry[]
      wheels: V2ContractEntry[]
      covenants: V2ContractEntry[]
      posses: V2ContractEntry[]
    }

    expect([...current.awakeners.map((entry) => entry.id)].sort()).toEqual(
      [...contractIds(expectedV2.awakeners)].sort(),
    )
    expect(current.wheels).toEqual(contractIds(expectedV2.wheels))
    expect(current.covenants).toEqual(contractIds(expectedV2.covenants))
    expect(current.posses.map((entry) => entry.id)).toEqual(contractIds(expectedV2.posses))
  })

  it('keeps V2 persistence contract ids canonical', () => {
    const contract = v2Contract as {
      version: number
      awakeners: V2ContractEntry[]
      wheels: V2ContractEntry[]
      covenants: V2ContractEntry[]
      posses: V2ContractEntry[]
    }

    expect(contract.version).toBe(2)
    expect(contract.awakeners).toEqual(contract.awakeners.map((entry) => ({id: entry.id})))
    expect(contract.wheels).toEqual(contract.wheels.map((entry) => ({id: entry.id})))
    expect(contract.covenants).toEqual(contract.covenants.map((entry) => ({id: entry.id})))
    expect(contract.posses).toEqual(contract.posses.map((entry) => ({id: entry.id})))
    expect(contract.awakeners.every((entry) => /^awakener-\d{4}$/.test(entry.id))).toBe(true)
    expect(contract.wheels.every((entry) => /^wheel-\d{4}$/.test(entry.id))).toBe(true)
    expect(contract.covenants.every((entry) => /^covenant-\d{4}$/.test(entry.id))).toBe(true)
    expect(contract.posses.every((entry) => /^posse-\d{4}$/.test(entry.id))).toBe(true)
    expect(contractIds(contract.awakeners)).toEqual(liteIds(publicAwakeners))
    expect(contractIds(contract.wheels)).toEqual(liteIds(publicWheels))
    expect(contractIds(contract.covenants)).toEqual(liteIds(publicCovenants))
    expect(contractIds(contract.posses)).toEqual(liteIds(publicPosses))
  })

  it('preserves V1 standard-code codec indices as unique byte meanings', () => {
    const contract = standardCodeContract as StandardCodeContract

    expect(contract.version).toBe(1)
    expect(contract.layout).toBe('t1-mt1-byte-codec')
    expectUniqueCodecIndices(contract.awakeners)
    expectUniqueCodecIndices(contract.wheels)
    expectUniqueCodecIndices(contract.covenants)
    expectUniqueCodecIndices(contract.posses)
  })

  it('preserves V1 byte meanings and maps rows through V2 migration helpers', () => {
    const v1 = frozenContract as PersistenceContract
    const standardCode = standardCodeContract as StandardCodeContract
    const v2 = v2Contract as {
      awakeners: V2ContractEntry[]
      wheels: V2ContractEntry[]
      covenants: V2ContractEntry[]
      posses: V2ContractEntry[]
    }
    const v2Ids = new Set([
      ...contractIds(v2.awakeners),
      ...contractIds(v2.wheels),
      ...contractIds(v2.covenants),
      ...contractIds(v2.posses),
    ])

    expect(
      standardCode.awakeners.map(({codecIndex, legacyId}) => ({codecIndex, legacyId})),
    ).toEqual(v1.awakeners.map(({id}) => ({codecIndex: id, legacyId: id})))
    expect(standardCode.wheels.map(({codecIndex, legacyId}) => ({codecIndex, legacyId}))).toEqual(
      v1.wheels.map((id, index) => ({codecIndex: index + 1, legacyId: id})),
    )
    expect(
      standardCode.covenants.map(({codecIndex, legacyId}) => ({codecIndex, legacyId})),
    ).toEqual(v1.covenants.map((id, index) => ({codecIndex: index + 1, legacyId: id})))
    expect(standardCode.posses.map(({codecIndex, legacyId}) => ({codecIndex, legacyId}))).toEqual(
      v1.posses.map(({id, index}) => ({codecIndex: index, legacyId: id})),
    )

    for (const entry of standardCode.awakeners) {
      expect(entry.id).toBe(migrateAwakenerIdV1ToV2(entry.legacyId))
      expect(v2Ids.has(entry.id)).toBe(true)
    }
    for (const entry of standardCode.wheels) {
      expect(entry.id).toBe(migrateWheelIdV1ToV2(String(entry.legacyId)))
      expect(v2Ids.has(entry.id)).toBe(true)
    }
    for (const entry of standardCode.covenants) {
      expect(entry.id).toBe(migrateCovenantIdV1ToV2(String(entry.legacyId)))
      expect(v2Ids.has(entry.id)).toBe(true)
    }
    for (const entry of standardCode.posses) {
      expect(entry.id).toBe(migratePosseIdV1ToV2(String(entry.legacyId)))
      expect(v2Ids.has(entry.id)).toBe(true)
    }
  })
})
