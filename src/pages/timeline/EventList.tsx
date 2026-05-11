import {useEffect, useRef, useState, type ReactNode} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {
  getTimelineCountdownDisplay,
  getTimelineStatus,
  shouldDisplayEndedEventInArchive,
  type BannerFeaturedUnit,
  type EventCategory,
  type EventEntry,
} from '@/domain/timeline'

import {TimelineArchiveSection} from './TimelineArchiveSection'
import {resolveTimelineFeaturedAsset} from './timelineDetailResolution'
import {TimelineRichText} from './TimelineRichText'

const CATEGORY_LABEL: Record<EventCategory, string> = {
  story: 'Story',
  raid: 'Raid',
  battlepass: 'Battlepass',
  'gameplay-event': 'Event',
  'd-tide': 'D-Tide',
  curriculum: 'Curriculum',
  login: 'Login',
  skin: 'Skin',
  'wheel-event': 'Wheel',
  preorder: 'Preorder',
  maintenance: 'Maintenance',
  campaign: 'Campaign',
  collab: 'Collab',
  other: 'Event',
}

type EventMetaTone = 'amber' | 'blue' | 'orange' | 'price' | 'red' | 'slate' | 'teal' | 'violet'
type EventMetaRole = 'awakener' | 'price' | 'rerun' | 'wheel'

const CATEGORY_TONE: Record<EventCategory, EventMetaTone> = {
  story: 'amber',
  raid: 'red',
  battlepass: 'violet',
  'gameplay-event': 'amber',
  'd-tide': 'red',
  curriculum: 'violet',
  login: 'teal',
  skin: 'violet',
  'wheel-event': 'blue',
  preorder: 'orange',
  maintenance: 'slate',
  campaign: 'teal',
  collab: 'violet',
  other: 'amber',
}

const ROLE_TONE: Record<EventMetaRole, EventMetaTone> = {
  awakener: 'amber',
  price: 'price',
  rerun: 'violet',
  wheel: 'blue',
}

function getEventMetaToneClass(tone: EventMetaTone, isEnded: boolean): string {
  if (isEnded) return 'timeline-event-meta--ended'

  return `timeline-event-meta--${tone}`
}

function getEventTargetTone(kind: EntityRef['kind']): EventMetaTone {
  return kind === 'wheel' ? ROLE_TONE.wheel : ROLE_TONE.awakener
}

interface EventArt {
  url: string | undefined
  isWheel: boolean
  artAlign?: string
  detailTargets: EventDetailTarget[]
}

interface EventDetailTarget {
  label: string
  ref: EntityRef
}

function resolveEventArt(
  featured: BannerFeaturedUnit[] | undefined,
  customArt: string | undefined,
  artAlign?: string,
): EventArt | null {
  const assets = featured?.map((unit) => resolveTimelineFeaturedAsset(unit)) ?? []
  const detailTargets = assets.flatMap((asset) =>
    asset.detailRef ? [{label: asset.label, ref: asset.detailRef}] : [],
  )

  if (customArt) {
    return {url: customArt, isWheel: false, artAlign, detailTargets}
  }

  if (assets.length === 0) {
    return null
  }

  const primaryAsset = assets[0]

  return {
    url: primaryAsset.url,
    isWheel: primaryAsset.isWheel,
    artAlign,
    detailTargets,
  }
}

function EventArtSlice({art}: {art: EventArt}) {
  if (!art.url) return null
  const base = art.isWheel ? 'h-full w-full object-cover scale-110' : 'h-full w-full object-cover'
  const posClass = art.artAlign ? '' : art.isWheel ? 'object-center' : 'object-top'
  const posStyle = art.artAlign ? {objectPosition: art.artAlign} : undefined
  const linkedArtClass =
    art.detailTargets.length > 0
      ? 'ring-1 ring-inset ring-transparent transition-[filter,box-shadow] duration-150 hover:brightness-110 group-hover/event-row:brightness-110 group-hover/event-row:ring-amber-200/45'
      : ''
  return (
    <div className={`relative h-full w-full overflow-hidden ${linkedArtClass}`}>
      <img
        alt=''
        className={`${base} ${posClass}`}
        draggable={false}
        src={art.url}
        style={posStyle}
      />
    </div>
  )
}

function EventMetaSeparator({isEnded}: {isEnded: boolean}) {
  return (
    <span aria-hidden className={isEnded ? 'text-slate-700/70' : 'text-slate-600/75'}>
      &middot;
    </span>
  )
}

function EventMetaText({
  children,
  isEnded,
  primary = false,
  tone,
}: {
  children: string
  isEnded: boolean
  primary?: boolean
  tone: EventMetaTone
}) {
  return (
    <span
      className={`timeline-event-meta-segment ${primary ? 'timeline-event-meta-segment--primary' : ''} ${getEventMetaToneClass(tone, isEnded)}`}
      title={children}
    >
      {children}
    </span>
  )
}

