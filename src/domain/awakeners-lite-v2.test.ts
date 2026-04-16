import {describe, expect, it} from 'vitest'

import {getAwakenersLiteV2} from './awakeners-lite-v2'
import {compileCanonicalAwakenersLiteV2} from './awakeners-lite-v2-canonical'

describe('awakeners-lite-v2', () => {
  it('keeps the generated lite V2 artifact in sync with the compiler', () => {
    expect(getAwakenersLiteV2()).toEqual(compileCanonicalAwakenersLiteV2())
  })

  it('merges curated roster search tags with overlay-derived search tags', () => {
    const records = getAwakenersLiteV2()
    const vortice = records.find((entry) => entry.name === 'vortice')
    const fauxbornMurphy = records.find((entry) => entry.name === 'murphy: fauxborn')
    const twentyFour = records.find((entry) => entry.name === '24')

    expect(vortice?.tags).toEqual(
      expect.arrayContaining(['Dispel', 'Divine Realm', 'Fortress', 'Pursuit', 'Tentacles']),
    )
    expect(fauxbornMurphy?.tags).toEqual(
      expect.arrayContaining(['Arithmetica', 'Divine Realm', 'Draw', 'Keyflare', 'Tentacles']),
    )
    expect(twentyFour?.tags).toEqual(
      expect.arrayContaining(['Bleed', 'Counter', 'Embryo Fusion', 'Fixed DMG', 'STR Up']),
    )
  })

  it('filters out low-signal overlay references like Retain and Exhaust', () => {
    const tags = new Set(getAwakenersLiteV2().flatMap((entry) => entry.tags))

    expect(tags.has('Retain')).toBe(false)
    expect(tags.has('Exhaust')).toBe(false)
  })
})
