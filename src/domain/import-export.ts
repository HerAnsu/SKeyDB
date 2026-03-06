import {getAwakeners} from '@/domain/awakeners';
import {getCovenants} from '@/domain/covenants';
import {
  decodeIngameTeamCode,
  type IngameImportWarning,
} from '@/domain/ingame-codec';
import {getPosses} from '@/domain/posses';
import {getWheels} from '@/domain/wheels';
import {createEmptyTeamSlots} from '@/pages/builder/constants';
import type {Team, TeamSlot} from '@/pages/builder/types';

const singlePrefix = 't1.';
const multiPrefix = 'mt1.';
const slotsPerTeam = 4;
const bytesPerSlot = 5;
const bytesPerTeam = 1 + slotsPerTeam * bytesPerSlot;
const supportLevelFlag = 0x80;
const levelValueMask = 0x7f;

const awakeners = getAwakeners();
const covenants = getCovenants();
const posses = getPosses();
const wheels = getWheels();

const awakenerIdByName = new Map(
  awakeners.map((awakener) => [awakener.name, awakener.id]),
);
const awakenerById = new Map(
  awakeners.map((awakener) => [awakener.id, awakener]),
);
const posseIndexById = new Map(posses.map((posse) => [posse.id, posse.index]));
const posseIdByIndex = new Map(posses.map((posse) => [posse.index, posse.id]));
const wheelIndexById = new Map(
  wheels.map((wheel, index) => [wheel.id, index + 1]),
);
const wheelIdByIndex = new Map(
  wheels.map((wheel, index) => [index + 1, wheel.id]),
);
const covenantIndexById = new Map(
  covenants.map((covenant, index) => [covenant.id, index + 1]),
);
const covenantIdByIndex = new Map(
  covenants.map((covenant, index) => [index + 1, covenant.id]),
);

export type DecodedImport =
  | {
      readonly kind: 'single';
      readonly team: Team;
      readonly warnings?: readonly IngameImportWarning[];
    }
  | {
      readonly kind: 'multi';
      readonly teams: readonly Team[];
      readonly activeTeamIndex: number;
    };

function extractImportCodeCandidate(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }

  if (
    trimmed.startsWith(singlePrefix) ||
    trimmed.startsWith(multiPrefix) ||
    (trimmed.startsWith('@@') && trimmed.endsWith('@@'))
  ) {
    return trimmed;
  }

  const ingameMatch = /@@[A-Za-z0-9]+@@/.exec(trimmed);
  if (ingameMatch?.[0]) {
    return ingameMatch[0];
  }

  const standardMatch = /\b(?:mt1|t1)\.[A-Za-z0-9_-]+\b/.exec(trimmed);
  if (standardMatch?.[0]) {
    return standardMatch[0];
  }

  return trimmed;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/={1,2}$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding =
    normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function pushSlotBytes(
  buffer: number[],
  slot: TeamSlot,
  options?: {readonly includeSupport?: boolean},
) {
  const awakenerId = slot.awakenerName
    ? (awakenerIdByName.get(slot.awakenerName) ?? 0)
    : 0;
  if (awakenerId > 255) {
    throw new Error('Awakener ID exceeds export format limits.');
  }
  const rawLevel = awakenerId ? (slot.level ?? 0) : 0;
  if (rawLevel < 0 || rawLevel > levelValueMask) {
    throw new Error('Awakener level exceeds export format limits.');
  }
  const level =
    options?.includeSupport && awakenerId && slot.isSupport
      ? rawLevel | supportLevelFlag
      : rawLevel;
  const wheelOne =
    awakenerId && slot.wheels[0]
      ? (wheelIndexById.get(slot.wheels[0]) ?? 0)
      : 0;
  const wheelTwo =
    awakenerId && slot.wheels[1]
      ? (wheelIndexById.get(slot.wheels[1]) ?? 0)
      : 0;
  const covenant =
    awakenerId && slot.covenantId
      ? (covenantIndexById.get(slot.covenantId) ?? 0)
      : 0;
  if (wheelOne > 255 || wheelTwo > 255) {
    throw new Error('Equipment index exceeds export format limits.');
  }
  if (covenant > 255) {
    throw new Error('Covenant index exceeds export format limits.');
  }

  buffer.push(awakenerId, level, wheelOne, wheelTwo, covenant);
}

function pushTeamBytes(
  buffer: number[],
  team: Team,
  options?: {readonly includeSupport?: boolean},
) {
  const posseIndex = team.posseId ? (posseIndexById.get(team.posseId) ?? 0) : 0;
  if (posseIndex > 255) {
    throw new Error('Posse index exceeds export format limits.');
  }
  buffer.push(posseIndex);
  const fallbackSlots = createEmptyTeamSlots();
  for (let index = 0; index < slotsPerTeam; index += 1) {
    pushSlotBytes(buffer, team.slots[index] ?? fallbackSlots[index], options);
  }
}

function validateSlotIndices(
  awakenerId: number,
  wheelOne: number,
  wheelTwo: number,
  covenant: number,
) {
  if (!awakenerId) return;
  if (wheelOne && !wheelIdByIndex.has(wheelOne)) {
    throw new Error(`Unknown wheel index: ${String(wheelOne)}`);
  }
  if (wheelTwo && !wheelIdByIndex.has(wheelTwo)) {
    throw new Error(`Unknown wheel index: ${String(wheelTwo)}`);
  }
  if (covenant && !covenantIdByIndex.has(covenant)) {
    throw new Error(`Unknown covenant index: ${String(covenant)}`);
  }
}

