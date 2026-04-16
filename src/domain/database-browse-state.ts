import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

export const DATABASE_REALM_FILTER_IDS = ['ALL', 'AEQUOR', 'CARO', 'CHAOS', 'ULTRA'] as const
export type RealmFilterId = (typeof DATABASE_REALM_FILTER_IDS)[number]
export const DATABASE_RARITY_FILTER_IDS = ['ALL', 'Genesis', 'SSR', 'SR'] as const
export type RarityFilterId = (typeof DATABASE_RARITY_FILTER_IDS)[number]
export const DATABASE_TYPE_FILTER_IDS = ['ALL', 'ASSAULT', 'WARDEN', 'CHORUS'] as const
export type TypeFilterId = (typeof DATABASE_TYPE_FILTER_IDS)[number]

export const DATABASE_SORT_OPTIONS: readonly DatabaseSortKey[] = [
  'ALPHABETICAL',
  'RARITY',
  'ATK',
  'DEF',
  'CON',
]

export interface DatabaseBrowseState {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
}

export const DATABASE_BROWSE_DEFAULTS: DatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  typeFilter: 'ALL',
  sortKey: 'ALPHABETICAL',
  sortDirection: 'ASC',
  groupByRealm: false,
}

function parseEnumParam<TValue extends string>(
  rawValue: string | null,
  allowedValues: readonly TValue[],
  fallback: TValue,
): TValue {
  return rawValue && allowedValues.includes(rawValue as TValue) ? (rawValue as TValue) : fallback
}

function parseSortDirection(rawValue: string | null): CollectionSortDirection {
  return rawValue === 'DESC' ? 'DESC' : DATABASE_BROWSE_DEFAULTS.sortDirection
}

function parseGroupByRealm(rawValue: string | null): boolean {
  return rawValue === '1'
}

function normalizeQuery(rawValue: string | null | undefined): string {
  return rawValue?.trim() ?? ''
}

function updateSearchParam(params: URLSearchParams, key: string, value?: string) {
  if (!value) {
    params.delete(key)
    return
  }

  params.set(key, value)
}

export function parseDatabaseBrowseState(searchParams: URLSearchParams): DatabaseBrowseState {
  return {
    query: normalizeQuery(searchParams.get('q')),
    realmFilter: parseEnumParam(
      searchParams.get('realm'),
      DATABASE_REALM_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
    rarityFilter: parseEnumParam(
      searchParams.get('rarity'),
      DATABASE_RARITY_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.rarityFilter,
    ),
    typeFilter: parseEnumParam(
      searchParams.get('type'),
      DATABASE_TYPE_FILTER_IDS,
      DATABASE_BROWSE_DEFAULTS.typeFilter,
    ),
    sortKey: parseEnumParam(
      searchParams.get('sort'),
      DATABASE_SORT_OPTIONS,
      DATABASE_BROWSE_DEFAULTS.sortKey,
    ),
    sortDirection: parseSortDirection(searchParams.get('dir')),
    groupByRealm: parseGroupByRealm(searchParams.get('group')),
  }
}

export function patchDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<DatabaseBrowseState>,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams)
  const nextState = {
    ...parseDatabaseBrowseState(searchParams),
    ...patch,
  }
  const normalizedQuery = normalizeQuery(nextState.query)

  updateSearchParam(nextParams, 'q', normalizedQuery || undefined)
  updateSearchParam(
    nextParams,
    'realm',
    nextState.realmFilter === DATABASE_BROWSE_DEFAULTS.realmFilter
      ? undefined
      : nextState.realmFilter,
  )
  updateSearchParam(
    nextParams,
    'rarity',
    nextState.rarityFilter === DATABASE_BROWSE_DEFAULTS.rarityFilter
      ? undefined
      : nextState.rarityFilter,
  )
  updateSearchParam(
    nextParams,
    'type',
    nextState.typeFilter === DATABASE_BROWSE_DEFAULTS.typeFilter ? undefined : nextState.typeFilter,
  )
  updateSearchParam(
    nextParams,
    'sort',
    nextState.sortKey === DATABASE_BROWSE_DEFAULTS.sortKey ? undefined : nextState.sortKey,
  )
  updateSearchParam(
    nextParams,
    'dir',
    nextState.sortDirection === DATABASE_BROWSE_DEFAULTS.sortDirection
      ? undefined
      : nextState.sortDirection,
  )
  updateSearchParam(
    nextParams,
    'group',
    nextState.groupByRealm === DATABASE_BROWSE_DEFAULTS.groupByRealm ? undefined : '1',
  )

  return nextParams
}
