import { useCallback, useMemo, useState } from 'react'
import { getAwakeners, type Awakener } from '../../domain/awakeners'
import { searchAwakeners } from '../../domain/awakeners-search'
import type { AwakenerSortKey, CollectionSortDirection } from '../../domain/collection-sorting'

export type RealmFilterId = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type RarityFilterId = 'ALL' | 'Genesis' | 'SSR' | 'SR'
export type TypeFilterId = 'ALL' | 'ASSAULT' | 'WARDEN' | 'CHORUS'

export const DATABASE_SORT_OPTIONS: readonly AwakenerSortKey[] = [
  'ALPHABETICAL',
  'RARITY',
  'ATK',
  'DEF',
  'CON',
]

const allAwakeners = getAwakeners()

const rarityOrder: Record<string, number> = { Genesis: 0, SSR: 1, SR: 2 }

function applyFilters(
  awakeners: Awakener[],
  realmFilter: RealmFilterId,
  rarityFilter: RarityFilterId,
  typeFilter: TypeFilterId,
): Awakener[] {
  let result = awakeners
  if (realmFilter !== 'ALL') {
    result = result.filter((a) => a.realm === realmFilter)
  }
  if (rarityFilter !== 'ALL') {
    result = result.filter((a) => a.rarity === rarityFilter)
  }
  if (typeFilter !== 'ALL') {
    result = result.filter((a) => a.type === typeFilter)
  }
  return result
}

function applySorting(
  awakeners: Awakener[],
  sortKey: AwakenerSortKey,
  sortDirection: CollectionSortDirection,
): Awakener[] {
  const sorted = [...awakeners]
  const dir = sortDirection === 'ASC' ? 1 : -1

  sorted.sort((a, b) => {
    if (sortKey === 'RARITY') {
      const ra = rarityOrder[a.rarity ?? ''] ?? 99
      const rb = rarityOrder[b.rarity ?? ''] ?? 99
      if (ra !== rb) return dir * (ra - rb)
      return a.name.localeCompare(b.name)
    }
    if (sortKey === 'ATK' || sortKey === 'DEF' || sortKey === 'CON') {
      const sa = a.stats?.[sortKey] ?? 0
      const sb = b.stats?.[sortKey] ?? 0
      if (sa !== sb) return dir * (sa - sb)
      return a.name.localeCompare(b.name)
    }
    return dir * a.name.localeCompare(b.name)
  })

  return sorted
}

export function useDatabaseViewModel() {
  const [query, setQueryRaw] = useState('')
  const [realmFilter, setRealmFilter] = useState<RealmFilterId>('ALL')
  const [rarityFilter, setRarityFilter] = useState<RarityFilterId>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilterId>('ALL')
  const [sortKey, setSortKey] = useState<AwakenerSortKey>('ALPHABETICAL')
  const [sortDirection, setSortDirection] = useState<CollectionSortDirection>('ASC')
  const [groupByRealm, setGroupByRealm] = useState(false)
  const [selectedAwakenerId, setSelectedAwakenerId] = useState<number | null>(null)

  const filteredAwakeners = useMemo(() => {
    const searched = searchAwakeners(allAwakeners, query)
    const filtered = applyFilters(searched, realmFilter, rarityFilter, typeFilter)
    const sorted = applySorting(filtered, sortKey, sortDirection)
    if (groupByRealm) {
      const realmOrder: Record<string, number> = { CHAOS: 0, AEQUOR: 1, CARO: 2, ULTRA: 3 }
      sorted.sort((a, b) => {
        const ra = realmOrder[a.realm] ?? 99
        const rb = realmOrder[b.realm] ?? 99
        return ra - rb
      })
    }
    return sorted
  }, [query, realmFilter, rarityFilter, typeFilter, sortKey, sortDirection, groupByRealm])

  const selectedAwakener = useMemo(
    () => (selectedAwakenerId !== null
      ? allAwakeners.find((a) => a.id === selectedAwakenerId) ?? null
      : null),
    [selectedAwakenerId],
  )

  const setQuery = useCallback((next: string) => setQueryRaw(next), [])

  const appendSearchCharacter = useCallback(
    (key: string) => setQueryRaw((prev) => prev + key),
    [],
  )

  const clearQuery = useCallback(() => setQueryRaw(''), [])

  const toggleSortDirection = useCallback(
    () => setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC')),
    [],
  )

  return {
    awakeners: filteredAwakeners,
    totalCount: allAwakeners.length,
    query,
    realmFilter,
    rarityFilter,
    typeFilter,
    sortKey,
    sortDirection,
    groupByRealm,
    selectedAwakener,
    setQuery,
    appendSearchCharacter,
    clearQuery,
    setRealmFilter,
    setRarityFilter,
    setTypeFilter,
    setSortKey,
    toggleSortDirection,
    setGroupByRealm,
    selectAwakener: setSelectedAwakenerId,
    closeDetail: () => setSelectedAwakenerId(null),
  }
}
