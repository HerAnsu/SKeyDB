import {
  AWAKENER_NAME_V1_TO_V2,
  COVENANT_ID_V1_TO_V2,
  POSSE_ID_V1_TO_V2,
  WHEEL_ID_V1_TO_V2,
  migrateAwakenerNameV1ToV2,
  migrateCovenantIdV1ToV2,
  migratePosseIdV1ToV2,
  migrateWheelIdV1ToV2,
} from '@/domain/persistence-id-migration.v2'
import {getCovenants} from '@/domain/covenants'
import {getPosses} from '@/domain/posses'
import {
  safeStorageRead,
  safeStorageRemove,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage'
import {getWheels} from '@/domain/wheels'

import type {Team, TeamSlot} from './types'

const BUILDER_PERSISTENCE_VERSION = 2
const LEGACY_BUILDER_PERSISTENCE_VERSION = 1

export const BUILDER_PERSISTENCE_KEY = `skeydb.builder.v${String(BUILDER_PERSISTENCE_VERSION)}`
export const LEGACY_BUILDER_PERSISTENCE_KEY = `skeydb.builder.v${String(
  LEGACY_BUILDER_PERSISTENCE_VERSION,
)}`

export interface BuilderDraftPayload {
  teams: Team[]
  activeTeamId: string
}

interface PersistedBuilderEnvelope<TPayload = BuilderDraftPayload> {
  version: number
  updatedAt: string
  payload: TPayload
}

interface PersistedBuilderSlotV2 {
  slotId: string
  awakenerId?: string
  realm?: TeamSlot['realm']
  level?: number
  isSupport?: boolean
  wheels: [string | null, string | null]
  covenantId?: string
}

interface PersistedBuilderTeamV2 {
  id: string
  name: string
  slots: PersistedBuilderSlotV2[]
  posseId?: string
}

interface PersistedBuilderPayloadV2 {
  teams: PersistedBuilderTeamV2[]
  activeTeamId: string
}

const VALID_REALMS = new Set(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL', 'OTHER'])
const PUBLIC_ID_PATTERNS = {
  awakener: /^awakener-\d{4}$/,
  covenant: /^covenant-\d{4}$/,
  posse: /^posse-\d{4}$/,
  wheel: /^wheel-\d{4}$/,
}

const AWAKENER_ID_V2_TO_NAME = Object.fromEntries(
  Object.entries(AWAKENER_NAME_V1_TO_V2).map(([name, id]) => [id, name]),
) as Record<string, string>
const WHEEL_ID_V2_TO_V1 = reverseIdMap(WHEEL_ID_V1_TO_V2)
const COVENANT_ID_V2_TO_V1 = reverseIdMap(COVENANT_ID_V1_TO_V2)
const POSSE_ID_V2_TO_V1 = reverseIdMap(POSSE_ID_V1_TO_V2)
const CURRENT_WHEEL_IDS = new Set(getWheels().map((wheel) => wheel.id))
const CURRENT_COVENANT_IDS = new Set(getCovenants().map((covenant) => covenant.id))
const CURRENT_POSSE_IDS = new Set(getPosses().map((posse) => posse.id))

function reverseIdMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([legacyId, publicId]) => [publicId, legacyId]))
}

function isPublicId(kind: keyof typeof PUBLIC_ID_PATTERNS, value: string): boolean {
  return PUBLIC_ID_PATTERNS[kind].test(value)
}

function migrateBuilderAwakenerNameToV2(name: string): string | undefined {
  return migrateAwakenerNameV1ToV2(name) ?? migrateAwakenerNameV1ToV2(name.toLowerCase())
}

function migrateBuilderPosseIdToV2(id: string): string | undefined {
  const unprefixedId = id.replace(/^\d+-/, '')
  return migratePosseIdV1ToV2(id) ?? migratePosseIdV1ToV2(unprefixedId)
}

function canonicalizePersistedId(
  id: string,
  kind: keyof typeof PUBLIC_ID_PATTERNS,
  migrate: (id: string) => string | undefined,
  knownPublicIds: Partial<Record<string, string>>,
): string | null {
  if (isPublicId(kind, id)) {
    return id in knownPublicIds ? id : null
  }
  return migrate(id) ?? null
}

