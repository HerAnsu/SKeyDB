import {describe, expect, it} from 'vitest'

import {getAwakeners} from './awakeners'
import {
  clearCollectionOwnership,
  clearOwnedEntry,
  COLLECTION_OWNERSHIP_KEY,
  COLLECTION_OWNERSHIP_LEGACY_KEY,
  createDefaultCollectionOwnershipCatalog,
  createEmptyCollectionOwnershipState,
  getAwakenerLevel,
  getOwnedLevel,
  isOwned,
  loadCollectionOwnership,
  parseCollectionOwnershipSnapshot,
  saveCollectionOwnership,
  serializeCollectionOwnershipSnapshot,
  setAwakenerLevel,
  setDisplayUnowned,
  setOwnedLevel,
  type CollectionOwnershipCatalog,
} from './collection-ownership'

const catalog: CollectionOwnershipCatalog = {
  awakenerIds: ['1', '2'],
  wheelIds: ['B01', 'B02'],
  posseIds: ['encounter-in-pure-white', 'voices-in-your-head'],
  linkedAwakenerGroups: [['1', '2']],
}

function createStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    rawStore: store,
  }
}

describe('collection ownership persistence', () => {
  const defaultOwnedStateForCatalog = {
    ownedAwakeners: {'1': 0, '2': 0},
    awakenerLevels: {'1': 60, '2': 60},
    ownedWheels: {B01: 0, B02: 0},
    ownedPosses: {'encounter-in-pure-white': 0, 'voices-in-your-head': 0},
    displayUnowned: true,
  } as const

  it('saves and loads ownership data with normalization', () => {
    const storage = createStorage()
    const saved = saveCollectionOwnership(
      storage,
      {
        ownedAwakeners: {'1': 5, unknown: 99},
        awakenerLevels: {'1': 60, unknown: 999},
        ownedWheels: {B01: 0},
        ownedPosses: {'encounter-in-pure-white': 21},
        displayUnowned: false,
      },
      catalog,
    )

    expect(saved).toBe(true)
    const raw = storage.rawStore.get(COLLECTION_OWNERSHIP_KEY)
    expect(raw).toContain('"version":2')

    const loaded = loadCollectionOwnership(storage, catalog)
    expect(loaded).toEqual({
      ownedAwakeners: {'1': 5, '2': 5},
      awakenerLevels: {'1': 60, '2': 60},
      ownedWheels: {B01: 0},
      ownedPosses: {'encounter-in-pure-white': 0},
      displayUnowned: false,
    })
  })

  it('returns empty defaults for malformed or unsupported payloads', () => {
    const storage = createStorage()
    storage.setItem(COLLECTION_OWNERSHIP_KEY, '{"version":999,"payload":{}}')
    expect(loadCollectionOwnership(storage, catalog)).toEqual(defaultOwnedStateForCatalog)

    storage.setItem(COLLECTION_OWNERSHIP_KEY, '{this is not json')
    expect(loadCollectionOwnership(storage, catalog)).toEqual(defaultOwnedStateForCatalog)
  })

  it('does not fall back to v1 when the v2 key exists but is invalid', () => {
    const storage = createStorage()
    storage.setItem(COLLECTION_OWNERSHIP_KEY, '{"version":999,"payload":{}}')
    storage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 5},
          awakenerLevels: {'1': 80},
          ownedWheels: {B01: 7},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
    )

    expect(loadCollectionOwnership(storage, catalog)).toEqual(defaultOwnedStateForCatalog)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBe('{"version":999,"payload":{}}')
  })

  it('prefers v2 storage over v1 fallback', () => {
    const storage = createStorage()
    storage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 5},
          awakenerLevels: {'1': 80},
          ownedWheels: {B01: 7},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
    )
    storage.setItem(
      COLLECTION_OWNERSHIP_KEY,
      JSON.stringify({
        version: 2,
        payload: {
          ownedAwakeners: {'awakener-0002': 3},
          awakenerLevels: {'awakener-0002': 70},
          ownedWheels: {'wheel-0002': 4},
          ownedPosses: {'posse-0002': 0},
          displayUnowned: true,
        },
      }),
    )

    expect(loadCollectionOwnership(storage, catalog)).toEqual({
      ownedAwakeners: {'1': 3, '2': 3},
      awakenerLevels: {'1': 70, '2': 70},
      ownedWheels: {B02: 4},
      ownedPosses: {'voices-in-your-head': 0},
      displayUnowned: true,
    })
  })

  it('falls back from v1 storage, migrates, and saves v2 without deleting v1', () => {
    const storage = createStorage()
    storage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 4},
          awakenerLevels: {'1': 72},
          ownedWheels: {B01: 2},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
    )

    const loaded = loadCollectionOwnership(storage, catalog)

    expect(loaded).toEqual({
      ownedAwakeners: {'1': 4, '2': 4},
      awakenerLevels: {'1': 72, '2': 72},
      ownedWheels: {B01: 2},
      ownedPosses: {'encounter-in-pure-white': 0},
      displayUnowned: false,
    })
    expect(storage.getItem(COLLECTION_OWNERSHIP_LEGACY_KEY)).toBeTruthy()
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"version":2')
  })

  it('supports ownership level helpers and cleanup', () => {
    const storage = createStorage()
    storage.setItem(COLLECTION_OWNERSHIP_LEGACY_KEY, '{"version":1,"payload":{}}')
    let state = createEmptyCollectionOwnershipState()

    state = setOwnedLevel(state, 'wheels', 'B01', 0)
    expect(isOwned(state, 'wheels', 'B01')).toBe(true)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBe(0)

    state = setOwnedLevel(state, 'wheels', 'B01', 15)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBe(15)
    state = setOwnedLevel(state, 'wheels', 'B01', 99)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBe(15)

    state = clearOwnedEntry(state, 'wheels', 'B01')
    expect(isOwned(state, 'wheels', 'B01')).toBe(false)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBeNull()

    state = setOwnedLevel(state, 'awakeners', '1', 5, catalog)
    expect(getOwnedLevel(state, 'awakeners', '1')).toBe(5)
    expect(getOwnedLevel(state, 'awakeners', '2')).toBe(5)

    state = setDisplayUnowned(state, false)
    expect(state.displayUnowned).toBe(false)
    state = setAwakenerLevel(state, '1', 88, catalog)
    expect(getAwakenerLevel(state, '1')).toBe(88)
    expect(getAwakenerLevel(state, '2')).toBe(88)
    state = setAwakenerLevel(state, '1', 0, catalog)
    expect(getAwakenerLevel(state, '1')).toBe(1)
    expect(getAwakenerLevel(state, '2')).toBe(1)
    state = setAwakenerLevel(state, '1', 999, catalog)
    expect(getAwakenerLevel(state, '1')).toBe(90)
    expect(getAwakenerLevel(state, '2')).toBe(90)
    state = setOwnedLevel(state, 'posses', 'encounter-in-pure-white', 13, catalog)
    expect(getOwnedLevel(state, 'posses', 'encounter-in-pure-white')).toBe(0)

    saveCollectionOwnership(storage, state, catalog)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBeTruthy()
    clearCollectionOwnership(storage)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBeNull()
    expect(storage.getItem(COLLECTION_OWNERSHIP_LEGACY_KEY)).toBeNull()
  })

  it('removes linked awakeners together and exposes default linked groups', () => {
    let state = createEmptyCollectionOwnershipState()
    state = setOwnedLevel(state, 'awakeners', '1', 7, catalog)
    expect(getOwnedLevel(state, 'awakeners', '2')).toBe(7)

    state = clearOwnedEntry(state, 'awakeners', '1', catalog)
    expect(getOwnedLevel(state, 'awakeners', '1')).toBeNull()
    expect(getOwnedLevel(state, 'awakeners', '2')).toBeNull()

    const defaultCatalog = createDefaultCollectionOwnershipCatalog()
    const awakeners = getAwakeners()
    const ramonaId = awakeners.find((awakener) => awakener.name === 'ramona')?.id
    const ramonaTimewornId = awakeners.find((awakener) => awakener.name === 'ramona: timeworn')?.id
    expect(ramonaId).toBeDefined()
    expect(ramonaTimewornId).toBeDefined()
    expect(defaultCatalog.linkedAwakenerGroups).toContainEqual(
      [String(ramonaId), String(ramonaTimewornId)].sort((a, b) => a.localeCompare(b)),
    )
  })

  it('serializes and parses ownership snapshot payloads for file export/import', () => {
    const snapshot = serializeCollectionOwnershipSnapshot(
      {
        ownedAwakeners: {'1': 4},
        awakenerLevels: {'1': 72},
        ownedWheels: {B01: 2},
        ownedPosses: {'encounter-in-pure-white': 0},
        displayUnowned: true,
      },
      catalog,
    )

    const parsed = parseCollectionOwnershipSnapshot(snapshot, catalog)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }
    expect(parsed.state).toEqual({
      ownedAwakeners: {'1': 4, '2': 4},
      awakenerLevels: {'1': 72, '2': 72},
      ownedWheels: {B01: 2},
      ownedPosses: {'encounter-in-pure-white': 0},
      displayUnowned: true,
    })
  })

  it('serializes v1 runtime ids as v2 public ids and imports them back for v1 runtime catalog', () => {
    const snapshot = serializeCollectionOwnershipSnapshot(
      {
        ownedAwakeners: {'1': 4},
        awakenerLevels: {'1': 72},
        ownedWheels: {B01: 2},
        ownedPosses: {'encounter-in-pure-white': 0},
        displayUnowned: true,
      },
      {
        awakenerIds: ['1'],
        wheelIds: ['B01'],
        posseIds: ['encounter-in-pure-white'],
      },
    )

    expect(snapshot).toContain('"version":2')
    expect(snapshot).toContain('"awakener-0001"')
    expect(snapshot).toContain('"wheel-0001"')
    expect(snapshot).toContain('"posse-0001"')

    const parsed = parseCollectionOwnershipSnapshot(snapshot, {
      awakenerIds: ['1'],
      wheelIds: ['B01'],
      posseIds: ['encounter-in-pure-white'],
    })

    expect(parsed).toEqual({
      ok: true,
      state: {
        ownedAwakeners: {'1': 4},
        awakenerLevels: {'1': 72},
        ownedWheels: {B01: 2},
        ownedPosses: {'encounter-in-pure-white': 0},
        displayUnowned: true,
      },
    })
  })

  it('migrates v1 snapshots to v2 ids for v2 catalogs', () => {
    const parsed = parseCollectionOwnershipSnapshot(
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 4},
          awakenerLevels: {'1': 72},
          ownedWheels: {B01: 2},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
      {
        awakenerIds: ['awakener-0001'],
        wheelIds: ['wheel-0001'],
        posseIds: ['posse-0001'],
      },
    )

    expect(parsed).toEqual({
      ok: true,
      migratedFromVersion: 1,
      state: {
        ownedAwakeners: {'awakener-0001': 4},
        awakenerLevels: {'awakener-0001': 72},
        ownedWheels: {'wheel-0001': 2},
        ownedPosses: {'posse-0001': 0},
        displayUnowned: false,
      },
    })
  })

  it('does not treat legacy ids as valid v2 snapshot ids', () => {
    const parsed = parseCollectionOwnershipSnapshot(
      JSON.stringify({
        version: 2,
        payload: {
          ownedAwakeners: {'1': 4},
          awakenerLevels: {'1': 72},
          ownedWheels: {B01: 2},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
      catalog,
    )

    expect(parsed).toEqual({
      ok: true,
      state: {
        ownedAwakeners: {},
        awakenerLevels: {'1': 60, '2': 60},
        ownedWheels: {},
        ownedPosses: {},
        displayUnowned: false,
      },
    })
  })

  it('does not treat unmapped runtime catalog ids as valid v2 snapshot ids', () => {
    const parsed = parseCollectionOwnershipSnapshot(
      JSON.stringify({
        version: 2,
        payload: {
          ownedAwakeners: {'runtime-new': 4},
          awakenerLevels: {'runtime-new': 72},
          ownedWheels: {WheelRuntimeNew: 2},
          ownedPosses: {'runtime-posse-new': 0},
          displayUnowned: true,
        },
      }),
      {
        awakenerIds: ['runtime-new'],
        wheelIds: ['WheelRuntimeNew'],
        posseIds: ['runtime-posse-new'],
      },
    )

    expect(parsed).toEqual({
      ok: true,
      state: {
        ownedAwakeners: {},
        awakenerLevels: {'runtime-new': 60},
        ownedWheels: {},
        ownedPosses: {},
        displayUnowned: true,
      },
    })
  })

  it('fails serialization instead of emitting unmapped runtime ids in v2 snapshots', () => {
    expect(() =>
      serializeCollectionOwnershipSnapshot(
        {
          ownedAwakeners: {'runtime-new': 4},
          awakenerLevels: {'runtime-new': 72},
          ownedWheels: {WheelRuntimeNew: 2},
          ownedPosses: {'runtime-posse-new': 0},
          displayUnowned: true,
        },
        {
          awakenerIds: ['runtime-new'],
          wheelIds: ['WheelRuntimeNew'],
          posseIds: ['runtime-posse-new'],
        },
      ),
    ).toThrow(/non-public awakener id: runtime-new/)
  })

  it('returns false instead of throwing when saving unmapped runtime ids', () => {
    const storage = createStorage()

    const saved = saveCollectionOwnership(
      storage,
      {
        ownedAwakeners: {'runtime-new': 4},
        awakenerLevels: {'runtime-new': 72},
        ownedWheels: {},
        ownedPosses: {},
        displayUnowned: true,
      },
      {
        awakenerIds: ['runtime-new'],
        wheelIds: [],
        posseIds: [],
      },
    )

    expect(saved).toBe(false)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBeNull()
  })

  it('merges mixed v1 and v2 ids deterministically by max level', () => {
    const parsed = parseCollectionOwnershipSnapshot(
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 2, 'awakener-0001': 7},
          awakenerLevels: {'1': 65, 'awakener-0001': 82},
          ownedWheels: {B01: 3, 'wheel-0001': 9},
          ownedPosses: {'encounter-in-pure-white': 12, 'posse-0001': 8},
          displayUnowned: true,
        },
      }),
      {
        awakenerIds: ['awakener-0001'],
        wheelIds: ['wheel-0001'],
        posseIds: ['posse-0001'],
      },
    )

    expect(parsed).toEqual({
      ok: true,
      migratedFromVersion: 1,
      state: {
        ownedAwakeners: {'awakener-0001': 7},
        awakenerLevels: {'awakener-0001': 82},
        ownedWheels: {'wheel-0001': 9},
        ownedPosses: {'posse-0001': 0},
        displayUnowned: true,
      },
    })
  })

  it('keeps imported awakener levels below the default when no collision exists', () => {
    const parsed = parseCollectionOwnershipSnapshot(
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 2},
          awakenerLevels: {'1': 42},
          ownedWheels: {},
          ownedPosses: {},
          displayUnowned: true,
        },
      }),
      {
        awakenerIds: ['awakener-0001'],
        wheelIds: [],
        posseIds: [],
      },
    )

    expect(parsed).toEqual({
      ok: true,
      migratedFromVersion: 1,
      state: {
        ownedAwakeners: {'awakener-0001': 2},
        awakenerLevels: {'awakener-0001': 42},
        ownedWheels: {},
        ownedPosses: {},
        displayUnowned: true,
      },
    })
  })

  it('merges canonicalization collisions by max level before v2 serialization', () => {
    const snapshot = serializeCollectionOwnershipSnapshot(
      {
        ownedAwakeners: {'1': 3, 'awakener-0001': 8},
        awakenerLevels: {'1': 64, 'awakener-0001': 83},
        ownedWheels: {B01: 2, 'wheel-0001': 10},
        ownedPosses: {'encounter-in-pure-white': 4, 'posse-0001': 6},
        displayUnowned: true,
      },
      {
        awakenerIds: ['1', 'awakener-0001'],
        wheelIds: ['B01', 'wheel-0001'],
        posseIds: ['encounter-in-pure-white', 'posse-0001'],
      },
    )

    expect(JSON.parse(snapshot).payload).toEqual({
      ownedAwakeners: {'awakener-0001': 8},
      awakenerLevels: {'awakener-0001': 83},
      ownedWheels: {'wheel-0001': 10},
      ownedPosses: {'posse-0001': 0},
      displayUnowned: true,
    })
  })

  it('rejects malformed snapshot payloads with explicit errors', () => {
    expect(parseCollectionOwnershipSnapshot('nope', catalog)).toEqual({
      ok: false,
      error: 'invalid_json',
    })
    expect(parseCollectionOwnershipSnapshot('{"version":99,"payload":{}}', catalog)).toEqual({
      ok: false,
      error: 'unsupported_version',
    })
    expect(parseCollectionOwnershipSnapshot('{"version":2}', catalog)).toEqual({
      ok: false,
      error: 'invalid_payload',
    })
  })
})
