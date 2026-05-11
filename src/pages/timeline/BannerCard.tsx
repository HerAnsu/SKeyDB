import {Fragment, useEffect, useMemo, useRef, useState, type MouseEvent} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'
import {Link} from 'react-router-dom'

import type {EntityRef} from '@/domain/entities/types'
import {
  getTimelineCountdownDisplay,
  getTimelineStatus,
  type BannerEntry,
  type BannerFeaturedUnit,
  type BannerPoolSlot,
  type BannerTag,
} from '@/domain/timeline'

import {resolveTimelineFeaturedAsset, type TimelineFeaturedAsset} from './timelineDetailResolution'
import {TimelineRichText} from './TimelineRichText'

const BANNER_TAG_LABEL: Record<BannerTag, string> = {
  awaken: 'New Awakener',
  limited: 'Limited',
  standard: 'Standard',
  rerun: 'Rerun',
  selector: 'Selector',
  wheel: 'Wheel',
  combo: 'Combo',
  collab: 'Collab',
  preliminary: 'Preliminary',
}

const BANNER_TAG_COLOR: Record<BannerTag, string> = {
  awaken: 'text-amber-300/95',
  limited: 'text-sky-300/90',
  standard: 'text-slate-400/80',
  rerun: 'text-violet-300/90',
  selector: 'text-pink-300/90',
  wheel: 'text-cyan-300/90',
  combo: 'text-emerald-300/95',
  collab: 'text-fuchsia-300/90',
  preliminary: 'text-amber-200/76',
}

const CYCLE_INTERVAL_MS = 2500
const TRANSITION_DURATION_MS = 800

type SliceAsset = TimelineFeaturedAsset

function isPlainPrimaryClick(event: MouseEvent<HTMLElement>): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
}

function openDetailFromTarget(
  event: MouseEvent<HTMLElement>,
  detailRef: EntityRef | undefined,
  onOpenDetail: ((ref: EntityRef) => void) | undefined,
) {
  if (!detailRef || !onOpenDetail || !isPlainPrimaryClick(event)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  onOpenDetail(detailRef)
}

function SliceDetailTarget({
  asset,
  className,
  onOpenDetail,
}: {
  asset: SliceAsset
  className: string
  onOpenDetail?: (ref: EntityRef) => void
}) {
  if (asset.linkTo) {
    return (
      <Link
        aria-label={asset.label}
        className={className}
        onClick={(event) => {
          openDetailFromTarget(event, asset.detailRef, onOpenDetail)
        }}
        title={asset.label}
        to={asset.linkTo}
      />
    )
  }

  if (!asset.detailRef || !onOpenDetail) {
    return null
  }

  return (
    <button
      aria-label={asset.label}
      className={className}
      onClick={(event) => {
        openDetailFromTarget(event, asset.detailRef, onOpenDetail)
      }}
      title={asset.label}
      type='button'
    />
  )
}

function getArtworkImageClass(asset: SliceAsset, emphasis: boolean): string {
  if (asset.isWheel) {
    return emphasis
      ? 'h-full w-full scale-[1.18] object-cover object-center transition-transform duration-500 ease-out group-hover/art-panel:scale-[1.24] motion-reduce:transition-none'
      : 'h-full w-full scale-[1.12] object-cover object-center transition-transform duration-500 ease-out group-hover/art-panel:scale-[1.18] motion-reduce:transition-none'
  }

  return emphasis
    ? 'h-full w-full scale-[1.035] object-cover object-top transition-transform duration-500 ease-out group-hover/art-panel:scale-[1.08] motion-reduce:transition-none'
    : 'h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover/art-panel:scale-[1.045] motion-reduce:transition-none'
}

function ArtworkFallback({label}: {label?: string}) {
  return (
    <div className='relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(217,196,121,0.14),rgba(8,13,24,0.9)_58%,rgba(2,6,14,1))]'>
      <span className='sigil-placeholder sigil-placeholder-card opacity-80' />
      {label ? (
        <p className='ui-title relative z-10 max-w-[82%] text-center text-xs leading-tight text-amber-50/80'>
          {label}
        </p>
      ) : null}
    </div>
  )
}

function ArtworkPanel({
  asset,
  className = '',
  emphasis = false,
  onOpenDetail,
}: {
  asset: SliceAsset
  className?: string
  emphasis?: boolean
  onOpenDetail?: (ref: EntityRef) => void
}) {
  return (
    <div
      className={`group/art-panel relative min-w-0 overflow-hidden bg-slate-950 ${className}`}
      title={asset.label}
    >
      <div className='absolute inset-0'>
        {asset.url ? (
          <img
            alt={asset.label}
            className={getArtworkImageClass(asset, emphasis)}
            draggable={false}
            src={asset.url}
          />
        ) : (
          <ArtworkFallback label={asset.label} />
        )}
      </div>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.04)_48%,rgba(2,6,14,0.74))]' />
      <div className='pointer-events-none absolute inset-y-0 right-0 w-px bg-amber-100/10' />
      <SliceDetailTarget
        asset={asset}
        className='absolute inset-0 z-30 focus-visible:ring-2 focus-visible:ring-amber-200/45 focus-visible:outline-none'
        onOpenDetail={onOpenDetail}
      />
    </div>
  )
}

