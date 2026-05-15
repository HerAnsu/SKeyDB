import {useState} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {shouldDisplayEndedEventInArchive, type EventEntry} from '@/domain/timeline'

import {EventCard} from './EventCard'
import {TimelineArchiveSection} from './TimelineArchiveSection'
import {TimelineSectionHeader} from './TimelineSectionHeader'
import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'

const EVENT_GRID_CLASS = 'grid gap-3 md:grid-cols-2'

interface EventListProps {
  events: EventEntry[]
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

export function EventList({events, now, onOpenDetail}: EventListProps) {
  const [showEnded, setShowEnded] = useState(false)

  if (events.length === 0) {
    return <p className='px-3 py-4 text-sm text-slate-400'>No events to display.</p>
  }

  const {active, upcoming, ended} = partitionTimelineEntriesByStatus(events, {
    includeEnded: shouldDisplayEndedEventInArchive,
    now,
  })

  if (active.length === 0 && upcoming.length === 0 && ended.length === 0) {
    return <p className='px-3 py-4 text-sm text-slate-400'>No events to display.</p>
  }

  return (
    <div className='space-y-5'>
      {active.length > 0 && (
        <ul className={EVENT_GRID_CLASS}>
          {active.map((event) => (
            <EventCard event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </ul>
      )}

      {upcoming.length > 0 && (
        <div className='space-y-3'>
          <TimelineSectionHeader title='Upcoming events' />
          <ul className={EVENT_GRID_CLASS}>
            {upcoming.map((event) => (
              <EventCard event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
            ))}
          </ul>
        </div>
      )}

      {ended.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={EVENT_GRID_CLASS}
          expanded={showEnded}
          itemCount={ended.length}
          onToggle={() => {
            setShowEnded((current) => !current)
          }}
          title='Ended events'
        >
          {ended.map((event) => (
            <EventCard event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}
