import {describe, expect, it} from 'vitest'

import {
  getBestSearchFieldMatch,
  getNormalizedSearchValues,
  getSearchFieldMatch,
  normalizeForSearch,
} from './search-utils'

describe('normalizeForSearch', () => {
  it('lowercases and strips non-alphanumeric characters', () => {
    expect(normalizeForSearch('Hello World!')).toBe('helloworld')
  })

  it('preserves digits', () => {
    expect(normalizeForSearch('Unit-42')).toBe('unit42')
  })

  it('returns empty string for non-alphanumeric input', () => {
    expect(normalizeForSearch('---')).toBe('')
  })

  it('handles empty string', () => {
    expect(normalizeForSearch('')).toBe('')
  })

  it('strips unicode and special characters', () => {
    expect(normalizeForSearch('café résumé')).toBe('caferesume')
  })
})

describe('getSearchFieldMatch', () => {
  it('prefers exact matches over broader matches', () => {
    expect(getSearchFieldMatch('Bleed', 'bleed')?.kind).toBe('exact')
  })

  it('recognizes normalized prefixes', () => {
    expect(getSearchFieldMatch('Castor', 'ca')?.kind).toBe('prefix')
  })

  it('recognizes word prefixes across punctuation and spaces', () => {
    expect(getSearchFieldMatch('helot: catena', 'cat')?.kind).toBe('wordPrefix')
  })

  it('falls back to contains matches when no stronger match exists', () => {
    expect(getSearchFieldMatch('aurita', 'rit')?.kind).toBe('contains')
  })
})

describe('getBestSearchFieldMatch', () => {
  it('returns the strongest match across multiple values', () => {
    expect(getBestSearchFieldMatch(['Counter', 'STR Up', 'Bleed'], 'bleed')?.kind).toBe('exact')
  })
})

describe('getNormalizedSearchValues', () => {
  it('normalizes and deduplicates search values', () => {
    expect(getNormalizedSearchValues(['Café', 'cafe', ''])).toEqual(['cafe'])
  })
})
