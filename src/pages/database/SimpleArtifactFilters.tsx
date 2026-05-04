import type {RefObject} from 'react'

import {CatalogChipFilterRow} from './DatabaseChipPrimitives'
import {DatabaseSearchInput} from './DatabaseSearchInput'

export type PosseRealmFilter =
  | 'ALL'
  | 'FADED_LEGACY'
  | 'AEQUOR'
  | 'CARO'
  | 'CHAOS'
  | 'ULTRA'
  | 'OTHER'

const POSSE_REALM_OPTIONS: {id: PosseRealmFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'FADED_LEGACY', label: 'Faded Legacy'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
  {id: 'OTHER', label: 'Other'},
]

interface PosseDatabaseFiltersProps {
  query: string
  realmFilter: PosseRealmFilter
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: PosseRealmFilter) => void
}

export function PosseDatabaseFilters({
  onQueryChange,
  onRealmFilterChange,
  query,
  realmFilter,
  searchInputRef,
}: PosseDatabaseFiltersProps) {
  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <DatabaseSearchInput
        label='Search posses'
        onQueryChange={onQueryChange}
        placeholder='Name or realm'
        query={query}
        searchInputRef={searchInputRef}
      />
      <CatalogChipFilterRow
        activeId={realmFilter}
        label='Realm'
        onChange={onRealmFilterChange}
        options={POSSE_REALM_OPTIONS}
      />
    </div>
  )
}

interface CovenantDatabaseFiltersProps {
  query: string
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
}

export function CovenantDatabaseFilters({
  onQueryChange,
  query,
  searchInputRef,
}: CovenantDatabaseFiltersProps) {
  return (
    <DatabaseSearchInput
      label='Search covenants'
      onQueryChange={onQueryChange}
      placeholder='Name'
      query={query}
      searchInputRef={searchInputRef}
    />
  )
}
