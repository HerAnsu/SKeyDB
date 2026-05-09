import {useId, useState, type RefObject} from 'react'

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

import {
  CatalogMobileFilterPanel,
  CatalogMobileFilterToggle,
  CatalogRealmFilterRow,
} from './DatabaseChipPrimitives'
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
  const filterPanelIdPrefix = useId()
  const rarityPanelId = `${filterPanelIdPrefix}-rarity`
  const typePanelId = `${filterPanelIdPrefix}-type`
  const sourcePanelId = `${filterPanelIdPrefix}-source`

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

          <div className='space-y-1.5'>
            <div className='grid grid-cols-2 gap-1.5'>
              <CatalogMobileFilterToggle
                activeId={rarityFilter}
                controlsId={rarityPanelId}
                defaultId='ALL'
                label='Rarity'
                onOpenChange={(open) => {
                  setOpenMobileFilter(open ? 'rarity' : null)
                }}
                open={openMobileFilter === 'rarity'}
                options={rarityFilterTabs}
              />
              <CatalogMobileFilterToggle
                activeId={typeFilter}
                controlsId={typePanelId}
                defaultId='ALL'
                label='Type'
                onOpenChange={(open) => {
                  setOpenMobileFilter(open ? 'type' : null)
                }}
                open={openMobileFilter === 'type'}
                options={typeFilterTabs}
              />
              <CatalogMobileFilterToggle
                activeId={availabilityFilter}
                className='col-span-2'
                controlsId={sourcePanelId}
                defaultId='ALL'
                label='Source'
                onOpenChange={(open) => {
                  setOpenMobileFilter(open ? 'source' : null)
                }}
                open={openMobileFilter === 'source'}
                options={availabilityFilterTabs}
              />
            </div>

            {openMobileFilter === 'rarity' ? (
              <CatalogMobileFilterPanel
                activeId={rarityFilter}
                id={rarityPanelId}
                label='Rarity'
                onChange={onRarityFilterChange}
                options={rarityFilterTabs}
              />
            ) : null}
            {openMobileFilter === 'type' ? (
              <CatalogMobileFilterPanel
                activeId={typeFilter}
                id={typePanelId}
                label='Type'
                onChange={onTypeFilterChange}
                options={typeFilterTabs}
              />
            ) : null}
            {openMobileFilter === 'source' ? (
              <CatalogMobileFilterPanel
                activeId={availabilityFilter}
                id={sourcePanelId}
                label='Source'
                onChange={onAvailabilityFilterChange}
                options={availabilityFilterTabs}
              />
            ) : null}
          </div>
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
