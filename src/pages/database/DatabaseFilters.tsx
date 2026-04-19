import type {RefObject} from 'react'

import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {TogglePill} from '@/components/ui/TogglePill'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'

import {CatalogFilterChipButton, CatalogFilterRow, CatalogFiltersShell} from './CatalogFiltersShell'
import {
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_SORT_OPTIONS,
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
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
  onSortKeyChange: (key: DatabaseSortKey) => void
  onSortDirectionToggle: () => void
  onGroupByRealmChange: (next: boolean) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs: {id: RarityFilterId; label: string}[] = DATABASE_RARITY_FILTER_IDS.map(
  (id) => ({
    id,
    label: id === 'ALL' ? 'All' : id,
  }),
)

const typeFilterTabs: {id: TypeFilterId; label: string}[] = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label:
    id === 'ALL' ? 'All' : id === 'ASSAULT' ? 'Assault' : id === 'WARDEN' ? 'Warden' : 'Chorus',
}))

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  sortKey,
  sortDirection,
  groupByRealm,
  totalCount,
  filteredCount,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
  onSortKeyChange,
  onSortDirectionToggle,
  onGroupByRealmChange,
}: DatabaseFiltersProps) {
  return (
    <CatalogFiltersShell
      filteredCount={filteredCount}
      onQueryChange={onQueryChange}
      query={query}
      searchInputRef={searchInputRef}
      searchLabel='Search awakeners'
      searchPlaceholder='Search awakeners... (name, tags, realm, etc.)'
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
              {icon ? <img alt='' className='h-3.5 w-3.5' draggable={false} src={icon} /> : null}
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

      <CatalogFilterRow label='Type'>
        {typeFilterTabs.map((entry) => (
          <CatalogFilterChipButton
            active={typeFilter === entry.id}
            key={entry.id}
            onClick={() => {
              onTypeFilterChange(entry.id)
            }}
          >
            {entry.label}
          </CatalogFilterChipButton>
        ))}
      </CatalogFilterRow>

      <CatalogFilterRow label='Sort'>
        <CollectionSortControls
          groupByRealm={groupByRealm}
          layout='compact'
          onGroupByRealmChange={onGroupByRealmChange}
          onSortDirectionToggle={onSortDirectionToggle}
          onSortKeyChange={onSortKeyChange}
          showGroupByRealm={false}
          sortDirection={sortDirection}
          sortKey={sortKey}
          sortOptions={DATABASE_SORT_OPTIONS}
          sortDirectionAriaLabel='Toggle database sort direction'
          sortSelectAriaLabel='Database sort key'
        />
        <span className='mx-0.5 h-4 w-px bg-slate-600/40' />
        <span className='text-[10px] tracking-wide text-slate-500 uppercase'>Group By Realm</span>
        <TogglePill
          ariaLabel='Toggle grouping awakeners by realm'
          checked={groupByRealm}
          className='ownership-pill-builder'
          offLabel='Off'
          onChange={onGroupByRealmChange}
          onLabel='On'
          variant='flat'
        />
      </CatalogFilterRow>
    </CatalogFiltersShell>
  )
}
