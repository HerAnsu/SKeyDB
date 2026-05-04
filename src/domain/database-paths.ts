import type {Awakener} from './awakeners'
import type {Covenant} from './covenants'
import {
  buildDatabaseEntityBrowsePath,
  buildDatabaseEntityDetailPath,
  toDatabaseEntitySlug,
} from './database-entity-paths'
import type {Posse} from './posses'
import type {Wheel} from './wheels'

export const DATABASE_AWAKENER_TABS = ['overview', 'upgrades', 'skills', 'builds', 'teams'] as const

export type DatabaseAwakenerTab = (typeof DATABASE_AWAKENER_TABS)[number]

const DATABASE_AWAKENER_TAB_SET = new Set<string>(DATABASE_AWAKENER_TABS)

export function toDatabaseAwakenerSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabaseWheelSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabasePosseSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabaseCovenantSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function resolveDatabaseAwakenerTab(tab: string | undefined): DatabaseAwakenerTab | null {
  if (!tab) {
    return null
  }
  const normalizedTab = tab.trim().toLowerCase()
  if (normalizedTab === 'cards') {
    return 'skills'
  }
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
    return buildDatabaseEntityDetailPath('awakeners', slug)
  }
  return `${buildDatabaseEntityDetailPath('awakeners', slug)}/${tab}`
}

export function buildDatabaseWheelBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('wheels')
}

export function buildDatabasePosseBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('posses')
}

export function buildDatabaseCovenantBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('covenants')
}

export function buildDatabaseWheelPath(wheel: Pick<Wheel, 'name'>): string {
  return buildDatabaseEntityDetailPath('wheels', toDatabaseWheelSlug(wheel.name))
}

export function buildDatabasePossePath(posse: Pick<Posse, 'name'>): string {
  return buildDatabaseEntityDetailPath('posses', toDatabasePosseSlug(posse.name))
}

export function buildDatabaseCovenantPath(covenant: Pick<Covenant, 'name'>): string {
  return buildDatabaseEntityDetailPath('covenants', toDatabaseCovenantSlug(covenant.name))
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

export function findWheelByDatabaseSlug(wheels: Wheel[], slug: string | undefined): Wheel | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  return wheels.find((wheel) => toDatabaseWheelSlug(wheel.name) === normalizedSlug) ?? null
}

export function findPosseByDatabaseSlug(posses: Posse[], slug: string | undefined): Posse | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  return posses.find((posse) => toDatabasePosseSlug(posse.name) === normalizedSlug) ?? null
}

export function findCovenantByDatabaseSlug(
  covenants: Covenant[],
  slug: string | undefined,
): Covenant | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  return (
    covenants.find((covenant) => toDatabaseCovenantSlug(covenant.name) === normalizedSlug) ?? null
  )
}
