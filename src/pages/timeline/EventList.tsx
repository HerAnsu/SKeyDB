import {useState} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {
  getTimelineCountdownDisplay,
  getTimelineStatus,
  shouldDisplayEndedEventInArchive,
  type BannerFeaturedUnit,
  type EventCategory,
  type EventEntry,
  type TimelineStatus,
} from '@/domain/timeline'

import {TimelineArchiveSection} from './TimelineArchiveSection'
import {resolveTimelineFeaturedAsset} from './timelineDetailResolution'

const STATUS_CLASS: Record<TimelineStatus, string> = {
  active: 'timeline-event-chip--status-active',
  upcoming: 'timeline-event-chip--status-upcoming',
  ended: 'timeline-event-chip--status-ended',
}

const STATUS_LABEL: Record<TimelineStatus, string> = {
  active: 'Live',
  upcoming: 'Soon',
  ended: 'Ended',
}

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

const CATEGORY_TINT: Record<EventCategory, string> = {
  story: 'timeline-event-chip--amber',
  raid: 'timeline-event-chip--red',
  battlepass: 'timeline-event-chip--violet',
  'gameplay-event': 'timeline-event-chip--amber',
  'd-tide': 'timeline-event-chip--red',
  curriculum: 'timeline-event-chip--violet',
  login: 'timeline-event-chip--teal',
  skin: 'timeline-event-chip--pink',
  'wheel-event': 'timeline-event-chip--cyan',
  preorder: 'timeline-event-chip--orange',
  maintenance: 'timeline-event-chip--slate',
  campaign: 'timeline-event-chip--emerald',
  collab: 'timeline-event-chip--fuchsia',
  other: 'timeline-event-chip--slate',
}

const CATEGORY_BORDER_LEFT: Record<EventCategory, string> = {
  story: 'border-l-amber-400',
  raid: 'border-l-red-400',
  battlepass: 'border-l-violet-400',
  'gameplay-event': 'border-l-amber-400',
  'd-tide': 'border-l-red-400',
  curriculum: 'border-l-violet-400',
  login: 'border-l-teal-400',
  skin: 'border-l-pink-400',
  'wheel-event': 'border-l-cyan-400',
  preorder: 'border-l-orange-400',
  maintenance: 'border-l-slate-400',
  campaign: 'border-l-emerald-400',
  collab: 'border-l-fuchsia-400',
  other: 'border-l-slate-400',
}

const RERUN_TINT = 'timeline-event-chip--rerun'
const EVENT_META_CHIP_CLASS = 'timeline-event-chip'
const MUTED_CHIP_CLASS = 'timeline-event-chip--muted'

