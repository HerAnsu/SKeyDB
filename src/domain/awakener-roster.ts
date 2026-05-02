import publicAwakenersFull from '@/data/public-v2/full/awakeners.json'

import {awakenerRosterDatasetSchema, type AwakenerRosterRecord} from './awakener-source-schema'

interface PublicAwakenersEnvelope {
  records: {
    id: string
    numericId: number
    assets?: AwakenerRosterRecord['assets']
    baseStatsLv1: Partial<Record<keyof AwakenerRosterRecord['stats'], number>>
    faction: string
    ingameId?: string
    name: string
    primaryScalingBase: AwakenerRosterRecord['primaryScalingBase']
    rarity?: string
    realm: string
    searchTags?: string[]
    statScaling: AwakenerRosterRecord['statScaling']
    substatScaling: Partial<Record<keyof AwakenerRosterRecord['substatScaling'], number>>
    type?: string
    aliases?: string[]
  }[]
}

let awakenerRosterCache: AwakenerRosterRecord[] | null = null

function adaptPublicAwakener(
  record: PublicAwakenersEnvelope['records'][number],
): AwakenerRosterRecord {
  const fullStats = {
    CON: record.baseStatsLv1.CON ?? 0,
    ATK: record.baseStatsLv1.ATK ?? 0,
    DEF: record.baseStatsLv1.DEF ?? 0,
    CritRate: 0,
    CritDamage: 0,
    AliemusRegen: 0,
    KeyflareRegen: 0,
    RealmMastery: 0,
    SigilYield: 0,
    DamageAmplification: 0,
    DeathResistance: 0,
  }

  return {
    id: record.numericId,
    key: record.assets?.portraitKey ?? record.id,
    displayName: record.name,
    ingameId: record.ingameId,
    faction: record.faction,
    realm: record.realm,
    rarity: record.rarity,
    type: record.type,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    stats: Object.fromEntries(
      Object.entries(fullStats).map(([key, value]) => [key, String(value)]),
    ) as AwakenerRosterRecord['stats'],
    primaryScalingBase: record.primaryScalingBase,
    statScaling: record.statScaling,
    substatScaling: Object.fromEntries(
      Object.entries(record.substatScaling).map(([key, value]) => [key, String(value)]),
    ) as AwakenerRosterRecord['substatScaling'],
    assets: record.assets ?? {portraitKey: record.id, iconKey: record.id},
  }
}

export function getAwakenerRoster(): AwakenerRosterRecord[] {
  if (awakenerRosterCache) {
    return awakenerRosterCache
  }

  awakenerRosterCache = awakenerRosterDatasetSchema.parse(
    (publicAwakenersFull as unknown as PublicAwakenersEnvelope).records.map(adaptPublicAwakener),
  )
  return awakenerRosterCache
}

export function getAwakenerRosterById(
  awakenerId: number,
  roster: AwakenerRosterRecord[],
): AwakenerRosterRecord | undefined {
  return roster.find((entry) => entry.id === awakenerId)
}

export function buildAwakenerRosterMap(
  roster: AwakenerRosterRecord[],
): Map<number, AwakenerRosterRecord> {
  return new Map(roster.map((entry) => [entry.id, entry]))
}
