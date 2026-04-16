export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export type SearchFieldMatchKind = 'exact' | 'prefix' | 'wordPrefix' | 'contains'

export interface SearchFieldMatch {
  kind: SearchFieldMatchKind
}

function getNormalizedSearchTokens(value: string): string[] {
  return value
    .split(/[^a-z0-9]+/i)
    .map((token) => normalizeForSearch(token))
    .filter((token) => token.length > 0)
}

export function getSearchFieldMatch(
  value: string,
  normalizedQuery: string,
): SearchFieldMatch | null {
  if (normalizedQuery.length === 0) {
    return null
  }

  const normalizedValue = normalizeForSearch(value)
  if (normalizedValue.length === 0) {
    return null
  }

  if (normalizedValue === normalizedQuery) {
    return {kind: 'exact'}
  }

  if (normalizedValue.startsWith(normalizedQuery)) {
    return {kind: 'prefix'}
  }

  if (
    getNormalizedSearchTokens(value).some(
      (token) => token !== normalizedValue && token.startsWith(normalizedQuery),
    )
  ) {
    return {kind: 'wordPrefix'}
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return {kind: 'contains'}
  }

  return null
}

export function getNormalizedSearchValues(values: readonly string[] | null | undefined): string[] {
  if (!values) {
    return []
  }

  const dedupedValues = new Set<string>()
  for (const value of values) {
    const normalizedValue = normalizeForSearch(value)
    if (normalizedValue.length === 0) {
      continue
    }
    dedupedValues.add(normalizedValue)
  }

  return Array.from(dedupedValues)
}

export function getBestSearchFieldMatch(
  values: readonly string[] | null | undefined,
  normalizedQuery: string,
): SearchFieldMatch | null {
  if (!values) {
    return null
  }

  let bestMatch: SearchFieldMatch | null = null
  for (const value of values) {
    const match = getSearchFieldMatch(value, normalizedQuery)
    if (!match) {
      continue
    }
    if (!bestMatch || compareSearchFieldMatches(match, bestMatch) < 0) {
      bestMatch = match
    }
  }
  return bestMatch
}

export function compareSearchFieldMatches(a: SearchFieldMatch, b: SearchFieldMatch): number {
  return getSearchFieldMatchPriority(a.kind) - getSearchFieldMatchPriority(b.kind)
}

function getSearchFieldMatchPriority(kind: SearchFieldMatchKind): number {
  switch (kind) {
    case 'exact':
      return 0
    case 'prefix':
      return 1
    case 'wordPrefix':
      return 2
    case 'contains':
      return 3
  }
}
