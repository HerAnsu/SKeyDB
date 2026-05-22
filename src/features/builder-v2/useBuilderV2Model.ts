import {useCallback, useEffect, useMemo, useState} from 'react'

import {useStore} from 'zustand'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants} from '@/domain/covenants'
import {searchCovenants} from '@/domain/covenants-search'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses, type Posse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {getBrowserLocalStorage, safeStorageRead} from '@/domain/storage'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheelMainstatLabel, getWheels, type Wheel} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'
import {builderDraftStore, createDefaultBuilderDraft} from '@/stores/builderDraftStore'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {loadBuilderDraft, saveBuilderDraft} from '../builder/builder-persistence'
import {allAwakeners, awakenerById} from '../builder/constants'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignCovenantToSlot,
  assignWheelToSlot,
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  swapCovenantAssignments,
  swapWheelAssignments,
  type TeamStateViolationCode,
} from '../builder/team-state'
import type {ActiveSelection, Team, TeamSlot, WheelUsageLocation} from '../builder/types'

const BUILDER_V2_AUTOSAVE_DEBOUNCE_MS = 300
const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'

export type BuilderV2PickerTab = 'awakeners' | 'wheels' | 'covenants' | 'posses'
type BuilderV2TeamTarget = {kind: 'posse'} | null

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
  wheelSlots: [BuilderV2WheelSlotView, BuilderV2WheelSlotView]
  covenantId?: string
  covenantName: string | null
  covenantAssetSrc: string | undefined
  isCovenantSelected: boolean
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

export interface BuilderV2WheelSlotView {
  wheelIndex: 0 | 1
  label: string
  wheelId: string | null
  wheelName: string | null
  assetSrc: string | undefined
  isSelected: boolean
}

export interface BuilderV2WheelOption {
  id: string
  name: string
  rarity: Wheel['rarity']
  realm: Wheel['realm']
  mainstat: string
  assetSrc: string | undefined
  inUse: boolean
}

export interface BuilderV2CovenantOption {
  id: string
  name: string
  assetSrc: string | undefined
  inUse: boolean
}

export interface BuilderV2PosseOption {
  id: string
  name: string
  realm: string
  assetSrc: string | undefined
  inUse: boolean
  isActive: boolean
}

export interface BuilderV2ActivePosseView {
  id: string
  name: string
  realm: string
  assetSrc: string | undefined
}

export interface BuilderV2Model {
  activeTeamId: string
  activeTeamName: string
  activePosse: BuilderV2ActivePosseView | null
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  pickerTab: BuilderV2PickerTab
  selectedSlotId: string | null
  editingLabel: string
  teams: BuilderV2TeamSummary[]
  slots: BuilderV2SlotView[]
  awakeners: BuilderV2AwakenerOption[]
  wheels: BuilderV2WheelOption[]
  covenants: BuilderV2CovenantOption[]
  posses: BuilderV2PosseOption[]
  searchQuery: string
  setSearchQuery: (nextQuery: string) => void
  setPickerTab: (nextTab: BuilderV2PickerTab) => void
  setActiveTeam: (teamId: string) => void
  selectAwakenerSlot: (slotId: string) => void
  selectWheelSlot: (slotId: string, wheelIndex: 0 | 1) => void
  selectCovenantSlot: (slotId: string) => void
  selectPosse: () => void
  assignAwakener: (awakenerId: string) => void
  assignWheel: (wheelId: string) => void
  assignCovenant: (covenantId: string) => void
  assignPosse: (posseId: string) => void
  removeAwakener: (slotId: string) => void
  clearWheel: (slotId: string, wheelIndex: 0 | 1) => void
  clearCovenant: (slotId: string) => void
  clearPosse: () => void
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
  const [pickerTab, setPickerTab] = useState<BuilderV2PickerTab>('awakeners')
  const [searchQueryByTab, setSearchQueryByTab] = useState<Record<BuilderV2PickerTab, string>>({
    awakeners: '',
    wheels: '',
    covenants: '',
    posses: '',
  })
  const [activeTeamTarget, setActiveTeamTarget] = useState<BuilderV2TeamTarget>(null)
  const [violationMessage, setViolationMessage] = useState<string | null>(null)

