import {useMemo} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {sortBannersByRelevance, type BannerEntry} from '@/domain/timeline'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineSectionId} from '@/domain/timeline-routing'

import {BannerCard} from './BannerCard'
import {TimelineArchiveSection} from './TimelineArchiveSection'
import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'
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
    <div className='space-y-6'>
      {activeBanners.length > 0 && (
        <BannerGrid
          artworkLoading='eager'
          banners={activeBanners}
          now={now}
          onOpenDetail={onOpenDetail}
          priceMode={priceMode}
        />
      )}

      {upcomingBanners.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={BANNER_GRID_CLASS}
          expanded={upcomingExpanded}
          itemCount={upcomingBanners.length}
          onToggle={toggleUpcoming}
          sectionId='upcoming-banners'
          title='Upcoming banners'
        >
          {upcomingBanners.map((banner) => (
            <BannerCard
              artworkLoading='lazy'
              banner={banner}
              key={banner.id}
              now={now}
              onOpenDetail={onOpenDetail}
              priceMode={priceMode}
            />
          ))}
        </TimelineArchiveSection>
      ) : null}

      {endedBanners.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={BANNER_GRID_CLASS}
          expanded={endedExpanded}
          itemCount={endedBanners.length}
          onToggle={toggleEnded}
          sectionId='ended-banners'
          title='Ended banners'
        >
          {endedBanners.map((banner) => (
            <BannerCard
              artworkLoading='lazy'
              banner={banner}
              key={banner.id}
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

function BannerGrid({
  artworkLoading,
  banners,
  now,
  onOpenDetail,
  priceMode,
}: {
  artworkLoading: 'eager' | 'lazy'
  banners: BannerEntry[]
  now: Date
  onOpenDetail: (ref: EntityRef) => void
  priceMode: TimelinePriceDisplayMode
}) {
  return (
    <div className={BANNER_GRID_CLASS}>
      {banners.map((banner) => (
        <BannerCard
          artworkLoading={artworkLoading}
          banner={banner}
          key={banner.id}
          now={now}
          onOpenDetail={onOpenDetail}
          priceMode={priceMode}
        />
      ))}
    </div>
  )
}
