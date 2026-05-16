import {vi} from 'vitest'

export interface MockPublicDetailRecord {
  id: string
}

export interface MockPublicCatalog {
  awakeners: {
    aliases: string[]
    faction: string
    id: string
    lineupToken?: string
    name: string
    numericId: number
    rarity: string
    realm: string
    stats: {ATK: number; CON: number; DEF: number}
    tags: string[]
    type: string
  }[]
  covenants: {
    assetId: string
    id: string
    lineupToken: string
    name: string
  }[]
  posses: {
    id: string
    index: number
    isFadedLegacy: boolean
    awakenerName?: string
    lineupToken: string
    name: string
    realm: string
  }[]
  wheels: {
    aliases: string[]
    assetId: string
    awakener: string
    id: string
    lineupToken?: string
    mainstatKey: string
    name: string
    ownerAwakenerId?: string
    ownerAwakenerName?: string
    rarity: string
    realm: string
    tags: string[]
  }[]
}

const DEFAULT_PUBLIC_DETAIL_IDS = {
  awakeners: ['awakener-0001', 'awakener-0002', 'awakener-0003'],
  covenants: ['covenant-0001', 'covenant-0002'],
  posses: ['posse-0001', 'posse-0002'],
  wheels: ['wheel-0001', 'wheel-0040'],
} as const

type MockPublicAwakener = MockPublicCatalog['awakeners'][number]
type MockPublicCovenant = MockPublicCatalog['covenants'][number]
type MockPublicPosse = MockPublicCatalog['posses'][number]
type MockPublicWheel = MockPublicCatalog['wheels'][number]

type MockPublicAwakenerInput = Pick<MockPublicAwakener, 'id' | 'name' | 'numericId'> &
  Partial<MockPublicAwakener>
type MockPublicCovenantInput = Pick<MockPublicCovenant, 'assetId' | 'id' | 'name'> &
  Partial<MockPublicCovenant>
type MockPublicPosseInput = Pick<MockPublicPosse, 'id' | 'index' | 'name'> &
  Partial<MockPublicPosse>
type MockPublicWheelInput = Pick<MockPublicWheel, 'assetId' | 'id' | 'name'> &
  Partial<MockPublicWheel>

function recordsFromIds(ids: readonly string[]): MockPublicDetailRecord[] {
  return ids.map((id) => ({id}))
}

export function createMockPublicAwakener({
  aliases,
  faction = 'The Fools',
  realm = 'CHAOS',
  rarity = 'SSR',
  stats,
  tags = [],
  type = 'ASSAULT',
  ...awakener
}: MockPublicAwakenerInput): MockPublicAwakener {
  return {
    aliases: aliases ?? [awakener.name],
    faction,
    realm,
    rarity,
    stats: stats ?? {CON: 100, ATK: 100, DEF: 100},
    tags,
    type,
    ...awakener,
  }
}

export function createMockPublicCovenant({
  lineupToken,
  ...covenant
}: MockPublicCovenantInput): MockPublicCovenant {
  return {
    lineupToken: lineupToken ?? covenant.name,
    ...covenant,
  }
}

export function createMockPublicPosse({
  isFadedLegacy = false,
  lineupToken,
  realm = 'CHAOS',
  ...posse
}: MockPublicPosseInput): MockPublicPosse {
  return {
    isFadedLegacy,
    lineupToken: lineupToken ?? posse.name,
    realm,
    ...posse,
  }
}

export function createMockPublicWheel({
  aliases,
  awakener = '',
  mainstatKey = 'ATK',
  rarity = 'SSR',
  realm = 'NEUTRAL',
  tags = [],
  ...wheel
}: MockPublicWheelInput): MockPublicWheel {
  return {
    aliases: aliases ?? [wheel.name],
    awakener,
    mainstatKey,
    rarity,
    realm,
    tags,
    ...wheel,
  }
}

