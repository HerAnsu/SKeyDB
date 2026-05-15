import type {DzoneSeason, DzoneSeasonSummary} from '@/domain/dzone'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatDzoneSeasonDateRange(season: DzoneSeason | DzoneSeasonSummary): string {
  return `${DATE_FORMATTER.format(new Date(season.start))} - ${DATE_FORMATTER.format(
    new Date(season.end),
  )}`
}

export function formatDzoneSeasonBrowserDateRange(
  season: DzoneSeason | DzoneSeasonSummary,
): string {
  const startDate = new Date(season.start)
  const endDate = new Date(season.end)
  if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) {
    return formatDzoneSeasonDateRange(season)
  }
  return `${SHORT_DATE_FORMATTER.format(startDate)} - ${SHORT_DATE_FORMATTER.format(endDate)}`
}
