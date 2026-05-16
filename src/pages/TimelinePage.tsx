import {useEffect, useState, type ReactNode} from 'react'

import {useSearchParams} from 'react-router-dom'

import realmBadgeAequor from '@/assets/ui/realm-badge-aequor.webp'
import {getAwakeners} from '@/domain/awakeners'
import {getCurrentDzoneSeason, getLatestDzoneSeason} from '@/domain/dzone'
import {getDzoneSeasonRealmName} from '@/domain/dzone-season-realm'
import type {EntityRef} from '@/domain/entities/types'
import {
  getTimelineCountdownDisplay,
  getTimelineStatus,
  sortEventsByRelevance,
  type EventEntry,
} from '@/domain/timeline'
import {timelineBanners, timelineEvents} from '@/domain/timeline-data'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import {
  getTimelineViewForSection,
  parseTimelineContentFilter,
  parseTimelineSectionId,
  type TimelineContentFilter,
} from '@/domain/timeline-routing'
import {getWheels} from '@/domain/wheels'
import {DbDetailModalHost} from '@/features/database/detail/DbDetailModalHost'
import {dbDetailStore} from '@/stores/dbDetailStore'
import {SeasonMasthead} from '@/ui/masthead/SeasonMasthead'

import {EventList} from './timeline/EventList'
import {TimelineBannersSection} from './timeline/TimelineBannersSection'

import './timeline/timeline.css'

import {useTimelineNow} from './timeline/useTimelineNow'

const CONTENT_FILTERS: {id: TimelineContentFilter; label: string}[] = [
  {id: 'all', label: 'Both'},
  {id: 'events', label: 'Events'},
  {id: 'banners', label: 'Banners'},
]

const PRICE_DISPLAY_MODES: {
  ariaLabel: string
  id: TimelinePriceDisplayMode
  label: string
  title: string
}[] = [
  {
    ariaLabel: 'Silver Prime',
    id: 'silver-prime',
    label: 'Prime',
    title: 'Show game currency prices',
  },
  {
    ariaLabel: 'Estimated USD',
    id: 'usd-estimate',
    label: 'USD',
    title: 'Show rounded estimated USD prices',
  },
]

function selectDZoneEvent(events: EventEntry[], now: Date): EventEntry | undefined {
  return (
    events.find(
      (event) =>
        event.category === 'd-tide' &&
        getTimelineStatus(event.startDate, event.endDate, now) !== 'ended',
    ) ?? events.find((event) => event.category === 'd-tide')
  )
}

function getDZoneRealmName(event: EventEntry | undefined, now: Date): string {
  const match = event?.description?.match(/Current Realm relic:\s*([^.\n]+)/i)
  const eventRealmName = match?.[1]?.trim()
  if (eventRealmName) return eventRealmName

  return getDzoneSeasonRealmName(getCurrentDzoneSeason(now) ?? getLatestDzoneSeason())
}

export function TimelinePage() {
  const now = useTimelineNow()
  const [searchParams, setSearchParams] = useSearchParams()
  const timelineSection = parseTimelineSectionId(searchParams.get('section'))
  const contentFilter =
    getTimelineViewForSection(timelineSection) ??
    parseTimelineContentFilter(searchParams.get('view'))
  const [priceMode, setPriceMode] = useState<TimelinePriceDisplayMode>('silver-prime')
  const awakeners = getAwakeners()
  const wheels = getWheels()

  const events = sortEventsByRelevance(timelineEvents, now)
  const dZoneEvent = selectDZoneEvent(events, now)
  const dZoneCountdownDisplay = dZoneEvent
    ? getTimelineCountdownDisplay(dZoneEvent.startDate, dZoneEvent.endDate, now)
    : null
  const showEvents = contentFilter !== 'banners'
  const showBanners = contentFilter !== 'events'

  useEffect(() => {
    if (!timelineSection) return

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(timelineSection)?.scrollIntoView({
        block: 'start',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [timelineSection])

  function openTimelineDetail(ref: EntityRef) {
    dbDetailStore.getState().openDetail(ref, 'timeline-overlay')
  }

  function setContentFilter(nextFilter: TimelineContentFilter) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('section')
    if (nextFilter === 'all') {
      nextParams.delete('view')
    } else {
      nextParams.set('view', nextFilter)
    }
    setSearchParams(nextParams, {replace: true})
  }

  return (
    <section className='timeline-v2 -mt-4 md:-mt-5'>
      <SeasonMasthead
        layout='timeline'
        summary={{
          ariaLabel: 'D-Zone season',
          artSrc: dZoneEvent?.customArt,
          countdown: dZoneCountdownDisplay,
          emblemSrc: realmBadgeAequor,
          kicker: 'Current Season',
          name: getDZoneRealmName(dZoneEvent, now),
          to: '/d-zone',
        }}
      >
        <h1 className='sr-only'>Events & Banners</h1>
        <div className='timeline-v2-control-stack'>
          <div aria-label='Timeline content' className='timeline-v2-filter-list' role='group'>
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
          <div className='timeline-v2-price-toggle-shell'>
            <span className='timeline-v2-price-toggle-label'>Display Prices</span>
            <div aria-label='Display prices' className='timeline-v2-price-toggle' role='group'>
              {PRICE_DISPLAY_MODES.map((mode) => (
                <button
                  aria-label={mode.ariaLabel}
                  aria-pressed={priceMode === mode.id}
                  className={`timeline-v2-price-toggle-button ${
                    priceMode === mode.id
                      ? 'timeline-v2-price-toggle-button--active'
                      : 'timeline-v2-price-toggle-button--inactive'
                  }`}
                  key={mode.id}
                  onClick={() => {
                    setPriceMode(mode.id)
                  }}
                  title={mode.title}
                  type='button'
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SeasonMasthead>

      <div className='-my-[0.6rem] space-y-7'>
        {showEvents ? (
          <TimelineSection title='Events'>
            <EventList
              events={events}
              now={now}
              onOpenDetail={openTimelineDetail}
              priceMode={priceMode}
              targetSection={timelineSection}
            />
          </TimelineSection>
        ) : null}

        {showBanners ? (
          <TimelineSection title='Banners'>
            <TimelineBannersSection
              banners={timelineBanners}
              now={now}
              onOpenDetail={openTimelineDetail}
              priceMode={priceMode}
              targetSection={timelineSection}
            />
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
    ? 'timeline-v2-filter-button--active'
    : 'timeline-v2-filter-button--inactive'

  return (
    <button
      aria-pressed={active}
      className={`timeline-v2-filter-button ${buttonClass}`}
      onClick={onClick}
      type='button'
    >
      <span className='timeline-v2-filter-label'>{children}</span>
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
