import {useEffect, useState} from 'react'

const TICK_INTERVAL_MS = 60_000

export function useTimelineNow(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, TICK_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return now
}
