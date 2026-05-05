import type {PublicDataScope} from '@/data-access/public-data/contract'
import {getPublicSearchDocument} from '@/data-access/public-data/searchRepository'

export function getPublicSearchAliases(scope: PublicDataScope, id: string): string[] {
  return getPublicSearchDocument(scope, id)?.aliases ?? []
}

export function getPublicSearchSupplementalValues(scope: PublicDataScope, id: string): string[] {
  const document = getPublicSearchDocument(scope, id)
  if (!document) {
    return []
  }

  return uniqueSearchValues([...document.tokens, ...flattenSearchFacetValues(document.facets)])
}

function flattenSearchFacetValues(value: unknown): string[] {
  if (value === null || value === undefined) {
    return []
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)]
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenSearchFacetValues)
  }

  if (typeof value === 'object') {
    return Object.values(value).flatMap(flattenSearchFacetValues)
  }

  return []
}

function uniqueSearchValues(values: string[]): string[] {
  const seen = new Set<string>()
  const uniqueValues: string[] = []

  for (const value of values) {
    const normalizedValue = value.trim()
    if (!normalizedValue || seen.has(normalizedValue)) {
      continue
    }

    seen.add(normalizedValue)
    uniqueValues.push(normalizedValue)
  }

  return uniqueValues
}