function getFeaturedGridTemplate(assets: SliceAsset[]): string {
  return `repeat(${String(Math.min(assets.length, 4))}, minmax(0, 1fr))`
}

function FeaturedArtwork({
  assets,
  onOpenDetail,
}: {
  assets: SliceAsset[]
  onOpenDetail?: (ref: EntityRef) => void
}) {
  if (assets.length === 0) {
    return <BannerPlaceholderArt />
  }

  return (
    <div
      className='absolute inset-0 grid gap-px bg-amber-100/10'
      style={{gridTemplateColumns: getFeaturedGridTemplate(assets)}}
    >
      {assets.slice(0, 4).map((asset, index) => (
        <ArtworkPanel
          asset={asset}
          emphasis={index === 0}
          key={`${asset.label}-${String(index)}`}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  )
}

interface PoolCycleFrame {
  activeIdx: number
  incomingIdx: number
  transitioning: boolean
}

function getPoolFingerprint(pool: BannerFeaturedUnit[]): string {
  return pool
    .map((u) => `${u.kind}:${u.name}:${u.detailLink === false ? 'no-detail' : 'detail'}`)
    .join('|')
}

function usePoolCycling(poolSlots: BannerPoolSlot[]): PoolCycleFrame[] {
  const fingerprints = useMemo(() => poolSlots.map((s) => getPoolFingerprint(s.pool)), [poolSlots])

  const sharedGroups = useMemo(() => {
    const groups = new Map<string, number[]>()
    fingerprints.forEach((fp, i) => {
      const existing = groups.get(fp)
      if (existing) {
        existing.push(i)
      } else {
        groups.set(fp, [i])
      }
    })
    return groups
  }, [fingerprints])

  const [frames, setFrames] = useState<PoolCycleFrame[]>(() => {
    const initial: PoolCycleFrame[] = poolSlots.map(() => ({
      activeIdx: 0,
      incomingIdx: -1,
      transitioning: false,
    }))
    for (const group of sharedGroups.values()) {
      if (group.length <= 1) continue
      const poolSize = poolSlots[group[0]].pool.length
      group.forEach((slotIdx, i) => {
        initial[slotIdx].activeIdx = i % poolSize
      })
    }
    return initial
  })

  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const cyclableSlots = poolSlots
      .map((s, i) => (s.pool.length > 1 ? i : -1))
      .filter((i) => i >= 0)
    if (cyclableSlots.length === 0) return

    let deck: number[] = []
    let lastSlot = -1

    function shuffleDeck() {
      deck = [...cyclableSlots]
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
      if (deck.length > 1 && deck[0] === lastSlot) {
        const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1))
        ;[deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]]
      }
    }

    const interval = setInterval(() => {
      if (deck.length === 0) shuffleDeck()
      const slotIdx = deck.shift()
      if (slotIdx === undefined) return
      lastSlot = slotIdx

      setFrames((prev) => {
        if (prev[slotIdx].transitioning) return prev

        const poolSize = poolSlots[slotIdx].pool.length
        const fp = fingerprints[slotIdx]
        const group = sharedGroups.get(fp) ?? [slotIdx]

        const usedIndices = new Set(
          group
            .filter((i) => i !== slotIdx)
            .map((i) => (prev[i].transitioning ? prev[i].incomingIdx : prev[i].activeIdx)),
        )

        let nextIdx = (prev[slotIdx].activeIdx + 1) % poolSize
        let safety = 0
        while (usedIndices.has(nextIdx) && safety < poolSize) {
          nextIdx = (nextIdx + 1) % poolSize
          safety++
        }

        const next = [...prev]
        next[slotIdx] = {...prev[slotIdx], incomingIdx: nextIdx, transitioning: true}
        return next
      })

      if (pendingRef.current) clearTimeout(pendingRef.current)
      pendingRef.current = setTimeout(() => {
        setFrames((prev) =>
          prev.map((f) =>
            f.transitioning ? {activeIdx: f.incomingIdx, incomingIdx: -1, transitioning: false} : f,
          ),
        )
        pendingRef.current = null
      }, TRANSITION_DURATION_MS)
    }, CYCLE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      if (pendingRef.current) clearTimeout(pendingRef.current)
    }
  }, [poolSlots, fingerprints, sharedGroups])

  return frames
}

