import {useId, useState, type RefObject} from 'react'

import {wheelMainstatFilterOptions, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {
  WHEELS_DATABASE_RARITY_FILTER_IDS,
  WHEELS_DATABASE_REALM_FILTER_IDS,
  type WheelsDatabaseRarityFilterId,
  type WheelsDatabaseRealmFilterId,
} from '@/domain/wheels-database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

import {
  CatalogMobileFilterPanel,
  CatalogMobileFilterToggle,
  CatalogRealmFilterRow,
} from './DatabaseChipPrimitives'
import {useMobileDatabaseFilters} from './useMobileDatabaseFilters'

interface WheelDatabaseFiltersProps {
  query: string
  realmFilter: WheelsDatabaseRealmFilterId
  rarityFilter: WheelsDatabaseRarityFilterId
  mainstatFilter: WheelMainstatFilter
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: WheelsDatabaseRealmFilterId) => void
  onRarityFilterChange: (filter: WheelsDatabaseRarityFilterId) => void
  onMainstatFilterChange: (filter: WheelMainstatFilter) => void
}

const REALM_FILTERS = WHEELS_DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = WHEELS_DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
  summaryLabel: id === 'ALL' ? 'All' : id,
}))

export function WheelDatabaseFilters({
  mainstatFilter,
  onMainstatFilterChange,
  onQueryChange,
  onRarityFilterChange,
  onRealmFilterChange,
  query,
  rarityFilter,
  realmFilter,
  searchInputRef,
}: WheelDatabaseFiltersProps) {
  const [openMobileFilter, setOpenMobileFilter] = useState<'rarity' | 'mainstat' | null>(null)
  const isMobileFilters = useMobileDatabaseFilters()
  const filterPanelIdPrefix = useId()
  const rarityPanelId = `${filterPanelIdPrefix}-rarity`
  const mainstatPanelId = `${filterPanelIdPrefix}-mainstat`
  const mainstatFilterTabs = wheelMainstatFilterOptions.map((entry) => ({
    id: entry.id,
    iconSrc: entry.iconAsset,
    label: entry.label,
    summaryLabel: entry.label,
  }))

  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search wheels'
        onQueryChange={onQueryChange}
        placeholder='Name, owner, realm, main stat, or effect'
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
                activeId={mainstatFilter}
                controlsId={mainstatPanelId}
                defaultId='ALL'
                label='Main stat'
                onOpenChange={(open) => {
                  setOpenMobileFilter(open ? 'mainstat' : null)
                }}
                open={openMobileFilter === 'mainstat'}
                options={mainstatFilterTabs}
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
            {openMobileFilter === 'mainstat' ? (
              <CatalogMobileFilterPanel
                activeId={mainstatFilter}
                id={mainstatPanelId}
                label='Main stat'
                onChange={onMainstatFilterChange}
                options={mainstatFilterTabs}
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
            activeId={mainstatFilter}
            controlsClassName='flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            label='Main stat'
            onChange={onMainstatFilterChange}
            options={mainstatFilterTabs}
          />
        </div>
      )}
    </div>
  )
}
