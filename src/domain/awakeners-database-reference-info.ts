import type {AwakenerOverlayRecord} from './awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedAwakenerDatabaseReferenceLayer,
} from './awakeners-database-view'

export {buildAwakenerDatabaseOverlayLabel} from './awakeners-database-reference-layer'

function normalizeReferenceName(name: string): string {
  return name.trim().toLowerCase()
}

export function resolveAwakenerDatabaseReferenceInfo(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  name: string,
): DatabaseReferenceInfo | null {
  return view.referenceInfoByName.get(normalizeReferenceName(name)) ?? null
}

export function resolveAwakenerDatabaseReferenceInfoById(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  id: string,
): DatabaseReferenceInfo | null {
  return view.referenceInfoById.get(id) ?? null
}

export function resolveAwakenerDatabaseOverlay(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  name: string,
): AwakenerOverlayRecord | null {
  return view.overlayByName.get(normalizeReferenceName(name)) ?? null
}
