export type TimelineContentFilter = 'all' | 'events' | 'banners'

export const TIMELINE_SECTION_IDS = [
  'upcoming-events',
  'ended-events',
  'upcoming-banners',
  'ended-banners',
] as const

export type TimelineSectionId = (typeof TIMELINE_SECTION_IDS)[number]

export function parseTimelineContentFilter(value: string | null): TimelineContentFilter {
  if (value === 'events' || value === 'banners' || value === 'all') return value
  return 'all'
}

export function parseTimelineSectionId(value: string | null): TimelineSectionId | undefined {
  return TIMELINE_SECTION_IDS.includes(value as TimelineSectionId)
    ? (value as TimelineSectionId)
    : undefined
}

export function getTimelineViewForSection(
  sectionId: TimelineSectionId | undefined,
): TimelineContentFilter | undefined {
  if (!sectionId) return undefined
  return sectionId.endsWith('events') ? 'events' : 'banners'
}
