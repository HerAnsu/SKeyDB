import {useCallback, useEffect, useId} from 'react'

import type {AwakenerEnlightenRecord, FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {useDatabasePopoverTrailActions} from './useDatabasePopoverTrailActions'

interface DatabasePopoverControllerOptions {
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  stats?: FullStats | null
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function useDatabasePopoverController({
  referenceLayer,
  formulaContext,
  selectedEnlightenSlot = null,
  stats = null,
  onNavigateToSkills,
  onNavigateToWheelPage,
  onNavigateToCovenantPage,
  onToggleEnlightenSlot,
  showVisibleScaling = true,
  showTagIcons = true,
}: DatabasePopoverControllerOptions) {
  const ownerId = useId()

  const announceTrailOpened = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const trailActions = useDatabasePopoverTrailActions({
    formulaContext,
    onNavigateToCovenantPage,
    onNavigateToSkills,
    onNavigateToWheelPage,
    onRootTrailOpened: announceTrailOpened,
    onToggleEnlightenSlot,
    referenceLayer,
    selectedEnlightenSlot,
    showTagIcons,
    showVisibleScaling,
    stats,
  })
  const {closeAllPopovers} = trailActions

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      closeAllPopovers()
    }

    window.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened)
    return () => {
      window.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened)
    }
  }, [closeAllPopovers, ownerId])

  return trailActions
}