function decodeSlot(
  bytes: Uint8Array,
  offset: number,
  slotId: string,
  options?: {readonly includeSupport?: boolean},
): TeamSlot {
  const awakenerId = bytes[offset] ?? 0;
  const encodedLevel = bytes[offset + 1] ?? 0;
  const wheelOne = bytes[offset + 2] ?? 0;
  const wheelTwo = bytes[offset + 3] ?? 0;
  const covenant = bytes[offset + 4] ?? 0;
  const isSupport = options?.includeSupport
    ? (encodedLevel & supportLevelFlag) !== 0
    : false;
  const level = encodedLevel & levelValueMask;

  const awakener = awakenerId ? awakenerById.get(awakenerId) : undefined;
  if (awakenerId && !awakener) {
    throw new Error(`Unknown awakener id: ${String(awakenerId)}`);
  }

  validateSlotIndices(awakenerId, wheelOne, wheelTwo, covenant);

  return {
    slotId,
    awakenerName: awakener?.name,
    realm: awakener?.realm,
    level: awakener ? level || 60 : undefined,
    isSupport: awakener && isSupport ? true : undefined,
    wheels: awakener
      ? [
          wheelOne ? (wheelIdByIndex.get(wheelOne) ?? null) : null,
          wheelTwo ? (wheelIdByIndex.get(wheelTwo) ?? null) : null,
        ]
      : [null, null],
    covenantId:
      awakener && covenant ? covenantIdByIndex.get(covenant) : undefined,
  };
}

function decodeTeam(
  bytes: Uint8Array,
  offset: number,
  teamIndex: number,
  options?: {readonly includeSupport?: boolean},
): {readonly team: Team; readonly nextOffset: number} {
  if (offset + 1 > bytes.length) {
    throw new Error('Corrupted import code: missing team header.');
  }
  const posseIndex = bytes[offset];
  let cursor = offset + 1;

  if (posseIndex && !posseIdByIndex.has(posseIndex)) {
    throw new Error(`Unknown posse index: ${String(posseIndex)}`);
  }

  if (cursor + slotsPerTeam * bytesPerSlot > bytes.length) {
    throw new Error('Corrupted import code: incomplete team slots.');
  }

  const emptySlots = createEmptyTeamSlots();
  const slots: TeamSlot[] = [];
  for (let slotIndex = 0; slotIndex < slotsPerTeam; slotIndex += 1) {
    slots.push(
      decodeSlot(bytes, cursor, emptySlots[slotIndex].slotId, options),
    );
    cursor += bytesPerSlot;
  }

  return {
    team: {
      id: `imported-team-${String(teamIndex)}-${crypto.randomUUID()}`,
      name: `Team ${String(teamIndex + 1)}`,
      slots,
      posseId: posseIndex ? posseIdByIndex.get(posseIndex) : undefined,
    },
    nextOffset: cursor,
  };
}

function decodeSingleTeam(bytes: Uint8Array): Team {
  if (bytes.length !== bytesPerTeam) {
    throw new Error(
      'Corrupted import code: invalid single-team payload length.',
    );
  }
  const decoded = decodeTeam(bytes, 0, 0);
  if (decoded.nextOffset !== bytes.length) {
    throw new Error(
      'Corrupted import code: trailing data in single-team payload.',
    );
  }
  return decoded.team;
}

function decodeMultiTeam(bytes: Uint8Array): {
  teams: Team[];
  activeTeamIndex: number;
} {
  if (bytes.length < 2) {
    throw new Error('Corrupted import code: missing multi-team header.');
  }
  const activeTeamIndex = bytes[0];
  const teamCount = bytes[1];
  if (activeTeamIndex >= teamCount) {
    throw new Error('Corrupted import code: invalid active team index.');
  }
  if (bytes.length !== 2 + teamCount * bytesPerTeam) {
    throw new Error(
      'Corrupted import code: invalid multi-team payload length.',
    );
  }
  let offset = 2;
  const teams: Team[] = [];
  for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
    const decoded = decodeTeam(bytes, offset, teamIndex, {
      includeSupport: true,
    });
    teams.push(decoded.team);
    offset = decoded.nextOffset;
  }
  return {teams, activeTeamIndex};
}

export function encodeSingleTeamCode(team: Team): string {
  const buffer: number[] = [];
  pushTeamBytes(buffer, team);
  return `${singlePrefix}${bytesToBase64Url(Uint8Array.from(buffer))}`;
}

export function encodeMultiTeamCode(
  teams: readonly Team[],
  activeTeamId: string,
): string {
  if (teams.length > 255) {
    throw new Error('Too many teams to export.');
  }
  const activeTeamIndex = Math.max(
    0,
    teams.findIndex((team) => team.id === activeTeamId),
  );
  const buffer: number[] = [activeTeamIndex, teams.length];
  teams.forEach((team) => {
    pushTeamBytes(buffer, team, {includeSupport: true});
  });
  return `${multiPrefix}${bytesToBase64Url(Uint8Array.from(buffer))}`;
}

export function decodeImportCode(code: string): DecodedImport {
  const trimmed = extractImportCodeCandidate(code);
  if (!trimmed) {
    throw new Error('Import code is empty.');
  }

  if (trimmed.startsWith(singlePrefix)) {
    return {
      kind: 'single',
      team: decodeSingleTeam(
        base64UrlToBytes(trimmed.slice(singlePrefix.length)),
      ),
    };
  }

  if (trimmed.startsWith(multiPrefix)) {
    const {teams, activeTeamIndex} = decodeMultiTeam(
      base64UrlToBytes(trimmed.slice(multiPrefix.length)),
    );
    return {kind: 'multi', activeTeamIndex, teams};
  }

  if (trimmed.startsWith('@@') && trimmed.endsWith('@@')) {
    const decoded = decodeIngameTeamCode(trimmed);
    return {kind: 'single', team: decoded.team, warnings: decoded.warnings};
  }

  throw new Error('Unsupported import code prefix.');
}