interface ResolvedVisualSlot {
  assets: SliceAsset[]
  cycleFrameIndex: number
}

function resolvePoolSlots(poolSlots: BannerPoolSlot[]): ResolvedVisualSlot[] {
  const visual: ResolvedVisualSlot[] = []
  poolSlots.forEach((slot, frameIdx) => {
    visual.push({
      assets: slot.pool.map((unit) => resolveTimelineFeaturedAsset(unit)),
      cycleFrameIndex: frameIdx,
    })
    if (slot.linked) {
      visual.push({
        assets: slot.pool.map((unit) =>
          resolveTimelineFeaturedAsset({
            name: unit.name,
            kind: 'wheel-auto',
            detailLink: unit.detailLink,
          }),
        ),
        cycleFrameIndex: frameIdx,
      })
    }
  })
  return visual
}

function getPoolGridTemplate(total: number): string {
  return `repeat(${String(Math.max(total, 1))}, minmax(0, 1fr))`
}

function PoolMontageSlot({
  assets,
  frame,
  onOpenDetail,
}: {
  assets: SliceAsset[]
  frame: PoolCycleFrame
  onOpenDetail?: (ref: EntityRef) => void
}) {
  const [layers, setLayers] = useState<{a: number; b: number; front: 'a' | 'b'}>({
    a: frame.activeIdx,
    b: frame.activeIdx,
    front: 'a',
  })
  const prevTransRef = useRef(false)

  useEffect(() => {
    if (frame.transitioning && !prevTransRef.current && frame.incomingIdx >= 0) {
      setLayers((prev) => {
        const back: 'a' | 'b' = prev.front === 'a' ? 'b' : 'a'
        return {...prev, [back]: frame.incomingIdx, front: back}
      })
    }
    prevTransRef.current = frame.transitioning
  }, [frame.transitioning, frame.incomingIdx])

  const assetA = assets[layers.a]
  const assetB = assets[layers.b]
  const frontAsset = layers.front === 'a' ? assetA : assetB

  return (
    <div
      className='group/slice relative min-w-0 overflow-hidden bg-slate-950'
      title={frontAsset.label}
    >
      <div
        className='absolute inset-0 overflow-hidden transition-opacity ease-in-out'
        style={{
          opacity: layers.front === 'a' ? 1 : 0,
          transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
        }}
      >
        <ArtworkPanel asset={assetA} className='h-full w-full' onOpenDetail={onOpenDetail} />
      </div>
      {layers.a !== layers.b ? (
        <div
          className='absolute inset-0 overflow-hidden transition-opacity ease-in-out'
          style={{
            opacity: layers.front === 'b' ? 1 : 0,
            transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
          }}
        >
          <ArtworkPanel asset={assetB} className='h-full w-full' onOpenDetail={onOpenDetail} />
        </div>
      ) : null}
    </div>
  )
}

