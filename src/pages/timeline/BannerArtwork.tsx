import {useEffect, useMemo, useRef, useState, type MouseEvent} from 'react'

import {Link} from 'react-router-dom'

import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit, BannerPoolSlot} from '@/domain/timeline'

import {
  expandFeatured,
  getFeaturedGridTemplate,
  getPoolGridTemplate,
  getPoolPreloadUrls,
  getVisualSlotSignature,
  resolveFeaturedAssets,
  resolvePoolSlots,
  type ResolvedVisualSlot,
  type SliceAsset,
} from './timelineArtworkModel'
import {TRANSITION_DURATION_MS, usePoolCycling, type PoolCycleFrame} from './usePoolCycling'

const COMBO_PRELOAD_ROOT_MARGIN = '720px'
const COMBO_PRELOAD_BATCH_SIZE = 4
const COMBO_PRELOAD_BATCH_DELAY_MS = 80
const SLICE_DETAIL_TARGET_CLASS =
  'absolute inset-0 z-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-amber-100/95 focus-visible:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.85)]'
const POOL_MONTAGE_LAYER_CLASS =
  'absolute inset-0 overflow-hidden transition-opacity ease-in-out motion-reduce:transition-none'

const imagePreloadCache = new Map<string, Promise<void>>()
const noCleanup = () => undefined

function finishImageDecode(image: HTMLImageElement): Promise<void> {
  if (typeof image.decode !== 'function') {
    return Promise.resolve()
  }

  return image.decode().then(
    () => undefined,
    () => undefined,
  )
}

function preloadTimelineImage(url: string | undefined): Promise<void> {
  if (!url || typeof window === 'undefined' || typeof window.Image === 'undefined') {
    return Promise.resolve()
  }

  const cached = imagePreloadCache.get(url)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new window.Image()
    image.decoding = 'async'

    const finish = () => {
      void finishImageDecode(image).then(resolve)
    }

    image.onload = finish
    image.onerror = () => {
      resolve()
    }
    image.src = url

    if (image.complete) {
      finish()
    }
  })

  imagePreloadCache.set(url, promise)
  return promise
}

function preloadTimelineImagesInBatches(urls: string[]): () => void {
  if (typeof window === 'undefined' || urls.length === 0) return noCleanup

  let cancelled = false
  let nextIndex = 0
  let timer: number | undefined

  const preloadNextBatch = () => {
    if (cancelled) return

    const batch = urls.slice(nextIndex, nextIndex + COMBO_PRELOAD_BATCH_SIZE)
    batch.forEach((url) => {
      void preloadTimelineImage(url)
    })
    nextIndex += COMBO_PRELOAD_BATCH_SIZE

    if (nextIndex < urls.length) {
      timer = window.setTimeout(preloadNextBatch, COMBO_PRELOAD_BATCH_DELAY_MS)
    }
  }

  timer = window.setTimeout(preloadNextBatch, 0)

  return () => {
    cancelled = true
    if (timer !== undefined) {
      window.clearTimeout(timer)
    }
  }
}

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
  const base =
    'h-full w-full transition-transform duration-500 ease-out will-change-transform [backface-visibility:hidden] motion-reduce:transition-none'

  if (asset.isWheel) {
    return emphasis
      ? `${base} scale-[1.18] object-cover object-center group-hover/art-panel:scale-[1.24]`
      : `${base} scale-[1.12] object-cover object-center group-hover/art-panel:scale-[1.18]`
  }

  return emphasis
    ? `${base} scale-[1.035] object-cover object-top group-hover/art-panel:scale-[1.08]`
    : `${base} object-cover object-top group-hover/art-panel:scale-[1.045]`
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

function ArtworkVisual({asset, emphasis = false}: {asset: SliceAsset; emphasis?: boolean}) {
  return asset.url ? (
    <img
      alt={asset.label}
      className={getArtworkImageClass(asset, emphasis)}
      decoding='async'
      draggable={false}
      loading='lazy'
      src={asset.url}
    />
  ) : (
    <ArtworkFallback label={asset.label} />
  )
}

function SplitPanelSeparator() {
  return (
    <div className='pointer-events-none absolute inset-y-0 right-0 z-20 w-px bg-slate-950/70 shadow-[1px_0_0_rgba(255,244,202,0.045)]' />
  )
}

