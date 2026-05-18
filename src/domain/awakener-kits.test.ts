import {describe, expect, it} from 'vitest'

import {getAwakenerKitById, getAwakenerKits} from './awakener-kits'

describe('awakener-kits', () => {
  it('loads canonical kit bindings from the normalized dataset', () => {
    const kits = getAwakenerKits()

    expect(kits.length).toBeGreaterThan(0)
    expect(kits[0]).toEqual(
      expect.objectContaining({
        awakenerId: expect.any(Number),
        cards: expect.objectContaining({
          C1: expect.any(String),
          C2: expect.any(String),
          C3: expect.any(String),
          C4: expect.any(String),
          C5: expect.any(String),
          Exalt: expect.any(String),
          promotedExtras: expect.any(Array),
        }),
        talents: expect.objectContaining({
          extraTalentIds: expect.any(Array),
        }),
        enlightens: expect.objectContaining({
          E1: expect.any(String),
          E2: expect.any(String),
          E3: expect.any(String),
        }),
      }),
    )
  })

  it('captures known runtime layout fixes and public absolute axioms', () => {
    const kits = getAwakenerKits()

    expect(getAwakenerKitById(22, kits)).toEqual(
      expect.objectContaining({
        cards: expect.objectContaining({
          C1: 'skill.hameln.laudable-masterpiece',
          C2: 'skill.hameln.strike',
          C3: 'skill.hameln.defense',
          C4: 'skill.hameln.soul-overture',
          C5: 'skill.hameln.memory-rondo',
        }),
      }),
    )

    expect(getAwakenerKitById(32, kits)).toEqual(
      expect.objectContaining({
        cards: expect.objectContaining({
          C1: 'skill.miryam.testament-of-faith',
          C2: 'skill.miryam.strike',
          C3: 'skill.miryam.defense',
          C4: 'skill.miryam.exalted-pyre',
          C5: 'skill.miryam.the-chosen-one',
        }),
      }),
    )

    expect(getAwakenerKitById(15, kits)).toEqual(
      expect.objectContaining({
        cards: expect.objectContaining({
          C1: 'skill.erica.parameter-fitting',
          C4: 'skill.erica.unleash-mecha',
          C5: 'skill.erica.function-overload',
        }),
        enlightens: expect.objectContaining({
          AbsoluteAxiom: 'enlighten.erica.final-decree',
        }),
      }),
    )

    expect(getAwakenerKitById(47, kits)).toEqual(
      expect.objectContaining({
        cards: expect.objectContaining({
          C1: 'skill.tawil.the-silver-key-gate',
          C4: 'skill.tawil.omniscient-verity',
          C5: 'skill.tawil.pinions-of-time',
          Exalt: 'skill.tawil.omnifex-convergence',
          OverExalt: 'skill.tawil.infinite-radiant-brilliance',
        }),
      }),
    )

    expect(getAwakenerKitById(49, kits)).toEqual(
      expect.objectContaining({
        cards: expect.objectContaining({
          Exalt: 'skill.tinct.starlight-aurora',
        }),
      }),
    )
  })

  it('omits placeholder talent slots instead of binding them to None', () => {
    const kits = getAwakenerKits()
    const awakening24 = getAwakenerKitById(1, kits)

    expect(awakening24).toEqual(
      expect.objectContaining({
        talents: expect.objectContaining({
          T2: 'talent.24.madness-omen',
          T3: 'talent.24.soulforge-aptitude',
          T4: 'talent.24.gnostic-potential',
        }),
      }),
    )
    expect(awakening24?.talents).not.toHaveProperty('T1')
  })
})
