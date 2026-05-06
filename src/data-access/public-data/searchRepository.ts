import searchAwakenersJson from '@/data/public-v3/indexes/search-awakeners.json'
import searchCovenantsJson from '@/data/public-v3/indexes/search-covenants.json'
import searchPossesJson from '@/data/public-v3/indexes/search-posses.json'
import searchRelicsJson from '@/data/public-v3/indexes/search-relics.json'
import searchWheelsJson from '@/data/public-v3/indexes/search-wheels.json'

import {getOrCreateMapValue} from './cache'
import type {PublicDataScope, PublicSearchDocument, PublicSearchIndex} from './contract'
import {publicSearchIndexSchema} from './schemas'

const searchJsonByScope: Partial<Record<PublicDataScope, unknown>> = {
  awakeners: searchAwakenersJson,
  covenants: searchCovenantsJson,
  posses: searchPossesJson,
  relics: searchRelicsJson,
  wheels: searchWheelsJson,
}

const emptySearchIndexByScope = new Map<PublicDataScope, PublicSearchIndex>()

const searchCache = new Map<PublicDataScope, PublicSearchIndex>()
const searchDocumentByIdCache = new Map<PublicDataScope, Map<string, PublicSearchDocument>>()

function getPublicSearchIndex(scope: PublicDataScope): PublicSearchIndex {
  const searchJson = searchJsonByScope[scope]
  if (searchJson === undefined) {
    return getOrCreateMapValue(emptySearchIndexByScope, scope, () => ({
      schemaVersion: 3,
      scope,
      records: [],
    }))
  }
  return getOrCreateMapValue(searchCache, scope, () => publicSearchIndexSchema.parse(searchJson))
}

export function getPublicSearchDocuments(scope: PublicDataScope): PublicSearchDocument[] {
  return getPublicSearchIndex(scope).records
}

export function getPublicSearchDocument(
  scope: PublicDataScope,
  id: string,
): PublicSearchDocument | undefined {
  return getPublicSearchDocumentMap(scope).get(id)
}

function getPublicSearchDocumentMap(scope: PublicDataScope): Map<string, PublicSearchDocument> {
  const cached = searchDocumentByIdCache.get(scope)
  if (cached) {
    return cached
  }

  const map = new Map(getPublicSearchDocuments(scope).map((record) => [record.id, record]))
  searchDocumentByIdCache.set(scope, map)
  return map
}