function getEventDetailTargetTint(kind: EntityRef['kind']): string {
  return kind === 'wheel' ? 'timeline-event-chip--wheel' : 'timeline-event-chip--awakener'
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

function EventDetailTargetChip({
  onOpenDetail,
  target,
}: {
  onOpenDetail: (ref: EntityRef) => void
  target: EventDetailTarget
}) {
  return (
    <button
      aria-label={`Open details for ${target.label}`}
      className={`${EVENT_META_CHIP_CLASS} timeline-event-chip--interactive ${getEventDetailTargetTint(target.ref.kind)}`}
      onClick={() => {
        onOpenDetail(target.ref)
      }}
      title={target.label}
      type='button'
    >
      <span className='timeline-event-chip__label'>{target.label}</span>
    </button>
  )
}

interface EventRowProps {
  event: EventEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

function EventRow({event, now, onOpenDetail}: EventRowProps) {
  const status = getTimelineStatus(event.startDate, event.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(event.startDate, event.endDate, now)
  const isEnded = status === 'ended'
  const showPinned = event.pinned === true && status === 'active'
  const cat = event.category ?? 'other'
  const catTint = isEnded ? MUTED_CHIP_CLASS : CATEGORY_TINT[cat]
  const wrapperBorderLeft = isEnded ? 'border-l-slate-700' : CATEGORY_BORDER_LEFT[cat]

  const hasCustomArt = event.customArt && /^https?:\/\/|^\//.test(event.customArt)
  const featuredArt = resolveEventArt(
    event.featured,
    hasCustomArt ? event.customArt : undefined,
    event.artAlign,
  )

  return (
    <li
      className={`group/event-row overflow-hidden border bg-slate-900/55 ${isEnded ? 'border-slate-500/25 opacity-60 saturate-50' : status === 'upcoming' ? 'border-slate-500/40 opacity-70' : 'border-slate-500/40'} ${showPinned ? '!border-l-amber-400 bg-amber-400/5 ring-1 ring-amber-400/10 ring-inset' : wrapperBorderLeft}`}
    >
      <div className='flex h-full'>
        <div className='flex min-w-0 flex-1 flex-col py-3 pl-5'>
          <div className='grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2'>
            <div className='flex min-w-0 items-center gap-2'>
              {showPinned ? (
                <span
                  className='shrink-0 text-[10px] text-amber-300/80 drop-shadow-sm'
                  title='Pinned'
                >
                  &#x1F4CC;
                </span>
              ) : null}
              <h4
                className={`ui-title min-w-0 truncate text-base font-bold tracking-tight drop-shadow-sm ${isEnded ? 'text-slate-400' : 'text-slate-100'}`}
              >
                {event.title}
              </h4>
            </div>
            <div
              className='ml-auto flex shrink-0 flex-col items-end justify-center gap-0.5'
              title={countdownDisplay?.title}
            >
              <span
                className={`${EVENT_META_CHIP_CLASS} timeline-event-chip--status ${STATUS_CLASS[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
              {countdownDisplay ? (
                <span className='text-[10px] font-medium whitespace-nowrap text-slate-400 drop-shadow-sm'>
                  {countdownDisplay.text}
                </span>
              ) : null}
            </div>
          </div>
          <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
            <span className={`${EVENT_META_CHIP_CLASS} ${catTint}`}>{CATEGORY_LABEL[cat]}</span>
            {event.rerun ? (
              <span
                className={`${EVENT_META_CHIP_CLASS} ${isEnded ? MUTED_CHIP_CLASS : RERUN_TINT}`}
              >
                Rerun
              </span>
            ) : null}
            {featuredArt && onOpenDetail
              ? featuredArt.detailTargets.map((target) => (
                  <EventDetailTargetChip
                    key={`${target.ref.kind}-${target.ref.id}`}
                    onOpenDetail={onOpenDetail}
                    target={target}
                  />
                ))
              : null}
            {event.pricing ? (
              <span className={`${EVENT_META_CHIP_CLASS} timeline-event-chip--price`}>
                {event.pricing}
              </span>
            ) : null}
          </div>
          {event.description ? (
            <p className='mt-2.5 line-clamp-3 text-xs leading-relaxed text-balance whitespace-pre-line text-slate-400 drop-shadow-sm'>
              {event.description}
            </p>
          ) : null}
        </div>
        {featuredArt ? (
          <div
            className='relative w-16 shrink-0 bg-slate-950/80'
            style={{clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)'}}
          >
            <div className='absolute inset-0'>
              <EventArtSlice art={featuredArt} />
            </div>
          </div>
        ) : null}
      </div>
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

  return (
    <div className='space-y-6'>
      {active.length > 0 && (
        <ul className='grid gap-2 sm:grid-cols-2'>
          {active.map((event) => (
            <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </ul>
      )}

      {upcoming.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <h4 className='ui-title text-sm text-slate-400'>Upcoming</h4>
            <div className='h-px flex-1 bg-gradient-to-r from-slate-500/30 to-transparent' />
          </div>
          <ul className='grid gap-2 sm:grid-cols-2'>
            {upcoming.map((event) => (
              <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
            ))}
          </ul>
        </div>
      )}

      {ended.length > 0 ? (
        <TimelineArchiveSection
          contentClassName='grid gap-2 sm:grid-cols-2'
          expanded={showEnded}
          itemCount={ended.length}
          onToggle={() => {
            setShowEnded((current) => !current)
          }}
          title='Ended'
        >
          {ended.map((event) => (
            <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}
