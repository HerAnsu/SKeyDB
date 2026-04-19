import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {wheelMainstatFilterOptions, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'

export const WHEELS_DATABASE_REALM_FILTER_IDS = [
  'ALL',
  'AEQUOR',
  'CARO',
  'CHAOS',
  'ULTRA',
  'NEUTRAL',
] as const
export type WheelsDatabaseRealmFilterId = (typeof WHEELS_DATABASE_REALM_FILTER_IDS)[number]

export const WHEELS_DATABASE_RARITY_FILTER_IDS = ['ALL', 'SSR', 'SR', 'R', 'N'] as const
export type WheelsDatabaseRarityFilterId = (typeof WHEELS_DATABASE_RARITY_FILTER_IDS)[number]

export const WHEELS_DATABASE_SORT_OPTIONS = ['ALPHABETICAL', 'RARITY', 'MAINSTAT'] as const
export type WheelsDatabaseSortKey = (typeof WHEELS_DATABASE_SORT_OPTIONS)[number]

export interface WheelsDatabaseBrowseState {
  query: string
  realmFilter: WheelsDatabaseRealmFilterId
  rarityFilter: WheelsDatabaseRarityFilterId
  mainstatFilter: WheelMainstatFilter
  sortKey: WheelsDatabaseSortKey
  sortDirection: CollectionSortDirection
}

export const WHEELS_DATABASE_BROWSE_DEFAULTS: WheelsDatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  mainstatFilter: 'ALL',
  sortKey: 'RARITY',
  sortDirection: 'DESC',
}

export function getDefaultWheelsDatabaseSortDirection(
  sortKey: WheelsDatabaseSortKey,
): CollectionSortDirection {
  return sortKey === 'RARITY' ? 'DESC' : 'ASC'
}

const WHEELS_DATABASE_MAINSTAT_FILTER_IDS = wheelMainstatFilterOptions.map((entry) => entry.id)

function parseEnumParam<TValue extends string>(
  rawValue: string | null,
  allowedValues: readonly TValue[],
  fallback: TValue,
): TValue {
  return rawValue && allowedValues.includes(rawValue as TValue) ? (rawValue as TValue) : fallback
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

function parseSortDirection(
  rawValue: string | null,
  sortKey: WheelsDatabaseSortKey,
): CollectionSortDirection {
  if (rawValue === 'ASC' || rawValue === 'DESC') {
    return rawValue
  }
  return getDefaultWheelsDatabaseSortDirection(sortKey)
}

export function parseWheelsDatabaseBrowseState(
  searchParams: URLSearchParams,
): WheelsDatabaseBrowseState {
  const sortKey = parseEnumParam(
    searchParams.get('sort'),
    WHEELS_DATABASE_SORT_OPTIONS,
    WHEELS_DATABASE_BROWSE_DEFAULTS.sortKey,
  )

  return {
    query: normalizeQuery(searchParams.get('q')),
    realmFilter: parseEnumParam(
      searchParams.get('realm'),
      WHEELS_DATABASE_REALM_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
    rarityFilter: parseEnumParam(
      searchParams.get('rarity'),
      WHEELS_DATABASE_RARITY_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.rarityFilter,
    ),
    mainstatFilter: parseEnumParam(
      searchParams.get('mainstat'),
      WHEELS_DATABASE_MAINSTAT_FILTER_IDS,
      WHEELS_DATABASE_BROWSE_DEFAULTS.mainstatFilter,
    ),
    sortKey,
    sortDirection: parseSortDirection(searchParams.get('dir'), sortKey),
  }
}

export function patchWheelsDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<WheelsDatabaseBrowseState>,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams)
  const nextState = {
    ...parseWheelsDatabaseBrowseState(searchParams),
    ...patch,
  }
  if (patch.sortKey && patch.sortDirection === undefined) {
    nextState.sortDirection = getDefaultWheelsDatabaseSortDirection(patch.sortKey)
  }
  const normalizedQuery = normalizeQuery(nextState.query)

  updateSearchParam(nextParams, 'q', normalizedQuery || undefined)
  updateSearchParam(
    nextParams,
    'realm',
    nextState.realmFilter === WHEELS_DATABASE_BROWSE_DEFAULTS.realmFilter
      ? undefined
      : nextState.realmFilter,
  )
  updateSearchParam(
    nextParams,
    'rarity',
    nextState.rarityFilter === WHEELS_DATABASE_BROWSE_DEFAULTS.rarityFilter
      ? undefined
      : nextState.rarityFilter,
  )
  updateSearchParam(
    nextParams,
    'mainstat',
    nextState.mainstatFilter === WHEELS_DATABASE_BROWSE_DEFAULTS.mainstatFilter
      ? undefined
      : nextState.mainstatFilter,
  )
  updateSearchParam(
    nextParams,
    'sort',
    nextState.sortKey === WHEELS_DATABASE_BROWSE_DEFAULTS.sortKey ? undefined : nextState.sortKey,
  )
  updateSearchParam(
    nextParams,
    'dir',
    nextState.sortDirection === getDefaultWheelsDatabaseSortDirection(nextState.sortKey)
      ? undefined
      : nextState.sortDirection,
  )

  return nextParams
}
