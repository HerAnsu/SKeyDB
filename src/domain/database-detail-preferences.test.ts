import {describe, expect, it} from 'vitest'

import type {AwakenerFullV2Record} from './awakeners-full-v2'
import {
  DEFAULT_DATABASE_DETAIL_PREFERENCES,
  normalizeDatabaseDetailPreferences,
  readDatabaseDetailPreferences,
  resolveDatabaseDetailDefaultSelection,
  writeDatabaseDetailPreferences,
} from './database-detail-preferences'

function createStorage(initial: Record<string, string> = {}) {
  const state = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return state.get(key) ?? null
    },
    setItem(key: string, value: string) {
      state.set(key, value)
    },
    removeItem(key: string) {
      state.delete(key)
    },
  }
}

describe('database-detail-preferences', () => {
  it('normalizes persisted preferences and falls back on invalid values', () => {
    expect(
      normalizeDatabaseDetailPreferences({
        showVisibleScaling: false,
        showTagIcons: false,
        clickOutsideClosesPopovers: false,
        fontScale: 'large',
        defaultSelection: {
          awakenerLevel: 999,
          psycheSurgeOffset: -5,
          skillLevel: 9,
          selectedEnlightenSlot: 'AbsoluteAxiom',
          soulforgeLevel: -2,
        },
      }),
    ).toEqual({
      showVisibleScaling: false,
      showTagIcons: false,
      clickOutsideClosesPopovers: false,
      fontScale: 'large',
      defaultSelection: {
        awakenerLevel: 90,
        psycheSurgeOffset: 0,
        skillLevel: 6,
        selectedEnlightenSlot: 'AbsoluteAxiom',
        soulforgeLevel: 0,
      },
    })
  })

  it('reads stored preferences safely and ignores invalid payloads', () => {
    const validStorage = createStorage({
      'database-detail-preferences': JSON.stringify({
        showVisibleScaling: false,
        showTagIcons: false,
        clickOutsideClosesPopovers: false,
        fontScale: 'medium',
        defaultSelection: {
          awakenerLevel: 90,
          psycheSurgeOffset: 2,
          skillLevel: 4,
          selectedEnlightenSlot: 'E2',
          soulforgeLevel: 3,
        },
      }),
    })

    expect(readDatabaseDetailPreferences(validStorage)).toEqual({
      showVisibleScaling: false,
      showTagIcons: false,
      clickOutsideClosesPopovers: false,
      fontScale: 'medium',
      defaultSelection: {
        awakenerLevel: 90,
        psycheSurgeOffset: 2,
        skillLevel: 4,
        selectedEnlightenSlot: 'E2',
        soulforgeLevel: 3,
      },
    })

    const invalidStorage = createStorage({
      'database-detail-preferences': '{not json',
    })

    expect(readDatabaseDetailPreferences(invalidStorage)).toEqual(
      DEFAULT_DATABASE_DETAIL_PREFERENCES,
    )
  })

  it('writes normalized preferences for later sessions', () => {
    const storage = createStorage()

    expect(
      writeDatabaseDetailPreferences(
        {
          showVisibleScaling: false,
          clickOutsideClosesPopovers: false,
          fontScale: 'medium',
          defaultSelection: {
            awakenerLevel: 70,
            psycheSurgeOffset: 1,
            skillLevel: 3,
            selectedEnlightenSlot: 'E1',
            soulforgeLevel: 2,
          },
        },
        storage,
      ),
    ).toBe(true)

    expect(JSON.parse(storage.getItem('database-detail-preferences') ?? 'null')).toEqual({
      showVisibleScaling: false,
      showTagIcons: true,
      clickOutsideClosesPopovers: false,
      fontScale: 'medium',
      defaultSelection: {
        awakenerLevel: 70,
        psycheSurgeOffset: 1,
        skillLevel: 3,
        selectedEnlightenSlot: 'E1',
        soulforgeLevel: 2,
      },
    })
  })

  it('resolves persisted defaults against an awakener contract', () => {
    const record = buildRecord()

    expect(
      resolveDatabaseDetailDefaultSelection(record, {
        ...DEFAULT_DATABASE_DETAIL_PREFERENCES,
        defaultSelection: {
          awakenerLevel: 90,
          psycheSurgeOffset: 4,
          skillLevel: 5,
          selectedEnlightenSlot: 'AbsoluteAxiom',
          soulforgeLevel: 8,
        },
      }),
    ).toEqual({
      awakenerLevel: 90,
      psycheSurgeOffset: 4,
      skillLevel: 5,
      selectedEnlightenSlot: 'E3',
      soulforgeLevel: 3,
    })
  })
})

