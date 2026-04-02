import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'

import {BannerCard} from './BannerCard'

describe('BannerCard', () => {
  it('shows ended relative text for ended banners', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'ended-banner',
            title: 'Ended Banner',
            type: 'rerun',
            startDate: '2026-03-01T00:00:00.000Z',
            endDate: '2026-03-08T00:00:00.000Z',
          }}
          now={new Date('2026-03-10T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Ended 2d ago')).toBeInTheDocument()
    expect(screen.getByText('Ended').parentElement).toHaveAttribute(
      'title',
      'Mar 1, 2026 - Mar 8, 2026',
    )
  })

  it('shows a date instead of long-range countdown text and exposes it on hover', () => {
    render(
      <MemoryRouter>
        <BannerCard
          banner={{
            id: 'upcoming-banner',
            title: 'Upcoming Banner',
            type: 'limited',
            startDate: '2026-03-30T00:00:00.000Z',
            endDate: '2026-04-10T00:00:00.000Z',
          }}
          now={new Date('2026-03-10T00:00:00.000Z')}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Starts Mar 30')).toBeInTheDocument()
    expect(screen.getByText('Soon').parentElement).toHaveAttribute(
      'title',
      'Mar 30, 2026 - Apr 10, 2026',
    )
  })
})
