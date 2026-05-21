import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import {builderDraftStore} from '@/stores/builderDraftStore'

import {createEmptyTeamSlots} from '../builder/constants'

import {useBuilderV2Model} from './useBuilderV2Model'

function getAssignedIdentityCount(awakenerIds: (string | undefined)[], targetId: string) {
  const targetIdentity = getAwakenerIdentityKeyById(targetId)
  return awakenerIds.filter(
    (awakenerId) => awakenerId && getAwakenerIdentityKeyById(awakenerId) === targetIdentity,
  ).length
}

describe('useBuilderV2Model', () => {
  it('initializes one active team with four slots', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    expect(result.current.activeTeamName).toBe('Team 1')
    expect(result.current.teams).toHaveLength(1)
    expect(result.current.slots).toHaveLength(4)
    expect(result.current.slots.every((slot) => slot.isEmpty)).toBe(true)
  })

  it('assigns an awakener to the first empty slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.slots[0]?.awakener?.id).toBe('awakener-0021')
    expect(result.current.selectedSlotId).toBe('slot-1')
  })

  it('assigns an awakener to the selected slot', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.selectAwakenerSlot('slot-3')
    })
    act(() => {
      result.current.assignAwakener('awakener-0007')
    })

    expect(result.current.slots[2]?.awakener?.id).toBe('awakener-0007')
    expect(result.current.selectedSlotId).toBe('slot-3')
  })

  it('removes an awakener and clears that slot loadout', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      builderDraftStore.getState().setActiveTeamSlots(
        result.current.slots.map((slot, index) =>
          index === 0
            ? {
                slotId: slot.slotId,
                awakenerId: 'awakener-0021',
                realm: 'CHAOS',
                level: 70,
                wheels: ['wheel-0050', 'wheel-0051'] as [string | null, string | null],
                covenantId: 'c01',
              }
            : {
                slotId: slot.slotId,
                wheels: [null, null] as [string | null, string | null],
              },
        ),
      )
    })

    act(() => {
      result.current.removeAwakener('slot-1')
    })

    expect(result.current.slots[0]?.awakener).toBeNull()
    expect(result.current.slots[0]?.wheels).toEqual([null, null])
    expect(result.current.slots[0]?.covenantId).toBeUndefined()
    expect(result.current.selectedSlotId).toBe('slot-1')
  })

  it('moves alternate identities instead of adding duplicate copies', () => {
    const {result} = renderHook(() => useBuilderV2Model())

    act(() => {
      result.current.assignAwakener('awakener-0042')
    })
    act(() => {
      result.current.selectAwakenerSlot('slot-2')
    })
    act(() => {
      result.current.assignAwakener('awakener-0020')
    })

    const assignedIds = result.current.slots.map((slot) => slot.awakener?.id)
    expect(getAssignedIdentityCount(assignedIds, 'awakener-0042')).toBe(1)
    expect(result.current.slots[0]?.awakener).toBeNull()
    expect(result.current.slots[1]?.awakener?.id).toBe('awakener-0020')
  })

  it('blocks assigning an awakener already used by another team', () => {
    const {result} = renderHook(() => useBuilderV2Model())
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    act(() => {
      result.current.assignAwakener('awakener-0021')
    })

    expect(result.current.violationMessage).toBe(
      'Goliath is already assigned to Team 2. Remove them there before assigning them here.',
    )
    expect(result.current.slots.every((slot) => slot.awakener === null)).toBe(true)
    expect(builderDraftStore.getState().teams[1]?.slots[0]?.awakenerId).toBe('awakener-0021')
  })
})
