import publicOverlaysFull from '@/data/public-v2/full/overlays.json'

import {awakenerOverlaysDatasetSchema, type AwakenerOverlayRecord} from './awakener-source-schema'

interface PublicOverlayEnvelope {
  records: Array<Omit<AwakenerOverlayRecord, 'ownerAwakenerId'> & {ownerAwakenerId?: string}>
}

let awakenerOverlaysCache: AwakenerOverlayRecord[] | null = null
let overlayByNameCache: Map<string, AwakenerOverlayRecord> | null = null

function numericAwakenerId(publicAwakenerId: string): number | undefined {
  const suffix = /^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1]
  return suffix ? Number(suffix) : undefined
}

function adaptPublicOverlay(
  record: PublicOverlayEnvelope['records'][number],
): AwakenerOverlayRecord {
  return {
    ...record,
    ownerAwakenerId: record.ownerAwakenerId ? numericAwakenerId(record.ownerAwakenerId) : undefined,
  }
}

function buildOverlayLookup(overlays: AwakenerOverlayRecord[]): Map<string, AwakenerOverlayRecord> {
  const byName = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlays) {
    byName.set(overlay.displayName, overlay)
    for (const alias of overlay.aliases) {
      byName.set(alias, overlay)
    }
  }

  return byName
}

export function getAwakenerOverlays(): AwakenerOverlayRecord[] {
  if (awakenerOverlaysCache) {
    return awakenerOverlaysCache
  }

  awakenerOverlaysCache = awakenerOverlaysDatasetSchema.parse(
    (publicOverlaysFull as unknown as PublicOverlayEnvelope).records.map(adaptPublicOverlay),
  )
  overlayByNameCache = buildOverlayLookup(awakenerOverlaysCache)
  return awakenerOverlaysCache
}

export function resolveAwakenerOverlay(
  name: string,
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
): AwakenerOverlayRecord | null {
  if (!overlayByNameCache || overlays !== awakenerOverlaysCache) {
    overlayByNameCache = buildOverlayLookup(overlays)
  }
  return overlayByNameCache.get(name) ?? null
}
