import {render, screen} from '@testing-library/react'

import {EventCard} from './EventCard'
import {EventDescriptionShelf} from './EventDescription'

describe('EventCard', () => {
  it('renders expanded event details as a labeled section region', () => {
    render(
      <EventDescriptionShelf
        canExpandDescription
        description='Expanded event detail text.'
        descriptionId='event-description-test'
        descriptionOpen
        onCloseDescription={() => undefined}
      />,
    )

    expect(screen.getByRole('region', {name: 'Details'}).tagName).toBe('SECTION')
  })

  it('shows nearby upcoming text with the end date', () => {
    render(
      <EventCard
        event={{
          id: 'near-upcoming-event',
          title: 'Near Upcoming Event',
          startDate: '2026-06-15T01:00:00.000Z',
          endDate: '2026-07-13T01:00:00.000Z',
          category: 'gameplay-event',
        }}
        now={new Date('2026-06-05T23:00:00.000Z')}
      />,
    )

    expect(screen.getByLabelText('Starts in 9d 2h · Ends Jul 13')).toHaveAttribute(
      'title',
      'Jun 15, 2026 - Jul 13, 2026',
    )
  })
})
