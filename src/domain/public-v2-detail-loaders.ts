import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'
import type {PublicDataScope, PublicRecord} from '@/data-access/public-data/contract'
import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {type CovenantFullV2Record} from './covenants-full-v2'
import {type PosseFullV2Record} from './posses-full-v2'
import {buildWheelMainstatSeriesKey, type WheelMainstatKey} from './wheel-mainstat-scaling'
import {type WheelFullV2Record} from './wheels-full-v2'

type PublicV3AwakenerRecord = PublicRecord & {
  aliases?: string[]
  assets?: {portraitKey?: string}
  baseStatsLv1?: Partial<Record<string, number>>
  name: string
  numericId: number
  searchTags?: string[]
  substatsLv1?: Partial<Record<string, number>>
  substatScaling?: Partial<Record<string, number>>
}
type PublicV3DerivedSkillRecord = PublicRecord & {
  cardKeywords?: unknown[]
  childDerivedSkillIds?: string[]
  ownerAwakenerId?: string
  upgrades?: PublicV3UpgradeEntry[]
}
type PublicV3EnlightenRecord = PublicRecord & {
  ownerAwakenerId?: string
  slot?: string
}
type PublicV3OverlayRecord = PublicRecord & {
  ownerAwakenerId?: string
  upgrades?: PublicV3UpgradeEntry[]
}
type PublicV3SkillRecord = PublicRecord & {
  ownerAwakenerId?: string
  slot?: string
  upgrades?: PublicV3UpgradeEntry[]
}
type PublicV3TalentRecord = PublicRecord & {
  family?: string
  maxLevel?: number
  ownerAwakenerId?: string
}
type PublicV3WheelRecord = PublicRecord & {
  aliases?: string[]
  mainstatKey: string
  mainstatSeriesKey?: string
  name: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  rarity: string
  searchTags?: string[]
}
interface PublicV3UpgradeEntry {
  id?: string
  upgraderId?: string
  upgraderType?: string
  upgraderSlot?: string
  ownerAwakenerId?: string
  operation?: string
  patch?: Record<string, unknown>
}

const PROMOTED_EXTRA_DERIVED_IDS = new Set([
  'derived.castor.onyx-plume',
  'derived.corposant.pilot',
  'derived.doll-inferno.illusions-end',
  'derived.doresain.evernights-revel',
  'derived.helot-catena.bloodthirsty-flail',
  'derived.jenkins.swarm-impact',
  'derived.kathigu-ra.hyperflare',
  'derived.liz.corrupted-flames',
  'derived.pollux.sacred-heart',
  'derived.tawil.four-wings',
  'derived.tawil.six-wings',
  'derived.tawil.twin-wings',
  'derived.vortice.vortex-shell',
])

const awakenerFullByIdPromises = new Map<string, Promise<AwakenerFullV2Record | undefined>>()
const wheelFullByIdPromises = new Map<string, Promise<WheelFullV2Record | undefined>>()
const posseFullByIdPromises = new Map<string, Promise<PosseFullV2Record | undefined>>()
const covenantFullByIdPromises = new Map<string, Promise<CovenantFullV2Record | undefined>>()
const SUBSTAT_PERCENT_KEYS = new Set([
  'CritRate',
  'CritDamage',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
])

function isPublicAwakenerId(id: string): boolean {
  return /^awakener-\d{4}$/.test(id)
}

function isPublicWheelId(id: string): boolean {
  return /^wheel-\d{4}$/.test(id)
}

function isPublicPosseId(id: string): boolean {
  return /^posse-\d{4}$/.test(id)
}

function isPublicCovenantId(id: string): boolean {
  return /^covenant-\d{4}$/.test(id)
}

function resolvePublicAwakenerId(awakenerId: string | number): string | undefined {
  if (typeof awakenerId === 'string' && isPublicAwakenerId(awakenerId)) {
    return awakenerId
  }

  const numericId = typeof awakenerId === 'number' ? awakenerId : Number.parseInt(awakenerId, 10)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return undefined
  }

  return getPublicCatalogRecords('awakeners').find((record) => record.numericId === numericId)?.id
}

