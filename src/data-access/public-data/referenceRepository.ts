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

export function resolvePublicReferenceToken(token: string): EntityRef[] {
  const normalizedToken = normalizeReferenceToken(token)
  return getPublicReferencesIndex().tokens[normalizedToken] ?? []
}