function resolveRuntimeId(
  publicId: string,
  currentIds: Set<string>,
  legacyByPublicId: Partial<Record<string, string>>,
): string | undefined {
  if (currentIds.has(publicId)) {
    return publicId
  }
  return legacyByPublicId[publicId]
}

function isRealm(value: unknown): boolean {
  return typeof value === 'string' && VALID_REALMS.has(value)
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isOptionalFiniteInteger(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value))
  )
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean'
}

function hasValidSlotIdentity(record: Record<string, unknown>): boolean {
  return hasNonEmptyString(record.slotId)
}

function hasValidSlotWheels(record: Record<string, unknown>): boolean {
  return (
    Array.isArray(record.wheels) &&
    record.wheels.length === 2 &&
    record.wheels.every((wheelId) => wheelId === null || typeof wheelId === 'string')
  )
}

function hasValidSlotMetadata(record: Record<string, unknown>): boolean {
  if (!isOptionalString(record.awakenerName) || !isOptionalString(record.covenantId)) {
    return false
  }
  if (!isOptionalBoolean(record.isSupport) || !isOptionalFiniteInteger(record.level)) {
    return false
  }
  if (
    (typeof record.awakenerName === 'string' && !record.awakenerName.trim()) ||
    (typeof record.covenantId === 'string' && !record.covenantId.trim())
  ) {
    return false
  }

  return true
}

function resolveSlotRealmCandidate(record: Record<string, unknown>): unknown {
  return record.realm ?? record.faction
}

function hasInvalidEmptySlotData(record: Record<string, unknown>): boolean {
  const hasMetadata =
    record.realm !== undefined ||
    record.faction !== undefined ||
    record.level !== undefined ||
    record.covenantId !== undefined ||
    record.isSupport !== undefined
  const hasWheelData =
    Array.isArray(record.wheels) && record.wheels.some((wheelId) => wheelId !== null)
  return hasMetadata || hasWheelData
}

function isSlot(value: unknown): value is TeamSlot {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    !hasValidSlotIdentity(record) ||
    !hasValidSlotWheels(record) ||
    !hasValidSlotMetadata(record)
  ) {
    return false
  }

  const realmCandidate = resolveSlotRealmCandidate(record)
  if (realmCandidate !== undefined && !isRealm(realmCandidate)) {
    return false
  }

  const hasAwakener = hasNonEmptyString(record.awakenerName)
  if (!hasAwakener) {
    return !hasInvalidEmptySlotData(record)
  }

  return isRealm(realmCandidate)
}

function isTeam(value: unknown): value is Team {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    typeof record.name !== 'string' ||
    !record.name.trim()
  ) {
    return false
  }
  if (record.posseId !== undefined && typeof record.posseId !== 'string') {
    return false
  }

  if (!Array.isArray(record.slots) || record.slots.length !== 4) {
    return false
  }

  if (!record.slots.every(isSlot)) {
    return false
  }

  const slotIds = record.slots.map((slot) => slot.slotId)
  return new Set(slotIds).size === slotIds.length
}

function isBuilderDraftPayload(value: unknown): value is BuilderDraftPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (typeof record.activeTeamId !== 'string') {
    return false
  }

  if (!Array.isArray(record.teams)) {
    return false
  }

  if (record.teams.length === 0) {
    return false
  }

  return record.teams.every(isTeam)
}

function isPersistedSlotV2(value: unknown): value is PersistedBuilderSlotV2 {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (!hasValidSlotIdentity(record) || !hasValidSlotWheels(record)) {
    return false
  }
  if (!isOptionalString(record.awakenerId) || !isOptionalString(record.covenantId)) {
    return false
  }
  if (!isOptionalBoolean(record.isSupport) || !isOptionalFiniteInteger(record.level)) {
    return false
  }
  if (record.realm !== undefined && !isRealm(record.realm)) {
    return false
  }
  if (typeof record.awakenerId === 'string' && !isPublicId('awakener', record.awakenerId)) {
    return false
  }
  if (typeof record.covenantId === 'string' && !isPublicId('covenant', record.covenantId)) {
    return false
  }
  const wheels = record.wheels as unknown[]
  if (wheels.some((wheelId) => typeof wheelId === 'string' && !isPublicId('wheel', wheelId))) {
    return false
  }

  const hasAwakener = hasNonEmptyString(record.awakenerId)
  if (!hasAwakener) {
    return !hasInvalidEmptySlotData(record)
  }

  return isRealm(record.realm)
}