function numericAwakenerId(publicAwakenerId: string): number {
  const suffix = /^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1]
  return suffix ? Number(suffix) : 0
}

function formatPublicStatValue(key: string, value: number): string {
  const normalizedValue = Math.abs(value) < 0.0001 ? 0 : Math.round(value * 10) / 10
  return `${String(normalizedValue)}${SUBSTAT_PERCENT_KEYS.has(key) ? '%' : ''}`
}

function adaptPublicV2AwakenerStats(record: PublicV3AwakenerRecord) {
  const primaryStats = record.baseStatsLv1 ?? {}
  const substats = record.substatsLv1 ?? {}
  const substatScaling = record.substatScaling ?? {}

  const adaptedSubstats = Object.fromEntries(
    Object.entries(substats).map(([key, rawValue]) => {
      const value = rawValue ?? 0
      const growth = substatScaling[key] ?? 0
      return [key, formatPublicStatValue(key, value + growth * 5)]
    }),
  )

  return {
    CON: formatPublicStatValue('CON', primaryStats.CON ?? 0),
    ATK: formatPublicStatValue('ATK', primaryStats.ATK ?? 0),
    DEF: formatPublicStatValue('DEF', primaryStats.DEF ?? 0),
    ...adaptedSubstats,
  }
}

function adaptPublicV2SubstatScaling(record: PublicV3AwakenerRecord) {
  return Object.fromEntries(
    Object.entries(record.substatScaling ?? {}).flatMap(([key, value]) =>
      value === undefined || value === 0 ? [] : [[key, formatPublicStatValue(key, value)]],
    ),
  )
}

function withNumericOwner<T extends {ownerAwakenerId?: string}>(record: T): T {
  return {
    ...record,
    ownerAwakenerId: record.ownerAwakenerId ? numericAwakenerId(record.ownerAwakenerId) : undefined,
  } as T
}

function getSlotRecord<T extends {slot?: string}>(records: T[], slot: string): T | undefined {
  return records.find((record) => record.slot === slot)
}

function requireSlotRecord<T extends {id: string; slot?: string}>(
  records: T[],
  slot: string,
  label: string,
): T {
  const record = getSlotRecord(records, slot)
  if (!record) {
    throw new Error(`Missing public V2 ${label} record for slot ${slot}.`)
  }
  return record
}

function getTalentByFamily(
  records: PublicV3TalentRecord[],
  family: string,
): PublicV3TalentRecord | undefined {
  return records.find((record) => record.family === family)
}

function skillKindFromPublicSlot(slot: string | undefined): string {
  switch (slot) {
    case 'Rouse':
      return 'rouse'
    case 'Strike':
      return 'strike'
    case 'Defense':
      return 'defense'
    case 'Skill1':
    case 'Skill2':
      return 'command'
    case 'Exalt':
      return 'exalt'
    case 'OverExalt':
      return 'over_exalt'
    default:
      return 'other'
  }
}

function adaptPublicV2CardRecord(record: PublicV3SkillRecord, ownerPublicId: string) {
  return withNumericOwner({
    ...record,
    kind: skillKindFromPublicSlot(record.slot),
    displayName: record.name,
    ownerAwakenerId: ownerPublicId,
    variants: [],
  })
}

function adaptPublicV2DerivedRecord(record: PublicV3DerivedSkillRecord) {
  return withNumericOwner({
    ...record,
    displayName: record.name,
    childDerivedSkillIds: record.childDerivedSkillIds ?? [],
    cardKeywords: record.cardKeywords ?? [],
    variants: [],
  })
}

function adaptPublicV2TalentRecord(record: PublicV3TalentRecord) {
  return withNumericOwner({
    ...record,
    displayName: record.name,
    hasLevelScaledDescription: record.maxLevel !== undefined,
  })
}

function adaptPublicV2EnlightenRecord(record: PublicV3EnlightenRecord) {
  return withNumericOwner({
    ...record,
    displayName: record.name,
  })
}

