import {getOrCreateMapValue} from './cache'
import type {PublicDataScope, PublicRecord} from './contract'
import {publicRecordSchema} from './schemas'

type JsonLoader = () => Promise<unknown>

const recordLoaders: Partial<Record<string, JsonLoader>> = import.meta.glob(
  '../../data/public-v3/records/*/*.json',
  {
    import: 'default',
  },
)

const recordPromiseCache = new Map<string, Promise<PublicRecord | undefined>>()

function buildRecordPath(scope: PublicDataScope, id: string): string {
  return `../../data/public-v3/records/${scope}/${id}.json`
}

export function loadPublicRecord(
  scope: PublicDataScope,
  id: string,
): Promise<PublicRecord | undefined> {
  const cacheKey = `${scope}:${id}`
  return getOrCreateMapValue(recordPromiseCache, cacheKey, async () => {
    const loader = recordLoaders[buildRecordPath(scope, id)]
    if (!loader) {
      return undefined
    }
    const record = publicRecordSchema.parse(await loader())
    if (record.id !== id) {
      throw new Error(`Public V3 record path id "${id}" loaded record "${record.id}".`)
    }
    return record
  })
}
