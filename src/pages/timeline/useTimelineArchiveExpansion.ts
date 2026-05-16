import {useState} from 'react'

import type {TimelineSectionId} from '@/domain/timeline-routing'

type ArchiveExpansionRole = 'ended' | 'upcoming'
type ArchiveExpansionKey = TimelineSectionId | 'none'
type ArchiveExpansionOverrides = Partial<
  Record<ArchiveExpansionKey, Partial<Record<ArchiveExpansionRole, boolean>>>
>

interface UseTimelineArchiveExpansionOptions {
  endedSectionId: TimelineSectionId
  targetSection?: TimelineSectionId
  upcomingSectionId: TimelineSectionId
}

export function useTimelineArchiveExpansion({
  endedSectionId,
  targetSection,
  upcomingSectionId,
}: UseTimelineArchiveExpansionOptions) {
  const [overrides, setOverrides] = useState<ArchiveExpansionOverrides>({})
  const targetKey: ArchiveExpansionKey = targetSection ?? 'none'

  function getDefaultExpanded(role: ArchiveExpansionRole): boolean {
    if (role === 'upcoming') {
      return targetSection ? targetSection === upcomingSectionId : true
    }
    return targetSection === endedSectionId
  }

  function getExpanded(role: ArchiveExpansionRole): boolean {
    return overrides[targetKey]?.[role] ?? getDefaultExpanded(role)
  }

  function toggle(role: ArchiveExpansionRole) {
    const nextExpanded = !getExpanded(role)
    setOverrides((current) => ({
      ...current,
      [targetKey]: {
        ...current[targetKey],
        [role]: nextExpanded,
      },
    }))
  }

  return {
    endedExpanded: getExpanded('ended'),
    toggleEnded: () => {
      toggle('ended')
    },
    toggleUpcoming: () => {
      toggle('upcoming')
    },
    upcomingExpanded: getExpanded('upcoming'),
  }
}
