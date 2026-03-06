import {
  safeStorageRead,
  safeStorageRemove,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage';
import type {Team, TeamSlot} from '@/pages/builder/types';

const BUILDER_PERSISTENCE_VERSION = 1;

export const BUILDER_PERSISTENCE_KEY = `skeydb.builder.v${String(BUILDER_PERSISTENCE_VERSION)}`;

export interface BuilderDraftPayload {
  readonly teams: readonly Team[];
  readonly activeTeamId: string;
}

interface PersistedBuilderEnvelope {
  readonly version: number;
  readonly updatedAt: string;
  readonly payload: BuilderDraftPayload;
}

const VALID_REALMS = new Set([
  'AEQUOR',
  'CARO',
  'CHAOS',
  'ULTRA',
  'NEUTRAL',
  'OTHER',
]);

function isRealm(value: unknown): boolean {
  return typeof value === 'string' && VALID_REALMS.has(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalFiniteInteger(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === 'number' &&
      Number.isFinite(value) &&
      Number.isInteger(value))
  );
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean';
}

function isSlot(value: unknown): value is TeamSlot {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;

  if (typeof record.slotId !== 'string' || !record.slotId.trim()) return false;
  if (!Array.isArray(record.wheels) || record.wheels.length !== 2) return false;
  if (
    !record.wheels.every(
      (wheelId) => wheelId === null || typeof wheelId === 'string',
    )
  )
    return false;
  if (
    !isOptionalString(record.awakenerName) ||
    !isOptionalString(record.covenantId)
  )
    return false;
  if (!isOptionalBoolean(record.isSupport)) return false;
  if (typeof record.awakenerName === 'string' && !record.awakenerName.trim())
    return false;
  if (typeof record.covenantId === 'string' && !record.covenantId.trim())
    return false;
  if (!isOptionalFiniteInteger(record.level)) return false;

  const realmCandidate = record.realm ?? record.faction;
  const hasAwakener =
    typeof record.awakenerName === 'string' &&
    record.awakenerName.trim().length > 0;

  if (!hasAwakener) {
    const hasMetadata =
      record.realm !== undefined ||
      record.faction !== undefined ||
      record.level !== undefined ||
      record.covenantId !== undefined ||
      record.isSupport !== undefined ||
      record.wheels.some((wheelId) => wheelId !== null);
    return !hasMetadata;
  }

  return isRealm(realmCandidate);
}

function isTeam(value: unknown): value is Team {
  if (!value || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== 'string' ||
    !record.id.trim() ||
    typeof record.name !== 'string' ||
    !record.name.trim()
  )
    return false;
  if (record.posseId !== undefined && typeof record.posseId !== 'string')
    return false;
  if (
    !Array.isArray(record.slots) ||
    record.slots.length !== 4 ||
    !record.slots.every(isSlot)
  )
    return false;

  const slotIds = record.slots.map((slot) => slot.slotId);
  return new Set(slotIds).size === slotIds.length;
}

function isBuilderDraftPayload(value: unknown): value is BuilderDraftPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.activeTeamId === 'string' &&
    Array.isArray(record.teams) &&
    record.teams.length > 0 &&
    record.teams.every(isTeam)
  );
}

function normalizeDraft(
  payload: BuilderDraftPayload,
): BuilderDraftPayload | null {
  if (!payload.teams.some((team) => team.id === payload.activeTeamId))
    return null;

  return {
    ...payload,
    teams: payload.teams.map((team) => ({
      ...team,
      slots: team.slots.map((slot) => {
        const legacyFaction =
          'faction' in slot && typeof slot.faction === 'string'
            ? slot.faction
            : undefined;
        const realm = slot.realm ?? legacyFaction;
        return slot.awakenerName
          ? {...slot, realm}
          : {
              slotId: slot.slotId,
              awakenerName: undefined,
              realm: undefined,
              level: undefined,
              isSupport: undefined,
              wheels: [null, null] as const,
              covenantId: undefined,
            };
      }),
    })),
  };
}

export function loadBuilderDraft(
  storage: StorageLike | null,
): BuilderDraftPayload | null {
  const raw = safeStorageRead(storage, BUILDER_PERSISTENCE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedBuilderEnvelope;
    return parsed.version === BUILDER_PERSISTENCE_VERSION &&
      isBuilderDraftPayload(parsed.payload)
      ? normalizeDraft(parsed.payload)
      : null;
  } catch {
    return null;
  }
}

export function saveBuilderDraft(
  storage: StorageLike | null,
  payload: BuilderDraftPayload,
): boolean {
  const normalized = normalizeDraft(payload);
  if (!normalized) return false;

  const envelope: PersistedBuilderEnvelope = {
    version: BUILDER_PERSISTENCE_VERSION,
    updatedAt: new Date().toISOString(),
    payload: normalized,
  };

  return safeStorageWrite(
    storage,
    BUILDER_PERSISTENCE_KEY,
    JSON.stringify(envelope),
  );
}

export function clearBuilderDraft(storage: StorageLike | null): boolean {
  return safeStorageRemove(storage, BUILDER_PERSISTENCE_KEY);
}