function adaptPublicV2OverlayRecord(record: PublicV3OverlayRecord) {
  return withNumericOwner({
    ...record,
    displayName: record.name,
    aliases: record.aliases ?? [],
  })
}

async function loadPublicRecordsByIds<TRecord extends PublicRecord>(
  scope: PublicDataScope,
  ids: string[] | undefined,
): Promise<TRecord[]> {
  const records = await Promise.all((ids ?? []).map((id) => loadPublicRecord(scope, id)))
  return records.filter((record): record is TRecord => Boolean(record))
}

async function loadAwakenerOwnedRecords(publicAwakenerId: string) {
  const {getPublicRelationshipsIndex} =
    await import('@/data-access/public-data/relationshipRepository')
  const relationships = getPublicRelationshipsIndex().forward[publicAwakenerId] ?? {}
  const [ownedSkills, ownedTalents, ownedEnlightens, ownedDerivedSkills, ownedOverlays] =
    await Promise.all([
      loadPublicRecordsByIds<PublicV3SkillRecord>('skills', relationships.ownedSkills),
      loadPublicRecordsByIds<PublicV3TalentRecord>('talents', relationships.ownedTalents),
      loadPublicRecordsByIds<PublicV3EnlightenRecord>('enlightens', relationships.ownedEnlightens),
      loadPublicRecordsByIds<PublicV3DerivedSkillRecord>(
        'derived-skills',
        relationships.ownedDerivedSkills,
      ),
      loadPublicRecordsByIds<PublicV3OverlayRecord>('overlays', relationships.ownedOverlays),
    ])

  return {
    skills: ownedSkills,
    talents: ownedTalents,
    enlightens: ownedEnlightens,
    derivedSkills: ownedDerivedSkills,
    overlays: ownedOverlays,
  }
}

async function adaptPublicV2AwakenerRecord(
  record: PublicV3AwakenerRecord,
): Promise<AwakenerFullV2Record> {
  const ownedRecords = await loadAwakenerOwnedRecords(record.id)
  const cards = {
    C1: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Rouse', 'skill'),
      record.id,
    ),
    C2: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Strike', 'skill'),
      record.id,
    ),
    C3: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Defense', 'skill'),
      record.id,
    ),
    C4: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Skill1', 'skill'),
      record.id,
    ),
    C5: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Skill2', 'skill'),
      record.id,
    ),
    Exalt: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Exalt', 'skill'),
      record.id,
    ),
    OverExalt: getSlotRecord(ownedRecords.skills, 'OverExalt')
      ? adaptPublicV2CardRecord(
          requireSlotRecord(ownedRecords.skills, 'OverExalt', 'skill'),
          record.id,
        )
      : undefined,
    promotedExtras: ownedRecords.derivedSkills
      .filter((entry) => PROMOTED_EXTRA_DERIVED_IDS.has(entry.id))
      .map(adaptPublicV2DerivedRecord),
  }

  const passiveTalents = ownedRecords.talents.filter((talent) => talent.family === 'passive')
  const talents: {
    T1: unknown
    T2: unknown
    T3: unknown
    T4: unknown
    extraTalents: unknown[]
  } = {
    T1: passiveTalents[0] ? adaptPublicV2TalentRecord(passiveTalents[0]) : undefined,
    T2: undefined,
    T3: undefined,
    T4: undefined,
    extraTalents: passiveTalents.slice(1).map((talent) => adaptPublicV2TalentRecord(talent)),
  }

  const madnessOmen = getTalentByFamily(ownedRecords.talents, 'madness_omen')
  const soulforgeAptitude = getTalentByFamily(ownedRecords.talents, 'soulforge_aptitude')
  if (madnessOmen) {
    talents.T2 = adaptPublicV2TalentRecord(madnessOmen)
  }
  if (soulforgeAptitude) {
    talents.T3 = adaptPublicV2TalentRecord(soulforgeAptitude)
  }

  const adapted = {
    ...record,
    id: record.numericId,
    key:
      typeof record.assets === 'object' &&
      'portraitKey' in record.assets &&
      typeof record.assets.portraitKey === 'string'
        ? record.assets.portraitKey
        : record.id,
    displayName: record.name,
    stats: adaptPublicV2AwakenerStats(record),
    substatScaling: adaptPublicV2SubstatScaling(record),
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    cards,
    talents,
    enlightens: {
      E1: adaptPublicV2EnlightenRecord(
        requireSlotRecord(ownedRecords.enlightens, 'E1', 'enlighten'),
      ),
      E2: adaptPublicV2EnlightenRecord(
        requireSlotRecord(ownedRecords.enlightens, 'E2', 'enlighten'),
      ),
      E3: adaptPublicV2EnlightenRecord(
        requireSlotRecord(ownedRecords.enlightens, 'E3', 'enlighten'),
      ),
      AbsoluteAxiom: getSlotRecord(ownedRecords.enlightens, 'AbsoluteAxiom')
        ? adaptPublicV2EnlightenRecord(
            requireSlotRecord(ownedRecords.enlightens, 'AbsoluteAxiom', 'enlighten'),
          )
        : undefined,
    },
    derivedSkills: ownedRecords.derivedSkills.map(adaptPublicV2DerivedRecord),
    overlays: ownedRecords.overlays.map(adaptPublicV2OverlayRecord),
  }

  return adapted as unknown as AwakenerFullV2Record
}

