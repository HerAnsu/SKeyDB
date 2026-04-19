import type {RefObject} from 'react'

import type {Wheel} from '@/domain/wheels'

import type {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'
import {WheelDatabaseFilters} from './WheelDatabaseFilters'
import {WheelGrid} from './WheelGrid'

type WheelsDatabaseBrowseController = ReturnType<typeof useWheelsDatabaseBrowseState>

interface WheelsDatabaseSectionProps {
  browseState: WheelsDatabaseBrowseController
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  totalCount: number
  wheels: Wheel[]
  onSelectWheel: (wheelId: string) => void
}

export function WheelsDatabaseSection({
  browseState,
  filteredCount,
  onSelectWheel,
  searchInputRef,
  totalCount,
  wheels,
}: WheelsDatabaseSectionProps) {
  return (
    <>
      <WheelDatabaseFilters
        filteredCount={filteredCount}
        mainstatFilter={browseState.mainstatFilter}
        onMainstatFilterChange={browseState.setMainstatFilter}
        onQueryChange={browseState.setQuery}
        onRarityFilterChange={browseState.setRarityFilter}
        onRealmFilterChange={browseState.setRealmFilter}
        onSortDirectionToggle={browseState.toggleSortDirection}
        onSortKeyChange={browseState.setSortKey}
        query={browseState.query}
        rarityFilter={browseState.rarityFilter}
        realmFilter={browseState.realmFilter}
        searchInputRef={searchInputRef}
        sortDirection={browseState.sortDirection}
        sortKey={browseState.sortKey}
        totalCount={totalCount}
      />
      <WheelGrid onSelectWheel={onSelectWheel} wheels={wheels} />
    </>
  )
}
