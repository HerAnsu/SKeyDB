import {describe, expect, it} from 'vitest'

import {getDzoneSeasonSummaries} from '@/domain/dzone'

import {
  buildDZoneHistoryYearGroups,
  getDZoneHistoryVisibleSeasons,
} from './d-zone-history-view-model'

describe('d-zone history view model', () => {
  it('keeps exact season searches exact', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), 'season 1')

    expect(visibleSeasons.map((season) => season.period)).toEqual([1])
  })

  it('supports regular text search across season metadata', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), 'aequor')

    expect(visibleSeasons.length).toBeGreaterThan(0)
    expect(visibleSeasons.every((season) => season.realm === 'AEQUOR')).toBe(true)
  })

  it('groups visible seasons by descending season order year', () => {
    const visibleSeasons = getDZoneHistoryVisibleSeasons(getDzoneSeasonSummaries(), '')
    const groups = buildDZoneHistoryYearGroups(visibleSeasons)

    expect(groups[0]?.year).toBe('2026')
    expect(groups[0]?.seasons[0]?.period).toBeGreaterThan(groups[0]?.seasons.at(-1)?.period ?? 0)
  })
})
