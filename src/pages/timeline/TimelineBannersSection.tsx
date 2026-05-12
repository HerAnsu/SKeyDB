import {useState} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {sortBannersByRelevance, type BannerEntry} from '@/domain/timeline'

import {BannerCard} from './BannerCard'
import {TimelineArchiveSection} from './TimelineArchiveSection'
import {TimelineSectionHeader} from './TimelineSectionHeader'
import {partitionTimelineEntriesByStatus} from './timelineStatusPartition'

const BANNER_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-start justify-items-start gap-4'

interface TimelineBannersSectionProps {
  banners: BannerEntry[]
  now: Date
  onOpenDetail: (ref: EntityRef) => void
}

export function TimelineBannersSection({banners, now, onOpenDetail}: TimelineBannersSectionProps) {
  const [showEndedBanners, setShowEndedBanners] = useState(false)
  const sortedBanners = sortBannersByRelevance(banners, now)
  const {
    active: activeBanners,
    upcoming: upcomingBanners,
    ended: endedBanners,
  } = partitionTimelineEntriesByStatus(sortedBanners, {now})

  return (
    <div className='space-y-6'>
      {activeBanners.length > 0 && (
        <BannerGrid banners={activeBanners} now={now} onOpenDetail={onOpenDetail} />
      )}

      {upcomingBanners.length > 0 && (
        <div className='space-y-3'>
          <TimelineSectionHeader title='Upcoming banners' />
          <BannerGrid banners={upcomingBanners} now={now} onOpenDetail={onOpenDetail} />
        </div>
      )}

      {endedBanners.length > 0 ? (
        <TimelineArchiveSection
          contentClassName={BANNER_GRID_CLASS}
          expanded={showEndedBanners}
          itemCount={endedBanners.length}
          onToggle={() => {
            setShowEndedBanners((current) => !current)
          }}
          title='Ended banners'
        >
          {endedBanners.map((banner) => (
            <BannerCard banner={banner} key={banner.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}

function BannerGrid({
  banners,
  now,
  onOpenDetail,
}: {
  banners: BannerEntry[]
  now: Date
  onOpenDetail: (ref: EntityRef) => void
}) {
  return (
    <div className={BANNER_GRID_CLASS}>
      {banners.map((banner) => (
        <BannerCard banner={banner} key={banner.id} now={now} onOpenDetail={onOpenDetail} />
      ))}
    </div>
  )
}
