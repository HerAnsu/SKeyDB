import {create} from 'zustand'

import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'

export type RealmFilterId = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type RarityFilterId = 'ALL' | 'Genesis' | 'SSR' | 'SR'
export type TypeFilterId = 'ALL' | 'ASSAULT' | 'WARDEN' | 'CHORUS'

export const DATABASE_SORT_OPTIONS: readonly DatabaseSortKey[] = [
  'ALPHABETICAL',
  'RARITY',
  'ATK',
  'DEF',
  'CON',
]

type DatabaseStoreState = Readonly<{
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
}>

type DatabaseStoreActions = Readonly<{
  setQuery: (next: string) => void
  appendSearchCharacter: (key: string) => void
  clearQuery: () => void
  setRealmFilter: (filter: RealmFilterId) => void
  setRarityFilter: (filter: RarityFilterId) => void
  setTypeFilter: (filter: TypeFilterId) => void
  setSortKey: (key: DatabaseSortKey) => void
  toggleSortDirection: () => void
  setGroupByRealm: (next: boolean) => void
  reset: () => void
}>

export type DatabaseStore = DatabaseStoreState & DatabaseStoreActions

const INITIAL_DATABASE_STORE_STATE: DatabaseStoreState = {
  query: '',
  realmFilter: 'ALL',
  rarityFilter: 'ALL',
  typeFilter: 'ALL',
  sortKey: 'ALPHABETICAL',
  sortDirection: 'ASC',
  groupByRealm: false,
}

function createDatabaseStoreActions(
  set: (
    partial: Partial<DatabaseStore> | ((state: DatabaseStore) => Partial<DatabaseStore>),
  ) => void,
): DatabaseStoreActions {
  return {
    setQuery: (next) => {
      set({query: next})
    },
    appendSearchCharacter: (key) => {
      set((state) => ({query: state.query + key}))
    },
    clearQuery: () => {
      set({query: ''})
    },
    setRealmFilter: (filter) => {
      set({realmFilter: filter})
    },
    setRarityFilter: (filter) => {
      set({rarityFilter: filter})
    },
    setTypeFilter: (filter) => {
      set({typeFilter: filter})
    },
    setSortKey: (key) => {
      set({sortKey: key})
    },
    toggleSortDirection: () => {
      set((state) => ({sortDirection: state.sortDirection === 'ASC' ? 'DESC' : 'ASC'}))
    },
    setGroupByRealm: (next) => {
      set({groupByRealm: next})
    },
    reset: () => {
      set(INITIAL_DATABASE_STORE_STATE)
    },
  }
}

export const useDatabaseStore = create<DatabaseStore>()((set) => ({
  ...INITIAL_DATABASE_STORE_STATE,
  ...createDatabaseStoreActions(set),
}))

export function resetDatabaseStore(): void {
  useDatabaseStore.getState().reset()
}
