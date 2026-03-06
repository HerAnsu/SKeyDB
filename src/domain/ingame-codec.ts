import {getAwakeners} from '@/domain/awakeners';
import {buildIngameTokenDictionaries} from '@/domain/ingame-token-dictionaries';
import {getWheels} from '@/domain/wheels';
import {createEmptyTeamSlots} from '@/pages/builder/constants';
import type {Team, TeamSlot} from '@/pages/builder/types';

const INGAME_WRAPPER = '@@';
const TEAM_SLOT_COUNT = 4;
const POSSE_TOKEN_LENGTH = 1;
const WHEEL_TOKENS_PER_SLOT = 2;
const COVENANT_SLICES_PER_SLOT = 6;

export interface IngameImportWarning {
  readonly section: 'awakener' | 'wheel' | 'covenant' | 'posse';
  readonly slotIndex?: number;
  readonly field?: 'wheelOne' | 'wheelTwo';
  readonly token: string;
  readonly reason:
    | 'unknown_token'
    | 'unsupported_wip_block'
    | 'ambiguous_parse';
}

export interface DecodedIngameTeamCode {
  readonly team: Team;
  readonly warnings: readonly IngameImportWarning[];
}

interface WheelCandidate {
  readonly token: string;
  readonly wheelId?: string;
  readonly unknown?: boolean;
}

function normalizeWrappedPayload(code: string): string {
  const trimmed = code.trim();
  if (
    !trimmed.startsWith(INGAME_WRAPPER) ||
    !trimmed.endsWith(INGAME_WRAPPER)
  ) {
    throw new Error('Invalid in-game code wrapper. Expected @@...@@.');
  }
  const payload = trimmed.slice(INGAME_WRAPPER.length, -INGAME_WRAPPER.length);
  if (!payload) {
    throw new Error('In-game code payload is empty.');
  }
  return payload;
}

function buildLongestTokenList(tokens: Iterable<string>): string[] {
  return Array.from(tokens).sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length;
    }
    return left.localeCompare(right);
  });
}

function findLongestTokenAt(
  payload: string,
  cursor: number,
  tokenList: string[],
): string | null {
  for (const token of tokenList) {
    if (payload.startsWith(token, cursor)) {
      return token;
    }
  }
  return null;
}

function getWheelCandidatesAt(
  payload: string,
  cursor: number,
  wheelTokensByToken: Map<string, string>,
  sortedWheelTokens: string[],
): WheelCandidate[] {
  const candidates: WheelCandidate[] = [];
  if (payload[cursor] === 'a') {
    candidates.push({token: 'a'});
  }

  for (const token of sortedWheelTokens) {
    if (!payload.startsWith(token, cursor)) {
      continue;
    }
    candidates.push({token, wheelId: wheelTokensByToken.get(token)});
  }

  if (candidates.length === 0 && cursor < payload.length) {
    candidates.push({token: payload[cursor], unknown: true});
  }

  return candidates;
}

function parseWheelToken(
  payload: string,
  cursor: number,
  wheelTokensByToken: Map<string, string>,
  sortedWheelTokens: string[],
): {candidate: WheelCandidate; nextCursor: number} {
  const candidates = getWheelCandidatesAt(
    payload,
    cursor,
    wheelTokensByToken,
    sortedWheelTokens,
  );
  if (candidates.length > 0) {
    const candidate = candidates[0];
    return {
      candidate,
      nextCursor: cursor + candidate.token.length,
    };
  }
  return {
    candidate: {token: payload.charAt(cursor), unknown: true},
    nextCursor: cursor + 1,
  };
}

function parseAwakenersPart(
  payload: string,
  awakenerTokenList: string[],
  dictionaries: ReturnType<typeof buildIngameTokenDictionaries>,
  awakeningById: Map<string, ReturnType<typeof getAwakeners>[number]>,
  emptySlots: readonly TeamSlot[],
  warnings: IngameImportWarning[],
): {slots: TeamSlot[]; cursor: number} {
  let cursor = 0;
  const slots: TeamSlot[] = emptySlots.map((slot) => ({
    ...slot,
    wheels: [null, null],
  }));

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    if (cursor >= payload.length) {
      throw new Error('Corrupted in-game code: missing awakener tokens.');
    }
    const token = findLongestTokenAt(payload, cursor, awakenerTokenList);
    if (!token) {
      warnings.push({
        section: 'awakener',
        slotIndex,
        token: payload.charAt(cursor),
        reason: 'unknown_token',
      });
      cursor += 1;
      continue;
    }

    const awakenerId = dictionaries.awakeners.byTokenId.get(token);
    const awakener = awakenerId ? awakeningById.get(awakenerId) : undefined;
    if (!awakener) {
      warnings.push({
        section: 'awakener',
        slotIndex,
        token,
        reason: 'unknown_token',
      });
      cursor += token.length;
      continue;
    }

    slots[slotIndex] = {
      ...slots[slotIndex],
      awakenerName: awakener.name,
      realm: awakener.realm,
      level: 60,
    };
    cursor += token.length;
  }
  return {slots, cursor};
}

function parseWheelCandidates(
  payload: string,
  cursor: number,
  dictionaries: ReturnType<typeof buildIngameTokenDictionaries>,
): {candidates: WheelCandidate[]; cursor: number} {
  let currentCursor = cursor;
  const wheelTokenList = buildLongestTokenList(
    dictionaries.wheels.byTokenId.keys(),
  );
  const candidates: WheelCandidate[] = [];
  for (let i = 0; i < TEAM_SLOT_COUNT * WHEEL_TOKENS_PER_SLOT; i++) {
    if (currentCursor >= payload.length - POSSE_TOKEN_LENGTH) {
      throw new Error('Corrupted in-game code: missing wheel token block.');
    }
    const {candidate, nextCursor} = parseWheelToken(
      payload,
      currentCursor,
      dictionaries.wheels.byTokenId,
      wheelTokenList,
    );
    candidates.push(candidate);
    currentCursor = nextCursor;
  }
  return {candidates, cursor: currentCursor};
}