function PoolMontageArtwork({
  cycleFrames,
  onOpenDetail,
  visualSlots,
}: {
  cycleFrames: PoolCycleFrame[]
  onOpenDetail?: (ref: EntityRef) => void
  visualSlots: ResolvedVisualSlot[]
}) {
  return (
    <div
      className='absolute inset-0 grid gap-px bg-amber-100/10'
      style={{gridTemplateColumns: getPoolGridTemplate(visualSlots.length)}}
    >
      {visualSlots.map((vs, index) => (
        <PoolMontageSlot
          assets={vs.assets}
          frame={cycleFrames[vs.cycleFrameIndex]}
          key={index}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  )
}

function BannerPlaceholderArt() {
  return (
    <div className='absolute inset-0'>
      <ArtworkFallback label='Select your own rate-up' />
    </div>
  )
}

function FullCardArtwork({label, url}: {label: string; url: string}) {
  return (
    <div className='absolute inset-0 overflow-hidden bg-slate-950'>
      <img
        alt={label}
        className='h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover/banner:scale-[1.035] motion-reduce:transition-none'
        draggable={false}
        src={url}
      />
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,14,0.04),rgba(2,6,14,0.08)_42%,rgba(2,6,14,0.48)),linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_58%,rgba(2,6,14,0.68))]' />
    </div>
  )
}

function expandFeatured(featured: BannerFeaturedUnit[]): BannerFeaturedUnit[] {
  if (featured.length !== 1 || featured[0].kind !== 'awakener') {
    return featured
  }
  return [
    featured[0],
    {name: featured[0].name, kind: 'wheel-auto', detailLink: featured[0].detailLink},
  ]
}

function hasArtworkToReveal(
  assets: SliceAsset[],
  visualSlots: ResolvedVisualSlot[] | null,
  customArt: string | undefined,
): boolean {
  return Boolean(customArt) || assets.length > 0 || Boolean(visualSlots && visualSlots.length > 0)
}

interface BannerInfoDrawerProps {
  banner: BannerEntry
  canCollapse: boolean
  countdownTitle: string | undefined
  isEnded: boolean
  open: boolean
  onToggle: () => void
}

function BannerInfoDrawer({
  banner,
  canCollapse,
  countdownTitle,
  isEnded,
  open,
  onToggle,
}: BannerInfoDrawerProps) {
  const drawerTransform = open ? 'translate-x-0' : 'translate-x-[calc(100%_-_1.75rem)]'
  const contentInset = canCollapse ? 'pr-4 pl-11' : 'px-5'
  const displayTags =
    banner.tags && banner.tags.length > 0
      ? banner.tags
      : banner.preliminary
        ? ([banner.type, 'preliminary'] satisfies BannerTag[])
        : [banner.type]

  return (
    <div
      className={`absolute inset-y-0 right-0 z-30 w-[calc(50%+1.75rem)] min-w-[11.75rem] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${drawerTransform}`}
    >
      <div className='absolute inset-0 border-l border-amber-100/16 bg-[linear-gradient(180deg,rgba(9,16,29,0.42)_0%,rgba(9,16,29,0.88)_44%,rgba(4,8,16,0.98)_100%)] shadow-[-14px_0_26px_rgba(2,6,14,0.36)] backdrop-blur-[10px]' />

      {canCollapse ? (
        <button
          aria-expanded={open}
          aria-label={
            open ? `Hide details for ${banner.title}` : `Show details for ${banner.title}`
          }
          className='absolute inset-y-0 left-0 z-30 grid w-7 place-items-center border-l border-amber-100/14 bg-slate-950/58 text-amber-100/78 shadow-[-6px_0_14px_rgba(2,6,14,0.32)] transition-[background-color,color] duration-150 hover:bg-slate-900/88 hover:text-amber-50 focus-visible:ring-2 focus-visible:ring-amber-200/45 focus-visible:outline-none'
          onClick={onToggle}
          title={open ? 'Hide details' : 'Show details'}
          type='button'
        >
          {open ? <FaChevronRight aria-hidden /> : <FaChevronLeft aria-hidden />}
          {!open ? (
            <span
              aria-hidden
              className='absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.46rem] leading-none font-bold tracking-[0.18em] uppercase [writing-mode:vertical-rl]'
            >
              Details
            </span>
          ) : null}
        </button>
      ) : null}

      <div
        className={`relative z-10 flex h-full min-w-0 flex-col justify-center py-6 ${contentInset} ${isEnded ? 'text-slate-500' : 'text-slate-100'}`}
        title={countdownTitle}
      >
        <h3
          className={`ui-title line-clamp-3 text-[1.02rem] leading-[1.16] tracking-tight sm:text-[1.08rem] ${isEnded ? 'text-slate-500' : 'text-amber-50'}`}
        >
          {banner.title}
        </h3>
        <div className='mt-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.58rem] leading-none font-bold tracking-[0.16em] uppercase'>
          {displayTags.map((tag, index) => (
            <Fragment key={tag}>
              {index > 0 ? (
                <span aria-hidden className={isEnded ? 'text-slate-700' : 'text-slate-600/75'}>
                  &middot;
                </span>
              ) : null}
              <span className={isEnded ? 'text-slate-600' : BANNER_TAG_COLOR[tag]}>
                {BANNER_TAG_LABEL[tag]}
              </span>
            </Fragment>
          ))}
        </div>
        {banner.description ? (
          <p className='mt-3 line-clamp-3 text-xs leading-[1.5] text-slate-400 sm:line-clamp-4'>
            <TimelineRichText text={banner.description} />
          </p>
        ) : null}
      </div>
    </div>
  )
}

