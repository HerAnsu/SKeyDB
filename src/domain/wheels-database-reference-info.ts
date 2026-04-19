import type {
  DatabaseReferenceInfo,
  ResolvedAwakenerDatabaseReferenceLayer,
} from './awakeners-database-view'
import type {WheelDatabaseDescriptionRecord} from './description-records'

function normalizeReferenceName(name: string): string {
  return name.trim().toLowerCase()
}

export function resolveWheelDatabaseReferenceInfo(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  name: string,
): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord> | null {
  const info = view.referenceInfoByName.get(normalizeReferenceName(name))
  return info?.kind === 'wheel'
    ? (info as DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>)
    : null
}

export function resolveWheelDatabaseReferenceInfoById(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  id: string,
): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord> | null {
  const info = view.referenceInfoById.get(id)
  return info?.kind === 'wheel'
    ? (info as DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>)
    : null
}
