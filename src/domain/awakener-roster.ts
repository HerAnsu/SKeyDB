import awakenerRosterJson from '@/data/awakeners/awakener-roster.json'

import {awakenerRosterDatasetSchema, type AwakenerRosterRecord} from './awakener-source-schema'

let awakenerRosterCache: AwakenerRosterRecord[] | null = null

export function getAwakenerRoster(): AwakenerRosterRecord[] {
  if (awakenerRosterCache) {
    return awakenerRosterCache
  }

  awakenerRosterCache = awakenerRosterDatasetSchema.parse(awakenerRosterJson)
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
