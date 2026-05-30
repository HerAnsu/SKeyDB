import {useEffect, useEffectEvent, useRef, type RefObject} from 'react'

import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {TimelineRichText} from './TimelineRichText'

interface EventDescriptionPreviewProps {
  canExpandDescription: boolean
  description: string
  descriptionId: string
  descriptionOpen: boolean
  descriptionRef: RefObject<HTMLParagraphElement | null>
  onOpenDescription: (opener: HTMLButtonElement) => void
  priceMode?: TimelinePriceDisplayMode
}

export function EventDescriptionPreview({
  canExpandDescription,
  description,
  descriptionId,
  descriptionOpen,
  descriptionRef,
  onOpenDescription,
  priceMode = 'silver-prime',
}: EventDescriptionPreviewProps) {
  if (description.length === 0) return null

  return (
    <div className='relative mt-1'>
      <p
        className={`line-clamp-4 text-[0.8rem] leading-[1.55] text-balance text-slate-400 ${canExpandDescription ? 'pr-12' : ''}`}
        ref={descriptionRef}
      >
        <TimelineRichText priceMode={priceMode} text={description} />
      </p>
      {canExpandDescription ? (
        <button
          aria-controls={descriptionId}
          aria-expanded={descriptionOpen}
          className='absolute right-0 -bottom-1 min-h-7 min-w-11 px-2 py-1 text-[10px] leading-none font-bold tracking-[0.1em] text-amber-100/70 uppercase underline decoration-amber-200/25 underline-offset-4 transition-colors hover:text-amber-50 hover:decoration-amber-100/65 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
          onClick={(event) => {
            onOpenDescription(event.currentTarget)
          }}
          type='button'
        >
          More
        </button>
      ) : null}
    </div>
  )
}

interface EventDescriptionShelfProps {
  canExpandDescription: boolean
  description: string
  descriptionId: string
  descriptionOpen: boolean
  onCloseDescription: () => void
  priceMode?: TimelinePriceDisplayMode
}

export function EventDescriptionShelf({
  canExpandDescription,
  description,
  descriptionId,
  descriptionOpen,
  onCloseDescription,
  priceMode = 'silver-prime',
}: EventDescriptionShelfProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const shelfRef = useRef<HTMLElement | null>(null)
  const closeDescriptionEvent = useEffectEvent(onCloseDescription)
  const titleId = `${descriptionId}-title`

  useEffect(() => {
    if (!canExpandDescription || !descriptionOpen) return

    closeButtonRef.current?.focus()
  }, [canExpandDescription, descriptionOpen])

  useEffect(() => {
    if (!canExpandDescription || !descriptionOpen) return undefined

    const shelfElement = shelfRef.current
    if (!shelfElement) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.stopPropagation()
      closeDescriptionEvent()
    }

    shelfElement.addEventListener('keydown', handleKeyDown)
    return () => {
      shelfElement.removeEventListener('keydown', handleKeyDown)
    }
  }, [canExpandDescription, descriptionOpen])

  if (!canExpandDescription || !descriptionOpen) return null

  return (
    <section
      aria-labelledby={titleId}
      className='absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden bg-slate-950/95 shadow-[0_12px_24px_rgba(2,6,14,0.46)] backdrop-blur-sm'
      id={descriptionId}
      ref={shelfRef}
    >
      <div className='flex shrink-0 items-center justify-between gap-3 border-b border-slate-700/55 px-3 py-2.5'>
        <span
          className='text-[10px] leading-none font-bold tracking-[0.14em] text-slate-500 uppercase'
          id={titleId}
        >
          Details
        </span>
        <button
          className='min-h-7 min-w-11 px-2 py-1 text-[10px] leading-none font-bold tracking-[0.1em] text-slate-300 uppercase underline decoration-slate-500/35 underline-offset-4 transition-colors hover:text-amber-50 hover:decoration-amber-200/55 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
          onClick={onCloseDescription}
          ref={closeButtonRef}
          type='button'
        >
          Less
        </button>
      </div>
      <p className='min-h-0 flex-1 overflow-y-auto px-3 py-2.5 text-[0.8rem] leading-[1.55] text-slate-300'>
        <TimelineRichText priceMode={priceMode} text={description} />
      </p>
    </section>
  )
}
