import {useCallback, useEffect, useMemo, useState} from 'react'

import {useStore} from 'zustand'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getBrowserLocalStorage, safeStorageRead} from '@/domain/storage'
import {builderDraftStore, createDefaultBuilderDraft} from '@/stores/builderDraftStore'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {loadBuilderDraft, saveBuilderDraft} from '../builder/builder-persistence'
import {allAwakeners, awakenerById} from '../builder/constants'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  clearSlotAssignment,
  type TeamStateViolationCode,
} from '../builder/team-state'
import type {ActiveSelection, TeamSlot} from '../builder/types'

const BUILDER_V2_AUTOSAVE_DEBOUNCE_MS = 300
const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'

export interface BuilderV2TeamSummary {
  id: string
  name: string
  isActive: boolean
  deployedCount: number
  slotNames: string[]
}

export interface BuilderV2SlotView {
  slotId: string
  slotNumber: number
  slotLabel: string
  awakener: BuilderV2SlotAwakener | null
  isSelected: boolean
  isEmpty: boolean
  wheels: [string | null, string | null]
  covenantId?: string
}

export interface BuilderV2SlotAwakener {
  id: string
  name: string
  displayName: string
  realm: Awakener['realm']
  level: number
  portraitSrc: string | undefined
  isSupport: boolean
}

export interface BuilderV2AwakenerOption {
  id: string
  name: string
  displayName: string
  realm: Awakener['realm']
  portraitSrc: string | undefined
  inUse: boolean
}

export interface BuilderV2Model {
  activeTeamId: string
  activeTeamName: string
  activeSelection: ActiveSelection
  selectedSlotId: string | null
  teams: BuilderV2TeamSummary[]
  slots: BuilderV2SlotView[]
  awakeners: BuilderV2AwakenerOption[]
  searchQuery: string
  setSearchQuery: (nextQuery: string) => void
  setActiveTeam: (teamId: string) => void
  selectAwakenerSlot: (slotId: string) => void
  assignAwakener: (awakenerId: string) => void
  removeAwakener: (slotId: string) => void
  violationMessage: string | null
}

