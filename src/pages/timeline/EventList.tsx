import type {EntityRef} from '@/domain/entities/types'
import {shouldDisplayEndedEventInArchive, type EventEntry} from '@/domain/timeline'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineSectionId} from '@/domain/timeline-routing'

import {EventCard} from './EventCard'
import {TimelineArchiveSection} from './TimelineArchiveSection'
import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'
import {useTimelineArchiveExpansion} from './useTimelineArchiveExpansion'

const EVENT_GRID_CLASS = 'grid gap-3 md:grid-cols-2'

interface EventListProps {
  events: EventEntry[]
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
  priceMode?: TimelinePriceDisplayMode
  targetSection?: TimelineSectionId
}

export function EventList({
  events,
  now,
  onOpenDetail,
  priceMode = 'silver-prime',
  targetSection,
}: EventListProps) {
  const {endedExpanded, toggleEnded, toggleUpcoming, upcomingExpanded} =
    useTimelineArchiveExpansion({
      endedSectionId: 'ended-events',
      targetSection,
      upcomingSectionId: 'upcoming-events',
    })

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
            <EventCard
              event={event}
              key={event.id}
              now={now}
              onOpenDetail={onOpenDetail}
              priceMode={priceMode}
            />
          ))}
        </ul>
      )}

      {upcoming.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={EVENT_GRID_CLASS}
          expanded={upcomingExpanded}
          itemCount={upcoming.length}
          onToggle={toggleUpcoming}
          sectionId='upcoming-events'
          title='Upcoming events'
        >
          {upcoming.map((event) => (
            <EventCard
              event={event}
              key={event.id}
              now={now}
              onOpenDetail={onOpenDetail}
              priceMode={priceMode}
            />
          ))}
        </TimelineArchiveSection>
      ) : null}

      {ended.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={EVENT_GRID_CLASS}
          expanded={endedExpanded}
          itemCount={ended.length}
          onToggle={toggleEnded}
          sectionId='ended-events'
          title='Ended events'
        >
          {ended.map((event) => (
            <EventCard
              event={event}
              key={event.id}
              now={now}
              onOpenDetail={onOpenDetail}
              priceMode={priceMode}
            />
          ))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}
