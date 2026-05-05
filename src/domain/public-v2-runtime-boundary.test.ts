import {describe, expect, it} from 'vitest'

const runtimeSourceModules = {
  ...import.meta.glob('../**/*.{ts,tsx}', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  ...import.meta.glob('../../scripts/**/*.mjs', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
} as Record<string, string>

const runtimeSourceFiles = Object.keys(runtimeSourceModules)
  .filter((filePath) => !filePath.endsWith('.test.ts'))
  .filter((filePath) => !filePath.endsWith('.test.tsx'))

const allowedPersistenceBridgeFiles = new Set([
  'src/domain/persistence-id-migration.ts',
  'src/domain/persistence-id-migration.v2.ts',
  'src/domain/collection-ownership.ts',
  'src/pages/builder/builder-persistence.ts',
])

const allowedStorageVersionFiles = new Set([
  'src/pages/builder/useBuilderPreferences.ts',
  'src/pages/builder/BuilderSelectionControls.tsx',
  'src/pages/collection/export-config.ts',
  'src/pages/collection/OwnedAssetBoxExport.tsx',
  'src/pages/collection/useCollectionViewModel.ts',
])

function normalizePath(filePath: string): string {
  if (filePath.startsWith('../')) {
    return `src/${filePath.slice(3)}`
  }
  if (filePath.startsWith('../../')) {
    return filePath.slice(6)
  }
  return filePath
}

function readSource(filePath: string): string {
  return runtimeSourceModules[filePath] ?? ''
}

describe('public V2 runtime boundary', () => {
  it('confines generated public V3 JSON imports to the public-data repository boundary', () => {
    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (normalizedPath.startsWith('src/data-access/public-data/')) {
        return []
      }

      const source = readSource(filePath)
      return source.includes('data/public-v3') || source.includes('@/data/public-v3')
        ? [normalizedPath]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('does not import old awakener or wheel database files outside the persistence bridge', () => {
    const forbiddenImportPatterns = [
      '@/data/awakeners',
      '../data/awakeners',
      '@/data/wheels',
      '../data/wheels',
      'data/awakeners/',
      'data/wheels/',
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (allowedPersistenceBridgeFiles.has(normalizedPath)) {
        return []
      }

      const source = readSource(filePath)
      return forbiddenImportPatterns.some((pattern) => source.includes(pattern))
        ? [normalizedPath]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('keeps V1 naming confined to persistence migration code and tests', () => {
    const forbiddenRuntimeTerms = [
      'WheelFullV1Record',
      'wheels-full-v1',
      'fullDataV1',
      'compile-wheels-full-v1',
      'compileWheelsFullV1',
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (
        allowedPersistenceBridgeFiles.has(normalizedPath) ||
        allowedStorageVersionFiles.has(normalizedPath)
      ) {
        return []
      }

      const source = readSource(filePath)
      return forbiddenRuntimeTerms.some((term) => source.includes(term)) ? [normalizedPath] : []
    })

    expect(offenders).toEqual([])
  })
})
