import awakenersOverlaysJson from '@/data/awakeners/awakener-overlays.json'

import {awakenerOverlaysDatasetSchema, type AwakenerOverlayRecord} from './awakener-source-schema'

let awakenerOverlaysCache: AwakenerOverlayRecord[] | null = null
let overlayByNameCache: Map<string, AwakenerOverlayRecord> | null = null

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

  awakenerOverlaysCache = awakenerOverlaysDatasetSchema.parse(awakenersOverlaysJson)
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
