import aequorIcon from '@/assets/factions/aequor.webp'
import caroIcon from '@/assets/factions/caro.webp'
import chaosIcon from '@/assets/factions/chaos.webp'
import ultraIcon from '@/assets/factions/ultra.webp'
import aequorBadge from '@/assets/ui/realm-badge-aequor.webp'
import caroBadge from '@/assets/ui/realm-badge-caro.webp'
import chaosBadge from '@/assets/ui/realm-badge-chaos.webp'
import ultraBadge from '@/assets/ui/realm-badge-ultra.webp'

export const DEFAULT_REALM_ACCENT = '#7a8da8'

export const REALM_LABEL_BY_ID = {
  AEQUOR: 'Aequor',
  CARO: 'Caro',
  CHAOS: 'Chaos',
  ULTRA: 'Ultra',
  FADED_LEGACY: 'Faded Legacy',
  NEUTRAL: 'Neutral',
  OTHER: 'Other',
} as const

export const REALM_ACCENT_BY_ID: Record<string, string> = {
  AEQUOR: '#6aabec',
  CARO: '#e46161',
  CHAOS: '#e3c96e',
  ULTRA: '#aa89dd',
  NEUTRAL: '#d9ddd3',
}

export const REALM_ICON_BY_ID: Record<string, string> = {
  AEQUOR: aequorIcon,
  CARO: caroIcon,
  CHAOS: chaosIcon,
  ULTRA: ultraIcon,
}

export const REALM_BADGE_BY_ID: Record<string, string> = {
  AEQUOR: aequorBadge,
  CARO: caroBadge,
  CHAOS: chaosBadge,
  ULTRA: ultraBadge,
}

export const REALM_ACCENT_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REALM_ACCENT_BY_ID).map(([id, accent]) => [
    REALM_LABEL_BY_ID[id as keyof typeof REALM_LABEL_BY_ID],
    accent,
  ]),
)

export function normalizeRealmId(realm: string): string {
  return realm.trim().toUpperCase()
}

export function getRealmAccent(realmId: string | undefined): string {
  if (!realmId) {
    return DEFAULT_REALM_ACCENT
  }
  return REALM_ACCENT_BY_ID[normalizeRealmId(realmId)] ?? DEFAULT_REALM_ACCENT
}

export function getRealmLabel(realmId: string): string {
  const normalizedRealmId = normalizeRealmId(realmId)
  if (normalizedRealmId in REALM_LABEL_BY_ID) {
    return REALM_LABEL_BY_ID[normalizedRealmId as keyof typeof REALM_LABEL_BY_ID]
  }
  return realmId
}

export function getRealmIcon(realmId: string | undefined): string | undefined {
  if (!realmId) {
    return undefined
  }
  return REALM_ICON_BY_ID[normalizeRealmId(realmId)]
}

export function getRealmBadge(realmId: string | undefined): string | undefined {
  if (!realmId) {
    return undefined
  }
  return REALM_BADGE_BY_ID[normalizeRealmId(realmId)]
}
