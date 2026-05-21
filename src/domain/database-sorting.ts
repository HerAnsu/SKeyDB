import {resolveAwakenerLiteStatsForLevel, type Awakener} from './awakeners'
import type {AwakenerSortKey, CollectionSortDirection} from './collection-sorting'

export type DatabaseSortKey =
  | Extract<AwakenerSortKey, 'ALPHABETICAL' | 'RARITY' | 'RELEASE_DATE' | 'ATK' | 'DEF' | 'CON'>
  | 'BEST_MATCH'

export interface DatabaseSortConfig {
  key: DatabaseSortKey
  direction: CollectionSortDirection
  groupByRealm: boolean
}

const REALM_PRIORITY_BY_ID: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
}

const RARITY_PRIORITY_BY_ID = new Map<string, number>([
  ['GENESIS', 0],
  ['SSR_LIMITED', 1],
  ['SSR_PERMANENT', 2],
  ['SSR_WELFARE', 2],
  ['SSR', 2],
  ['SR_WELFARE', 3],
  ['SR', 3],
])
const DATABASE_SORT_AWAKENER_STAT_LEVEL = 60

function compareNumber(left: number, right: number, direction: CollectionSortDirection): number {
  if (left === right) {
    return 0
  }
  return direction === 'ASC' ? left - right : right - left
}

function compareText(left: string, right: string, direction: CollectionSortDirection): number {
  const result = left.localeCompare(right)
  return direction === 'ASC' ? result : -result
}

function compareRealm(left: Awakener, right: Awakener): number {
  const leftRank = REALM_PRIORITY_BY_ID[left.realm] ?? Number.MAX_SAFE_INTEGER
  const rightRank = REALM_PRIORITY_BY_ID[right.realm] ?? Number.MAX_SAFE_INTEGER
  return leftRank - rightRank
}

function compareRarity(
  left: Awakener,
  right: Awakener,
  direction: CollectionSortDirection,
): number {
  const leftRank = getRaritySourceSortRank(left)
  const rightRank = getRaritySourceSortRank(right)
  return direction === 'DESC' ? leftRank - rightRank : rightRank - leftRank
}

function getAvailabilitySourceSortId(value: string | undefined): string | null {
  const normalized = value?.trim().toUpperCase()
  if (!normalized) {
    return null
  }
  if (normalized === 'PERMANENT') {
    return 'PERMANENT'
  }
  if (normalized === 'WELFARE') {
    return 'WELFARE'
  }
  if (normalized.startsWith('LIMITED')) {
    return 'LIMITED'
  }
  return normalized
}

function getRaritySourceSortRank(awakener: Awakener): number {
  const rarity = awakener.rarity?.trim().toUpperCase()
  if (!rarity) {
    return Number.MAX_SAFE_INTEGER
  }
  if (rarity === 'GENESIS') {
    return RARITY_PRIORITY_BY_ID.get('GENESIS') ?? Number.MAX_SAFE_INTEGER
  }
  const source = getAvailabilitySourceSortId(awakener.availabilityType)
  const raritySourceRank = source ? RARITY_PRIORITY_BY_ID.get(`${rarity}_${source}`) : undefined
  return raritySourceRank ?? RARITY_PRIORITY_BY_ID.get(rarity) ?? Number.MAX_SAFE_INTEGER
}

function compareStat(
  left: Awakener,
  right: Awakener,
  statKey: 'ATK' | 'DEF' | 'CON',
  direction: CollectionSortDirection,
): number {
  const leftStats = resolveAwakenerLiteStatsForLevel(left, DATABASE_SORT_AWAKENER_STAT_LEVEL)
  const rightStats = resolveAwakenerLiteStatsForLevel(right, DATABASE_SORT_AWAKENER_STAT_LEVEL)
  return compareNumber(leftStats?.[statKey] ?? 0, rightStats?.[statKey] ?? 0, direction)
}

function compareReleaseDate(
  left: Awakener,
  right: Awakener,
  direction: CollectionSortDirection,
): number {
  return compareText(left.releaseDate ?? '', right.releaseDate ?? '', direction)
}

function compareByPriority(
  left: Awakener,
  right: Awakener,
  comparators: ((left: Awakener, right: Awakener) => number)[],
): number {
  for (const comparator of comparators) {
    const result = comparator(left, right)
    if (result !== 0) {
      return result
    }
  }
  return 0
}

export function compareAwakenersForDatabaseSort(
  left: Awakener,
  right: Awakener,
  config: DatabaseSortConfig,
): number {
  const comparators: ((left: Awakener, right: Awakener) => number)[] = []

  if (config.groupByRealm) {
    comparators.push(compareRealm)
  }

  if (config.key === 'BEST_MATCH') {
    comparators.push((innerLeft, innerRight) => compareText(innerLeft.name, innerRight.name, 'ASC'))
  } else if (config.key === 'RARITY') {
    comparators.push((innerLeft, innerRight) =>
      compareRarity(innerLeft, innerRight, config.direction),
    )
  } else if (config.key === 'RELEASE_DATE') {
    comparators.push((innerLeft, innerRight) =>
      compareReleaseDate(innerLeft, innerRight, config.direction),
    )
  } else if (config.key === 'ATK' || config.key === 'DEF' || config.key === 'CON') {
    const statKey = config.key
    comparators.push((innerLeft, innerRight) =>
      compareStat(innerLeft, innerRight, statKey, config.direction),
    )
  } else {
    comparators.push((innerLeft, innerRight) =>
      compareText(innerLeft.name, innerRight.name, config.direction),
    )
  }

  comparators.push((innerLeft, innerRight) => compareText(innerLeft.name, innerRight.name, 'ASC'))
  comparators.push((innerLeft, innerRight) => innerLeft.id.localeCompare(innerRight.id))

  return compareByPriority(left, right, comparators)
}
