import {getPublicCatalog} from './catalogRepository'
import type {PublicDataScope, PublicRecord} from './contract'
import {publicRecordSchema} from './schemas'

const recordSnapshots: Partial<Record<string, unknown>> = import.meta.glob(
  '../../data/public-v3/records/{covenants,derived-skills,enlightens,overlays,posses,relics,skills,talents,wheels}/*.json',
  {
    eager: true,
    import: 'default',
  },
)

const recordSnapshotCache = new Map<string, PublicRecord | undefined>()

function buildRecordPath(scope: PublicDataScope, id: string): string {
  return `../../data/public-v3/records/${scope}/${id}.json`
}

export function getPublicRecordSnapshot(
  scope: PublicDataScope,
  id: string,
): PublicRecord | undefined {
  const cacheKey = `${scope}:${id}`
  if (recordSnapshotCache.has(cacheKey)) {
    return recordSnapshotCache.get(cacheKey)
  }

  const recordJson = recordSnapshots[buildRecordPath(scope, id)]
  if (!recordJson) {
    recordSnapshotCache.set(cacheKey, undefined)
    return undefined
  }

  const record = publicRecordSchema.parse(recordJson)
  if (record.id !== id) {
    throw new Error(`Public V3 record path id "${id}" loaded record "${record.id}".`)
  }

  recordSnapshotCache.set(cacheKey, record)
  return record
}

export function getPublicRecordSnapshots(scope: PublicDataScope): PublicRecord[] {
  return getPublicCatalog(scope).records.flatMap((record) => {
    const snapshot = getPublicRecordSnapshot(scope, record.id)
    return snapshot ? [snapshot] : []
  })
}
