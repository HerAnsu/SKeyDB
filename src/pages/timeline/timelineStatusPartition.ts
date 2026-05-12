import {getTimelineStatus, type TimelineStatus} from '@/domain/timeline'

interface TimelineStatusEntry {
  startDate: string
  endDate: string
}

interface PartitionTimelineEntriesOptions<TEntry extends TimelineStatusEntry> {
  includeEnded?: (entry: TEntry) => boolean
  now?: Date
}

type TimelineStatusPartition<TEntry extends TimelineStatusEntry> = Record<TimelineStatus, TEntry[]>

export function partitionTimelineEntriesByStatus<TEntry extends TimelineStatusEntry>(
  entries: TEntry[],
  {includeEnded, now}: PartitionTimelineEntriesOptions<TEntry> = {},
): TimelineStatusPartition<TEntry> {
  const partition: TimelineStatusPartition<TEntry> = {
    active: [],
    upcoming: [],
    ended: [],
  }

  entries.forEach((entry) => {
    const status = getTimelineStatus(entry.startDate, entry.endDate, now)

    if (status === 'ended' && includeEnded && !includeEnded(entry)) {
      return
    }

    partition[status].push(entry)
  })

  return partition
}