export function createMockPublicCatalog(
  overrides: Partial<MockPublicCatalog> = {},
): MockPublicCatalog {
  return {
    awakeners: overrides.awakeners ?? [
      createMockPublicAwakener({
        id: 'awakener-0001',
        numericId: 1,
        name: 'alpha',
        faction: 'The Fools',
        realm: 'CHAOS',
        rarity: 'SSR',
        type: 'ASSAULT',
        aliases: ['alpha'],
        stats: {CON: 100, ATK: 200, DEF: 80},
        tags: ['Bleed', 'Crit'],
      }),
      createMockPublicAwakener({
        id: 'awakener-0002',
        numericId: 2,
        name: 'beta',
        faction: 'Outlanders',
        realm: 'AEQUOR',
        rarity: 'SR',
        type: 'WARDEN',
        aliases: ['beta'],
        stats: {CON: 150, ATK: 90, DEF: 180},
        tags: ['Draw', 'STR Up'],
      }),
      createMockPublicAwakener({
        id: 'awakener-0003',
        numericId: 3,
        name: 'gamma',
        faction: 'Hybrid',
        realm: 'CHAOS',
        rarity: 'Genesis',
        type: 'CHORUS',
        aliases: ['gamma'],
        stats: {CON: 120, ATK: 150, DEF: 130},
        tags: ['Heal', 'Bleed'],
      }),
    ],
    covenants: overrides.covenants ?? [
      createMockPublicCovenant({
        id: 'covenant-0001',
        assetId: 'Icon_Covenant_01',
        name: 'Oath of Glass',
        lineupToken: 'oath-of-glass',
      }),
      createMockPublicCovenant({
        id: 'covenant-0002',
        assetId: 'Icon_Covenant_02',
        name: 'Iron Promise',
        lineupToken: 'iron-promise',
      }),
    ],
    posses: overrides.posses ?? [
      createMockPublicPosse({
        id: 'posse-0001',
        index: 1,
        name: 'Silent Sigil',
        realm: 'CHAOS',
        lineupToken: 'silent-sigil',
      }),
      createMockPublicPosse({
        id: 'posse-0002',
        index: 2,
        name: 'Aequor Banner',
        realm: 'AEQUOR',
        lineupToken: 'aequor-banner',
      }),
    ],
    wheels: overrides.wheels ?? [
      createMockPublicWheel({
        id: 'wheel-0001',
        assetId: 'Weapon_Full_B01',
        name: 'Merciful Nurturing',
        rarity: 'SSR',
        realm: 'CARO',
        awakener: 'alpha',
        ownerAwakenerId: 'awakener-0001',
        ownerAwakenerName: 'alpha',
        aliases: ['Merciful Nurturing'],
        tags: ['Caro', 'Embryo Fusion'],
        mainstatKey: 'KEYFLARE_REGEN',
      }),
      createMockPublicWheel({
        id: 'wheel-0040',
        assetId: 'Weapon_Full_D12',
        name: 'Shared Dream',
        rarity: 'SR',
        realm: 'CHAOS',
        awakener: '',
        aliases: ['Shared Dream'],
        tags: ['Chaos'],
        mainstatKey: 'CRIT_RATE',
      }),
      createMockPublicWheel({
        id: 'wheel-9999',
        assetId: 'Weapon_Full_N07',
        name: 'Quiet Orbit',
        rarity: 'R',
        realm: 'NEUTRAL',
        awakener: '',
        aliases: ['Quiet Orbit'],
        tags: ['Neutral'],
        mainstatKey: 'HP',
      }),
    ],
  }
}

function createCachedPublicDetailLoader(getDetails: () => MockPublicDetailRecord[]) {
  let promiseCache = new Map<string, Promise<MockPublicDetailRecord | undefined>>()

  function loadPublicDetailById(id: string): Promise<MockPublicDetailRecord | undefined> {
    const cachedPromise = promiseCache.get(id)
    if (cachedPromise) {
      return cachedPromise
    }

    const recordPromise = Promise.resolve(getDetails().find((entry) => entry.id === id))
    promiseCache.set(id, recordPromise)

    return recordPromise
  }

  const load = vi.fn(loadPublicDetailById)

  return {
    clearCache() {
      promiseCache = new Map()
    },
    load,
    resetMock() {
      load.mockReset()
      load.mockImplementation(loadPublicDetailById)
    },
  }
}

export function createMockPublicDetailLoaders() {
  let awakenerDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.awakeners)
  let covenantDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.covenants)
  let posseDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.posses)
  let wheelDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.wheels)

  const awakeners = createCachedPublicDetailLoader(() => awakenerDetails)
  const covenants = createCachedPublicDetailLoader(() => covenantDetails)
  const posses = createCachedPublicDetailLoader(() => posseDetails)
  const wheels = createCachedPublicDetailLoader(() => wheelDetails)

  function clearCaches() {
    awakeners.clearCache()
    covenants.clearCache()
    posses.clearCache()
    wheels.clearCache()
  }

  function resetMocks() {
    awakeners.resetMock()
    covenants.resetMock()
    posses.resetMock()
    wheels.resetMock()
  }

  return {
    loadPublicAwakenerDetailById: awakeners.load,
    loadPublicCovenantDetailById: covenants.load,
    loadPublicPosseDetailById: posses.load,
    loadPublicWheelDetailById: wheels.load,
    reset() {
      awakenerDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.awakeners)
      covenantDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.covenants)
      posseDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.posses)
      wheelDetails = recordsFromIds(DEFAULT_PUBLIC_DETAIL_IDS.wheels)
      clearCaches()
      resetMocks()
    },
    setAwakenerDetails(records: MockPublicDetailRecord[]) {
      awakenerDetails = records
      awakeners.clearCache()
    },
    setCovenantDetails(records: MockPublicDetailRecord[]) {
      covenantDetails = records
      covenants.clearCache()
    },
    setPosseDetails(records: MockPublicDetailRecord[]) {
      posseDetails = records
      posses.clearCache()
    },
    setWheelDetails(records: MockPublicDetailRecord[]) {
      wheelDetails = records
      wheels.clearCache()
    },
  }
}
