import {getOrCreateMapValue} from './cache'
import type {PublicDataScope, PublicRecord} from './contract'
import {publicRecordSchema} from './schemas'
import {assertPublicRecordForScope, assertPublicScopeCapability} from './scopeRegistry'

const recordUrls: Partial<Record<string, () => Promise<string>>> = import.meta.glob<string>(
  '../../data/public-v3/records/*/*.json',
  {
    query: '?url&no-inline',
    import: 'default',
  },
)

const recordPromiseCache = new Map<string, Promise<PublicRecord | undefined>>()

function buildRecordPath(scope: PublicDataScope, id: string): string {
  return `../../data/public-v3/records/${scope}/${id}.json`
}

async function loadJsonFromRecordUrl(recordUrl: string): Promise<unknown> {
  if (import.meta.env.MODE === 'test' && recordUrl.startsWith('/src/')) {
    const nodeFsPromisesSpecifier = 'node:fs/promises'
    const {readFile} = (await import(nodeFsPromisesSpecifier)) as {
      readFile: (path: string, encoding: 'utf8') => Promise<string>
    }
    const cwd = (globalThis as {process?: {cwd: () => string}}).process?.cwd()
    if (!cwd) {
      throw new Error(`Cannot resolve Public V3 test record URL: ${recordUrl}`)
    }
    const filePath = `${cwd}${recordUrl.split('?')[0]}`
    return JSON.parse(await readFile(filePath, 'utf8'))
  }

  const response = await fetch(recordUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Public V3 record from ${recordUrl}: ${String(response.status)} ${response.statusText}`,
    )
  }
  return response.json()
}

export function loadPublicRecord(
  scope: PublicDataScope,
  id: string,
): Promise<PublicRecord | undefined> {
  assertPublicScopeCapability(scope, 'detailRecord')
  const cacheKey = `${scope}:${id}`
  return getOrCreateMapValue(recordPromiseCache, cacheKey, async () => {
    const loadRecordUrl = recordUrls[buildRecordPath(scope, id)]
    if (!loadRecordUrl) {
      return undefined
    }
    const recordUrl = await loadRecordUrl()
    const record = publicRecordSchema.parse(await loadJsonFromRecordUrl(recordUrl))
    assertPublicRecordForScope(scope, record, id)
    return record
  })
}
