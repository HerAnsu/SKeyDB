import {describe, expect, it} from 'vitest'

import {
  createLegacyMigrationExportUrl,
  createMigrationNonce,
  isAllowedMigrationSourceOrigin,
  isAllowedMigrationTargetOrigin,
  parseMigrationBridgeMessage,
  resolveLegacyMigrationExportUrlForCurrentOrigin,
} from './migrationBridgeProtocol'
import {
  DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
  DOMAIN_STORAGE_MIGRATION_VERSION,
  type DomainStorageMigrationSnapshot,
} from './storageMigrationSnapshot'

const SNAPSHOT: DomainStorageMigrationSnapshot = {
  kind: DOMAIN_STORAGE_MIGRATION_SNAPSHOT_KIND,
  version: DOMAIN_STORAGE_MIGRATION_VERSION,
  createdAt: '2026-05-17T10:00:00.000Z',
  sourceOrigin: 'https://dansa.github.io',
  sourcePathname: '/SKeyDB/',
  entries: [{key: 'skeydb.builder.allowDupes.v1', value: '1', category: 'preference'}],
  skipped: [],
}

describe('createMigrationNonce', () => {
  it('creates a non-empty hex nonce', () => {
    expect(createMigrationNonce()).toMatch(/^[\da-f]{32}$/)
  })
})

describe('origin allowlists', () => {
  it('allows production origins and rejects arbitrary origins', () => {
    expect(isAllowedMigrationSourceOrigin('https://dansa.github.io')).toBe(true)
    expect(isAllowedMigrationTargetOrigin('https://skeydb.com')).toBe(true)
    expect(isAllowedMigrationTargetOrigin('https://www.skeydb.com')).toBe(true)
    expect(isAllowedMigrationSourceOrigin('https://evil.example')).toBe(false)
    expect(isAllowedMigrationTargetOrigin('https://evil.example')).toBe(false)
  })

  it('allows localhost origins only when explicitly enabled', () => {
    expect(isAllowedMigrationSourceOrigin('http://127.0.0.1:5173')).toBe(false)
    expect(isAllowedMigrationSourceOrigin('http://127.0.0.1:5173', {allowLocalOrigins: true})).toBe(
      true,
    )
    expect(isAllowedMigrationTargetOrigin('http://localhost:5174', {allowLocalOrigins: true})).toBe(
      true,
    )
  })
})

describe('createLegacyMigrationExportUrl', () => {
  it('builds a hash route URL with nonce and target origin params', () => {
    expect(
      createLegacyMigrationExportUrl({
        nonce: 'abc',
        targetOrigin: 'https://skeydb.com',
      }),
    ).toBe(
      'https://dansa.github.io/SKeyDB/#/migrate/export?nonce=abc&targetOrigin=https%3A%2F%2Fskeydb.com',
    )
  })
})

describe('resolveLegacyMigrationExportUrlForCurrentOrigin', () => {
  it('points dev target ports at the default local source port', () => {
    expect(
      resolveLegacyMigrationExportUrlForCurrentOrigin(
        {
          origin: 'http://127.0.0.1:5174',
          hostname: '127.0.0.1',
          protocol: 'http:',
          port: '5174',
        },
        undefined,
        true,
      ),
    ).toBe('http://127.0.0.1:5173/#/migrate/export')
  })
})

describe('parseMigrationBridgeMessage', () => {
  it('accepts snapshot messages from allowed origins with the expected nonce', () => {
    expect(
      parseMigrationBridgeMessage(
        {type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: SNAPSHOT},
        {
          expectedNonce: 'abc',
          eventOrigin: 'https://dansa.github.io',
          allowedOrigins: ['https://dansa.github.io'],
        },
      ),
    ).toEqual({type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: SNAPSHOT})
  })

  it('rejects wrong origins, wrong nonces, and unknown message types', () => {
    expect(
      parseMigrationBridgeMessage(
        {type: 'skeydb:migration-snapshot:v1', nonce: 'abc', snapshot: SNAPSHOT},
        {
          expectedNonce: 'abc',
          eventOrigin: 'https://evil.example',
          allowedOrigins: ['https://dansa.github.io'],
        },
      ),
    ).toBeNull()
    expect(
      parseMigrationBridgeMessage(
        {type: 'skeydb:migration-snapshot:v1', nonce: 'wrong', snapshot: SNAPSHOT},
        {
          expectedNonce: 'abc',
          eventOrigin: 'https://dansa.github.io',
          allowedOrigins: ['https://dansa.github.io'],
        },
      ),
    ).toBeNull()
    expect(
      parseMigrationBridgeMessage(
        {type: 'unknown', nonce: 'abc', snapshot: SNAPSHOT},
        {
          expectedNonce: 'abc',
          eventOrigin: 'https://dansa.github.io',
          allowedOrigins: ['https://dansa.github.io'],
        },
      ),
    ).toBeNull()
  })
})
