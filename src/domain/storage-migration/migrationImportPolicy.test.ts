import {describe, expect, it} from 'vitest'

import {type StorageLike} from '@/domain/storage'

import {applyDomainStorageMigrationPlan, planDomainStorageMigration} from './migrationImportPolicy'
import {
  DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
  DOMAIN_STORAGE_MIGRATION_VERSION,
  type DomainStorageMigrationSnapshot,
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

function makeSnapshot(): DomainStorageMigrationSnapshot {
  return {
    kind: DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
    version: DOMAIN_STORAGE_MIGRATION_VERSION,
    createdAt: '2026-05-17T10:00:00.000Z',
    sourceOrigin: 'https://dansa.github.io',
    sourcePathname: '/SKeyDB/',
    entries: [
      {key: 'skeydb.builder.allowDupes.v1', value: '1', category: 'preference'},
      {key: 'skeydb.builder.displayUnowned.v1', value: '0', category: 'preference'},
      {key: 'skeydb.builder.teamPreviewMode.v1', value: 'compact', category: 'preference'},
    ],
    skipped: [],
  }
}

describe('planDomainStorageMigration', () => {
  it('classifies copy, unchanged, and conflict items', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.displayUnowned.v1', '0')
    storage.setItem('skeydb.builder.teamPreviewMode.v1', 'expanded')

    const plan = planDomainStorageMigration(makeSnapshot(), storage)

    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.summary).toEqual({copy: 1, unchanged: 1, conflict: 1})
    expect(plan.items.map((item) => [item.key, item.status])).toEqual([
      ['skeydb.builder.allowDupes.v1', 'copy'],
      ['skeydb.builder.displayUnowned.v1', 'unchanged'],
      ['skeydb.builder.teamPreviewMode.v1', 'conflict'],
    ])
  })

  it('rejects invalid snapshot envelopes', () => {
    const result = planDomainStorageMigration({kind: 'wrong'}, new MemoryStorage())

    expect(result).toEqual({ok: false, error: 'invalid_snapshot'})
  })
})

describe('applyDomainStorageMigrationPlan', () => {
  it('writes missing entries, keeps requested conflicts, and leaves unchanged values alone', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.displayUnowned.v1', '0')
    storage.setItem('skeydb.builder.teamPreviewMode.v1', 'expanded')
    const plan = planDomainStorageMigration(makeSnapshot(), storage)
    if (!plan.ok) throw new Error('Expected valid plan')

    const result = applyDomainStorageMigrationPlan(
      plan,
      storage,
      {'skeydb.builder.teamPreviewMode.v1': 'keep-target'},
      new Date('2026-05-17T11:00:00.000Z'),
    )

    expect(result.ok).toBe(true)
    expect(storage.getItem('skeydb.builder.allowDupes.v1')).toBe('1')
    expect(storage.getItem('skeydb.builder.displayUnowned.v1')).toBe('0')
    expect(storage.getItem('skeydb.builder.teamPreviewMode.v1')).toBe('expanded')
  })

  it('backs up target values before replacing conflicts', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.teamPreviewMode.v1', 'expanded')
    const plan = planDomainStorageMigration(makeSnapshot(), storage)
    if (!plan.ok) throw new Error('Expected valid plan')

    const result = applyDomainStorageMigrationPlan(
      plan,
      storage,
      {'skeydb.builder.teamPreviewMode.v1': 'copy-source'},
      new Date('2026-05-17T11:00:00.000Z'),
    )

    expect(result).toMatchObject({
      ok: true,
      backupKey: 'skeydb.migration.backup.2026-05-17T11:00:00.000Z.v1',
    })
    expect(storage.getItem('skeydb.builder.teamPreviewMode.v1')).toBe('compact')
    expect(
      JSON.parse(storage.getItem('skeydb.migration.backup.2026-05-17T11:00:00.000Z.v1') ?? ''),
    ).toMatchObject({
      kind: 'skeydb.domain-storage-migration.backup',
      entries: [{key: 'skeydb.builder.teamPreviewMode.v1', value: 'expanded'}],
    })
  })

  it('requires an explicit decision for conflicts', () => {
    const storage = new MemoryStorage()
    storage.setItem('skeydb.builder.teamPreviewMode.v1', 'expanded')
    const plan = planDomainStorageMigration(makeSnapshot(), storage)
    if (!plan.ok) throw new Error('Expected valid plan')

    expect(applyDomainStorageMigrationPlan(plan, storage, {})).toEqual({
      ok: false,
      error: 'missing_conflict_decision',
      key: 'skeydb.builder.teamPreviewMode.v1',
    })
  })
})
