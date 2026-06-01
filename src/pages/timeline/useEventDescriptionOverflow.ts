import {useLayoutEffect, useRef, useState} from 'react'

interface UseEventDescriptionOverflowOptions {
  description: string
}

export function useEventDescriptionOverflow({description}: UseEventDescriptionOverflowOptions) {
  const [descriptionOverflow, setDescriptionOverflow] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const hasDescription = description.length > 0

  useLayoutEffect(() => {
    const node = descriptionRef.current

    if (!node || !hasDescription) {
      setDescriptionOverflow((currentDescriptionOverflow) =>
        currentDescriptionOverflow ? false : currentDescriptionOverflow,
      )
      return
    }

    const measureOverflow = () => {
      const nextDescriptionOverflow = node.scrollHeight > node.clientHeight + 1
      setDescriptionOverflow((currentDescriptionOverflow) =>
        currentDescriptionOverflow === nextDescriptionOverflow
          ? currentDescriptionOverflow
          : nextDescriptionOverflow,
      )
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

  return {
    canExpandDescription: hasDescription && descriptionOverflow,
    descriptionRef,
    hasDescription,
  }
}