function ArtworkPanel({
  asset,
  className = '',
  emphasis = false,
  onOpenDetail,
  showSeparator = false,
}: {
  asset: SliceAsset
  className?: string
  emphasis?: boolean
  onOpenDetail?: (ref: EntityRef) => void
  showSeparator?: boolean
}) {
  return (
    <div
      className={`group/art-panel relative min-w-0 overflow-hidden bg-slate-950 ${className}`}
      title={asset.label}
    >
      <div className='absolute inset-0'>
        <ArtworkVisual asset={asset} emphasis={emphasis} />
      </div>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.04)_48%,rgba(2,6,14,0.74))]' />
      {showSeparator ? <SplitPanelSeparator /> : null}
      <SliceDetailTarget
        asset={asset}
        className={SLICE_DETAIL_TARGET_CLASS}
        onOpenDetail={onOpenDetail}
      />
    </div>
  )
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
      className='absolute inset-0 grid bg-slate-950'
      style={{gridTemplateColumns: getFeaturedGridTemplate(assets)}}
    >
      {assets.slice(0, 4).map((asset, index, splitAssets) => (
        <ArtworkPanel
          asset={asset}
          emphasis={index === 0}
          key={`${asset.label}-${String(index)}`}
          onOpenDetail={onOpenDetail}
          showSeparator={index < splitAssets.length - 1}
        />
      ))}
    </div>
  )
}

function PoolMontageSlot({
  assets,
  frame,
  onOpenDetail,
  showSeparator,
}: {
  assets: SliceAsset[]
  frame: PoolCycleFrame
  onOpenDetail?: (ref: EntityRef) => void
  showSeparator: boolean
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
  const transitionStyle = {
    transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
  }

  return (
    <div
      className='group/art-panel group/slice relative min-w-0 overflow-hidden bg-slate-950 [contain:paint]'
      title={frontAsset.label}
    >
      <div
        className={POOL_MONTAGE_LAYER_CLASS}
        style={{
          opacity: layers.front === 'a' ? 1 : 0,
          ...transitionStyle,
        }}
      >
        <ArtworkVisual asset={assetA} />
      </div>
      {layers.a !== layers.b ? (
        <div
          className={POOL_MONTAGE_LAYER_CLASS}
          style={{
            opacity: layers.front === 'b' ? 1 : 0,
            ...transitionStyle,
          }}
        >
          <ArtworkVisual asset={assetB} />
        </div>
      ) : null}
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.04)_48%,rgba(2,6,14,0.74))]' />
      {showSeparator ? <SplitPanelSeparator /> : null}
      <SliceDetailTarget
        asset={frontAsset}
        className={SLICE_DETAIL_TARGET_CLASS}
        onOpenDetail={onOpenDetail}
      />
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
  const rootRef = useRef<HTMLDivElement>(null)
  const [shouldPreload, setShouldPreload] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    if (shouldPreload) return

    const node = rootRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setShouldPreload(true)
        observer.disconnect()
      },
      {rootMargin: COMBO_PRELOAD_ROOT_MARGIN},
    )
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [shouldPreload])

  useEffect(() => {
    if (!shouldPreload) return

    return preloadTimelineImagesInBatches(getPoolPreloadUrls(visualSlots))
  }, [shouldPreload, visualSlots])

  return (
    <div
      className='absolute inset-0 grid bg-slate-950'
      ref={rootRef}
      style={{gridTemplateColumns: getPoolGridTemplate(visualSlots.length)}}
    >
      {visualSlots.map((vs, index) => (
        <PoolMontageSlot
          assets={vs.assets}
          frame={cycleFrames[vs.cycleFrameIndex]}
          key={`${String(index)}:${getVisualSlotSignature(vs)}`}
          onOpenDetail={onOpenDetail}
          showSeparator={index < visualSlots.length - 1}
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
        decoding='async'
        draggable={false}
        loading='eager'
        src={url}
      />
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,14,0.04),rgba(2,6,14,0.08)_42%,rgba(2,6,14,0.48)),linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_58%,rgba(2,6,14,0.68))]' />
    </div>
  )
}

interface BannerArtworkProps {
  customArt?: string
  featured?: BannerFeaturedUnit[]
  poolSlots?: BannerPoolSlot[]
  title: string
  onOpenDetail?: (ref: EntityRef) => void
}

export function BannerArtwork({
  customArt,
  featured,
  poolSlots,
  title,
  onOpenDetail,
}: BannerArtworkProps) {
  const displaySlices = expandFeatured(featured ?? [])
  const displayAssets = resolveFeaturedAssets(displaySlices)
  const visualSlots = useMemo(() => (poolSlots ? resolvePoolSlots(poolSlots) : null), [poolSlots])
  const cycleFrames = usePoolCycling(poolSlots ?? [])

  if (customArt) {
    return <FullCardArtwork label={title} url={customArt} />
  }

  if (visualSlots && visualSlots.length > 0) {
    return (
      <PoolMontageArtwork
        cycleFrames={cycleFrames}
        onOpenDetail={onOpenDetail}
        visualSlots={visualSlots}
      />
    )
  }

  return <FeaturedArtwork assets={displayAssets} onOpenDetail={onOpenDetail} />
}