export function useBuilderV2Model(): BuilderV2Model {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [allowDuplicateAwakenerIdentities] = useState(
    () => safeStorageRead(storage, BUILDER_ALLOW_DUPES_KEY) === '1',
  )
  const [canAutosaveBuilderDraft] = useState(() => {
    const persisted = loadBuilderDraft(storage)
    const initialBuilderState =
      persisted.status === 'loaded' || persisted.status === 'loaded-legacy'
        ? persisted.draft
        : createDefaultBuilderDraft()
    builderDraftStore.getState().hydrateBuilderDraft(initialBuilderState)
    collectionOwnershipStore.getState().hydrate()
    return persisted.status !== 'invalid-current'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [violationMessage, setViolationMessage] = useState<string | null>(null)

  const teams = useStore(builderDraftStore, (state) => state.teams)
  const activeTeamId = useStore(builderDraftStore, (state) => state.activeTeamId)
  const setActiveTeamId = useStore(builderDraftStore, (state) => state.setActiveTeamId)
  const activeSelection = useStore(builderDraftStore, (state) => state.activeSelection)
  const setActiveSelection = useStore(builderDraftStore, (state) => state.setActiveSelection)
  const setActiveTeamSlotsInStore = useStore(builderDraftStore, (state) => state.setActiveTeamSlots)

  const effectiveActiveTeamId = useMemo(
    () => (teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')),
    [activeTeamId, teams],
  )
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === effectiveActiveTeamId) ?? teams[0],
    [effectiveActiveTeamId, teams],
  )
  const activeTeamSlots = activeTeam.slots

  useEffect(() => {
    if (!canAutosaveBuilderDraft) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveBuilderDraft(storage, {
        activeTeamId: effectiveActiveTeamId,
        teams,
      })
    }, BUILDER_V2_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [canAutosaveBuilderDraft, effectiveActiveTeamId, storage, teams])

  const usedAwakenerByIdentityKey = useMemo(() => {
    const ownership = new Map<string, string>()
    for (const team of teams) {
      for (const slot of team.slots) {
        if (!slot.awakenerId || slot.isSupport) {
          continue
        }

        const identityKey = getAwakenerIdentityKeyById(slot.awakenerId)
        if (!ownership.has(identityKey)) {
          ownership.set(identityKey, team.id)
        }
      }
    }
    return ownership
  }, [teams])
  const usedAwakenerIdentityKeys = useMemo(
    () => new Set(usedAwakenerByIdentityKey.keys()),
    [usedAwakenerByIdentityKey],
  )

  const selectedSlotId = activeSelection?.kind === 'awakener' ? activeSelection.slotId : null
  const activeTeamName = activeTeam.name

  const v2Teams = useMemo<BuilderV2TeamSummary[]>(
    () =>
      teams.map((team) => ({
        id: team.id,
        name: team.name,
        isActive: team.id === effectiveActiveTeamId,
        deployedCount: team.slots.filter((slot) => Boolean(slot.awakenerId)).length,
        slotNames: team.slots.map((slot) =>
          slot.awakenerId
            ? formatAwakenerNameForUi(awakenerById.get(slot.awakenerId)?.name ?? 'Unknown')
            : 'Empty',
        ),
      })),
    [effectiveActiveTeamId, teams],
  )

  const slots = useMemo<BuilderV2SlotView[]>(
    () =>
      activeTeamSlots.map((slot, index) => ({
        slotId: slot.slotId,
        slotNumber: index + 1,
        slotLabel: `Slot ${String(index + 1)}`,
        awakener: createSlotAwakenerView(slot),
        isSelected: selectedSlotId === slot.slotId,
        isEmpty: !slot.awakenerId,
        wheels: slot.wheels,
        covenantId: slot.covenantId,
      })),
    [activeTeamSlots, selectedSlotId],
  )

  const awakeners = useMemo<BuilderV2AwakenerOption[]>(
    () =>
      searchAwakeners(allAwakeners, searchQuery)
        .sort((left, right) =>
          formatAwakenerNameForUi(left.name).localeCompare(formatAwakenerNameForUi(right.name)),
        )
        .map((awakener) => ({
          id: awakener.id,
          name: awakener.name,
          displayName: formatAwakenerNameForUi(awakener.name),
          realm: awakener.realm,
          portraitSrc: getAwakenerPortraitAsset(awakener.name),
          inUse: usedAwakenerIdentityKeys.has(getAwakenerIdentityKeyById(awakener.id)),
        })),
    [searchQuery, usedAwakenerIdentityKeys],
  )

  const setActiveTeam = useCallback(
    (teamId: string) => {
      setViolationMessage(null)
      setActiveTeamId(teamId)
      setActiveSelection(null)
    },
    [setActiveSelection, setActiveTeamId],
  )

  const selectAwakenerSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      setActiveSelection((current) =>
        current?.kind === 'awakener' && current.slotId === slotId
          ? null
          : {kind: 'awakener', slotId},
      )
    },
    [setActiveSelection],
  )

  const assignAwakener = useCallback(
    (awakenerId: string) => {
      const targetSlotId =
        activeSelection?.kind === 'awakener' ? activeSelection.slotId : undefined
      const firstEmptySlotId = activeTeamSlots.find((slot) => !slot.awakenerId)?.slotId
      const result = targetSlotId
        ? assignAwakenerToSlot(activeTeamSlots, awakenerId, targetSlotId, awakenerById, {
            allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
          })
        : assignAwakenerToFirstEmptySlot(activeTeamSlots, awakenerId, awakenerById, {
            allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
          })

      if (result.violation) {
        setViolationMessage(getViolationMessage(result.violation))
        return
      }

      if (result.nextSlots === activeTeamSlots) {
        setViolationMessage('No available slot can accept that awakener.')
        return
      }

      const owningTeamId = getCrossTeamAwakenerOwner({
        activeTeamId: effectiveActiveTeamId,
        allowDuplicateAwakenerIdentities,
        awakenerId,
        slots: activeTeamSlots,
        targetSlotId,
        usedAwakenerByIdentityKey,
      })
      if (owningTeamId) {
        setViolationMessage(getAwakenerInUseMessage(awakenerId, owningTeamId, teams))
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)

      const nextSelectedSlotId = targetSlotId ?? firstEmptySlotId
      if (nextSelectedSlotId) {
        setActiveSelection({kind: 'awakener', slotId: nextSelectedSlotId})
      }
    },
    [
      activeSelection,
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      effectiveActiveTeamId,
      setActiveSelection,
      setActiveTeamSlotsInStore,
      teams,
      usedAwakenerByIdentityKey,
    ],
  )

  const removeAwakener = useCallback(
    (slotId: string) => {
      const result = clearSlotAssignment(activeTeamSlots, slotId)
      if (result.nextSlots === activeTeamSlots) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveSelection({kind: 'awakener', slotId})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  return {
    activeTeamId: effectiveActiveTeamId,
    activeTeamName,
    activeSelection,
    selectedSlotId,
    teams: v2Teams,
    slots,
    awakeners,
    searchQuery,
    setSearchQuery,
    setActiveTeam,
    selectAwakenerSlot,
    assignAwakener,
    removeAwakener,
    violationMessage,
  }
}

function createSlotAwakenerView(slot: TeamSlot): BuilderV2SlotAwakener | null {
  if (!slot.awakenerId) {
    return null
  }

  const awakener = awakenerById.get(slot.awakenerId)
  if (!awakener) {
    return null
  }

  return {
    id: awakener.id,
    name: awakener.name,
    displayName: formatAwakenerNameForUi(awakener.name),
    realm: awakener.realm,
    level: slot.isSupport ? 90 : (slot.level ?? 60),
    portraitSrc: getAwakenerPortraitAsset(awakener.name),
    isSupport: Boolean(slot.isSupport),
  }
}

interface CrossTeamAwakenerOwnerOptions {
  activeTeamId: string
  allowDuplicateAwakenerIdentities: boolean
  awakenerId: string
  slots: TeamSlot[]
  targetSlotId: string | undefined
  usedAwakenerByIdentityKey: Map<string, string>
}

function getCrossTeamAwakenerOwner({
  activeTeamId,
  allowDuplicateAwakenerIdentities,
  awakenerId,
  slots,
  targetSlotId,
  usedAwakenerByIdentityKey,
}: CrossTeamAwakenerOwnerOptions): string | null {
  if (allowDuplicateAwakenerIdentities) {
    return null
  }

  const targetSlot = targetSlotId ? slots.find((slot) => slot.slotId === targetSlotId) : undefined
  if (targetSlot?.isSupport) {
    return null
  }

  const owningTeamId = usedAwakenerByIdentityKey.get(getAwakenerIdentityKeyById(awakenerId))
  if (!owningTeamId || owningTeamId === activeTeamId) {
    return null
  }

  return owningTeamId
}

function getAwakenerInUseMessage(
  awakenerId: string,
  owningTeamId: string,
  teams: {id: string; name: string}[],
) {
  const awakenerName = formatAwakenerNameForUi(awakenerById.get(awakenerId)?.name ?? 'That awakener')
  const teamName = teams.find((team) => team.id === owningTeamId)?.name ?? 'another team'
  return `${awakenerName} is already assigned to ${teamName}. Remove them there before assigning them here.`
}

function getViolationMessage(violation: TeamStateViolationCode): string {
  if (violation === 'TOO_MANY_REALMS_IN_TEAM') {
    return 'A team can only contain up to 2 realms.'
  }

  return 'That assignment would break current builder rules.'
}
