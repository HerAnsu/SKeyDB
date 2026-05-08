import referencesIndexJson from '@/data/public-v3/indexes/references.json'

import type {EntityRef, PublicReferencesIndex} from './contract'
import {publicReferencesIndexSchema} from './schemas'

let referencesIndexCache: PublicReferencesIndex | undefined

function getPublicReferencesIndex(): PublicReferencesIndex {
  referencesIndexCache ??= publicReferencesIndexSchema.parse(referencesIndexJson)
  return referencesIndexCache
}

function normalizeReferenceToken(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/[^\da-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type PublicReferenceResolveResult =
  | {status: 'match'; refs: EntityRef[]}
  | {status: 'ambiguous'; refs: EntityRef[]}
  | {status: 'notFound'; refs: []}

export function resolvePublicReferenceTokenResult(token: string): PublicReferenceResolveResult {
  const normalizedToken = normalizeReferenceToken(token)
  const referencesIndex = getPublicReferencesIndex()
  if (Object.hasOwn(referencesIndex.ambiguous, normalizedToken)) {
    return {status: 'ambiguous', refs: referencesIndex.ambiguous[normalizedToken] ?? []}
  }

  if (Object.hasOwn(referencesIndex.tokens, normalizedToken)) {
    return {status: 'match', refs: referencesIndex.tokens[normalizedToken] ?? []}
  }

  return {status: 'notFound', refs: []}
}

export function resolvePublicReferenceToken(token: string): EntityRef[] {
  return resolvePublicReferenceTokenResult(token).refs
}
