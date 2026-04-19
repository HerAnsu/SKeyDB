import type {RefObject} from 'react'

import {
  CatalogChipFilterRow,
  CatalogFiltersShell,
  CatalogRealmFilterRow,
} from './CatalogFiltersShell'
import {
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_TYPE_FILTER_IDS,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from './database-browse-state'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
}))

const typeFilterTabs = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label:
    id === 'ALL' ? 'All' : id === 'ASSAULT' ? 'Assault' : id === 'WARDEN' ? 'Warden' : 'Chorus',
}))

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
}: DatabaseFiltersProps) {
  return (
    <CatalogFiltersShell
      onQueryChange={onQueryChange}
      query={query}
      searchInputRef={searchInputRef}
      searchLabel='Search awakeners'
      searchPlaceholder='Name, tag, realm, or role'
    >
      <div className='grid gap-2 lg:grid-cols-2'>
        <CatalogRealmFilterRow
          activeRealm={realmFilter}
          onChange={onRealmFilterChange}
          realms={REALM_FILTERS}
        />

        <CatalogChipFilterRow
          activeId={rarityFilter}
          label='Rarity'
          onChange={onRarityFilterChange}
          options={rarityFilterTabs}
        />
      </div>

      <CatalogChipFilterRow
        activeId={typeFilter}
        label='Type'
        onChange={onTypeFilterChange}
        options={typeFilterTabs}
      />
    </CatalogFiltersShell>
  )
}
