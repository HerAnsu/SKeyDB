import {useMemo} from 'react'

import {
  buildAwakenerBuildEntryMap,
  getAwakenerBuildEntries,
  getPrimaryAwakenerBuild,
  type AwakenerBuild,
} from '@/domain/awakener-builds'

import type {ActiveSelection, TeamSlot} from './types'

interface UseAwakenerBuildRecommendationsOptions {
  activeSelection: ActiveSelection
  slotsById: Map<string, TeamSlot>
  awakenerIdByName: Map<string, string>
}

export function useAwakenerBuildRecommendations({
  activeSelection,
  slotsById,
  awakenerIdByName,
}: UseAwakenerBuildRecommendationsOptions) {
  const entryMap = useMemo(() => {
    return buildAwakenerBuildEntryMap(getAwakenerBuildEntries())
  }, [])

  const activeSlot = useMemo(() => {
    if (!activeSelection) {
      return undefined
    }
    return slotsById.get(activeSelection.slotId)
  }, [activeSelection, slotsById])

  const activeAwakenerId = useMemo(() => {
    const awakenerName = activeSlot?.awakenerName
    if (!awakenerName) {
      return undefined
    }
    return awakenerIdByName.get(awakenerName.toLowerCase())
  }, [activeSlot, awakenerIdByName])

  const activeBuild = useMemo<AwakenerBuild | undefined>(() => {
    if (activeAwakenerId === undefined) {
      return undefined
    }
    return getPrimaryAwakenerBuild(entryMap.get(activeAwakenerId))
  }, [entryMap, activeAwakenerId])

  const teamRecommendedPosseIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>()
    for (const slot of slotsById.values()) {
      if (!slot.awakenerName) {
        continue
      }
      const awakId = awakenerIdByName.get(slot.awakenerName.toLowerCase())
      if (awakId === undefined) {
        continue
      }
      const entry = entryMap.get(awakId)
      if (entry?.recommendedPosseIds) {
        for (const posseId of entry.recommendedPosseIds) {
          ids.add(posseId)
        }
      }
    }
    return ids
  }, [entryMap, slotsById, awakenerIdByName])

  return {
    activeBuild,
    teamRecommendedPosseIds,
  }
}
