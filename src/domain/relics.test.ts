import {describe, expect, it} from 'vitest'

import {getAwakeners} from './awakeners'
import {getPortraitRelicByAwakenerIngameId, getPortraitRelics, getRelics} from './relics'

describe('getRelics', () => {
  it('returns parsed relics with stable ids', () => {
    const relics = getRelics()
    expect(relics.length).toBeGreaterThan(0)
    expect(relics[0]).toEqual({
      id: expect.any(String),
      kind: expect.stringMatching(/^(PORTRAIT|GENERIC)$/),
      awakenerIngameId: expect.any(String),
      assetId: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
    })
  })

  it('does not leak unresolved source placeholders or wrappers into generated descriptions', () => {
    const relics = getRelics()
    expect(relics.every((relic) => !relic.description.includes('[Arg'))).toBe(true)
    expect(relics.every((relic) => !relic.description.includes('<'))).toBe(true)
  })
})

describe('getPortraitRelics', () => {
  it('returns portrait relics linked by awakener in-game id', () => {
    const portraits = getPortraitRelics()
    expect(portraits.length).toBeGreaterThan(0)
    expect(portraits.every((relic) => relic.awakenerIngameId.trim().length > 0)).toBe(true)
  })

  it('enforces unique awakener in-game ids for portrait relic linkage', () => {
    const portraits = getPortraitRelics()
    const uniqueAwakenerIds = new Set(portraits.map((relic) => relic.awakenerIngameId))
    expect(uniqueAwakenerIds.size).toBe(portraits.length)
  })

  it('only links portrait relics to known awakener in-game ids', () => {
    const knownAwakenerIngameIds = new Set(
      getAwakeners()
        .map((awakener) => awakener.ingameId)
        .filter((ingameId): ingameId is string => Boolean(ingameId)),
    )
    const portraits = getPortraitRelics()
    expect(portraits.every((relic) => knownAwakenerIngameIds.has(relic.awakenerIngameId))).toBe(
      true,
    )
  })
})

describe('getPortraitRelicByAwakenerIngameId', () => {
  it('resolves portrait relic lookup case-insensitively', () => {
    const b01 = getPortraitRelicByAwakenerIngameId('b01')
    expect(b01?.awakenerIngameId).toBe('B01')
  })

  it('keeps key relic references in canonical tagged form for the database UI', () => {
    expect(getPortraitRelicByAwakenerIngameId('B06')?.description).toContain('{Reluctant Alms}')
    expect(getPortraitRelicByAwakenerIngameId('C15')?.description).toContain('{Silver Key Dawn}')
    expect(getPortraitRelicByAwakenerIngameId('C17')?.description).toContain('Temporary {Strike}')
  })
})
