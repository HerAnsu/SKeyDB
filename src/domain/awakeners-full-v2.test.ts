import {describe, expect, it} from 'vitest'

import type {
  AwakenerEnlightenRecord,
  AwakenerKitRecord,
  AwakenerRosterRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'
import {getAwakenersFullV2} from './awakeners-full-v2'
import {compileCanonicalAwakenersFullV2} from './awakeners-full-v2-canonical'
import {compileAwakenersFullV2} from './awakeners-full-v2-compiler'

function buildRosterRecord(): AwakenerRosterRecord {
  return {
    id: 17,
    key: 'celeste',
    displayName: 'Celeste',
    aliases: [],
    faction: 'Test',
    realm: 'Test',
    stats: {
      CON: '100',
      ATK: '120',
      DEF: '80',
      CritRate: '10%',
      CritDamage: '50%',
      AliemusRegen: '2',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    },
    primaryScalingBase: 20,
    statScaling: {
      CON: 1.2,
      ATK: 1.4,
      DEF: 1.1,
    },
    substatScaling: {},
    assets: {
      portraitKey: 'celeste',
      iconKey: 'celeste',
    },
  }
}

function buildSkillRecord(
  id: string,
  displayName: string,
  kind: AwakenerSkillRecord['kind'],
): AwakenerSkillRecord {
  return {
    id,
    ownerAwakenerId: 17,
    kind,
    displayName,
    descriptionTemplate: `${displayName} description`,
    descriptionArgs: {},
    cardKeywords: [],
    variants: [],
  }
}

function buildTalentRecord(id: string, displayName: string): AwakenerTalentRecord {
  return {
    id,
    ownerAwakenerId: 17,
    displayName,
    descriptionTemplate: `${displayName} description`,
    descriptionArgs: {},
    upgradeTargetIds: [],
    upgradePatches: [],
  }
}

function buildEnlightenRecord(
  id: string,
  slot: AwakenerEnlightenRecord['slot'],
  displayName: string,
): AwakenerEnlightenRecord {
  return {
    id,
    ownerAwakenerId: 17,
    slot,
    displayName,
    descriptionTemplate: `${displayName} description`,
    descriptionArgs: {},
    upgradeTargetIds: ['skill.celeste.everlasting-phantasm'],
    upgradePatches: [
      {
        targetId: 'skill.celeste.everlasting-phantasm',
        targetType: 'skill',
        operation: 'card_keywords',
        addCardKeywords: [{id: 'mechanic.retain'}],
      },
    ],
  }
}

function buildDerivedRecord(id: string, displayName: string): DerivedSkillRecord {
  return {
    id,
    ownerAwakenerId: 17,
    displayName,
    descriptionTemplate: `${displayName} description`,
    descriptionArgs: {},
    childDerivedSkillIds: [],
    cardKeywords: [],
    variants: [],
  }
}

describe('awakeners-full-v2', () => {
  it('compiles aggregated awakener records from canonical datasets only', () => {
    const roster: AwakenerRosterRecord[] = [buildRosterRecord()]
    const kits: AwakenerKitRecord[] = [
      {
        awakenerId: 17,
        cards: {
          C1: 'skill.celeste.strike',
          C2: 'skill.celeste.defense',
          C3: 'skill.celeste.tintless-dream',
          C4: 'skill.celeste.everlasting-phantasm',
          C5: 'skill.celeste.power-of-blessing',
          Exalt: 'skill.celeste.undying-bird-of-paradise',
          OverExalt: 'skill.celeste.absolution',
          promotedExtras: ['derived.celeste.mirage'],
        },
        talents: {
          T1: 'talent.celeste.voyage-horn',
          T2: 'talent.celeste.star-trail',
          extraTalentIds: ['talent.celeste.soulforge-aptitude'],
        },
        enlightens: {
          E1: 'enlighten.celeste.solitary-mast',
          E2: 'enlighten.celeste.ancestral-beacon',
          E3: 'enlighten.celeste.beyond-joy-and-sorrow',
        },
      },
    ]
    const skills: AwakenerSkillRecord[] = [
      buildSkillRecord('skill.celeste.strike', 'Strike', 'strike'),
      buildSkillRecord('skill.celeste.defense', 'Defense', 'defense'),
      buildSkillRecord('skill.celeste.tintless-dream', 'Tintless Dream', 'rouse'),
      buildSkillRecord('skill.celeste.everlasting-phantasm', 'Everlasting Phantasm', 'command'),
      buildSkillRecord('skill.celeste.power-of-blessing', 'Power of Blessing', 'command'),
      buildSkillRecord(
        'skill.celeste.undying-bird-of-paradise',
        'Undying Bird of Paradise',
        'exalt',
      ),
      buildSkillRecord('skill.celeste.absolution', 'Absolution', 'over_exalt'),
    ]
    const talents: AwakenerTalentRecord[] = [
      buildTalentRecord('talent.celeste.voyage-horn', 'Voyage Horn'),
      buildTalentRecord('talent.celeste.star-trail', 'Star Trail'),
      buildTalentRecord('talent.celeste.soulforge-aptitude', 'Soulforge Aptitude'),
    ]
    const enlightens: AwakenerEnlightenRecord[] = [
      buildEnlightenRecord('enlighten.celeste.solitary-mast', 'E1', 'Solitary Mast'),
      buildEnlightenRecord('enlighten.celeste.ancestral-beacon', 'E2', 'Ancestral Beacon'),
      buildEnlightenRecord(
        'enlighten.celeste.beyond-joy-and-sorrow',
        'E3',
        'Beyond Joy and Sorrow',
      ),
    ]
    const derivedSkills: DerivedSkillRecord[] = [
      buildDerivedRecord('derived.celeste.mirage', 'Mirage'),
      {
        ...buildDerivedRecord('derived.other.unused', 'Unused'),
        ownerAwakenerId: 999,
      },
    ]

    const compiled = compileAwakenersFullV2({
      roster,
      kits,
      skills,
      talents,
      enlightens,
      derivedSkills,
    })

    expect(compiled).toHaveLength(1)
    expect(compiled[0]?.cards.C1.id).toBe('skill.celeste.strike')
    expect(compiled[0]?.cards.Exalt.kind).toBe('exalt')
    expect(compiled[0]?.cards.OverExalt?.id).toBe('skill.celeste.absolution')
    expect(compiled[0]?.cards.promotedExtras.map((entry) => entry.id)).toEqual([
      'derived.celeste.mirage',
    ])
    expect(compiled[0]?.talents.T2?.id).toBe('talent.celeste.star-trail')
    expect(compiled[0]?.talents.extraTalents.map((entry) => entry.id)).toEqual([
      'talent.celeste.soulforge-aptitude',
    ])
    expect(compiled[0]?.enlightens.E1.upgradePatches).toEqual([
      {
        targetId: 'skill.celeste.everlasting-phantasm',
        targetType: 'skill',
        operation: 'card_keywords',
        addCardKeywords: [{id: 'mechanic.retain'}],
      },
    ])
    expect(compiled[0]?.derivedSkills.map((entry) => entry.id)).toEqual(['derived.celeste.mirage'])
  })

  it('fails fast when kits reference missing canonical records', () => {
    expect(() =>
      compileAwakenersFullV2({
        roster: [buildRosterRecord()],
        kits: [
          {
            awakenerId: 17,
            cards: {
              C1: 'skill.celeste.strike',
              C2: 'missing.skill',
              C3: 'skill.celeste.tintless-dream',
              C4: 'skill.celeste.everlasting-phantasm',
              C5: 'skill.celeste.power-of-blessing',
              Exalt: 'skill.celeste.undying-bird-of-paradise',
              promotedExtras: [],
            },
            talents: {
              extraTalentIds: [],
            },
            enlightens: {
              E1: 'enlighten.celeste.solitary-mast',
              E2: 'enlighten.celeste.ancestral-beacon',
              E3: 'enlighten.celeste.beyond-joy-and-sorrow',
            },
          },
        ],
        skills: [buildSkillRecord('skill.celeste.strike', 'Strike', 'strike')],
        talents: [],
        enlightens: [
          buildEnlightenRecord('enlighten.celeste.solitary-mast', 'E1', 'Solitary Mast'),
          buildEnlightenRecord('enlighten.celeste.ancestral-beacon', 'E2', 'Ancestral Beacon'),
          buildEnlightenRecord(
            'enlighten.celeste.beyond-joy-and-sorrow',
            'E3',
            'Beyond Joy and Sorrow',
          ),
        ],
        derivedSkills: [],
      }),
    ).toThrow('Missing canonical skill record "missing.skill" for awakener 17 slot C2.')
  })

  it('keeps the generated compiled dataset in sync with the canonical compiler', () => {
    const compiledFromArtifact = getAwakenersFullV2()
    const compiledFromCanonical = compileCanonicalAwakenersFullV2()

    expect(compiledFromArtifact).toEqual(compiledFromCanonical)
  })

  it('keeps reviewed promoted extra cards in the generated dataset', () => {
    const compiled = getAwakenersFullV2()

    expect(compiled.find((entry) => entry.key === 'castor')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.castor.onyx-plume',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'corposant')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.corposant.pilot',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'doll-inferno')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.doll-inferno.illusions-end',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'doresain')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.doresain.evernights-revel',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'helot-catena')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.helot-catena.bloodthirsty-flail',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'jenkins')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.jenkins.swarm-impact',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'kathigu-ra')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.kathigu-ra.hyperflare',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'liz')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.liz.corrupted-flames',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'pollux')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.pollux.sacred-heart',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'tawil')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.tawil.twin-wings',
        }),
        expect.objectContaining({
          id: 'derived.tawil.four-wings',
        }),
        expect.objectContaining({
          id: 'derived.tawil.six-wings',
        }),
      ]),
    )
    expect(compiled.find((entry) => entry.key === 'vortice')?.cards.promotedExtras).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'derived.vortice.vortex-shell',
        }),
      ]),
    )
  })
})
