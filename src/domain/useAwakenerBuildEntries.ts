import {useEffect, useState} from 'react'

import {loadAwakenerBuildEntries, type AwakenerBuildEntry} from './awakener-builds'

export function useAwakenerBuildEntries(): AwakenerBuildEntry[] | null {
  const [entries, setEntries] = useState<AwakenerBuildEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadAwakenerBuildEntries().then((data) => {
      if (!cancelled) {
        setEntries(data)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return entries
}
