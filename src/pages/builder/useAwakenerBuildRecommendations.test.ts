import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  getAwakenerBuildEntries,
  getPrimaryAwakenerBuild,
  type AwakenerBuildEntry,
} from '@/domain/awakener-builds'
import {getAwakeners} from '@/domain/awakeners'

import type {ActiveSelection, TeamSlot} from './types'
import {useAwakenerBuildRecommendations} from './useAwakenerBuildRecommendations'

function requireEntry(
  predicate: (entry: AwakenerBuildEntry) => boolean,
  label: string,
): AwakenerBuildEntry {
  const entry = getAwakenerBuildEntries().find(predicate)
  if (!entry) {
    throw new Error(`Expected curated build entry for ${label}`)
  }
  return entry
}

function getEntryName(entry: AwakenerBuildEntry): string {
  if (entry.awakenerName) {
    return entry.awakenerName
  }

  const awakener = getAwakeners().find((candidate) => candidate.id === entry.awakenerId)
  if (!awakener) {
    throw new Error(`Expected canonical awakener for id ${entry.awakenerId}`)
  }

  return awakener.name
}

describe('useAwakenerBuildRecommendations', () => {
  it('resolves the active build and aggregates team posse recommendations from cached entries', () => {
    const activeEntry = requireEntry(
      (entry) => Boolean(getPrimaryAwakenerBuild(entry)),
      'active build',
    )
    const posseEntry = requireEntry(
      (entry) => Boolean(entry.recommendedPosseIds?.length),
      'recommended posse ids',
    )
    const activeSlotId = 'slot-active'
    const slotsById = new Map<string, TeamSlot>([
      [
        activeSlotId,
        {
          slotId: activeSlotId,
          awakenerName: getEntryName(activeEntry),
          wheels: [null, null],
        },
      ],
      [
        'slot-posse',
        {
          slotId: 'slot-posse',
          awakenerName: getEntryName(posseEntry),
          wheels: [null, null],
        },
      ],
    ])
    const awakenerIdByName = new Map(
      getAwakeners().map((awakener) => [awakener.name.toLowerCase(), awakener.id]),
    )
    const activeSelection: ActiveSelection = {kind: 'awakener', slotId: activeSlotId}
    const expectedPrimaryBuildId = getPrimaryAwakenerBuild(activeEntry)?.id

    const {result} = renderHook(() =>
      useAwakenerBuildRecommendations({
        activeSelection,
        awakenerIdByName,
        slotsById,
      }),
    )

    expect(result.current.activeBuild?.id).toBe(expectedPrimaryBuildId)
    expect(result.current.teamRecommendedPosseIds).toEqual(
      new Set(posseEntry.recommendedPosseIds ?? []),
    )
  })
})
