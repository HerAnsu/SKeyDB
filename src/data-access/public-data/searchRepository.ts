import searchAwakenerBuildsJson from '@/data/public-v3/indexes/search-awakener-builds.json'
import searchAwakenersJson from '@/data/public-v3/indexes/search-awakeners.json'
import searchCovenantsJson from '@/data/public-v3/indexes/search-covenants.json'
import searchDerivedSkillsJson from '@/data/public-v3/indexes/search-derived-skills.json'
import searchEnlightensJson from '@/data/public-v3/indexes/search-enlightens.json'
import searchOverlaysJson from '@/data/public-v3/indexes/search-overlays.json'
import searchPossesJson from '@/data/public-v3/indexes/search-posses.json'
import searchRelicsJson from '@/data/public-v3/indexes/search-relics.json'
import searchSkillsJson from '@/data/public-v3/indexes/search-skills.json'
import searchTalentsJson from '@/data/public-v3/indexes/search-talents.json'
import searchWheelsJson from '@/data/public-v3/indexes/search-wheels.json'

import {getOrCreateMapValue} from './cache'
import type {PublicDataScope, PublicSearchDocument, PublicSearchIndex} from './contract'
import {publicSearchIndexSchema} from './schemas'

const searchJsonByScope = {
  'awakener-builds': searchAwakenerBuildsJson,
  awakeners: searchAwakenersJson,
  covenants: searchCovenantsJson,
  'derived-skills': searchDerivedSkillsJson,
  enlightens: searchEnlightensJson,
  overlays: searchOverlaysJson,
  posses: searchPossesJson,
  relics: searchRelicsJson,
  skills: searchSkillsJson,
  talents: searchTalentsJson,
  wheels: searchWheelsJson,
} satisfies Record<PublicDataScope, unknown>

const searchCache = new Map<PublicDataScope, PublicSearchIndex>()
const searchDocumentByIdCache = new Map<PublicDataScope, Map<string, PublicSearchDocument>>()

function getPublicSearchIndex(scope: PublicDataScope): PublicSearchIndex {
  return getOrCreateMapValue(searchCache, scope, () =>
    publicSearchIndexSchema.parse(searchJsonByScope[scope]),
  )
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
