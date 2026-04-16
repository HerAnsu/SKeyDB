import {describe, expect, it} from 'vitest'

import {getAwakenerKits} from './awakener-kits'
import {
  getAwakenerTalentById,
  getAwakenerTalents,
  getAwakenerTalentsForAwakener,
} from './awakener-talents'

describe('awakener-talents', () => {
  it('loads canonical talent records from the normalized dataset', () => {
    const talents = getAwakenerTalents()

    expect(talents.length).toBeGreaterThan(0)
    expect(talents[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ownerAwakenerId: expect.any(Number),
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
        descriptionArgs: expect.any(Object),
      }),
    )
  })

  it('matches every tracked kit talent binding to a seeded record', () => {
    const talents = getAwakenerTalents()
    const kits = getAwakenerKits()
    const ids = new Set(talents.map((entry) => entry.id))

    kits.forEach((kit) => {
      Object.values(kit.talents).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((talentId) => {
            expect(ids.has(talentId)).toBe(true)
          })
          return
        }

        if (value) {
          expect(ids.has(value)).toBe(true)
        }
      })
    })
  })

  it('preserves public slot coverage and soulforge metadata', () => {
    const talents = getAwakenerTalents()

    expect(getAwakenerTalentById('talent.corposant.cinders', talents)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 11,
        displayName: 'Cinders',
      }),
    )

    expect(getAwakenerTalentById('talent.24.madness-omen', talents)).toEqual(
      expect.objectContaining({
        maxLevel: 12,
        descriptionArgs: {
          Arg1: {
            kind: 'linear',
            base: '5',
            gainPerLevel: '5',
          },
        },
      }),
    )

    expect(getAwakenerTalentById('talent.xu.soulforge-aptitude', talents)).toEqual(
      expect.objectContaining({
        maxLevel: 10,
        hasLevelScaledDescription: true,
        descriptionArgs: expect.objectContaining({
          Arg1: {
            kind: 'linear',
            base: '3',
            gainPerLevel: '3',
          },
          Arg2: {
            kind: 'linear',
            base: '50',
            gainPerLevel: '50',
          },
          Arg3: {
            kind: 'scaling',
            values: ['5', '7', '9', '11', '13', '15', '17', '19', '21', '25'],
          },
        }),
      }),
    )
  })

  it('supports lookup by owner awakener id', () => {
    const talents = getAwakenerTalents()
    const doresainTalents = getAwakenerTalentsForAwakener(14, talents)

    expect(doresainTalents.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'talent.doresain.casket-harvest',
        'talent.doresain.festering-grace',
        'talent.doresain.madness-omen',
        'talent.doresain.soulforge-aptitude',
      ]),
    )
  })

  it('stores multiline descriptions as real newlines instead of escaped literals', () => {
    const talents = getAwakenerTalents()
    const murphyFauxbornTalent = getAwakenerTalentById(
      'talent.murphy-fauxborn.divine-realms-order',
      talents,
    )

    expect(murphyFauxbornTalent?.descriptionTemplate).toContain('\n')
    expect(murphyFauxbornTalent?.descriptionTemplate).not.toContain('\\n')
    expect(murphyFauxbornTalent?.descriptionTemplate).toContain(
      'Realm Mastery is counted as Divine Realm: {Aequor} Mastery:',
    )
    expect(murphyFauxbornTalent?.descriptionTemplate).not.toContain('{Divine Realm: Aequor}')
  })

  it('stores talent-owned substat scaling as upgrade patches instead of base card args', () => {
    const talents = getAwakenerTalents()

    expect(getAwakenerTalentById('talent.agrippa.seal-of-the-pact', talents)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.agrippa.pale-blessing'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.agrippa.pale-blessing',
            targetType: 'skill',
            operation: 'arg_substat_bonuses',
            argSubstatBonuses: {
              Arg2: {
                substat: 'SigilYield',
                multiplier: '0.5',
                mode: 'scale_base',
              },
              Arg3: {
                substat: 'SigilYield',
                multiplier: '1',
                mode: 'scale_base',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerTalentById('talent.caecus.rebellious-spikes', talents)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.caecus.strike'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.caecus.strike',
            argSubstatBonuses: {
              Arg3: {
                substat: 'SigilYield',
                multiplier: '1',
                suffix: '%',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerTalentById('talent.corposant.cinders', talents)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: expect.arrayContaining([
          'skill.corposant.defense',
          'skill.corposant.lightning-retribution',
          'skill.corposant.strike',
          'skill.corposant.sunken-in-the-profound',
          'derived.corposant.pilot',
        ]),
      }),
    )

    expect(getAwakenerTalentById('talent.ramona.silverheart-resonance', talents)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.ramona.queens-sword'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.ramona.queens-sword',
            argSubstatBonuses: {
              Arg1: {
                substat: 'KeyflareRegen',
                multiplier: '1',
                suffix: '%',
                mode: 'scale_base',
              },
              Arg7: {
                substat: 'KeyflareRegen',
                multiplier: '0.75',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerTalentById('talent.wanda.revelation', talents)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.wanda.necropolis-of-dreams'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.wanda.necropolis-of-dreams',
            argSubstatBonuses: {
              Arg2: {
                substat: 'DamageAmplification',
                multiplier: '0.75',
                suffix: '%',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerTalentById('talent.casiah.master-of-magic', talents)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: [],
        upgradePatches: [],
      }),
    )
  })
})
