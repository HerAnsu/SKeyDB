import {useState, type RefObject} from 'react'

import {
  DATABASE_AVAILABILITY_FILTER_IDS,
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_TYPE_FILTER_IDS,
  getAvailabilityFilterLabel,
  getTypeFilterLabel,
  type AvailabilityFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogMobileFilterGroup, CatalogRealmFilterRow} from './DatabaseChipPrimitives'
import {useMobileDatabaseFilters} from './useMobileDatabaseFilters'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  availabilityFilter: AvailabilityFilterId
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
  onAvailabilityFilterChange: (filter: AvailabilityFilterId) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
  summaryLabel: id === 'ALL' ? 'All' : id,
}))

const typeFilterTabs = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label: getTypeFilterLabel(id),
  summaryLabel: getTypeFilterLabel(id),
}))

const availabilityFilterTabs = DATABASE_AVAILABILITY_FILTER_IDS.map((id) => ({
  id,
  label: getAvailabilityFilterLabel(id),
  summaryLabel: getAvailabilityFilterLabel(id),
}))

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  availabilityFilter,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
  onAvailabilityFilterChange,
}: DatabaseFiltersProps) {
  const [openMobileFilter, setOpenMobileFilter] = useState<'rarity' | 'type' | 'source' | null>(
    null,
  )
  const isMobileFilters = useMobileDatabaseFilters()

  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search awakeners'
        onQueryChange={onQueryChange}
        placeholder='Name, tag, realm, or role'
        query={query}
        searchInputRef={searchInputRef}
      />
      {isMobileFilters ? (
        <div className='space-y-2.5'>
          <CatalogRealmFilterRow
            activeRealm={realmFilter}
            onChange={onRealmFilterChange}
            realms={REALM_FILTERS}
          />

          <CatalogMobileFilterGroup
            groups={[
              {
                activeId: rarityFilter,
                defaultId: 'ALL',
                key: 'rarity',
                label: 'Rarity',
                onChange: (next) => {
                  onRarityFilterChange(next as RarityFilterId)
                },
                options: rarityFilterTabs,
              },
              {
                activeId: typeFilter,
                defaultId: 'ALL',
                key: 'type',
                label: 'Type',
                onChange: (next) => {
                  onTypeFilterChange(next as TypeFilterId)
                },
                options: typeFilterTabs,
              },
              {
                activeId: availabilityFilter,
                defaultId: 'ALL',
                key: 'source',
                label: 'Source',
                onChange: (next) => {
                  onAvailabilityFilterChange(next as AvailabilityFilterId)
                },
                options: availabilityFilterTabs,
                toggleClassName: 'col-span-2',
              },
            ]}
            onOpenKeyChange={setOpenMobileFilter}
            openKey={openMobileFilter}
          />
        </div>
      ) : (
        <div className='space-y-2.5 sm:space-y-3'>
          <div className='grid gap-2 lg:grid-cols-2'>
            <CatalogRealmFilterRow
              activeRealm={realmFilter}
              onChange={onRealmFilterChange}
              realms={REALM_FILTERS}
            />

            <ChipFilterRow
              activeId={rarityFilter}
              label='Rarity'
              onChange={onRarityFilterChange}
              options={rarityFilterTabs}
            />
          </div>

          <ChipFilterRow
            activeId={typeFilter}
            label='Type'
            onChange={onTypeFilterChange}
            options={typeFilterTabs}
          />
          <ChipFilterRow
            activeId={availabilityFilter}
            label='Source'
            onChange={onAvailabilityFilterChange}
            options={availabilityFilterTabs}
          />
        </div>
      )}
    </div>
  )
}
