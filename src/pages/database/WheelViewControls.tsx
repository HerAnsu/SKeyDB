import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'

import {DatabaseSortControls} from './DatabaseSortControls'

interface WheelViewControlsProps {
  sortKey: WheelsDatabaseSortKey
  sortDirection: CollectionSortDirection
  onSortKeyChange: (key: WheelsDatabaseSortKey) => void
  onSortDirectionToggle: () => void
}

function getWheelSortLabel(sortKey: WheelsDatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'MAINSTAT') {
    return 'Main stat'
  }
  return 'Alphabetical'
}

function getWheelSortDirectionLabel(
  sortKey: WheelsDatabaseSortKey,
  direction: CollectionSortDirection,
): string {
  if (sortKey === 'RARITY') {
    return direction === 'ASC' ? 'Low → High' : 'High → Low'
  }
  return direction === 'ASC' ? 'A → Z' : 'Z → A'
}

export function WheelViewControls({
  onSortDirectionToggle,
  onSortKeyChange,
  sortDirection,
  sortKey,
}: WheelViewControlsProps) {
  return (
    <DatabaseSortControls
      getSortDirectionLabel={getWheelSortDirectionLabel}
      getSortLabel={getWheelSortLabel}
      onSortDirectionToggle={onSortDirectionToggle}
      onSortKeyChange={onSortKeyChange}
      sortDirection={sortDirection}
      sortDirectionAriaLabel='Toggle wheel sort direction'
      sortKey={sortKey}
      sortOptions={WHEELS_DATABASE_SORT_OPTIONS}
      sortSelectAriaLabel='Wheel database sort key'
    />
  )
}