function isPersistedTeamV2(value: unknown): value is PersistedBuilderTeamV2 {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    typeof record.name !== 'string' ||
    !record.name.trim()
  ) {
    return false
  }
  if (record.posseId !== undefined) {
    if (typeof record.posseId !== 'string' || !isPublicId('posse', record.posseId)) {
      return false
    }
  }

  if (!Array.isArray(record.slots) || record.slots.length !== 4) {
    return false
  }
  if (!record.slots.every(isPersistedSlotV2)) {
    return false
  }

  const slotIds = record.slots.map((slot) => slot.slotId)
  return new Set(slotIds).size === slotIds.length
}

function isPersistedBuilderPayloadV2(value: unknown): value is PersistedBuilderPayloadV2 {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  if (typeof record.activeTeamId !== 'string') {
    return false
  }
  if (!Array.isArray(record.teams) || record.teams.length === 0) {
    return false
  }

  return record.teams.every(isPersistedTeamV2)
}

function normalizeDraft(payload: BuilderDraftPayload): BuilderDraftPayload | null {
  if (!payload.teams.some((team) => team.id === payload.activeTeamId)) {
    return null
  }
  return {
    ...payload,
    teams: payload.teams.map((team) => ({
      ...team,
      slots: team.slots.map((slot) => {
        const legacyFaction =
          'faction' in slot && typeof slot.faction === 'string' ? slot.faction : undefined
        const realm = slot.realm ?? legacyFaction
        if (slot.awakenerName) {
          return {
            ...slot,
            realm,
          }
        }
        return {
          slotId: slot.slotId,
          awakenerName: undefined,
          realm: undefined,
          level: undefined,
          isSupport: undefined,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      }),
    })),
  }
}

function serializeSlotV2(slot: TeamSlot): PersistedBuilderSlotV2 | null {
  const awakenerId = slot.awakenerName ? migrateBuilderAwakenerNameToV2(slot.awakenerName) : undefined
  const wheels = slot.wheels.map((wheelId) =>
    wheelId ? canonicalizePersistedId(wheelId, 'wheel', migrateWheelIdV1ToV2, WHEEL_ID_V2_TO_V1) : null,
  ) as [string | null, string | null]
  const covenantId = slot.covenantId
    ? canonicalizePersistedId(
        slot.covenantId,
        'covenant',
        migrateCovenantIdV1ToV2,
        COVENANT_ID_V2_TO_V1,
      )
    : undefined
  if (slot.awakenerName && !awakenerId) {
    return null
  }
  if (slot.wheels.some((wheelId, index) => wheelId && !wheels[index])) {
    return null
  }
  if (slot.covenantId && !covenantId) {
    return null
  }
  const persistedSlot: PersistedBuilderSlotV2 = {
    slotId: slot.slotId,
    awakenerId,
    realm: awakenerId ? slot.realm : undefined,
    level: awakenerId ? slot.level : undefined,
    isSupport: awakenerId ? slot.isSupport : undefined,
    wheels,
  }
  if (covenantId) {
    persistedSlot.covenantId = covenantId
  }
  return persistedSlot
}

function serializeDraftV2(payload: BuilderDraftPayload): PersistedBuilderPayloadV2 | null {
  const normalized = normalizeDraft(payload)
  if (!normalized) {
    return null
  }

  const teams: PersistedBuilderTeamV2[] = []
  for (const team of normalized.teams) {
    const posseId = team.posseId
      ? canonicalizePersistedId(team.posseId, 'posse', migrateBuilderPosseIdToV2, POSSE_ID_V2_TO_V1)
      : undefined
    if (team.posseId && !posseId) {
      return null
    }
    const slots = team.slots.map(serializeSlotV2)
    if (slots.some((slot) => !slot)) {
      return null
    }
    const persistedTeam: PersistedBuilderTeamV2 = {
      id: team.id,
      name: team.name,
      slots: slots as PersistedBuilderSlotV2[],
    }
    if (posseId) {
      persistedTeam.posseId = posseId
    }
    teams.push(persistedTeam)
  }

  return {
    activeTeamId: normalized.activeTeamId,
    teams,
  }
}

function deserializeSlotV2(slot: PersistedBuilderSlotV2): TeamSlot | null {
  if (!slot.awakenerId) {
    return {
      slotId: slot.slotId,
      wheels: [null, null],
    }
  }

  const awakenerName = AWAKENER_ID_V2_TO_NAME[slot.awakenerId]
  if (!awakenerName) {
    return null
  }

  const wheels = slot.wheels.map((wheelId) => {
    if (!wheelId) {
      return null
    }
    return resolveRuntimeId(wheelId, CURRENT_WHEEL_IDS, WHEEL_ID_V2_TO_V1) ?? null
  }) as [string | null, string | null]
  if (slot.wheels.some((wheelId, index) => wheelId && !wheels[index])) {
    return null
  }
  const covenantId = slot.covenantId
    ? resolveRuntimeId(slot.covenantId, CURRENT_COVENANT_IDS, COVENANT_ID_V2_TO_V1)
    : undefined
  if (slot.covenantId && !covenantId) {
    return null
  }

  const runtimeSlot: TeamSlot = {
    slotId: slot.slotId,
    awakenerName,
    realm: slot.realm,
    level: slot.level,
    wheels,
  }
  if (slot.isSupport !== undefined) {
    runtimeSlot.isSupport = slot.isSupport
  }
  if (covenantId) {
    runtimeSlot.covenantId = covenantId
  }
  return runtimeSlot
}

function deserializeDraftV2(payload: PersistedBuilderPayloadV2): BuilderDraftPayload | null {
  if (!payload.teams.some((team) => team.id === payload.activeTeamId)) {
    return null
  }

  const teams: Team[] = []
  for (const team of payload.teams) {
    const slots: TeamSlot[] = []
    for (const slot of team.slots) {
      const runtimeSlot = deserializeSlotV2(slot)
      if (!runtimeSlot) {
        return null
      }
      slots.push(runtimeSlot)
    }

    const posseId = team.posseId
      ? resolveRuntimeId(team.posseId, CURRENT_POSSE_IDS, POSSE_ID_V2_TO_V1)
      : undefined
    if (team.posseId && !posseId) {
      return null
    }
    teams.push({...team, posseId, slots})
  }

  return {teams, activeTeamId: payload.activeTeamId}
}

export function loadBuilderDraft(storage: StorageLike | null): BuilderDraftPayload | null {
  const raw = safeStorageRead(storage, BUILDER_PERSISTENCE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PersistedBuilderEnvelope<PersistedBuilderPayloadV2>
      if (parsed.version !== BUILDER_PERSISTENCE_VERSION) {
        return null
      }
      if (!isPersistedBuilderPayloadV2(parsed.payload)) {
        return null
      }
      return deserializeDraftV2(parsed.payload)
    } catch {
      return null
    }
  }

  const legacyRaw = safeStorageRead(storage, LEGACY_BUILDER_PERSISTENCE_KEY)
  if (!legacyRaw) {
    return null
  }

  try {
    const parsed = JSON.parse(legacyRaw) as PersistedBuilderEnvelope
    if (parsed.version !== LEGACY_BUILDER_PERSISTENCE_VERSION) {
      return null
    }
    if (!isBuilderDraftPayload(parsed.payload)) {
      return null
    }
    const migrated = normalizeDraft(parsed.payload)
    if (!migrated) {
      return null
    }
    if (!saveBuilderDraft(storage, migrated)) {
      return null
    }
    const serialized = serializeDraftV2(migrated)
    return serialized ? deserializeDraftV2(serialized) : null
  } catch {
    return null
  }
}

export function saveBuilderDraft(
  storage: StorageLike | null,
  payload: BuilderDraftPayload,
): boolean {
  const serialized = serializeDraftV2(payload)
  if (!serialized) {
    return false
  }

  const envelope: PersistedBuilderEnvelope<PersistedBuilderPayloadV2> = {
    version: BUILDER_PERSISTENCE_VERSION,
    updatedAt: new Date().toISOString(),
    payload: serialized,
  }

  return safeStorageWrite(storage, BUILDER_PERSISTENCE_KEY, JSON.stringify(envelope))
}

export function clearBuilderDraft(storage: StorageLike | null): boolean {
  const currentRemoved = safeStorageRemove(storage, BUILDER_PERSISTENCE_KEY)
  const legacyRemoved = safeStorageRemove(storage, LEGACY_BUILDER_PERSISTENCE_KEY)
  return currentRemoved && legacyRemoved
}
