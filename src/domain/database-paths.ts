import type {Awakener} from './awakeners'

export const DATABASE_AWAKENER_TABS = ['overview', 'cards', 'builds', 'teams'] as const

export type DatabaseAwakenerTab = (typeof DATABASE_AWAKENER_TABS)[number]

const DATABASE_AWAKENER_TAB_SET = new Set<string>(DATABASE_AWAKENER_TABS)

function trimEdgeDashes(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') {
    start += 1
  }
  while (end > start && value[end - 1] === '-') {
    end -= 1
  }
  return value.slice(start, end)
}

export function toDatabaseAwakenerSlug(name: string): string {
  return trimEdgeDashes(
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
  )
}

export function resolveDatabaseAwakenerTab(tab: string | undefined): DatabaseAwakenerTab | null {
  if (!tab) {
    return null
  }
  const normalizedTab = tab.trim().toLowerCase()
  return isDatabaseAwakenerTab(normalizedTab) ? normalizedTab : null
}

function isDatabaseAwakenerTab(tab: string): tab is DatabaseAwakenerTab {
  return DATABASE_AWAKENER_TAB_SET.has(tab)
}

export function buildDatabaseAwakenerPath(
  awakener: Pick<Awakener, 'name'>,
  tab: DatabaseAwakenerTab = 'overview',
): string {
  const slug = toDatabaseAwakenerSlug(awakener.name)
  if (tab === 'overview') {
    return `/database/awk/${slug}`
  }
  return `/database/awk/${slug}/${tab}`
}

export function findAwakenerByDatabaseSlug(
  awakeners: Awakener[],
  slug: string | undefined,
): Awakener | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  return (
    awakeners.find((awakener) => toDatabaseAwakenerSlug(awakener.name) === normalizedSlug) ?? null
  )
}
