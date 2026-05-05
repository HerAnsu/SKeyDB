import {parseDatabaseBrowseState, patchDatabaseBrowseState} from '@/domain/database-browse-state'
import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
} from '@/domain/simple-artifact-database-browse-state'
import {
  parseWheelsDatabaseBrowseState,
  patchWheelsDatabaseBrowseState,
} from '@/domain/wheels-database-browse-state'

export function sanitizeDatabaseEntitySearch(entity: DatabaseEntityId, search: string): string {
  const searchParams = new URLSearchParams(search)
  const sanitizedParams = sanitizeDatabaseEntitySearchParams(entity, searchParams)
  const sanitizedSearch = sanitizedParams.toString()

  return sanitizedSearch ? `?${sanitizedSearch}` : ''
}

function sanitizeDatabaseEntitySearchParams(
  entity: DatabaseEntityId,
  searchParams: URLSearchParams,
): URLSearchParams {
  if (entity === 'wheels') {
    return patchWheelsDatabaseBrowseState(
      new URLSearchParams(),
      parseWheelsDatabaseBrowseState(searchParams),
    )
  }

  if (entity === 'posses') {
    return patchPosseDatabaseBrowseState(
      new URLSearchParams(),
      parsePosseDatabaseBrowseState(searchParams),
    )
  }

  if (entity === 'covenants') {
    return patchCovenantDatabaseBrowseState(
      new URLSearchParams(),
      parseCovenantDatabaseBrowseState(searchParams),
    )
  }

  return patchDatabaseBrowseState(new URLSearchParams(), parseDatabaseBrowseState(searchParams))
}
