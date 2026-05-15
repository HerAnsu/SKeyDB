import {describe, expect, it} from 'vitest'

import type {DzoneSeasonSummary} from '@/domain/dzone'

import {formatDzoneSeasonBrowserDateRange, formatDzoneSeasonDateRange} from './d-zone-date-format'

function buildSeasonDateRange(start: string, end: string): DzoneSeasonSummary {
  return {
    end,
    id: 'dzone-0060',
    name: 'Test Season',
    period: 60,
    realm: 'AEQUOR',
    seasonPath: 'seasons/dzone-0060.json',
    stageEffect: 'Astral Reign',
    start,
  }
}

describe('D-zone date formatting', () => {
  it('formats full date ranges in UTC', () => {
    expect(
      formatDzoneSeasonDateRange(
        buildSeasonDateRange('2026-05-07T00:00:00.000Z', '2026-05-20T23:59:59.000Z'),
      ),
    ).toBe('May 7, 2026 - May 20, 2026')
  })

  it('formats same-year browser ranges without repeating the year', () => {
    expect(
      formatDzoneSeasonBrowserDateRange(
        buildSeasonDateRange('2026-05-07T00:00:00.000Z', '2026-05-20T23:59:59.000Z'),
      ),
    ).toBe('May 7 - May 20')
  })

  it('formats cross-year browser ranges with full years', () => {
    expect(
      formatDzoneSeasonBrowserDateRange(
        buildSeasonDateRange('2026-12-28T00:00:00.000Z', '2027-01-10T23:59:59.000Z'),
      ),
    ).toBe('Dec 28, 2026 - Jan 10, 2027')
  })
})