function adaptPublicV2WheelRecord(record: PublicV3WheelRecord): WheelFullV2Record {
  const mainstatKey = record.mainstatKey as WheelMainstatKey
  const rarity = record.rarity as WheelFullV2Record['rarity']
  const adapted = {
    ...record,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    awakener: record.ownerAwakenerName,
    mainstatSeriesKey: record.mainstatSeriesKey ?? buildWheelMainstatSeriesKey(rarity, mainstatKey),
  }

  return adapted as unknown as WheelFullV2Record
}

export async function loadPublicV2AwakenerFullById(
  awakenerId: string | number,
): Promise<AwakenerFullV2Record | undefined> {
  const publicId = resolvePublicAwakenerId(awakenerId)
  if (!publicId) {
    return undefined
  }

  const cachedPromise = awakenerFullByIdPromises.get(publicId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('awakeners', publicId).then((record) =>
    record ? adaptPublicV2AwakenerRecord(record as PublicV3AwakenerRecord) : undefined,
  )
  awakenerFullByIdPromises.set(publicId, recordPromise)
  return recordPromise
}

export async function loadPublicV2WheelFullById(
  wheelId: string,
): Promise<WheelFullV2Record | undefined> {
  if (!isPublicWheelId(wheelId)) {
    return undefined
  }

  const cachedPromise = wheelFullByIdPromises.get(wheelId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('wheels', wheelId).then((record) =>
    record ? adaptPublicV2WheelRecord(record as PublicV3WheelRecord) : undefined,
  )
  wheelFullByIdPromises.set(wheelId, recordPromise)
  return recordPromise
}

export async function loadPublicV2PosseFullById(
  posseId: string,
): Promise<PosseFullV2Record | undefined> {
  if (!isPublicPosseId(posseId)) {
    return undefined
  }

  const cachedPromise = posseFullByIdPromises.get(posseId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('posses', posseId).then((record) =>
    record ? (record as unknown as PosseFullV2Record) : undefined,
  )
  posseFullByIdPromises.set(posseId, recordPromise)
  return recordPromise
}

export async function loadPublicV2CovenantFullById(
  covenantId: string,
): Promise<CovenantFullV2Record | undefined> {
  if (!isPublicCovenantId(covenantId)) {
    return undefined
  }

  const cachedPromise = covenantFullByIdPromises.get(covenantId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('covenants', covenantId).then((record) =>
    record ? (record as unknown as CovenantFullV2Record) : undefined,
  )
  covenantFullByIdPromises.set(covenantId, recordPromise)
  return recordPromise
}
