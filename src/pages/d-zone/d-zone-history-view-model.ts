import type {DzoneSeasonSummary} from '@/domain/dzone'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'

import {formatDzoneSeasonDateRange} from './d-zone-date-format'

export interface DZoneHistoryYearGroup {
  seasons: DzoneSeasonSummary[]
  year: string
}

export function getDZoneHistorySeasonYear(season: DzoneSeasonSummary): string {
  return new Date(season.start).getUTCFullYear().toString()
}

function getSeasonSearchText(season: DzoneSeasonSummary): string {
  return [
    `season ${season.period.toString()}`,
    season.period.toString(),
    season.name,
    getDzoneSeasonSummaryDisplayName(season),
    season.stageEffect,
    season.realm ?? '',
    formatDzoneSeasonDateRange(season),
  ]
    .join(' ')
    .toLowerCase()
}

export function getDZoneHistoryNormalizedSearchTerm(searchTerm: string): string {
  return searchTerm.trim().toLowerCase()
}

export function getDZoneHistoryVisibleSeasons(
  seasons: DzoneSeasonSummary[],
  searchTerm: string,
): DzoneSeasonSummary[] {
  const normalizedSearchTerm = getDZoneHistoryNormalizedSearchTerm(searchTerm)
  const exactSeasonSearch = /^season\s+(\d+)$/.exec(normalizedSearchTerm)?.[1]

  return seasons
    .filter((season) =>
      exactSeasonSearch
        ? season.period.toString() === exactSeasonSearch
        : normalizedSearchTerm
          ? getSeasonSearchText(season).includes(normalizedSearchTerm)
          : true,
    )
    .sort((left, right) => right.period - left.period)
}

export function buildDZoneHistoryYearGroups(
  seasons: DzoneSeasonSummary[],
): DZoneHistoryYearGroup[] {
  const groups = new Map<string, DzoneSeasonSummary[]>()

  for (const season of seasons) {
    const year = getDZoneHistorySeasonYear(season)
    groups.set(year, [...(groups.get(year) ?? []), season])
  }

  return Array.from(groups, ([year, groupedSeasons]) => ({year, seasons: groupedSeasons}))
}

export function getDZoneHistoryYearPanelId(year: string): string {
  return `d-zone-history-year-${year}-panel`
}

export function getDZoneHistoryYearButtonId(year: string): string {
  return `d-zone-history-year-${year}-button`
}
