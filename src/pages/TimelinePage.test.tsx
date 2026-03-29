import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {TimelinePage} from './TimelinePage'

vi.mock('@/domain/timeline-data', () => ({
  timelineBanners: [
    {
      id: 'active-banner',
      title: 'Active Banner',
      type: 'limited',
      startDate: '2026-03-09T00:00:00.000Z',
      endDate: '2026-03-12T00:00:00.000Z',
    },
    {
      id: 'ended-banner',
      title: 'Archived Banner',
      type: 'rerun',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-08T00:00:00.000Z',
    },
  ],
  timelineEvents: [],
}))

vi.mock('./timeline/BannerCard', () => ({
  BannerCard: ({banner}: {banner: {title: string}}) => <div>{banner.title}</div>,
}))

vi.mock('./timeline/EventList', () => ({
  EventList: () => <div>No events to display.</div>,
}))

afterEach(() => {
  vi.useRealTimers()
})

describe('TimelinePage', () => {
  it('keeps ended banners collapsed by default and expands them on demand', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-10T00:00:00.000Z'))

    render(<TimelinePage />)

    expect(screen.getByText('Active Banner')).toBeInTheDocument()
    expect(screen.queryByText('Archived Banner')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /ended/i}))

    expect(screen.getByText('Archived Banner')).toBeInTheDocument()
  })
})
