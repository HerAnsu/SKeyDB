import type {EntityRef} from '@/domain/entities/types'
import {shouldDisplayEndedEventInArchive, type EventEntry} from '@/domain/timeline'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineSectionId} from '@/domain/timeline-routing'

import {EventCard} from './EventCard'
import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'
import {TimelineStatusSections} from './TimelineStatusSections'
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
    <TimelineStatusSections
      activeContainer='ul'
      activeItems={active}
      ended={{
        expanded: endedExpanded,
        onToggle: toggleEnded,
        sectionId: 'ended-events',
        title: 'Ended events',
      }}
      endedItems={ended}
      gridClassName={EVENT_GRID_CLASS}
      renderItem={(event) => (
        <EventCard
          event={event}
          key={event.id}
          now={now}
          onOpenDetail={onOpenDetail}
          priceMode={priceMode}
        />
      )}
      upcoming={{
        expanded: upcomingExpanded,
        onToggle: toggleUpcoming,
        sectionId: 'upcoming-events',
        title: 'Upcoming events',
      }}
      upcomingItems={upcoming}
      wrapperClassName='space-y-5'
    />
  )
}
