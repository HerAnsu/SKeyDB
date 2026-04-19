import {getRealmLabel} from '@/domain/factions'
import {wheelMainstatFilterOptions} from '@/domain/wheel-mainstat-filters'

import type {ActiveFilterChip} from './ActiveFilterChips'
import {getTypeFilterLabel} from './database-browse-state'
import type {useDatabaseBrowseState} from './useDatabaseBrowseState'
import type {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'

type AwakenerBrowseController = ReturnType<typeof useDatabaseBrowseState>
type WheelBrowseController = ReturnType<typeof useWheelsDatabaseBrowseState>

export function buildAwakenerActiveFilterChips(
  state: AwakenerBrowseController,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  const trimmedQuery = state.query.trim()
  if (trimmedQuery.length > 0) {
    chips.push({
      key: 'query',
      label: `Search: "${trimmedQuery}"`,
      onClear: state.clearQuery,
    })
  }

  if (state.realmFilter !== 'ALL') {
    chips.push({
      key: 'realm',
      label: getRealmLabel(state.realmFilter),
      onClear: () => {
        state.setRealmFilter('ALL')
      },
    })
  }

  if (state.rarityFilter !== 'ALL') {
    chips.push({
      key: 'rarity',
      label: state.rarityFilter,
      onClear: () => {
        state.setRarityFilter('ALL')
      },
    })
  }

  if (state.typeFilter !== 'ALL') {
    chips.push({
      key: 'type',
      label: getTypeFilterLabel(state.typeFilter),
      onClear: () => {
        state.setTypeFilter('ALL')
      },
    })
  }

  return chips
}

export function buildWheelActiveFilterChips(state: WheelBrowseController): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []

  const trimmedQuery = state.query.trim()
  if (trimmedQuery.length > 0) {
    chips.push({
      key: 'query',
      label: `Search: "${trimmedQuery}"`,
      onClear: state.clearQuery,
    })
  }

  if (state.realmFilter !== 'ALL') {
    chips.push({
      key: 'realm',
      label: getRealmLabel(state.realmFilter),
      onClear: () => {
        state.setRealmFilter('ALL')
      },
    })
  }

  if (state.rarityFilter !== 'ALL') {
    chips.push({
      key: 'rarity',
      label: state.rarityFilter,
      onClear: () => {
        state.setRarityFilter('ALL')
      },
    })
  }

  if (state.mainstatFilter !== 'ALL') {
    const mainstatLabel =
      wheelMainstatFilterOptions.find((entry) => entry.id === state.mainstatFilter)?.label ??
      state.mainstatFilter
    chips.push({
      key: 'mainstat',
      label: mainstatLabel,
      onClear: () => {
        state.setMainstatFilter('ALL')
      },
    })
  }

  return chips
}
