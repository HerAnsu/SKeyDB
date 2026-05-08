import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  setSearchParam,
} from '@/domain/browse-state-search-params'

export const POSSE_DATABASE_REALM_FILTER_IDS = [
  'ALL',
  'FADED_LEGACY',
  'AEQUOR',
  'CARO',
  'CHAOS',
  'ULTRA',
  'OTHER',
] as const
export type PosseDatabaseRealmFilterId = (typeof POSSE_DATABASE_REALM_FILTER_IDS)[number]

export interface PosseDatabaseBrowseState {
  query: string
  realmFilter: PosseDatabaseRealmFilterId
}

export const POSSE_DATABASE_BROWSE_DEFAULTS: PosseDatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
}

export interface CovenantDatabaseBrowseState {
  query: string
}

export const COVENANT_DATABASE_BROWSE_DEFAULTS: CovenantDatabaseBrowseState = {
  query: '',
}

export function getPosseDatabaseRealmFilterLabel(realmFilter: PosseDatabaseRealmFilterId): string {
  switch (realmFilter) {
    case 'ALL':
      return 'All'
    case 'FADED_LEGACY':
      return 'Faded Legacy'
    case 'AEQUOR':
      return 'Aequor'
    case 'CARO':
      return 'Caro'
    case 'CHAOS':
      return 'Chaos'
    case 'ULTRA':
      return 'Ultra'
    case 'OTHER':
      return 'Other'
  }

  return realmFilter
}

export function parsePosseDatabaseBrowseState(
  searchParams: URLSearchParams,
): PosseDatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(searchParams.get('q')),
    realmFilter: parseEnumSearchParam(
      searchParams.get('realm'),
      POSSE_DATABASE_REALM_FILTER_IDS,
      POSSE_DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
  }
}

export function patchPosseDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<PosseDatabaseBrowseState>,
): URLSearchParams {
  const nextState = {...parsePosseDatabaseBrowseState(searchParams), ...patch}
  const nextParams = new URLSearchParams()

  setSearchParam(nextParams, 'q', normalizeBrowseQuery(nextState.query))
  setSearchParam(
    nextParams,
    'realm',
    nextState.realmFilter === POSSE_DATABASE_BROWSE_DEFAULTS.realmFilter
      ? undefined
      : nextState.realmFilter,
  )

  return nextParams
}

export function parseCovenantDatabaseBrowseState(
  searchParams: URLSearchParams,
): CovenantDatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(searchParams.get('q')),
  }
}

export function patchCovenantDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<CovenantDatabaseBrowseState>,
): URLSearchParams {
  const nextState = {...parseCovenantDatabaseBrowseState(searchParams), ...patch}
  const nextParams = new URLSearchParams()

  setSearchParam(nextParams, 'q', normalizeBrowseQuery(nextState.query))

  return nextParams
}
