import {useMemo} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {sortBannersByRelevance, type BannerEntry} from '@/domain/timeline'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineSectionId} from '@/domain/timeline-routing'

import {BannerCard} from './BannerCard'
import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'
import {TimelineStatusSections} from './TimelineStatusSections'
import {useTimelineArchiveExpansion} from './useTimelineArchiveExpansion'

const BANNER_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start justify-items-start gap-4'

interface TimelineBannersSectionProps {
  banners: BannerEntry[]
  now: Date
  onOpenDetail: (ref: EntityRef) => void
  priceMode?: TimelinePriceDisplayMode
  targetSection?: TimelineSectionId
}

export function TimelineBannersSection({
  banners,
  now,
  onOpenDetail,
  priceMode = 'silver-prime',
  targetSection,
}: TimelineBannersSectionProps) {
  const sortedBanners = useMemo(() => sortBannersByRelevance(banners, now), [banners, now])
  const {
    active: activeBanners,
    upcoming: upcomingBanners,
    ended: endedBanners,
  } = useMemo(() => partitionTimelineEntriesByStatus(sortedBanners, {now}), [now, sortedBanners])
  const {endedExpanded, toggleEnded, toggleUpcoming, upcomingExpanded} =
    useTimelineArchiveExpansion({
      endedSectionId: 'ended-banners',
      targetSection,
      upcomingSectionId: 'upcoming-banners',
    })

  return (
    <TimelineStatusSections
      activeItems={activeBanners}
      ended={{
        expanded: endedExpanded,
        onToggle: toggleEnded,
        sectionId: 'ended-banners',
        title: 'Ended banners',
      }}
      endedItems={endedBanners}
      gridClassName={BANNER_GRID_CLASS}
      renderItem={(banner, section) => (
        <BannerCard
          artworkLoading={section === 'active' ? 'eager' : 'lazy'}
          banner={banner}
          key={banner.id}
          now={now}
          onOpenDetail={onOpenDetail}
          priceMode={priceMode}
        />
      )}
      upcoming={{
        expanded: upcomingExpanded,
        onToggle: toggleUpcoming,
        sectionId: 'upcoming-banners',
        title: 'Upcoming banners',
      }}
      upcomingItems={upcomingBanners}
    />
  )
}