  const teams = useStore(builderDraftStore, (state) => state.teams)
  const activeTeamId = useStore(builderDraftStore, (state) => state.activeTeamId)
  const setActiveTeamId = useStore(builderDraftStore, (state) => state.setActiveTeamId)
  const activeSelection = useStore(builderDraftStore, (state) => state.activeSelection)
  const setActiveSelection = useStore(builderDraftStore, (state) => state.setActiveSelection)
  const updateActiveTeam = useStore(builderDraftStore, (state) => state.updateActiveTeam)
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
  const allWheels = useMemo(() => [...getWheels()].sort(compareWheelsForUi), [])
  const wheelById = useMemo(() => new Map(allWheels.map((wheel) => [wheel.id, wheel])), [allWheels])
  const allCovenants = useMemo(
    () => [...getCovenants()].sort((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const covenantById = useMemo(
    () => new Map(allCovenants.map((covenant) => [covenant.id, covenant])),
    [allCovenants],
  )
  const allPosses = useMemo(
    () => [...getPosses()].sort((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const posseById = useMemo(
    () => new Map(allPosses.map((posse) => [posse.id, posse])),
    [allPosses],
  )
  const searchQuery = searchQueryByTab[pickerTab]

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
  const usedWheelByTeamOrder = useMemo(() => buildUsedWheelByTeamOrder(teams), [teams])
  const usedWheelIds = useMemo(() => new Set(usedWheelByTeamOrder.keys()), [usedWheelByTeamOrder])
  const usedPosseByTeamOrder = useMemo(() => buildUsedPosseByTeamOrder(teams), [teams])
  const usedPosseIds = useMemo(() => new Set(usedPosseByTeamOrder.keys()), [usedPosseByTeamOrder])

  const selectedSlotId = activeSelection?.slotId ?? null
  const activeTeamName = activeTeam.name
  const activePosse = useMemo<BuilderV2ActivePosseView | null>(() => {
    if (!activeTeam.posseId) {
      return null
    }

    const posse = posseById.get(activeTeam.posseId)
    if (!posse) {
      return null
    }

    return createActivePosseView(posse)
  }, [activeTeam.posseId, posseById])

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
      activeTeamSlots.map((slot, index) => {
        const slotLabel = `Slot ${String(index + 1)}`
        const covenant = slot.covenantId ? covenantById.get(slot.covenantId) : undefined

        return {
          slotId: slot.slotId,
          slotNumber: index + 1,
          slotLabel,
          awakener: createSlotAwakenerView(slot),
          isSelected: selectedSlotId === slot.slotId,
          isEmpty: !slot.awakenerId,
          wheels: slot.wheels,
          wheelSlots: [
            createWheelSlotView(slot, slotLabel, 0, wheelById, activeSelection),
            createWheelSlotView(slot, slotLabel, 1, wheelById, activeSelection),
          ],
          covenantId: slot.covenantId,
          covenantName: covenant?.name ?? null,
          covenantAssetSrc: slot.covenantId
            ? getCovenantAssetById(slot.covenantId)
            : undefined,
          isCovenantSelected:
            activeSelection?.kind === 'covenant' && activeSelection.slotId === slot.slotId,
        }
      }),
    [activeSelection, activeTeamSlots, covenantById, selectedSlotId, wheelById],
  )

  const awakeners = useMemo<BuilderV2AwakenerOption[]>(
    () =>
      searchAwakeners(allAwakeners, searchQueryByTab.awakeners)
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
    [searchQueryByTab.awakeners, usedAwakenerIdentityKeys],
  )

  const wheels = useMemo<BuilderV2WheelOption[]>(
    () =>
      searchWheels(allWheels, searchQueryByTab.wheels).map((wheel) => ({
        id: wheel.id,
        name: wheel.name,
        rarity: wheel.rarity,
        realm: wheel.realm,
        mainstat: getWheelMainstatLabel(wheel),
        assetSrc: getWheelAssetById(wheel.id),
        inUse: usedWheelIds.has(wheel.id),
      })),
    [allWheels, searchQueryByTab.wheels, usedWheelIds],
  )

  const covenants = useMemo<BuilderV2CovenantOption[]>(
    () =>
      searchCovenants(allCovenants, searchQueryByTab.covenants).map((covenant) => ({
        id: covenant.id,
        name: covenant.name,
        assetSrc: getCovenantAssetById(covenant.id),
        inUse: activeTeamSlots.some((slot) => slot.covenantId === covenant.id),
      })),
    [activeTeamSlots, allCovenants, searchQueryByTab.covenants],
  )

  const posses = useMemo<BuilderV2PosseOption[]>(
    () =>
      searchPosses(allPosses, searchQueryByTab.posses).map((posse) => ({
        id: posse.id,
        name: posse.name,
        realm: posse.realm,
        assetSrc: getPosseAssetById(posse.id),
        inUse: usedPosseIds.has(posse.id),
        isActive: activeTeam.posseId === posse.id,
      })),
    [activeTeam.posseId, allPosses, searchQueryByTab.posses, usedPosseIds],
  )

  const setSearchQuery = useCallback(
    (nextQuery: string) => {
      setSearchQueryByTab((current) => ({
        ...current,
        [pickerTab]: nextQuery,
      }))
    },
    [pickerTab],
  )

  const switchPickerTab = useCallback((nextTab: BuilderV2PickerTab) => {
    setPickerTab(nextTab)
    setViolationMessage(null)
  }, [])

  const setActiveTeam = useCallback(
    (teamId: string) => {
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveTeamId(teamId)
      setActiveSelection(null)
    },
    [setActiveSelection, setActiveTeamId],
  )

  const selectAwakenerSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setPickerTab('awakeners')
      setActiveSelection((current) =>
        current?.kind === 'awakener' && current.slotId === slotId
          ? null
          : {kind: 'awakener', slotId},
      )
    },
    [setActiveSelection],
  )

  const selectWheelSlot = useCallback(
    (slotId: string, wheelIndex: 0 | 1) => {
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setPickerTab('wheels')
      setActiveSelection((current) =>
        current?.kind === 'wheel' &&
        current.slotId === slotId &&
        current.wheelIndex === wheelIndex
          ? null
          : {kind: 'wheel', slotId, wheelIndex},
      )
    },
    [setActiveSelection],
  )

  const selectCovenantSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setPickerTab('covenants')
      setActiveSelection((current) =>
        current?.kind === 'covenant' && current.slotId === slotId
          ? null
          : {kind: 'covenant', slotId},
      )
    },
    [setActiveSelection],
  )

  const selectPosse = useCallback(() => {
    setViolationMessage(null)
    setPickerTab('posses')
    setActiveSelection(null)
    setActiveTeamTarget((current) => (current?.kind === 'posse' ? null : {kind: 'posse'}))
  }, [setActiveSelection])

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
      setActiveTeamTarget(null)

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

  const assignWheel = useCallback(
    (wheelId: string) => {
      const target = getWheelAssignmentTarget(activeSelection, activeTeamSlots)
      if (!target) {
        setViolationMessage('Select a wheel slot or an awakened slot before assigning a wheel.')
        setPickerTab('wheels')
        return
      }

      const targetSlot = activeTeamSlots.find((slot) => slot.slotId === target.slotId)
      if (!targetSlot?.awakenerId) {
        setViolationMessage('Wheels require an awakener in that slot.')
        setPickerTab('wheels')
        return
      }

      const wheelOwner = allowDuplicateAwakenerIdentities
        ? undefined
        : usedWheelByTeamOrder.get(wheelId)
      if (
        wheelOwner?.teamId === effectiveActiveTeamId &&
        (wheelOwner.slotId !== target.slotId || wheelOwner.wheelIndex !== target.wheelIndex)
      ) {
        const result = swapWheelAssignments(
          activeTeamSlots,
          wheelOwner.slotId,
          wheelOwner.wheelIndex,
          target.slotId,
          target.wheelIndex,
        )
        setActiveTeamSlotsInStore(result.nextSlots)
        setViolationMessage(null)
        setActiveTeamTarget(null)
        if (activeSelection?.kind === 'wheel') {
          setActiveSelection({kind: 'wheel', slotId: target.slotId, wheelIndex: target.wheelIndex})
        }
        return
      }

      if (wheelOwner && wheelOwner.teamId !== effectiveActiveTeamId && !targetSlot.isSupport) {
        setViolationMessage(getWheelInUseMessage(wheelId, wheelOwner.teamId, teams, wheelById))
        setPickerTab('wheels')
        return
      }

      const result = assignWheelToSlot(activeTeamSlots, target.slotId, target.wheelIndex, wheelId)
      if (result.nextSlots === activeTeamSlots) {
        setViolationMessage(null)
        setActiveTeamTarget(null)
        if (activeSelection?.kind === 'wheel') {
          setActiveSelection({kind: 'wheel', slotId: target.slotId, wheelIndex: target.wheelIndex})
        }
        setPickerTab('wheels')
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      if (activeSelection?.kind === 'wheel') {
        setActiveSelection({kind: 'wheel', slotId: target.slotId, wheelIndex: target.wheelIndex})
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
      usedWheelByTeamOrder,
      wheelById,
    ],
  )

  const assignCovenant = useCallback(
    (covenantId: string) => {
      const targetSlotId = getSlotTargetFromSelection(activeSelection)
      if (!targetSlotId) {
        setViolationMessage('Select a covenant slot or awakened slot before assigning a covenant.')
        setPickerTab('covenants')
        return
      }

      const targetSlot = activeTeamSlots.find((slot) => slot.slotId === targetSlotId)
      if (!targetSlot?.awakenerId) {
        setViolationMessage('Covenants require an awakener in that slot.')
        setPickerTab('covenants')
        return
      }

      const sourceSlot = activeTeamSlots.find(
        (slot) => slot.slotId !== targetSlotId && slot.covenantId === covenantId,
      )
      const result = sourceSlot
        ? swapCovenantAssignments(activeTeamSlots, sourceSlot.slotId, targetSlotId)
        : assignCovenantToSlot(activeTeamSlots, targetSlotId, covenantId)

      if (result.nextSlots === activeTeamSlots) {
        setViolationMessage(null)
        setActiveTeamTarget(null)
        if (activeSelection?.kind === 'covenant') {
          setActiveSelection({kind: 'covenant', slotId: targetSlotId})
        }
        setPickerTab('covenants')
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      if (activeSelection?.kind === 'covenant') {
        setActiveSelection({kind: 'covenant', slotId: targetSlotId})
      }
    },
    [activeSelection, activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const assignPosse = useCallback(
    (posseId: string) => {
      const owningTeamOrder = allowDuplicateAwakenerIdentities
        ? undefined
        : usedPosseByTeamOrder.get(posseId)
      const owningTeam =
        owningTeamOrder === undefined ? undefined : teams.at(owningTeamOrder)

      if (owningTeam && owningTeam.id !== effectiveActiveTeamId) {
        setViolationMessage(getPosseInUseMessage(posseId, owningTeam.id, teams, posseById))
        setPickerTab('posses')
        return
      }

      updateActiveTeam((team) => ({...team, posseId}))
      setViolationMessage(null)
      setActiveSelection(null)
      setActiveTeamTarget({kind: 'posse'})
      setPickerTab('posses')
    },
    [
      allowDuplicateAwakenerIdentities,
      effectiveActiveTeamId,
      posseById,
      setActiveSelection,
      teams,
      updateActiveTeam,
      usedPosseByTeamOrder,
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
      setActiveTeamTarget(null)
      setActiveSelection({kind: 'awakener', slotId})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const clearWheel = useCallback(
    (slotId: string, wheelIndex: 0 | 1) => {
      const result = clearWheelAssignment(activeTeamSlots, slotId, wheelIndex)
      if (result.nextSlots === activeTeamSlots) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveSelection({kind: 'wheel', slotId, wheelIndex})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const clearCovenant = useCallback(
    (slotId: string) => {
      const result = clearCovenantAssignment(activeTeamSlots, slotId)
      if (result.nextSlots === activeTeamSlots) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveSelection({kind: 'covenant', slotId})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const clearPosse = useCallback(() => {
    if (!activeTeam.posseId) {
      return
    }

    updateActiveTeam((team) => ({...team, posseId: undefined}))
    setViolationMessage(null)
    setActiveSelection(null)
    setActiveTeamTarget({kind: 'posse'})
    setPickerTab('posses')
  }, [activeTeam.posseId, setActiveSelection, updateActiveTeam])

  const editingLabel = useMemo(
    () =>
      getEditingLabel({
        activeSelection,
        activeTeamTarget,
        activeTeamName,
        slots,
      }),
    [activeSelection, activeTeamName, activeTeamTarget, slots],
  )

  return {
    activeTeamId: effectiveActiveTeamId,
    activeTeamName,
    activePosse,
    activeSelection,
    activeTeamTarget,
    pickerTab,
    selectedSlotId,
    editingLabel,
    teams: v2Teams,
    slots,
    awakeners,
    wheels,
    covenants,
    posses,
    searchQuery,
    setSearchQuery,
    setPickerTab: switchPickerTab,
    setActiveTeam,
    selectAwakenerSlot,
    selectWheelSlot,
    selectCovenantSlot,
    selectPosse,
    assignAwakener,
    assignWheel,
    assignCovenant,
    assignPosse,
    removeAwakener,
    clearWheel,
    clearCovenant,
    clearPosse,
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

function createWheelSlotView(
  slot: TeamSlot,
  slotLabel: string,
  wheelIndex: 0 | 1,
  wheelById: Map<string, Wheel>,
  activeSelection: ActiveSelection,
): BuilderV2WheelSlotView {
  const wheelId = slot.wheels[wheelIndex]
  const wheel = wheelId ? wheelById.get(wheelId) : undefined
  return {
    wheelIndex,
    label: `${slotLabel} Wheel ${String(wheelIndex + 1)}`,
    wheelId,
    wheelName: wheel?.name ?? null,
    assetSrc: wheelId ? getWheelAssetById(wheelId) : undefined,
    isSelected:
      activeSelection?.kind === 'wheel' &&
      activeSelection.slotId === slot.slotId &&
      activeSelection.wheelIndex === wheelIndex,
  }
}

function createActivePosseView(posse: Posse): BuilderV2ActivePosseView {
  return {
    id: posse.id,
    name: posse.name,
    realm: posse.realm,
    assetSrc: getPosseAssetById(posse.id),
  }
}

function buildUsedWheelByTeamOrder(teams: Team[]): Map<string, WheelUsageLocation> {
  const wheelMap = new Map<string, WheelUsageLocation>()

  for (const [teamOrder, team] of teams.entries()) {
    for (const slot of team.slots) {
      if (slot.isSupport) {
        continue
      }

      for (const [wheelIndex, wheelId] of slot.wheels.entries()) {
        if (!wheelId || wheelMap.has(wheelId)) {
          continue
        }

        wheelMap.set(wheelId, {teamOrder, teamId: team.id, slotId: slot.slotId, wheelIndex})
      }
    }
  }

  return wheelMap
}

function buildUsedPosseByTeamOrder(teams: Team[]): Map<string, number> {
  const posseMap = new Map<string, number>()
  for (const [teamOrder, team] of teams.entries()) {
    if (!team.posseId || posseMap.has(team.posseId)) {
      continue
    }

    posseMap.set(team.posseId, teamOrder)
  }

  return posseMap
}

function getFirstEmptyWheelIndex(slot: TeamSlot | undefined): 0 | 1 | null {
  if (!slot?.awakenerId) {
    return null
  }

  const firstEmptyIndex = slot.wheels.findIndex((wheelId) => !wheelId)
  return firstEmptyIndex === 0 || firstEmptyIndex === 1 ? firstEmptyIndex : null
}

function getWheelAssignmentTarget(
  activeSelection: ActiveSelection,
  slots: TeamSlot[],
): {slotId: string; wheelIndex: 0 | 1} | null {
  if (activeSelection?.kind === 'wheel') {
    return {
      slotId: activeSelection.slotId,
      wheelIndex: activeSelection.wheelIndex === 0 ? 0 : 1,
    }
  }

  if (activeSelection?.kind !== 'awakener') {
    return null
  }

  const slot = slots.find((entry) => entry.slotId === activeSelection.slotId)
  const wheelIndex = getFirstEmptyWheelIndex(slot)
  return wheelIndex === null ? null : {slotId: activeSelection.slotId, wheelIndex}
}

function getSlotTargetFromSelection(activeSelection: ActiveSelection): string | null {
  if (activeSelection?.kind === 'awakener' || activeSelection?.kind === 'covenant') {
    return activeSelection.slotId
  }

  return null
}

function getEditingLabel({
  activeSelection,
  activeTeamTarget,
  activeTeamName,
  slots,
}: {
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  activeTeamName: string
  slots: BuilderV2SlotView[]
}): string {
  if (activeTeamTarget?.kind === 'posse') {
    return `Editing ${activeTeamName} - Posse`
  }

  if (!activeSelection) {
    return 'Select a slot or loadout target to begin.'
  }

  const slot = slots.find((entry) => entry.slotId === activeSelection.slotId)
  const slotLabel = slot?.slotLabel ?? activeSelection.slotId.replace('slot-', 'Slot ')
  if (activeSelection.kind === 'wheel') {
    return `Editing ${slotLabel} - Wheel ${String(activeSelection.wheelIndex + 1)}`
  }
  if (activeSelection.kind === 'covenant') {
    return `Editing ${slotLabel} - Covenant`
  }

  return `Editing ${slotLabel} - Awakener`
}

function getWheelInUseMessage(
  wheelId: string,
  owningTeamId: string,
  teams: {id: string; name: string}[],
  wheelById: Map<string, Wheel>,
) {
  const wheelName = wheelById.get(wheelId)?.name ?? 'That wheel'
  const teamName = teams.find((team) => team.id === owningTeamId)?.name ?? 'another team'
  return `${wheelName} is already assigned to ${teamName}. Remove it there before assigning it here.`
}

function getPosseInUseMessage(
  posseId: string,
  owningTeamId: string,
  teams: {id: string; name: string}[],
  posseById: Map<string, Posse>,
) {
  const posseName = posseById.get(posseId)?.name ?? 'That posse'
  const teamName = teams.find((team) => team.id === owningTeamId)?.name ?? 'another team'
  return `${posseName} is already assigned to ${teamName}. Remove it there before assigning it here.`
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
