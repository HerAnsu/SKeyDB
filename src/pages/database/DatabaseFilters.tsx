import {useId, type CSSProperties, type ReactNode, type RefObject} from 'react'

import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {TogglePill} from '@/components/ui/TogglePill'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'

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

function chipClass(active: boolean): string {
  return `inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors ${
    active
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

interface FilterRowProps {
  label: string
  children: ReactNode
}

function FilterRow({label, children}: FilterRowProps) {
  return (
    <div className='flex items-center gap-3'>
      <span className='w-14 shrink-0 text-[10px] tracking-wide text-slate-500 uppercase'>
        {label}
      </span>
      <div className='flex flex-wrap items-center gap-1.5'>{children}</div>
    </div>
  )
}

interface FilterChipButtonProps {
  active: boolean
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
}

function FilterChipButton({active, children, onClick, style}: FilterChipButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={`${chipClass(active)} focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}

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
  const searchInputId = useId()

  return (
    <div className='space-y-2 border-b border-slate-600/40 pb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <label className='sr-only' htmlFor={searchInputId}>
          Search awakeners
        </label>
        <input
          className='max-w-md min-w-0 flex-1 border border-slate-800/95 bg-slate-950/90 px-3 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
          id={searchInputId}
          name='database-search'
          onChange={(event) => {
            onQueryChange(event.target.value)
          }}
          autoComplete='off'
          placeholder='Search awakeners... (name, tags, realm, etc.)'
          ref={searchInputRef}
          type='search'
          value={query}
        />
        <span className='text-[10px] text-slate-400'>
          {filteredCount}/{totalCount}
        </span>
      </div>

      <FilterRow label='Realm'>
        <FilterChipButton
          active={realmFilter === 'ALL'}
          onClick={() => {
            onRealmFilterChange('ALL')
          }}
        >
          All
        </FilterChipButton>
        {REALM_FILTERS.map((realm) => {
          const active = realmFilter === realm
          const tint = getRealmTint(realm)
          const icon = getRealmIcon(realm)
          return (
            <FilterChipButton
              active={active}
              key={realm}
              onClick={() => {
                onRealmFilterChange(realm)
              }}
              style={active ? {borderColor: `${tint}88`, color: tint} : undefined}
            >
              {icon ? <img alt='' className='h-3.5 w-3.5' draggable={false} src={icon} /> : null}
              {getRealmLabel(realm)}
            </FilterChipButton>
          )
        })}
      </FilterRow>

      <FilterRow label='Rarity'>
        {rarityFilterTabs.map((entry) => (
          <FilterChipButton
            active={rarityFilter === entry.id}
            key={entry.id}
            onClick={() => {
              onRarityFilterChange(entry.id)
            }}
          >
            {entry.label}
          </FilterChipButton>
        ))}
      </FilterRow>

      <FilterRow label='Type'>
        {typeFilterTabs.map((entry) => (
          <FilterChipButton
            active={typeFilter === entry.id}
            key={entry.id}
            onClick={() => {
              onTypeFilterChange(entry.id)
            }}
          >
            {entry.label}
          </FilterChipButton>
        ))}
      </FilterRow>

      <FilterRow label='Sort'>
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
      </FilterRow>
    </div>
  )
}
