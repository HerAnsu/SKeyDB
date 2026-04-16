import {describe, expect, it} from 'vitest'

import {
  getAwakenerEnlightenById,
  getAwakenerEnlightens,
  getAwakenerEnlightensForAwakener,
} from './awakener-enlightens'
import {getAwakenerKits} from './awakener-kits'

describe('awakener-enlightens', () => {
  it('loads canonical enlighten records from the normalized dataset', () => {
    const enlightens = getAwakenerEnlightens()

    expect(enlightens.length).toBeGreaterThan(0)
    expect(enlightens[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ownerAwakenerId: expect.any(Number),
        slot: expect.any(String),
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
        descriptionArgs: expect.any(Object),
        upgradeTargetIds: expect.any(Array),
        upgradePatches: expect.any(Array),
      }),
    )
  })

  it('matches every tracked kit enlighten binding to a seeded record', () => {
    const enlightens = getAwakenerEnlightens()
    const kits = getAwakenerKits()
    const ids = new Set(enlightens.map((entry) => entry.id))

    kits.forEach((kit) => {
      Object.values(kit.enlightens).forEach((enlightenId) => {
        expect(ids.has(enlightenId)).toBe(true)
      })
    })
  })

  it('keeps public absolute axioms and conservative upgrade target links', () => {
    const enlightens = getAwakenerEnlightens()

    expect(getAwakenerEnlightenById('enlighten.alva.unyielding-bastion', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.alva.combat-stance'],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.aurita.sparkling-friendship', enlightens)).toEqual(
      expect.objectContaining({
        slot: 'AbsoluteAxiom',
        upgradeTargetIds: ['skill.aurita.self-proliferation'],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.erica.final-decree', enlightens)).toEqual(
      expect.objectContaining({
        slot: 'AbsoluteAxiom',
        upgradeTargetIds: ['skill.erica.parameter-fitting'],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.24.hysteria', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.24.frenzied-slash'],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.daffodil.essence-sediment', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: [],
      }),
    )
  })

  it('stores explicit cumulative patch arrays for reviewed public upgrade cases', () => {
    const enlightens = getAwakenerEnlightens()

    expect(getAwakenerEnlightenById('enlighten.24.hysteria', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.24.frenzied-slash',
            targetType: 'skill',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('Temporary {Retain}'),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.24.restraint-bonds', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.24.symbiotic-aberration',
            targetType: 'skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('{Weakness}'),
            descriptionArgs: {
              Arg2: {
                kind: 'fixed',
                value: '10',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.agrippa.ashes-and-skulls', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.agrippa.strike',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('Trigger [Arg3]% {Poison}'),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '10',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.agrippa.defense',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('Trigger [Arg3]% of {Poison}'),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '10',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.aigis.nightborne-wings', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.aigis.a-small-wish',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('{A Small Wish}'),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.celeste.ancestral-beacon', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.celeste.tintless-dream',
            operation: 'mixed',
            addCardKeywords: [{id: 'mechanic.retain'}],
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.faros.jagged-shore', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.faros.ocean-of-elation',
            operation: 'override_args',
            descriptionArgs: {
              Arg4: {
                kind: 'fixed',
                value: '100',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.aurita.slick-slide-adventure', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.aurita.gland-division',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('{Pierce DMG}'),
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['24', '28.8', '33.6', '38.4', '43.2', '48'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.aurita.clamorous-ocean',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('{Pierce DMG}'),
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.aurita.lets-all-have-fun-together', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.aurita.defense'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.aurita.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('draw 1 Card'),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.aigis.crystallized-tear', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.aigis.stagnant-curse'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.aigis.stagnant-curse',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              "next Aigis's {Defense} to take effect 3 times",
            ),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.caecus.bloodline-awaken', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.caecus.shattered-halberd',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Obtain [Energy:Arg2] Aliemus'),
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['15', '16', '17', '18', '19', '20'],
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.casiah.minds-whisper', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.casiah.poof',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'gaining [Energy:Arg2] Aliemus per card drawn',
            ),
            descriptionArgs: {
              Arg2: {
                kind: 'fixed',
                value: '3',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.castor.unyielding-will', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.castor.stygian-wings',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('For every {Onyx Plume} in hand'),
            descriptionArgs: {
              Arg2: {
                kind: 'fixed',
                value: '5',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.castor.sky-eclipsing-wings', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['derived.castor.onyx-plume'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'derived.castor.onyx-plume',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'For every 3 {Onyx Plume} played, obtain 1 Arithmetica',
            ),
          }),
        ],
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.clementine.knocking-on-minds-portal', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.clementine.lifeform-reconstruction',
            operation: 'override_args',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['180', '216', '252', '288', '324', '360'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.clementine.soul-healing-journey', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.clementine.lifeform-reconstruction',
            operation: 'replace_description',
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['350', '380', '410', '440', '470', '500'],
                suffix: '%',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.goliath.boundless-ambition', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['derived.goliath.usurp', 'derived.goliath.dormancy'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'derived.goliath.usurp',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionArgs: {
              Arg2: {
                kind: 'fixed',
                value: '25',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'derived.goliath.dormancy',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionArgs: {
              Arg2: {
                kind: 'fixed',
                value: '25',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.doresain.evernights-revel', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['derived.doresain.evernights-revel'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'derived.doresain.evernights-revel',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionArgs: {
              Arg1: {
                kind: 'fixed',
                value: '160',
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.kathigu-ra.astral-meltdown', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.kathigu-ra.solarflare',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Base DMG +50%'),
          }),
          expect.objectContaining({
            targetId: 'skill.kathigu-ra.last-stand-salvo',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('gain an additional [Power:Arg3] {STR}'),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '3',
                suffix: '%',
                stat: 'ATK',
              },
              Arg4: {
                kind: 'scaling',
                values: ['3', '3.6', '4.2', '4.8', '5.4', '6'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.kathigu-ra.everburning-flame', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.kathigu-ra.strike',
            operation: 'override_args',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['15', '18', '21', '24', '27', '30'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg2: {
                kind: 'scaling',
                values: ['7.5', '9', '10.5', '12', '13.5', '15'],
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.kathigu-ra.defense',
            operation: 'override_args',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['15', '18', '21', '24', '27', '30'],
                suffix: '%',
                stat: 'DEF',
              },
              Arg2: {
                kind: 'scaling',
                values: ['7.5', '9', '10.5', '12', '13.5', '15'],
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.liz.verdant-spark', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['derived.liz.corrupted-flames'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'derived.liz.corrupted-flames',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'At turn end, if in hand or {Ultra Space}, upgrade to {Deadly Flames}.',
            ),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.pollux.divine-revelation', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['derived.pollux.sacred-heart'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'derived.pollux.sacred-heart',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('applying it 2 times'),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.pollux.flames-of-salvation', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.pollux.cleansing-judgement'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.pollux.cleansing-judgement',
            operation: 'replace_description',
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.vortice.endless-tide', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.vortice.abyssal-vortex-cannon', 'derived.vortice.vortex-shell'],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.vortice.abyssal-vortex-cannon',
            targetType: 'skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Gain [Arg6] Realm Mastery.'),
            descriptionArgs: {
              Arg6: {
                kind: 'fixed',
                value: '50',
                substatBonus: {
                  substat: 'RealmMastery',
                  multiplier: '0.5',
                },
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.vortice.abyssal-vortex-cannon',
            descriptionTemplate: expect.not.stringContaining('{Sacrifice}'),
          }),
          expect.objectContaining({
            targetId: 'derived.vortice.vortex-shell',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining("[Float:Arg3]% of target's Max HP"),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '0.5',
                substatBonus: {
                  substat: 'RealmMastery',
                  multiplier: '0.005',
                },
              },
              Arg4: {
                kind: 'scaling',
                channel: 'Damage',
                values: ['500', '1000', '1500', '2000', '2500', '3000'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.murphy-fauxborn.kneelers-supplication', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.murphy-fauxborn.waltz-of-lemuria',
            operation: 'override_args',
            descriptionArgs: {
              Arg8: {
                kind: 'scaling',
                values: ['11.55', '13.86', '16.17', '18.48', '20.79', '23.1'],
                suffix: '%',
                stat: 'ATK',
                substatBonus: {
                  substat: 'KeyflareRegen',
                  multiplier: '0.2',
                  suffix: '%',
                },
              },
              Arg9: {
                kind: 'scaling',
                values: ['45.1', '54.12', '63.14', '72.16', '81.18', '90.2'],
                suffix: '%',
                stat: 'DEF',
                substatBonus: {
                  substat: 'KeyflareRegen',
                  multiplier: '0.2',
                  suffix: '%',
                },
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.xu.enmity-of-the-heart', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.xu.bonesick-longing',
            operation: 'replace_description',
            descriptionArgs: {
              Arg6: {
                kind: 'fixed',
                value: '15',
                substatBonus: {
                  substat: 'DamageAmplification',
                  multiplier: '0.2',
                  suffix: '%',
                },
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.vortice.roaring-abyss', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.vortice.defense', 'skill.vortice.strike'],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.vortice.strike',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining(
              'reduce the next {Reload!} Arithmetica Cost by 1',
            ),
          }),
          expect.objectContaining({
            targetId: 'skill.vortice.defense',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining(
              'reduce the next {Reload!} Arithmetica Cost by 1',
            ),
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.vortice.shackled-impulse', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.vortice.abyssal-vortex-cannon'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.vortice.abyssal-vortex-cannon',
            targetType: 'skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Gain [Arg6] Realm Mastery, and for every 20 Aliemus spent, other Awakeners gain 1 Aliemus.',
            ),
            descriptionArgs: {
              Arg6: {
                kind: 'fixed',
                value: '50',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.faint.withering-hymn', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.faint.defense',
            operation: 'mixed',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['12.5', '15', '17.5', '20', '22.5', '25'],
                suffix: '%',
                stat: 'DEF',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.horla.chamber-of-shadows', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: [
          'skill.horla.snarl-psalm',
          'skill.horla.elegy-psalm',
          'skill.horla.carol-psalm',
          'skill.horla.dirge-psalm',
        ],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.horla.snarl-psalm',
            operation: 'card_keywords',
            addCardKeywords: [{id: 'mechanic.retain'}],
          }),
          expect.objectContaining({
            targetId: 'skill.horla.elegy-psalm',
            operation: 'card_keywords',
            addCardKeywords: [{id: 'mechanic.retain'}],
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.leigh.newborn-sanguivore', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.leigh.pain-and-pleasure',
            operation: 'replace_description',
            addCardKeywords: [{id: 'mechanic.retain'}],
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.lily.viscous-devour', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.lily.strike-to-protect',
            operation: 'mixed',
            addCardKeywords: [{id: 'mechanic.prepare', value: 2}],
            removeCardKeywordIds: ['mechanic.prepare'],
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['90', '108', '126', '144', '162', '180'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.salvador.book-of-genesis', enlightens)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['0.75', '0.9', '1.05', '1.2', '1.35', '1.5'],
          },
        },
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.salvador.blessed-are-the-bones',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'gain an additional [Arg3] per turn during battle',
            ),
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['40', '42', '44', '46', '48', '50'],
              },
              Arg3: {
                kind: 'scaling',
                values: ['0.75', '0.9', '1.05', '1.2', '1.35', '1.5'],
                suffix: '%',
                stat: 'CON',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.salvador.end-of-suffering',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining("This hit's Crit. Rate +[Arg4]%"),
            descriptionArgs: {
              Arg4: {
                kind: 'fixed',
                value: '25',
              },
            },
            addCardKeywords: [{id: 'mechanic.prepare', value: 1}],
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.salvador.salvations-hand', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.salvador.he-who-protects',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Salvador obtains [Arg5]% Temporary Crit. DMG',
            ),
            descriptionArgs: {
              Arg5: {
                kind: 'fixed',
                value: '35',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.ramona.innocent-departure', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.ramona.queens-sword',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              '{Aftershock}: Obtain an equal amount of Keyflare.',
            ),
            descriptionArgs: {
              Arg4: {
                kind: 'scaling',
                values: ['2.5', '3', '3.5', '4', '4.5', '5'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg5: {
                kind: 'fixed',
                value: '3',
              },
              Arg6: {
                kind: 'fixed',
                value: '5',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.ogier.mercy-for-the-meek', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.ogier.seven-arts-and-virtues',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('obtain [Block:Arg3] Shield'),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['10', '12', '14', '16', '18', '20'],
                suffix: '%',
                stat: 'DEF',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.ogier.honesty-unto-thyself', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.ogier.piercing-strike',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('enjoys a 300% {STR} bonus'),
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['50', '60', '70', '80', '90', '100'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg2: {
                kind: 'fixed',
                value: '2',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.ogier.sacrifice-for-justice', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.ogier.unstable-barrier',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Obtain [Power:Arg2] {STR}'),
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['9', '10.8', '12.6', '14.4', '16.2', '18'],
                suffix: '%',
                stat: 'DEF',
              },
              Arg2: {
                kind: 'scaling',
                values: ['3.0', '3.6', '4.2', '4.8', '5.4', '6.0'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg3: {
                kind: 'fixed',
                value: '5',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.lotan.swords-unleashed', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.lotan.blade-of-defiance'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.lotan.blade-of-defiance',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Counts as {Strike}'),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.lotan.surging-warlust', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.lotan.tides-of-hubris'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.lotan.tides-of-hubris',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining('Treated as {Strike}'),
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['5', '6', '7', '8', '9', '10'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.lotan.timeless-solitude', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.lotan.beast-of-chaos'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.lotan.beast-of-chaos',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Add 2 {Strike} cards'),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '2',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.lotan.primal-leviathan', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.lotan.battle-thirst'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.lotan.battle-thirst',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'next {Blade of Defiance} this turn take effect 2 times',
            ),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.sanga.kneel-before-beauty', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.sanga.beautys-mercy',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'for each Tentacle, gain an additional [Arg3] Shield',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['3', '3.6', '4.2', '4.8', '5.4', '6'],
                suffix: '%',
                stat: 'DEF',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.sanga.melodic-sculpting', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.sanga.opus-of-isolation',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Gain [Block:Arg2] Shield.'),
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['8', '9.6', '11.2', '12.8', '14.4', '16'],
                suffix: '%',
                stat: 'DEF',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.sorel.flowing-rill', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.sorel.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('deal an additional 1 instance of DMG'),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '10',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.sorel.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('obtain an additional Shield'),
            descriptionArgs: {
              Arg4: {
                kind: 'fixed',
                value: '10',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.tawil.nonexistent-existence', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.tawil.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Crit. Rate and Crit. DMG, stacking up to 10 times',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '3',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.tawil.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Crit. Rate and Crit. DMG, stacking up to 10 times',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '3',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.tulu.the-stars-are-right', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.tulu.when-lemuria-returns',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Temporary Crit. Rate'),
            descriptionArgs: {
              Arg2: {
                kind: 'fixed',
                value: '15',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.tulu.touch-of-revival', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.tulu.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Temporary {Tentacle DMG} and [Power:Arg3] Temporary {STR}',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['4.0', '4.8', '5.6', '6.4', '7.2', '8.0'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.tulu.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Temporary {Tentacle DMG} and [Power:Arg3] Temporary {STR}',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['4.0', '4.8', '5.6', '6.4', '7.2', '8.0'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.nautila.blank-recollection', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.nautila.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Obtain [Counterattack:Arg3] stacks of {Counter}',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['10', '12', '14', '16', '18', '20'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.nautila.forgotten-dreams', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.nautila.ready-and-set',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Immune to {Fragile}, {Weakness}, and {Vulnerable} for 1 turn',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '150',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.ryker.certain-gain', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.ryker.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('consume 3 Black Sigils to play it twice'),
          }),
          expect.objectContaining({
            targetId: 'skill.ryker.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('consume 3 Black Sigils to play it twice'),
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.ryker.fortunes-boon', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.ryker.showdown', 'skill.ryker.unexpected-gain'],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.ryker.showdown',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'for each Critical Hit, gain an additional [Arg3] Aliemus',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '3',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.corposant.lodestars-whisper', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.corposant.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Aliemus gained the next time this card is played is increased by [Arg3]',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '5',
              },
              Arg4: {
                kind: 'scaling',
                values: ['10', '11', '12', '13', '14', '15'],
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.corposant.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'This card generates [Arg3] more Aliemus next time',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '5',
              },
              Arg4: {
                kind: 'scaling',
                values: ['10', '11', '12', '13', '14', '15'],
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.corposant.willing-sacrifice', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.corposant.to-sail-the-sundered-tides',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Temporary Crit. DMG + [Arg3]%'),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '20',
              },
              Arg4: {
                kind: 'fixed',
                value: '10',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.jenkins.red-ribbon', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.jenkins.get-em-brown'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.jenkins.get-em-brown',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('the DMG of {Swarm Impact} +[Arg3]'),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['2.5', '3', '3.5', '4', '4.5', '5'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.jenkins.obsidian-dissolution', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.jenkins.mistborn-street-urchin'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.jenkins.mistborn-street-urchin',
            operation: 'override_args',
            descriptionArgs: {
              Arg1: {
                kind: 'fixed',
                value: '4',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.murphy.inextricable-bloodline', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.murphy.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('{Tentacle DMG} +[TentaclePower:Arg3]'),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['1.5', '1.8', '2.1', '2.4', '2.7', '3'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.murphy.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('{Tentacle DMG} +[TentaclePower:Arg3]'),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['1.5', '1.8', '2.1', '2.4', '2.7', '3'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.murphy-fauxborn.profane-apocalypse', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.murphy-fauxborn.defense', 'skill.murphy-fauxborn.strike'],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.murphy-fauxborn.strike',
            operation: 'replace_description',
          }),
          expect.objectContaining({
            targetId: 'skill.murphy-fauxborn.defense',
            operation: 'replace_description',
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.murphy-fauxborn.kneelers-supplication', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.murphy-fauxborn.waltz-of-lemuria',
            operation: 'override_args',
            descriptionArgs: {
              Arg8: {
                kind: 'scaling',
                values: ['11.55', '13.86', '16.17', '18.48', '20.79', '23.1'],
                suffix: '%',
                stat: 'ATK',
                substatBonus: {
                  substat: 'KeyflareRegen',
                  multiplier: '0.2',
                  suffix: '%',
                },
              },
              Arg9: {
                kind: 'scaling',
                values: ['45.1', '54.12', '63.14', '72.16', '81.18', '90.2'],
                suffix: '%',
                stat: 'DEF',
                substatBonus: {
                  substat: 'KeyflareRegen',
                  multiplier: '0.2',
                  suffix: '%',
                },
              },
            },
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.doll-inferno.envoy-of-extinction', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradeTargetIds: expect.arrayContaining(['derived.doll-inferno.illusions-end']),
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.doll-inferno.strike',
            operation: 'override_args',
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['10', '11', '12', '13', '14', '15'],
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.doll-inferno.defense',
            operation: 'override_args',
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['10', '11', '12', '13', '14', '15'],
              },
            },
          }),
          expect.objectContaining({
            targetId: 'derived.doll-inferno.illusions-end',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              "Deal 30% of all enemies' Max HP as {Fixed DMG}.",
            ),
            descriptionArgs: {
              Arg1: {
                kind: 'fixed',
                value: '500',
              },
            },
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.doll-inferno.resonant-mycelium', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradeTargetIds: expect.arrayContaining([
          'skill.doll-inferno.terminal-of-truth-and-abyss',
          'derived.doll-inferno.fates-descent-finale',
        ]),
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.doll-inferno.terminal-of-truth-and-abyss',
            operation: 'override_args',
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['75', '90', '105', '120', '135', '150'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'derived.doll-inferno.fates-descent-finale',
            targetType: 'derived-skill',
            operation: 'override_args',
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['45', '54', '63', '72', '81', '90'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.doll.flesh-transcended', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.doll.rationality-truth-and-reality',
            operation: 'replace_description',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['40', '48', '56', '64', '72', '80'],
                suffix: '%',
                stat: 'CON',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.doll.beyond-death', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.doll.equivalent-exchange',
            operation: 'replace_description',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['30', '36', '42', '48', '54', '60'],
                suffix: '%',
                stat: 'CON',
              },
              Arg2: {
                kind: 'scaling',
                values: ['6', '7.2', '8.4', '9.6', '10.8', '12'],
                suffix: '%',
                stat: 'CON',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.doll.ego-restructured', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.doll.flesh-detached'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.doll.flesh-detached',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              "Doll's {Strike} and {Defense} also triggers Shield gain",
            ),
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.daffodil.infinite-passage', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.daffodil.strike',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('{Leap}: Obtain 1 Arithmetica'),
          }),
          expect.objectContaining({
            targetId: 'skill.daffodil.defense',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('Obtain [Power:Arg3] {STR}'),
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['1', '1.2', '1.4', '1.6', '1.8', '2'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.erica.auto-rectification', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['derived.erica.retract-mecha', 'skill.erica.unleash-mecha'],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.erica.unleash-mecha',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'Add 1 {Strike} with {Exhaust} attached by Erica to your hand',
            ),
          }),
          expect.objectContaining({
            targetId: 'derived.erica.retract-mecha',
            targetType: 'derived-skill',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              "Place 1 of Erica's {Defense} with {Exhaust} into hand",
            ),
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.lily.viscous-devour', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.lily.strike-to-protect',
            operation: 'mixed',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['90', '108', '126', '144', '162', '180'],
                suffix: '%',
                stat: 'ATK',
              },
            },
            addCardKeywords: [{id: 'mechanic.prepare', value: 2}],
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.erica.force-circuit', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.erica.electromagnetic-blast',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining(
              'This skill additionally enjoys a [Arg7]x {STR} and {Alert} bonus.',
            ),
            descriptionArgs: {
              Arg7: {
                kind: 'fixed',
                value: '1',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.agrippa.spider-queens-kiss', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.agrippa.colorless-spiral',
            operation: 'mixed',
            descriptionArgs: {
              Arg1: {
                kind: 'scaling',
                values: ['22.5', '27', '31.5', '36', '40.5', '45'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg2: {
                kind: 'fixed',
                value: '20',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.thais.forests-embrace', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.thais.ancient-caress',
            operation: 'override_args',
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['3.75', '4.5', '5.25', '6', '6.75', '7.5'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'derived.thais.blood-of-coition',
            targetType: 'derived-skill',
            operation: 'override_args',
            descriptionArgs: {
              Arg1: {
                kind: 'fixed',
                value: '40',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.thais.seed-of-chaos', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.thais.ritual-of-abundance',
            operation: 'override_args',
            descriptionArgs: {
              Arg6: {
                kind: 'fixed',
                value: '2',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.winkle.forsaken-homeland', enlightens)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['5', '6', '7', '8', '9', '10'],
          },
        },
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.winkle.psyche-reforged',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'gain [Block:Arg2] points of Delayed Shield',
            ),
            descriptionArgs: {
              Arg2: {
                kind: 'scaling',
                values: ['5', '6', '7', '8', '9', '10'],
                suffix: '%',
                stat: 'DEF',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.caecus.spike-amalgamation', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.caecus.protective-scales',
            operation: 'mixed',
            addCardKeywords: [{id: 'mechanic.retain'}],
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.xu.fan-and-scythe', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.xu.defense', 'skill.xu.strike'],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.xu.strike',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining(
              '{Resonance 3}: Additionally gain [Energy:Arg3] Aliemus.',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '15',
              },
            },
          }),
          expect.objectContaining({
            targetId: 'skill.xu.defense',
            operation: 'mixed',
            descriptionTemplate: expect.stringContaining(
              '{Resonance 3}: Additionally gain [Energy:Arg3] Aliemus.',
            ),
            descriptionArgs: {
              Arg3: {
                kind: 'fixed',
                value: '15',
              },
            },
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.xu.enmity-of-the-heart', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: ['skill.xu.bonesick-longing'],
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.xu.bonesick-longing',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining('{Embryo Fusion} +[Arg6]%.'),
            descriptionArgs: {
              Arg6: {
                kind: 'fixed',
                value: '15',
                substatBonus: {
                  substat: 'DamageAmplification',
                  multiplier: '0.2',
                  suffix: '%',
                },
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.pandia.youre-being-naughty', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: [
          expect.objectContaining({
            targetId: 'skill.pandia.honey-colored-tragedy',
            operation: 'mixed',
            descriptionArgs: {
              Arg3: {
                kind: 'scaling',
                values: ['2.5', '3', '3.5', '4', '4.5', '5'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg4: {
                kind: 'scaling',
                values: ['15', '18', '21', '24', '27', '30'],
                suffix: '%',
                stat: 'ATK',
              },
            },
          }),
        ],
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.doll-inferno.borealis-visitor', enlightens)).toEqual(
      expect.objectContaining({
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'derived.doll-inferno.elation',
            targetType: 'derived-skill',
          }),
          expect.objectContaining({
            targetId: 'derived.doll-inferno.curse',
            targetType: 'derived-skill',
          }),
        ]),
      }),
    )

    expect(
      getAwakenerEnlightenById('enlighten.helot-catena.vengeance-unchained', enlightens),
    ).toEqual(
      expect.objectContaining({
        upgradeTargetIds: [
          'derived.helot-catena.bloodthirsty-flail',
          'skill.helot-catena.hatred-unleashed',
        ],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.helot-catena.hatred-unleashed',
            operation: 'replace_description',
            descriptionTemplate: expect.stringContaining(
              'If HP is below 50%, the gained {STR} is doubled',
            ),
          }),
          expect.objectContaining({
            targetId: 'derived.helot-catena.bloodthirsty-flail',
            targetType: 'derived-skill',
            operation: 'card_keywords',
            addCardKeywords: [{id: 'mechanic.prepare', value: 2}],
          }),
        ]),
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.miryam.vanitys-collapse', enlightens)).toEqual(
      expect.objectContaining({
        upgradeTargetIds: [
          'skill.miryam.strike',
          'skill.miryam.defense',
          'skill.miryam.exalted-pyre',
          'skill.miryam.the-chosen-one',
        ],
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'skill.miryam.defense',
            operation: 'override_args',
            descriptionArgs: expect.objectContaining({
              Arg3: {
                kind: 'scaling',
                values: ['6.5', '7.8', '9.1', '10.4', '11.7', '13'],
                suffix: '%',
                stat: 'ATK',
              },
            }),
          }),
          expect.objectContaining({
            targetId: 'skill.miryam.exalted-pyre',
            operation: 'override_args',
            descriptionArgs: expect.objectContaining({
              Arg3: {
                kind: 'scaling',
                values: ['1.3', '1.56', '1.82', '2.08', '2.34', '2.6'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg4: {
                kind: 'scaling',
                values: ['9.75', '11.7', '13.65', '15.6', '17.55', '19.5'],
                suffix: '%',
                stat: 'ATK',
              },
              Arg5: {
                kind: 'scaling',
                values: ['19.5', '23.4', '27.3', '31.2', '35.1', '39'],
                suffix: '%',
                stat: 'ATK',
              },
            }),
          }),
        ]),
      }),
    )
  })

  it('supports lookup by owner awakener id', () => {
    const enlightens = getAwakenerEnlightens()
    const ericaEnlightens = getAwakenerEnlightensForAwakener(15, enlightens)

    expect(ericaEnlightens.map((entry) => entry.slot)).toEqual(
      expect.arrayContaining(['E1', 'E2', 'E3', 'AbsoluteAxiom']),
    )
  })

  it('stores multiline descriptions as real newlines instead of escaped literals', () => {
    const enlightens = getAwakenerEnlightens()
    const horlaEnlighten = getAwakenerEnlightenById(
      'enlighten.horla.blossoms-and-verses-reunited',
      enlightens,
    )

    expect(horlaEnlighten?.descriptionTemplate).toContain('\n')
    expect(horlaEnlighten?.descriptionTemplate).not.toContain('\\n')
  })

  it('cleans malformed quote-heavy enlighten descriptions into canonical rich-text terms', () => {
    const enlightens = getAwakenerEnlightens()

    expect(
      getAwakenerEnlightenById('enlighten.clementine.you-will-recover', enlightens)
        ?.descriptionTemplate,
    ).toBe(
      'At turn end, obtain 2 stacks of {Symbiosis}. The stacking limit for {Symbiosis}, {Psychic Trauma}, and {Phobic Fixation} is increased to 15.',
    )

    expect(
      getAwakenerEnlightenById('enlighten.karen.creamy-frosting', enlightens)?.descriptionTemplate,
    ).toBe("The {Toad Stew}'s {Poison} and HP Recovery effects are increased by 25%.")
  })

  it('supports overlay upgrade patches for reviewed enlighten mechanics', () => {
    const enlightens = getAwakenerEnlightens()

    expect(
      getAwakenerEnlightenById('enlighten.clementine.you-will-recover', enlightens),
    ).toMatchObject({
      upgradeTargetIds: [
        'overlay.clementine.phobic-fixation',
        'overlay.clementine.psychic-trauma',
        'overlay.clementine.symbiosis',
      ],
      upgradePatches: expect.arrayContaining([
        expect.objectContaining({
          targetId: 'overlay.clementine.phobic-fixation',
          targetType: 'overlay',
          operation: 'replace_description',
          descriptionTemplate: expect.stringContaining('stacking up to 15 stacks'),
        }),
        expect.objectContaining({
          targetId: 'overlay.clementine.symbiosis',
          targetType: 'overlay',
          operation: 'replace_description',
          descriptionTemplate: expect.stringContaining('stacking up to 15 stacks'),
        }),
      ]),
    })

    expect(getAwakenerEnlightenById('enlighten.hameln.oneiric-waltz', enlightens)).toMatchObject({
      upgradeTargetIds: ['overlay.hameln.rondino'],
      upgradePatches: [
        expect.objectContaining({
          targetId: 'overlay.hameln.rondino',
          targetType: 'overlay',
          operation: 'replace_description',
          descriptionTemplate:
            'Arithmetica Cost -2, takes effect 2 times, then changes to {Crescendo}',
        }),
      ],
    })

    expect(getAwakenerEnlightenById('enlighten.wanda.lakeborne-dweller', enlightens)).toMatchObject(
      {
        upgradeTargetIds: expect.arrayContaining(['overlay.wanda.murmurs']),
        upgradePatches: expect.arrayContaining([
          expect.objectContaining({
            targetId: 'overlay.wanda.murmurs',
            targetType: 'overlay',
            operation: 'override_args',
            descriptionArgs: {
              StateArg1: {
                kind: 'fixed',
                value: '65',
              },
            },
          }),
        ]),
      },
    )

    expect(getAwakenerEnlightenById('enlighten.xu.nirvanas-kiss', enlightens)).toMatchObject({
      upgradeTargetIds: expect.arrayContaining(['overlay.xu.spellbound']),
      upgradePatches: expect.arrayContaining([
        expect.objectContaining({
          targetId: 'overlay.xu.spellbound',
          targetType: 'overlay',
          operation: 'override_args',
          descriptionArgs: {
            DescArg2: {
              kind: 'fixed',
              value: '10',
            },
          },
        }),
      ]),
    })
  })
})
