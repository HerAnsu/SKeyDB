import {useEffect, useMemo, useState, type ReactNode} from 'react'

import realmBadgeAequor from '@/assets/ui/realm-badge-aequor.webp'
import {getAwakeners} from '@/domain/awakeners'
import type {EntityRef} from '@/domain/entities/types'
import {getTimelineStatus, sortBannersByRelevance, sortEventsByRelevance} from '@/domain/timeline'
import {timelineBanners, timelineEvents} from '@/domain/timeline-data'
import {getWheels} from '@/domain/wheels'
import {DbDetailModalHost} from '@/features/database/detail/DbDetailModalHost'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {BannerCard} from './timeline/BannerCard'
import {EventList} from './timeline/EventList'
import {TimelineArchiveSection} from './timeline/TimelineArchiveSection'

const TICK_INTERVAL_MS = 60_000
type TimelineContentFilter = 'all' | 'events' | 'banners'

const CONTENT_FILTERS: {id: TimelineContentFilter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'events', label: 'Events'},
  {id: 'banners', label: 'Banners'},
]

const BANNER_GRID_CLASS =
  'grid justify-items-start gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]'

export function TimelinePage() {
  const [now, setNow] = useState(() => new Date())
  const [showEndedBanners, setShowEndedBanners] = useState(false)
  const [contentFilter, setContentFilter] = useState<TimelineContentFilter>('all')
  const awakeners = useMemo(() => getAwakeners(), [])
  const wheels = useMemo(() => getWheels(), [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, TICK_INTERVAL_MS)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const banners = sortBannersByRelevance(timelineBanners, now)
  const events = sortEventsByRelevance(timelineEvents, now)

  const activeBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'active',
  )
  const upcomingBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'upcoming',
  )
  const endedBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'ended',
  )
  const showEvents = contentFilter !== 'banners'
  const showBanners = contentFilter !== 'events'

  function openTimelineDetail(ref: EntityRef) {
    dbDetailStore.getState().openDetail(ref, 'timeline-overlay')
  }

  return (
    <section className='timeline-v2 -mt-4 md:-mt-5'>
      <header className='timeline-v2-hero overflow-hidden'>
        <div className='timeline-v2-hero-inner grid min-h-34 gap-6 px-4 py-6 sm:px-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:px-8'>
          <div className='max-w-3xl'>
            <h1 className='ui-title text-3xl leading-tight text-amber-50 sm:text-4xl'>
              Events & Banners
            </h1>
            <p className='mt-2 max-w-[64ch] text-sm leading-6 text-slate-300'>
              Current events and upcoming banners.
            </p>
          </div>
          <div className='timeline-v2-season justify-self-start lg:justify-self-end'>
            <div className='min-w-0 text-left lg:text-right'>
              <p className='text-[10px] font-bold tracking-[0.14em] text-amber-200/55 uppercase'>
                D-Zone Season
              </p>
              <p className='ui-title mt-1 flex items-center gap-1 text-base text-amber-50 lg:justify-end'>
                Aequor Ring
                <span aria-hidden className='text-amber-200/70'>
                  &gt;
                </span>
              </p>
            </div>
            <img
              alt=''
              className='h-16 w-16 object-contain opacity-85'
              draggable={false}
              src={realmBadgeAequor}
            />
          </div>
        </div>
      </header>

      <div className='space-y-7 py-6'>
        <div className='flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-slate-700/45 pb-4'>
          <div aria-label='Timeline content' className='flex min-w-0 flex-wrap items-center gap-1'>
            {CONTENT_FILTERS.map((filter) => (
              <TimelineFilterButton
                active={contentFilter === filter.id}
                key={filter.id}
                onClick={() => {
                  setContentFilter(filter.id)
                }}
              >
                {filter.label}
              </TimelineFilterButton>
            ))}
          </div>
        </div>

        {showEvents ? (
          <TimelineSection title='Events'>
            <EventList events={events} now={now} onOpenDetail={openTimelineDetail} />
          </TimelineSection>
        ) : null}

        {showBanners ? (
          <TimelineSection title='Banners'>
            <div className='space-y-6'>
              {activeBanners.length > 0 && (
                <div className={BANNER_GRID_CLASS}>
                  {activeBanners.map((banner) => (
                    <BannerCard
                      banner={banner}
                      key={banner.id}
                      now={now}
                      onOpenDetail={openTimelineDetail}
                    />
                  ))}
                </div>
              )}

              {upcomingBanners.length > 0 && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <h3 className='ui-title text-sm text-slate-400'>Upcoming banners</h3>
                    <div className='h-px flex-1 bg-gradient-to-r from-amber-200/20 via-slate-500/25 to-transparent' />
                  </div>
                  <div className={BANNER_GRID_CLASS}>
                    {upcomingBanners.map((banner) => (
                      <BannerCard
                        banner={banner}
                        key={banner.id}
                        now={now}
                        onOpenDetail={openTimelineDetail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {endedBanners.length > 0 ? (
                <TimelineArchiveSection
                  contentClassName={BANNER_GRID_CLASS}
                  dividerClassName='bg-gradient-to-r from-amber-200/15 via-slate-500/20 to-transparent'
                  expanded={showEndedBanners}
                  itemCount={endedBanners.length}
                  onToggle={() => {
                    setShowEndedBanners((current) => !current)
                  }}
                  title='Ended banners'
                  titleClassName='text-slate-400'
                >
                  {endedBanners.map((banner) => (
                    <BannerCard
                      banner={banner}
                      key={banner.id}
                      now={now}
                      onOpenDetail={openTimelineDetail}
                    />
                  ))}
                </TimelineArchiveSection>
              ) : null}
            </div>
          </TimelineSection>
        ) : null}
      </div>
      <DbDetailModalHost
        awakeners={awakeners}
        callbacks={{
          onClose: () => {
            dbDetailStore.getState().popDetail()
          },
          onSelectAwakener: () => undefined,
          onSelectCovenant: () => undefined,
          onSelectWheel: () => undefined,
          onTabChange: () => undefined,
        }}
        routeItem={null}
        wheels={wheels}
      />
    </section>
  )
}

function TimelineFilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  const buttonClass = active
    ? 'border-amber-300/80 text-amber-50'
    : 'border-transparent text-slate-400 hover:border-slate-600/70 hover:text-slate-200'

  return (
    <button
      aria-pressed={active}
      className={`inline-flex min-h-10 shrink-0 items-center border-b-2 px-2.5 text-xs leading-none font-semibold transition-[border-color,color] duration-150 sm:min-h-9 ${buttonClass} focus-visible:border-amber-200/80 focus-visible:ring-2 focus-visible:ring-amber-200/25 focus-visible:outline-none`}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  )
}

function TimelineSection({children, title}: {children: ReactNode; title: string}) {
  return (
    <section className='space-y-4'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <span aria-hidden className='block h-1.5 w-1.5 bg-amber-200/60' />
          <h2 className='ui-title text-sm tracking-[0.16em] text-amber-100 uppercase'>{title}</h2>
        </div>
        <div className='h-px flex-1 bg-gradient-to-r from-amber-200/25 via-slate-600/30 to-transparent' />
      </div>
      {children}
    </section>
  )
}