function applyWheelsAndCovenants(
  payload: string,
  cursor: number,
  slots: TeamSlot[],
  wheelCandidates: WheelCandidate[],
  wheelById: Map<string, ReturnType<typeof getWheels>[number]>,
  warnings: IngameImportWarning[],
): void {
  const covenantBlock = payload.slice(
    cursor,
    payload.length - POSSE_TOKEN_LENGTH,
  );

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const wheelOne = wheelCandidates[slotIndex * 2];
    const wheelTwo = wheelCandidates[slotIndex * 2 + 1];
    const currentWheels: [string | null, string | null] = [null, null];

    if (wheelOne.wheelId && wheelById.has(wheelOne.wheelId)) {
      currentWheels[0] = wheelOne.wheelId;
    } else if (wheelOne.token !== 'a') {
      warnings.push({
        section: 'wheel',
        slotIndex,
        field: 'wheelOne',
        token: wheelOne.token,
        reason: 'unknown_token',
      });
    }

    if (wheelTwo.wheelId && wheelById.has(wheelTwo.wheelId)) {
      currentWheels[1] = wheelTwo.wheelId;
    } else if (wheelTwo.token !== 'a') {
      warnings.push({
        section: 'wheel',
        slotIndex,
        field: 'wheelTwo',
        token: wheelTwo.token,
        reason: 'unknown_token',
      });
    }

    const covenantStart = slotIndex * COVENANT_SLICES_PER_SLOT;
    const covenantToken = covenantBlock.slice(
      covenantStart,
      covenantStart + COVENANT_SLICES_PER_SLOT,
    );
    if (covenantToken && /[^a]/.test(covenantToken)) {
      warnings.push({
        section: 'covenant',
        slotIndex,
        token: covenantToken,
        reason: 'unsupported_wip_block',
      });
    }
    slots[slotIndex] = {
      ...slots[slotIndex],
      wheels: currentWheels,
      covenantId: undefined,
    };
  }
}

export function decodeIngameTeamCode(code: string): DecodedIngameTeamCode {
  const payload = normalizeWrappedPayload(code);
  const dictionaries = buildIngameTokenDictionaries();
  const warnings: IngameImportWarning[] = [];
  const awakeningById = new Map(getAwakeners().map((a) => [String(a.id), a]));
  const wheelById = new Map(getWheels().map((w) => [w.id, w]));

  const {slots, cursor: awakenerCursor} = parseAwakenersPart(
    payload,
    buildLongestTokenList(dictionaries.awakeners.byTokenId.keys()),
    dictionaries,
    awakeningById,
    createEmptyTeamSlots(),
    warnings,
  );

  const {candidates: wheelCandidates, cursor: wheelsCursor} =
    parseWheelCandidates(payload, awakenerCursor, dictionaries);

  applyWheelsAndCovenants(
    payload,
    wheelsCursor,
    slots,
    wheelCandidates,
    wheelById,
    warnings,
  );

  const posseToken = payload.charAt(payload.length - 1);
  const posseId = dictionaries.posses.byTokenId.get(posseToken);
  if (posseToken !== 'a' && !posseId) {
    warnings.push({
      section: 'posse',
      token: posseToken,
      reason: 'unknown_token',
    });
  }

  return {
    team: {
      id: `ingame-import-${crypto.randomUUID()}`,
      name: 'Imported Team',
      slots,
      posseId,
    },
    warnings,
  };
}

export function encodeIngameTeamCode(team: Team): string {
  const dictionaries = buildIngameTokenDictionaries();
  const awakenersByNameId = new Map(
    getAwakeners().map((awakener) => [awakener.name, String(awakener.id)]),
  );
  const payloadTokens: string[] = [];
  const fallbackSlots = createEmptyTeamSlots();

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex];
    const awakenerId = slot.awakenerName
      ? awakenersByNameId.get(slot.awakenerName)
      : undefined;
    payloadTokens.push(
      awakenerId
        ? (dictionaries.awakeners.byIdToken.get(awakenerId) ?? 'a')
        : 'a',
    );
  }

  for (let slotIndex = 0; slotIndex < TEAM_SLOT_COUNT; slotIndex += 1) {
    const slot = team.slots[slotIndex] ?? fallbackSlots[slotIndex];
    payloadTokens.push(
      slot.wheels[0]
        ? (dictionaries.wheels.byIdToken.get(slot.wheels[0]) ?? 'a')
        : 'a',
    );
    payloadTokens.push(
      slot.wheels[1]
        ? (dictionaries.wheels.byIdToken.get(slot.wheels[1]) ?? 'a')
        : 'a',
    );
  }

  for (
    let slotIndex = 0;
    slotIndex < TEAM_SLOT_COUNT * COVENANT_SLICES_PER_SLOT;
    slotIndex += 1
  ) {
    payloadTokens.push('a');
  }

  const posseToken = team.posseId
    ? (dictionaries.posses.byIdToken.get(team.posseId) ?? 'a')
    : 'a';
  payloadTokens.push(posseToken);
  return `${INGAME_WRAPPER}${payloadTokens.join('')}${INGAME_WRAPPER}`;
}