function EventDetailTargetText({
  isEnded,
  onOpenDetail,
  target,
}: {
  isEnded: boolean
  onOpenDetail: (ref: EntityRef) => void
  target: EventDetailTarget
}) {
  return (
    <button
      aria-label={`Open details for ${target.label}`}
      className={`timeline-event-meta-segment timeline-event-meta-link ${getEventMetaToneClass(getEventTargetTone(target.ref.kind), isEnded)}`}
      onClick={() => {
        onOpenDetail(target.ref)
      }}
      title={target.label}
      type='button'
    >
      {target.label}
    </button>
  )
}

function EventTaxonomyLine({
  category,
  detailTargets,
  isEnded,
  onOpenDetail,
  pricing,
  preliminary,
  rerun,
}: {
  category: EventCategory
  detailTargets: EventDetailTarget[]
  isEnded: boolean
  onOpenDetail?: (ref: EntityRef) => void
  pricing?: string
  preliminary?: boolean
  rerun?: boolean
}) {
  const meta: {key: string; element: ReactNode; primary?: boolean}[] = [
    {
      key: 'category',
      element: (
        <EventMetaText isEnded={isEnded} primary tone={CATEGORY_TONE[category]}>
          {CATEGORY_LABEL[category]}
        </EventMetaText>
      ),
      primary: true,
    },
  ]

  if (preliminary) {
    meta.push({
      key: 'preliminary',
      element: (
        <EventMetaText isEnded={isEnded} tone='orange'>
          Preliminary
        </EventMetaText>
      ),
    })
  }

  if (rerun) {
    meta.push({
      key: 'rerun',
      element: (
        <EventMetaText isEnded={isEnded} tone={ROLE_TONE.rerun}>
          Rerun
        </EventMetaText>
      ),
    })
  }

  detailTargets.forEach((target) => {
    meta.push({
      key: `${target.ref.kind}-${target.ref.id}`,
      element: onOpenDetail ? (
        <EventDetailTargetText isEnded={isEnded} onOpenDetail={onOpenDetail} target={target} />
      ) : (
        <EventMetaText isEnded={isEnded} tone={getEventTargetTone(target.ref.kind)}>
          {target.label}
        </EventMetaText>
      ),
    })
  })

  if (pricing) {
    meta.push({
      key: 'pricing',
      element: (
        <EventMetaText isEnded={isEnded} tone={ROLE_TONE.price}>
          {pricing}
        </EventMetaText>
      ),
    })
  }

  return (
    <div className='timeline-event-meta-line' aria-label='Event classification'>
      {meta.map((item, index) => (
        <span
          className={`timeline-event-meta-item ${item.primary ? 'timeline-event-meta-item--primary' : ''}`}
          key={item.key}
        >
          {index > 0 ? <EventMetaSeparator isEnded={isEnded} /> : null}
          {item.element}
        </span>
      ))}
    </div>
  )
}

