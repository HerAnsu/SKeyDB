import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

import {DATABASE_SORT_OPTIONS} from './database-browse-state'
import {CatalogFilterChipButton} from './DatabaseChipPrimitives'
import {DatabaseSortControls} from './DatabaseSortControls'

function getDatabaseSortLabel(sortKey: DatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'ATK' || sortKey === 'DEF' || sortKey === 'CON') {
    return sortKey
  }
  return 'Alphabetical'
}

function getDatabaseSortDirectionLabel(
  sortKey: DatabaseSortKey,
  direction: CollectionSortDirection,
): string {
  if (sortKey === 'ALPHABETICAL') {
    return direction === 'ASC' ? 'A → Z' : 'Z → A'
  }
  return direction === 'ASC' ? 'Low → High' : 'High → Low'
}

interface DatabaseViewControlsProps {
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
  onSortKeyChange: (key: DatabaseSortKey) => void
  onSortDirectionToggle: () => void
  onGroupByRealmChange: (next: boolean) => void
}

export function DatabaseViewControls({
  groupByRealm,
  onGroupByRealmChange,
  onSortDirectionToggle,
  onSortKeyChange,
  sortDirection,
  sortKey,
}: DatabaseViewControlsProps) {
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
      <DatabaseSortControls
        getSortDirectionLabel={getDatabaseSortDirectionLabel}
        getSortLabel={getDatabaseSortLabel}
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        sortDirection={sortDirection}
        sortDirectionAriaLabel='Toggle database sort direction'
        sortKey={sortKey}
        sortOptions={DATABASE_SORT_OPTIONS}
        sortSelectAriaLabel='Database sort key'
      />
      <CatalogFilterChipButton
        active={groupByRealm}
        onClick={() => {
          onGroupByRealmChange(!groupByRealm)
        }}
      >
        Group by realm
      </CatalogFilterChipButton>
    </div>
  )
}
