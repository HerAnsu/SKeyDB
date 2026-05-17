import {useCallback, useLayoutEffect, useState} from 'react'

import type {HybridDatabaseCardMode} from './hybrid-database-card-mode'

const HYBRID_DOSSIER_CONTAINER_WIDTH = 620

function resolveHybridDatabaseCardMode(inlineSize: number): HybridDatabaseCardMode {
  return inlineSize <= HYBRID_DOSSIER_CONTAINER_WIDTH ? 'dossier' : 'poster'
}

export function useMeasuredHybridCardMode(isHybridGrid: boolean, hasItems: boolean) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<HybridDatabaseCardMode | null>(isHybridGrid ? null : 'poster')
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      setElement(node)
      if (!isHybridGrid || !hasItems || !node) {
        return
      }
      const inlineSize = node.getBoundingClientRect().width
      if (inlineSize > 0) {
        setMode(resolveHybridDatabaseCardMode(inlineSize))
      }
    },
    [hasItems, isHybridGrid],
  )

  useLayoutEffect(() => {
    if (!isHybridGrid) {
      return undefined
    }

    if (!hasItems) {
      return undefined
    }

    if (!element) {
      return undefined
    }

    const updateMode = (inlineSize: number) => {
      if (inlineSize <= 0) {
        setMode('poster')
        return
      }
      setMode(resolveHybridDatabaseCardMode(inlineSize))
    }

    const measureElement = () => {
      updateMode(element.getBoundingClientRect().width)
    }
    const frame = requestAnimationFrame(measureElement)
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureElement)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', measureElement)
      }
    }
    window.addEventListener('resize', measureElement)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const inlineSize = entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width
      updateMode(inlineSize)
    })
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureElement)
      observer.disconnect()
    }
  }, [element, hasItems, isHybridGrid])

  return {mode, ref}
}