function buildRecord(): AwakenerFullV2Record {
  return {
    id: 1,
    key: 'test',
    displayName: 'Test',
    aliases: ['test'],
    faction: 'Test',
    realm: 'CHAOS',
    rarity: 'SSR',
    type: 'ASSAULT',
    stats: {
      CON: '100',
      ATK: '100',
      DEF: '100',
      CritRate: '5%',
      CritDamage: '50%',
      AliemusRegen: '0',
      KeyflareRegen: '15',
      RealmMastery: '0',
      SigilYield: '0%',
      DamageAmplification: '0%',
      DeathResistance: '0%',
    },
    primaryScalingBase: 20,
    statScaling: {CON: 1, ATK: 1, DEF: 1},
    substatScaling: {},
    assets: {portraitKey: 'test', iconKey: 'test'},
    searchTags: [],
    cards: {
      C1: {
        id: 'skill.test.c1',
        ownerAwakenerId: 1,
        kind: 'rouse',
        displayName: 'Rouse',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C2: {
        id: 'skill.test.c2',
        ownerAwakenerId: 1,
        kind: 'strike',
        displayName: 'Strike',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C3: {
        id: 'skill.test.c3',
        ownerAwakenerId: 1,
        kind: 'defense',
        displayName: 'Defense',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C4: {
        id: 'skill.test.c4',
        ownerAwakenerId: 1,
        kind: 'command',
        displayName: 'C4',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
        cost: '1',
      },
      C5: {
        id: 'skill.test.c5',
        ownerAwakenerId: 1,
        kind: 'command',
        displayName: 'C5',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
        cost: '1',
      },
      Exalt: {
        id: 'skill.test.exalt',
        ownerAwakenerId: 1,
        kind: 'exalt',
        displayName: 'Exalt',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      promotedExtras: [],
    },
    talents: {
      T1: undefined,
      T2: undefined,
      T3: {
        id: 'talent.test.soulforge-aptitude',
        ownerAwakenerId: 1,
        displayName: 'Soulforge Aptitude',
        descriptionTemplate: '',
        descriptionArgs: {},
        hasLevelScaledDescription: true,
        maxLevel: 3,
        upgradeTargetIds: [],
        upgradePatches: [],
      },
      T4: undefined,
      extraTalents: [],
    },
    enlightens: {
      E1: {
        id: 'enlighten.test.e1',
        ownerAwakenerId: 1,
        slot: 'E1',
        displayName: 'E1',
        descriptionTemplate: '',
        descriptionArgs: {},
        upgradeTargetIds: [],
        upgradePatches: [],
      },
      E2: {
        id: 'enlighten.test.e2',
        ownerAwakenerId: 1,
        slot: 'E2',
        displayName: 'E2',
        descriptionTemplate: '',
        descriptionArgs: {},
        upgradeTargetIds: [],
        upgradePatches: [],
      },
      E3: {
        id: 'enlighten.test.e3',
        ownerAwakenerId: 1,
        slot: 'E3',
        displayName: 'E3',
        descriptionTemplate: '',
        descriptionArgs: {},
        upgradeTargetIds: [],
        upgradePatches: [],
      },
      AbsoluteAxiom: undefined,
    },
    derivedSkills: [],
  }
}
