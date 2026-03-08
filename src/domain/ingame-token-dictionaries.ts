import awakenersCanonical from '@/data/ingame-tokens/awakeners.json'
import covenantsCanonical from '@/data/ingame-tokens/covenants.json'
import possesCanonical from '@/data/ingame-tokens/posses.json'
import wheelsCanonical from '@/data/ingame-tokens/wheels.json'

import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import {getPosses} from './posses'
import {getWheels} from './wheels'

export type IngameTokenCategory = 'awakeners' | 'wheels' | 'covenants' | 'posses'

export interface CanonicalTokenEntry {
  id: string
  token: string
}

export interface CanonicalCovenantBlockEntry {
  id: string
  pieces: [string, string, string, string, string, string]
}

export interface IngameDictionaryIssue {
  category: IngameTokenCategory
  kind: 'duplicate_token' | 'missing_token_for_id' | 'unknown_source_id'
  id?: string
  token?: string
}

export interface IngameTokenDictionaryBuildResult {
  byIdToken: Map<string, string>
  byTokenId: Map<string, string>
  issues: IngameDictionaryIssue[]
}

export interface IngameCovenantBlockDictionaryBuildResult {
  byIdBlock: Map<string, string>
  byIdPieces: Map<string, [string, string, string, string, string, string]>
  pieceTokensByPosition: [string[], string[], string[], string[], string[], string[]]
  issues: IngameDictionaryIssue[]
}

interface BuildTokenDictionaryInput {
  category: IngameTokenCategory
  ids: string[]
  sourceEntries: CanonicalTokenEntry[]
}

function normalizeCovenantPieces(
  pieces: string[],
): [string, string, string, string, string, string] {
  if (pieces.length !== 6) {
    throw new Error('Invalid covenant block data: expected exactly 6 pieces per covenant.')
  }
  return [...pieces] as [string, string, string, string, string, string]
}

const canonicalAwakenerEntries: CanonicalTokenEntry[] = awakenersCanonical
const canonicalCovenantEntries: CanonicalCovenantBlockEntry[] = covenantsCanonical.map((entry) => ({
  id: entry.id,
  pieces: normalizeCovenantPieces(entry.pieces),
}))
const canonicalPosseEntries: CanonicalTokenEntry[] = possesCanonical
const canonicalWheelEntries: CanonicalTokenEntry[] = wheelsCanonical

export function buildTokenDictionaryFromEntries({
  category,
  ids,
  sourceEntries,
}: BuildTokenDictionaryInput): IngameTokenDictionaryBuildResult {
  const issues: IngameDictionaryIssue[] = []
  const allowedIds = new Set(ids)
  const provisionalByIdToken = new Map<string, string>()
  const provisionalByTokenIds = new Map<string, string[]>()

  for (const entry of sourceEntries) {
    if (!entry.id || !entry.token) {
      continue
    }

    if (!allowedIds.has(entry.id)) {
      issues.push({category, kind: 'unknown_source_id', id: entry.id, token: entry.token})
      continue
    }

    provisionalByIdToken.set(entry.id, entry.token)
    const existingTokenIds = provisionalByTokenIds.get(entry.token) ?? []
    existingTokenIds.push(entry.id)
    provisionalByTokenIds.set(entry.token, existingTokenIds)
  }

  const byIdToken = new Map<string, string>(provisionalByIdToken)
  const byTokenId = new Map<string, string>()

  for (const [token, mappedIds] of provisionalByTokenIds) {
    if (mappedIds.length > 1) {
      issues.push({category, kind: 'duplicate_token', token})
      continue
    }
    byTokenId.set(token, mappedIds[0])
  }

  for (const id of ids) {
    if (!byIdToken.has(id)) {
      issues.push({category, kind: 'missing_token_for_id', id})
    }
  }

  return {
    byIdToken,
    byTokenId,
    issues,
  }
}

export function buildCovenantBlockDictionaryFromEntries(
  ids: string[],
  sourceEntries: CanonicalCovenantBlockEntry[],
): IngameCovenantBlockDictionaryBuildResult {
  const issues: IngameDictionaryIssue[] = []
  const allowedIds = new Set(ids)
  const byIdBlock = new Map<string, string>()
  const byIdPieces = new Map<string, [string, string, string, string, string, string]>()
  const blockIds = new Map<string, string[]>()
  const pieceTokensByPosition = [
    new Set<string>(),
    new Set<string>(),
    new Set<string>(),
    new Set<string>(),
    new Set<string>(),
    new Set<string>(),
  ] as const

  for (const entry of sourceEntries) {
    if (!allowedIds.has(entry.id)) {
      issues.push({category: 'covenants', kind: 'unknown_source_id', id: entry.id})
      continue
    }

    byIdBlock.set(entry.id, entry.pieces.join(''))
    byIdPieces.set(entry.id, entry.pieces)
    const existingIds = blockIds.get(entry.pieces.join('')) ?? []
    existingIds.push(entry.id)
    blockIds.set(entry.pieces.join(''), existingIds)

    for (const [index, token] of entry.pieces.entries()) {
      pieceTokensByPosition[index].add(token)
    }
  }

  for (const [block, mappedIds] of blockIds) {
    if (mappedIds.length > 1) {
      issues.push({category: 'covenants', kind: 'duplicate_token', token: block})
    }
  }

  for (const id of ids) {
    if (!byIdBlock.has(id)) {
      issues.push({category: 'covenants', kind: 'missing_token_for_id', id})
    }
  }

  return {
    byIdBlock,
    byIdPieces,
    pieceTokensByPosition: pieceTokensByPosition.map((tokens) => Array.from(tokens)) as [
      string[],
      string[],
      string[],
      string[],
      string[],
      string[],
    ],
    issues,
  }
}

export interface IngameTokenDictionaries {
  awakeners: IngameTokenDictionaryBuildResult
  wheels: IngameTokenDictionaryBuildResult
  covenants: IngameCovenantBlockDictionaryBuildResult
  posses: IngameTokenDictionaryBuildResult
  issues: IngameDictionaryIssue[]
}

export function buildIngameTokenDictionaries(): IngameTokenDictionaries {
  const awakeners = getAwakeners()
  const wheels = getWheels()
  const covenants = getCovenants()
  const posses = getPosses()

  const awakenerDictionary = buildTokenDictionaryFromEntries({
    category: 'awakeners',
    ids: awakeners.map((awakener) => String(awakener.id)),
    sourceEntries: canonicalAwakenerEntries,
  })

  const wheelDictionary = buildTokenDictionaryFromEntries({
    category: 'wheels',
    ids: wheels.map((wheel) => wheel.id),
    sourceEntries: canonicalWheelEntries,
  })

  const covenantDictionary = buildCovenantBlockDictionaryFromEntries(
    covenants.map((covenant) => covenant.id),
    canonicalCovenantEntries,
  )

  const posseDictionary = buildTokenDictionaryFromEntries({
    category: 'posses',
    ids: posses.map((posse) => posse.id),
    sourceEntries: canonicalPosseEntries,
  })

  return {
    awakeners: awakenerDictionary,
    wheels: wheelDictionary,
    covenants: covenantDictionary,
    posses: posseDictionary,
    issues: [
      ...awakenerDictionary.issues,
      ...wheelDictionary.issues,
      ...covenantDictionary.issues,
      ...posseDictionary.issues,
    ],
  }
}
