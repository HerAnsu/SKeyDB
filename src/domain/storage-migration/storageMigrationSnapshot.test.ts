import {describe, expect, it} from 'vitest'

import {createEmptyCollectionOwnershipState} from '@/domain/collection-ownership'
import {type StorageLike} from '@/domain/storage'
import {saveBuilderDraft} from '@/features/builder/builder-persistence'
import {serializeCollectionOwnershipSnapshot} from '@/features/collection/collectionMigrations'

import {
  createDomainStorageMigrationSnapshot,
  DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
  isDomainStorageMigrationSnapshot,
} from './storageMigrationSnapshot'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const LOCATION = {
  origin: 'https://dansa.github.io',
  pathname: '/SKeyDB/',
} satisfies Pick<Location, 'origin' | 'pathname'>

describe('createDomainStorageMigrationSnapshot', () => {
  it('collects known valid storage entries and marks absent keys as missing', () => {
    const storage = new MemoryStorage()
    saveBuilderDraft(storage, {
      activeTeamId: 'team-1',
      teams: [
        {
          id: 'team-1',
          name: 'Team 1',
          slots: [
            {
              slotId: 'slot-1',
              awakenerId: 'awakener-0021',
              realm: 'AEQUOR',
              level: 60,
              wheels: [null, null],
            },
            {slotId: 'slot-2', wheels: [null, null]},
            {slotId: 'slot-3', wheels: [null, null]},
            {slotId: 'slot-4', wheels: [null, null]},
          ],
        },
      ],
    })
    storage.setItem(
      'skeydb.collection.v2',
      serializeCollectionOwnershipSnapshot(createEmptyCollectionOwnershipState()),
    )
    storage.setItem('skeydb.builder.allowDupes.v1', '1')
    storage.setItem('skeydb.builder.awakenerSortExpanded.v1', '0')
    storage.setItem('skeydb.ownedBoxExport.layout.v1', JSON.stringify({columns: 6}))
    storage.setItem('skeydb.unrecognized.v1', 'should not move')

    const snapshot = createDomainStorageMigrationSnapshot(
      storage,
      LOCATION,
      new Date('2026-05-17T10:00:00.000Z'),
    )

    expect(snapshot.kind).toBe(DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND)
    expect(snapshot.createdAt).toBe('2026-05-17T10:00:00.000Z')
    expect(snapshot.entries.map((entry) => entry.key)).toEqual(
      expect.arrayContaining([
        'skeydb.builder.v2',
        'skeydb.collection.v2',
        'skeydb.builder.allowDupes.v1',
        'skeydb.builder.awakenerSortExpanded.v1',
        'skeydb.ownedBoxExport.layout.v1',
      ]),
    )
    expect(snapshot.entries.some((entry) => entry.key === 'skeydb.unrecognized.v1')).toBe(false)
    expect(snapshot.skipped).toContainEqual({key: 'skeydb.builder.v1', reason: 'missing'})
  })

  it('skips invalid critical snapshots and invalid primitive preferences', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.v2', '{')
    storage.setItem('skeydb.collection.v2', JSON.stringify({version: 999, payload: {}}))
    storage.setItem('skeydb.builder.allowDupes.v1', 'true')

    const snapshot = createDomainStorageMigrationSnapshot(storage, LOCATION)

    expect(snapshot.entries).toHaveLength(0)
    expect(snapshot.skipped).toEqual(
      expect.arrayContaining([
        {key: 'skeydb.builder.v2', reason: 'invalid'},
        {key: 'skeydb.collection.v2', reason: 'invalid'},
        {key: 'skeydb.builder.allowDupes.v1', reason: 'invalid'},
      ]),
    )
  })
})

describe('isDomainStorageMigrationSnapshot', () => {
  it('accepts only snapshots with known entry keys, matching categories, and valid values', () => {
    const snapshot = createDomainStorageMigrationSnapshot(null, LOCATION)

    expect(isDomainStorageMigrationSnapshot(snapshot)).toBe(true)
    expect(
      isDomainStorageMigrationSnapshot({
        ...snapshot,
        entries: [{key: 'skeydb.unknown.v1', value: '1', category: 'preference'}],
      }),
    ).toBe(false)
    expect(
      isDomainStorageMigrationSnapshot({
        ...snapshot,
        entries: [{key: 'skeydb.builder.allowDupes.v1', value: '1', category: 'builder'}],
      }),
    ).toBe(false)
    expect(
      isDomainStorageMigrationSnapshot({
        ...snapshot,
        entries: [{key: 'skeydb.builder.allowDupes.v1', value: 'true', category: 'preference'}],
      }),
    ).toBe(false)
  })
})
