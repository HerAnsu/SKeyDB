import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {decideTrailDirection, isTrailMobileLayout} from './popover-trail'

interface PopoverTrailPanelProps {
  /** The root anchor rect (element that started the entire trail) */
  anchorRect: DOMRect
  anchorElement?: HTMLElement | null
  /** Per-entry rects for subsequent popovers (index 0 = root, index 1+ = nested) */
  entryRects?: (DOMRect | undefined)[]
  itemCount: number
  onCloseTop: () => void
  children: ReactNode
}

interface SinglePopoverProps {
  anchorRect: DOMRect
  direction: 'up' | 'down'
  zIndex: number
  children: ReactNode
  mountRef: React.RefObject<HTMLDivElement | null>
  onPosition: () => void
}

function SinglePopover({
  anchorRect,
  direction,
  zIndex,
  children,
  mountRef,
  onPosition,
}: SinglePopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 12
    const gap = 6

    let left = anchorRect.left
    if (left + rect.width > vw - margin) {
      left = vw - rect.width - margin
    }
    if (left < margin) {
      left = margin
    }

    let top = direction === 'up' ? anchorRect.top - gap - rect.height : anchorRect.bottom + gap

    if (top + rect.height > vh - margin) {
      top = vh - rect.height - margin
    }
    if (top < margin) {
      top = margin
    }

    el.style.top = `${String(top)}px`
    el.style.left = `${String(left)}px`
    onPosition()
    // Assign to parent ref for click-outside detection
    mountRef.current ??= el
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorRect, direction])

  return (
    <div
      className='fixed max-h-[calc(100vh-24px)] w-[min(22rem,calc(100vw-24px))] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.7)]'
      ref={ref}
      style={{top: 0, left: -9999, zIndex: 950 + zIndex}}
    >
      {children}
    </div>
  )
}

export function PopoverTrailPanel({
  anchorRect,
  anchorElement,
  entryRects,
  itemCount,
  onCloseTop,
  children,
}: PopoverTrailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [, forceUpdate] = useState(0)
  const isMobile = isTrailMobileLayout(window.innerWidth)
  const currentAnchorRect = anchorElement?.isConnected
    ? anchorElement.getBoundingClientRect()
    : anchorRect
  const direction = isMobile ? 'down' : decideTrailDirection(currentAnchorRect, window.innerHeight)

  useEffect(() => {
    function handleViewportChange() {
      forceUpdate((v) => v + 1)
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCloseTop()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseTop()
      }
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onCloseTop])

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const positionNoop = useCallback(() => {}, [])

  if (isMobile) {
    return (
      <div
        className='fixed bottom-4 left-1/2 z-[950] flex w-[min(22rem,calc(100vw-24px))] -translate-x-1/2 flex-col items-center'
        data-skill-popover=''
        onClick={(e) => {
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        ref={containerRef}
      >
        {itemCount > 1 && (
          <button
            className='mb-1.5 flex items-center gap-1.5 border border-slate-700/60 bg-slate-950/[.98] px-3 py-1.5 text-xs font-semibold text-amber-200/80 shadow-lg backdrop-blur transition-colors hover:border-amber-500/60 hover:text-amber-100'
            onClick={() => {
              onCloseTop()
            }}
            type='button'
          >
            <span className='text-amber-400'>&#8592;</span>
            <span>Back</span>
          </button>
        )}
        <div className='w-max max-w-full'>{React.Children.toArray(children)[itemCount - 1]}</div>
      </div>
    )
  }

  const childArray = React.Children.toArray(children)

  return (
    <div
      data-skill-popover=''
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      ref={containerRef}
    >
      {childArray.map((child, index) => {
        const entryRect = entryRects?.[index]
        const rect = index === 0 ? currentAnchorRect : (entryRect ?? currentAnchorRect)
        return (
          <SinglePopover
            anchorRect={rect}
            direction={direction}
            key={index}
            mountRef={containerRef}
            onPosition={positionNoop}
            zIndex={index}
          >
            {child}
          </SinglePopover>
        )
      })}
    </div>
  )
}
