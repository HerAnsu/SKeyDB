import {describe, expect, it} from 'vitest'

import {
  DEFAULT_REALM_TINT,
  getRealmIcon,
  getRealmLabel,
  getRealmTint,
  normalizeRealmId,
} from './factions'

describe('realms domain', () => {
  it('normalizes realm ids', () => {
    expect(normalizeRealmId(' aequor ')).toBe('AEQUOR')
    expect(normalizeRealmId('Chaos')).toBe('CHAOS')
  })

  it('returns canonical tints and fallback tint', () => {
    expect(getRealmTint('AEQUOR')).toBe('#6aabec')
    expect(getRealmTint('caro')).toBe('#e46161')
    expect(getRealmTint('unknown')).toBe(DEFAULT_REALM_TINT)
    expect(getRealmTint(undefined)).toBe(DEFAULT_REALM_TINT)
  })

  it('returns canonical labels with fallback to the given value', () => {
    expect(getRealmLabel('AEQUOR')).toBe('Aequor')
    expect(getRealmLabel('ultra')).toBe('Ultra')
    expect(getRealmLabel('XREALM')).toBe('XREALM')
  })

  it('returns icons for known realms and undefined for unknown ids', () => {
    expect(getRealmIcon('AEQUOR')).toEqual(expect.any(String))
    expect(getRealmIcon('CHAOS')).toEqual(expect.any(String))
    expect(getRealmIcon('unknown')).toBeUndefined()
    expect(getRealmIcon(undefined)).toBeUndefined()
  })
})
