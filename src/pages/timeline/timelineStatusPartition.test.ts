import {describe, expect, it} from 'vitest'

import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'

interface TestTimelineEntry {
  id: string
  startDate: string
  endDate: string
  archive?: boolean
}

describe('partitionTimelineEntriesByStatus', () => {
  it('groups entries by timeline status while preserving input order', () => {
    const now = new Date('2026-05-12T00:00:00.000Z')
    const entries: TestTimelineEntry[] = [
      {
        id: 'active-first',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-13T00:00:00.000Z',
      },
      {
        id: 'upcoming',
        startDate: '2026-05-20T00:00:00.000Z',
        endDate: '2026-05-27T00:00:00.000Z',
      },
      {
        id: 'active-second',
        startDate: '2026-05-10T00:00:00.000Z',
        endDate: '2026-05-18T00:00:00.000Z',
      },
      {
        id: 'ended',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-08T00:00:00.000Z',
      },
    ]

    const partition = partitionTimelineEntriesByStatus(entries, {now})

    expect(partition.active.map((entry) => entry.id)).toEqual(['active-first', 'active-second'])
    expect(partition.upcoming.map((entry) => entry.id)).toEqual(['upcoming'])
    expect(partition.ended.map((entry) => entry.id)).toEqual(['ended'])
  })

  it('applies the ended predicate only to ended entries', () => {
    const now = new Date('2026-05-12T00:00:00.000Z')
    const entries: TestTimelineEntry[] = [
      {
        id: 'active',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-13T00:00:00.000Z',
        archive: false,
      },
      {
        id: 'ended-visible',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-08T00:00:00.000Z',
        archive: true,
      },
      {
        id: 'ended-hidden',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-09T00:00:00.000Z',
        archive: false,
      },
    ]

    const partition = partitionTimelineEntriesByStatus(entries, {
      includeEnded: (entry) => entry.archive === true,
      now,
    })

    expect(partition.active.map((entry) => entry.id)).toEqual(['active'])
    expect(partition.ended.map((entry) => entry.id)).toEqual(['ended-visible'])
  })
})
