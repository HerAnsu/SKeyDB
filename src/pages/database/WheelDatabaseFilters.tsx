import type {RefObject} from 'react'

import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'
import {wheelMainstatFilterOptions, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {
  WHEELS_DATABASE_RARITY_FILTER_IDS,
  WHEELS_DATABASE_REALM_FILTER_IDS,
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseRarityFilterId,
  type WheelsDatabaseRealmFilterId,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'

import {CatalogFilterChipButton, CatalogFilterRow, CatalogFiltersShell} from './CatalogFiltersShell'

interface WheelDatabaseFiltersProps {
  query: string
  realmFilter: WheelsDatabaseRealmFilterId
  rarityFilter: WheelsDatabaseRarityFilterId
  mainstatFilter: WheelMainstatFilter
  sortKey: WheelsDatabaseSortKey
  sortDirection: CollectionSortDirection
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: WheelsDatabaseRealmFilterId) => void
  onRarityFilterChange: (filter: WheelsDatabaseRarityFilterId) => void
  onMainstatFilterChange: (filter: WheelMainstatFilter) => void
  onSortKeyChange: (key: WheelsDatabaseSortKey) => void
  onSortDirectionToggle: () => void
}

const REALM_FILTERS = WHEELS_DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs: {id: WheelsDatabaseRarityFilterId; label: string}[] =
  WHEELS_DATABASE_RARITY_FILTER_IDS.map((id) => ({
    id,
    label: id === 'ALL' ? 'All' : id,
  }))

function getWheelSortLabel(sortKey: WheelsDatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'MAINSTAT') {
    return 'Mainstat'
  }
  return 'Alphabetical'
}

function ignoreGroupByRealmChange(_nextGroupByRealm: boolean) {
  return undefined
}

export function WheelDatabaseFilters({
  filteredCount,
  mainstatFilter,
  onMainstatFilterChange,
  onQueryChange,
  onRarityFilterChange,
  onRealmFilterChange,
  onSortDirectionToggle,
  onSortKeyChange,
  query,
  rarityFilter,
  realmFilter,
  searchInputRef,
  sortDirection,
  sortKey,
  totalCount,
}: WheelDatabaseFiltersProps) {
  return (
    <CatalogFiltersShell
      filteredCount={filteredCount}
      onQueryChange={onQueryChange}
      query={query}
      searchInputRef={searchInputRef}
      searchLabel='Search wheels'
      searchPlaceholder='Search wheels... (name, owner, realm, mainstat, effects)'
      totalCount={totalCount}
    >
      <CatalogFilterRow label='Realm'>
        <CatalogFilterChipButton
          active={realmFilter === 'ALL'}
          onClick={() => {
            onRealmFilterChange('ALL')
          }}
        >
          All
        </CatalogFilterChipButton>
        {REALM_FILTERS.map((realm) => {
          const active = realmFilter === realm
          const tint = getRealmTint(realm)
          const icon = getRealmIcon(realm)
          return (
            <CatalogFilterChipButton
              active={active}
              key={realm}
              onClick={() => {
                onRealmFilterChange(realm)
              }}
              style={active ? {borderColor: `${tint}88`, color: tint} : undefined}
            >
              {icon ? (
                <img alt='' className='h-3.5 w-3.5 object-contain' draggable={false} src={icon} />
              ) : null}
              {getRealmLabel(realm)}
            </CatalogFilterChipButton>
          )
        })}
      </CatalogFilterRow>

      <CatalogFilterRow label='Rarity'>
        {rarityFilterTabs.map((entry) => (
          <CatalogFilterChipButton
            active={rarityFilter === entry.id}
            key={entry.id}
            onClick={() => {
              onRarityFilterChange(entry.id)
            }}
          >
            {entry.label}
          </CatalogFilterChipButton>
        ))}
      </CatalogFilterRow>

      <CatalogFilterRow
        controlsClassName='grid min-w-0 flex-1 max-w-[calc(5*10rem+4*0.375rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-1.5'
        label='Mainstat'
      >
        {wheelMainstatFilterOptions.map((entry) => (
          <CatalogFilterChipButton
            active={mainstatFilter === entry.id}
            key={entry.id}
            onClick={() => {
              onMainstatFilterChange(entry.id)
            }}
          >
            {entry.iconAsset ? (
              <img
                alt=''
                className='h-3.5 w-3.5 object-contain'
                draggable={false}
                src={entry.iconAsset}
              />
            ) : null}
            {entry.label}
          </CatalogFilterChipButton>
        ))}
      </CatalogFilterRow>

      <CatalogFilterRow label='Sort'>
        <CollectionSortControls
          getSortLabel={getWheelSortLabel}
          groupByRealm={false}
          layout='compact'
          onGroupByRealmChange={ignoreGroupByRealmChange}
          onSortDirectionToggle={onSortDirectionToggle}
          onSortKeyChange={onSortKeyChange}
          showGroupByRealm={false}
          sortDirection={sortDirection}
          sortKey={sortKey}
          sortOptions={WHEELS_DATABASE_SORT_OPTIONS}
          sortDirectionAriaLabel='Toggle wheel sort direction'
          sortSelectAriaLabel='Wheel database sort key'
        />
      </CatalogFilterRow>
    </CatalogFiltersShell>
  )
}
