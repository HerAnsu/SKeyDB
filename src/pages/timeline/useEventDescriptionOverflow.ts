import {useEffect, useRef, useState} from 'react'

interface UseEventDescriptionOverflowOptions {
  description: string
}

export function useEventDescriptionOverflow({description}: UseEventDescriptionOverflowOptions) {
  const [descriptionOverflow, setDescriptionOverflow] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const hasDescription = description.length > 0

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

  return {
    canExpandDescription: hasDescription && descriptionOverflow,
    descriptionRef,
    hasDescription,
  }
}
