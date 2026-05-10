import {useEffect, useState} from 'react'

const MOBILE_FILTER_QUERY = '(max-width: 639.98px)'

function getMobileFilterMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(MOBILE_FILTER_QUERY).matches
}

export function useMobileDatabaseFilters(): boolean {
  const [matches, setMatches] = useState(getMobileFilterMatch)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia(MOBILE_FILTER_QUERY)
    const updateMatch = () => {
      setMatches(mediaQuery.matches)
    }

    updateMatch()
    mediaQuery.addEventListener('change', updateMatch)

    return () => {
      mediaQuery.removeEventListener('change', updateMatch)
    }
  }, [])

  return matches
}
