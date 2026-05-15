import {useLayoutEffect, useRef, type RefObject} from 'react'

const WAVE_MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const WAVE_OPEN_DURATION_MS = 260
const WAVE_CLOSE_DURATION_MS = 180

export function useDZoneWaveCardMotion(cardRef: RefObject<HTMLElement | null>, expanded: boolean) {
  const previousExpandedRef = useRef(expanded)
  const previousNaturalHeightRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const cardElement = cardRef.current
    if (!cardElement) return

    const expandedChanged = previousExpandedRef.current !== expanded
    const renderedHeight = cardElement.getBoundingClientRect().height
    const previousNaturalHeight = previousNaturalHeightRef.current

    previousExpandedRef.current = expanded

    if (!expandedChanged) {
      previousNaturalHeightRef.current = renderedHeight
      return
    }

    const startHeight = cardElement.style.height ? renderedHeight : previousNaturalHeight

    cardElement.style.transition = 'none'
    cardElement.style.height = ''
    cardElement.style.overflow = ''
    delete cardElement.dataset.waveMotion

    const targetHeight = cardElement.getBoundingClientRect().height
    previousNaturalHeightRef.current = targetHeight

    const clearMotionStyles = () => {
      cardElement.style.height = ''
      cardElement.style.overflow = ''
      cardElement.style.transition = ''
      delete cardElement.dataset.waveMotion
      previousNaturalHeightRef.current = cardElement.getBoundingClientRect().height
    }

    if (startHeight === null || Math.abs(startHeight - targetHeight) < 1) {
      clearMotionStyles()
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      clearMotionStyles()
      return
    }

    const duration = expanded ? WAVE_OPEN_DURATION_MS : WAVE_CLOSE_DURATION_MS
    let cleanupTimer = 0

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === cardElement && event.propertyName === 'height') {
        window.clearTimeout(cleanupTimer)
        clearMotionStyles()
      }
    }

    cardElement.dataset.waveMotion = expanded ? 'opening' : 'closing'
    cardElement.style.overflow = 'hidden'
    cardElement.style.transition = 'none'
    cardElement.style.height = `${startHeight.toString()}px`
    void cardElement.offsetHeight
    cardElement.style.transition = `height ${duration.toString()}ms ${WAVE_MOTION_EASING}`
    cardElement.style.height = `${targetHeight.toString()}px`
    cardElement.addEventListener('transitionend', handleTransitionEnd)
    cleanupTimer = window.setTimeout(clearMotionStyles, duration + 90)

    return () => {
      window.clearTimeout(cleanupTimer)
      cardElement.removeEventListener('transitionend', handleTransitionEnd)
    }
  }, [cardRef, expanded])
}