interface EventRowProps {
  event: EventEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

function EventRow({event, now, onOpenDetail}: EventRowProps) {
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [descriptionOverflow, setDescriptionOverflow] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const status = getTimelineStatus(event.startDate, event.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(event.startDate, event.endDate, now)
  const isEnded = status === 'ended'
  const cat = event.category ?? 'other'
  const description = event.description ?? ''
  const hasDescription = description.length > 0
  const canExpandDescription = hasDescription && descriptionOverflow
  const descriptionId = `event-description-${event.id}`

  const hasCustomArt = event.customArt && /^https?:\/\/|^\//.test(event.customArt)
  const featuredArt = resolveEventArt(
    event.featured,
    hasCustomArt ? event.customArt : undefined,
    event.artAlign,
  )

  useEffect(() => {
    const node = descriptionRef.current
    if (!node || !hasDescription) {
      setDescriptionOverflow(false)
      return
    }

    const measureOverflow = () => {
      setDescriptionOverflow(node.scrollHeight > node.clientHeight + 1)
    }

    measureOverflow()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureOverflow)
      return () => {
        window.removeEventListener('resize', measureOverflow)
      }
    }

    const observer = new ResizeObserver(measureOverflow)
    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [description, hasDescription])

  return (
    <li
      className={`group/event-row relative overflow-hidden border bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(10,16,28,0.88))] transition-[border-color,filter] duration-150 ${isEnded ? 'border-slate-700/25 opacity-60 saturate-40' : 'border-slate-700/40 hover:border-amber-200/30 hover:brightness-105'}`}
    >
      <div
        className={`grid h-full ${featuredArt ? 'grid-cols-[5.75rem_minmax(0,1fr)] sm:grid-cols-[6rem_minmax(0,1fr)]' : 'grid-cols-1'}`}
      >
        {featuredArt ? (
          <div className='relative min-h-[8rem] overflow-hidden border-r border-slate-700/30 bg-slate-950/80'>
            <div className='absolute inset-0'>
              <EventArtSlice art={featuredArt} />
            </div>
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/60' />
          </div>
        ) : null}
        <div className='relative flex min-w-0 flex-1 flex-col px-3.5 py-3 sm:px-4'>
          <div className='flex min-w-0 flex-col gap-1'>
            <div className='flex min-w-0 items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <h3
                  className={`ui-title line-clamp-2 min-w-0 text-[0.96rem] leading-[1.16] tracking-[0.004em] sm:text-[0.98rem] ${isEnded ? 'text-slate-500' : 'text-amber-50/90'}`}
                >
                  {event.title}
                </h3>
              </div>
              {countdownDisplay ? (
                <span
                  className='shrink-0 pt-0.5 text-[11px] font-medium whitespace-nowrap text-slate-500 tabular-nums'
                  title={countdownDisplay.title}
                >
                  {countdownDisplay.text}
                </span>
              ) : null}
            </div>
            <EventTaxonomyLine
              category={cat}
              detailTargets={featuredArt?.detailTargets ?? []}
              isEnded={isEnded}
              onOpenDetail={onOpenDetail}
              pricing={event.pricing}
              preliminary={event.preliminary}
              rerun={event.rerun}
            />
          </div>
          {hasDescription ? (
            <div className='relative mt-1'>
              <p
                className={`line-clamp-4 text-[0.8rem] leading-[1.55] text-balance text-slate-400 ${canExpandDescription ? 'pr-12' : ''}`}
                ref={descriptionRef}
              >
                <TimelineRichText text={description} />
              </p>
              {canExpandDescription ? (
                <button
                  aria-controls={descriptionId}
                  aria-expanded={descriptionOpen}
                  className='absolute right-0 bottom-0 border-b border-amber-200/25 pb-px text-[10px] leading-none font-bold tracking-[0.1em] text-amber-100/70 uppercase transition-colors hover:border-amber-100/65 hover:text-amber-50 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
                  onClick={() => {
                    setDescriptionOpen(true)
                  }}
                  type='button'
                >
                  More
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {hasDescription && canExpandDescription && descriptionOpen ? (
        <div
          className='absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden bg-slate-950/95 shadow-[0_12px_24px_rgba(2,6,14,0.46)] backdrop-blur-sm'
          id={descriptionId}
        >
          <div className='flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/55 px-3 py-2.5'>
            <span className='text-[10px] leading-none font-bold tracking-[0.14em] text-slate-500 uppercase'>
              Details
            </span>
            <button
              className='border-b border-slate-500/35 pb-px text-[10px] leading-none font-bold tracking-[0.1em] text-slate-300 uppercase transition-colors hover:border-amber-200/55 hover:text-amber-50 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
              onClick={() => {
                setDescriptionOpen(false)
              }}
              type='button'
            >
              Less
            </button>
          </div>
          <p className='min-h-0 flex-1 overflow-y-auto px-3 py-2.5 text-[0.8rem] leading-[1.55] text-slate-300'>
            <TimelineRichText text={description} />
          </p>
        </div>
      ) : null}
    </li>
  )
}

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

  const active = events.filter((e) => getTimelineStatus(e.startDate, e.endDate, now) === 'active')
  const upcoming = events.filter(
    (e) => getTimelineStatus(e.startDate, e.endDate, now) === 'upcoming',
  )
  const ended = events.filter(
    (e) =>
      getTimelineStatus(e.startDate, e.endDate, now) === 'ended' &&
      shouldDisplayEndedEventInArchive(e),
  )

  if (active.length === 0 && upcoming.length === 0 && ended.length === 0) {
    return <p className='px-3 py-4 text-sm text-slate-400'>No events to display.</p>
  }

  return (
    <div className='space-y-5'>
      {active.length > 0 && (
        <ul className='grid gap-3 md:grid-cols-2'>
          {active.map((event) => (
            <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </ul>
      )}

      {upcoming.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <h3 className='ui-title text-sm text-slate-400'>Upcoming events</h3>
            <div className='h-px flex-1 bg-gradient-to-r from-amber-200/20 via-slate-500/25 to-transparent' />
          </div>
          <ul className='grid gap-3 md:grid-cols-2'>
            {upcoming.map((event) => (
              <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
            ))}
          </ul>
        </div>
      )}

      {ended.length > 0 ? (
        <TimelineArchiveSection
          contentClassName='grid gap-3 md:grid-cols-2'
          dividerClassName='bg-gradient-to-r from-amber-200/15 via-slate-500/20 to-transparent'
          expanded={showEnded}
          itemCount={ended.length}
          onToggle={() => {
            setShowEnded((current) => !current)
          }}
          title='Ended events'
          titleClassName='text-slate-400'
        >
          {ended.map((event) => (
            <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}