interface BannerCardProps {
  banner: BannerEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

export function BannerCard({banner, now, onOpenDetail}: BannerCardProps) {
  const [drawerPinnedOpen, setDrawerPinnedOpen] = useState(false)
  const status = getTimelineStatus(banner.startDate, banner.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(banner.startDate, banner.endDate, now)
  const displaySlices = useMemo(() => expandFeatured(banner.featured ?? []), [banner.featured])
  const displayAssets = useMemo(
    () => displaySlices.map((unit) => resolveTimelineFeaturedAsset(unit)),
    [displaySlices],
  )
  const visualSlots = useMemo(
    () => (banner.poolSlots ? resolvePoolSlots(banner.poolSlots) : null),
    [banner.poolSlots],
  )
  const cycleFrames = usePoolCycling(banner.poolSlots ?? [])
  const isEnded = status === 'ended'
  const artStateClass = isEnded ? 'opacity-[0.58] saturate-50' : ''
  const drawerCanCollapse = hasArtworkToReveal(displayAssets, visualSlots, banner.customArt)
  const drawerOpen = !drawerCanCollapse || drawerPinnedOpen
  const showPinned = banner.pinned === true && status === 'active'

  return (
    <article
      className={`group/banner relative aspect-[8/5] w-full max-w-[30rem] overflow-hidden rounded-[2px] border shadow-[0_12px_26px_rgba(2,6,23,0.28),inset_0_1px_0_rgba(255,244,202,0.05)] transition-[border-color,box-shadow] duration-150 ${isEnded ? 'border-slate-700/25' : 'border-slate-700/50 hover:border-amber-200/46 hover:shadow-[0_18px_34px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,244,202,0.08)]'} ${showPinned ? 'border-amber-300/45 bg-[radial-gradient(circle_at_18%_0%,rgba(181,124,34,0.22),transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(5,10,18,0.98))] ring-1 ring-amber-300/10 ring-inset' : 'bg-[radial-gradient(circle_at_14%_0%,rgba(76,96,128,0.2),transparent_44%),linear-gradient(180deg,rgba(9,16,29,0.96),rgba(4,9,17,0.98))]'}`}
    >
      <div className={`absolute inset-0 bg-slate-950 ${artStateClass}`}>
        {banner.customArt ? (
          <FullCardArtwork label={banner.title} url={banner.customArt} />
        ) : visualSlots && visualSlots.length > 0 ? (
          <PoolMontageArtwork
            cycleFrames={cycleFrames}
            onOpenDetail={onOpenDetail}
            visualSlots={visualSlots}
          />
        ) : (
          <FeaturedArtwork assets={displayAssets} onOpenDetail={onOpenDetail} />
        )}
      </div>

      <div className='pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_24%_12%,rgba(255,244,202,0.06),transparent_34%),linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_58%,rgba(2,6,14,0.68))]' />
      <div className='pointer-events-none absolute inset-1 z-20 border border-amber-100/10' />

      {countdownDisplay ? (
        <span
          className='absolute bottom-2.5 left-3 z-40 text-[0.68rem] leading-none font-medium text-slate-300/86 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]'
          title={countdownDisplay.title}
        >
          {countdownDisplay.text}
        </span>
      ) : null}

      <BannerInfoDrawer
        banner={banner}
        canCollapse={drawerCanCollapse}
        countdownTitle={countdownDisplay?.title}
        isEnded={isEnded}
        onToggle={() => {
          setDrawerPinnedOpen((current) => !current)
        }}
        open={drawerOpen}
      />
    </article>
  )
}
