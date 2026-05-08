import {useMemo} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {
  type AvailabilityFilterId,
  type DatabaseBrowseState,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {compareAwakenersForDatabaseSort, type DatabaseSortKey} from '@/domain/database-sorting'

function matchesAvailabilityFilter(awakener: Awakener, availabilityFilter: AvailabilityFilterId) {
  if (availabilityFilter === 'ALL') {
    return true
  }
  if (availabilityFilter === 'LIMITED') {
    return (
      awakener.availabilityType === 'LIMITED_FADED_LEGACY' ||
      awakener.availabilityType === 'LIMITED_ASTRAL_REIGN'
    )
  }
  return awakener.availabilityType === availabilityFilter
}

export function filterAwakenersForDatabase(
  awakeners: Awakener[],
  realmFilter: RealmFilterId,
  rarityFilter: RarityFilterId,
  typeFilter: TypeFilterId,
  availabilityFilter: AvailabilityFilterId,
): Awakener[] {
  let result = awakeners
  if (realmFilter !== 'ALL') {
    result = result.filter((a) => a.realm === realmFilter)
  }
  if (rarityFilter !== 'ALL') {
    result = result.filter((a) => a.rarity === rarityFilter)
  }
  if (typeFilter !== 'ALL') {
    result = result.filter((a) => a.type === typeFilter)
  }
  if (availabilityFilter !== 'ALL') {
    result = result.filter((a) => matchesAvailabilityFilter(a, availabilityFilter))
  }
  return result
}

function applySorting(
  awakeners: Awakener[],
  sortKey: DatabaseSortKey,
  sortDirection: CollectionSortDirection,
  groupByRealm: boolean,
): Awakener[] {
  return [...awakeners].sort((left, right) =>
    compareAwakenersForDatabaseSort(left, right, {
      key: sortKey,
      direction: sortDirection,
      groupByRealm,
    }),
  )
}

export function useDatabaseViewModel(allAwakeners: Awakener[], browseState: DatabaseBrowseState) {
  const {
    availabilityFilter,
    groupByRealm,
    query,
    rarityFilter,
    realmFilter,
    sortDirection,
    sortKey,
    typeFilter,
  } = browseState

  const filteredAwakeners = useMemo(() => {
    const searched = searchAwakeners(allAwakeners, query)
    const filtered = filterAwakenersForDatabase(
      searched,
      realmFilter,
      rarityFilter,
      typeFilter,
      availabilityFilter,
    )
    return applySorting(filtered, sortKey, sortDirection, groupByRealm)
  }, [
    allAwakeners,
    availabilityFilter,
    query,
    realmFilter,
    rarityFilter,
    typeFilter,
    sortKey,
    sortDirection,
    groupByRealm,
  ])

  return {
    awakeners: filteredAwakeners,
    totalCount: allAwakeners.length,
  }
}
