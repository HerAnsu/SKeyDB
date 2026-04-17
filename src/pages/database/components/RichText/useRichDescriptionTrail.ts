import {useCallback, useEffect, useId, useState} from 'react'

import type {AwakenerFull} from '@/domain/awakeners-full'
import {type Tag} from '@/domain/tags'

import {
  snapshotPopoverAnchor,
  type PopoverAnchorElement,
} from '../RichTextPopovers/core/popover-anchor'
import {
  clearRichDescriptionTrailState,
  closeFromRichDescriptionTrail,
  closeTopRichDescriptionTrail,
  openRootRichDescriptionTrail,
  pushNestedRichDescriptionTrail,
  type RichDescriptionTrailState,
} from '../RichTextPopovers/trail/trail-state'
import {
  buildRichDescriptionScalingTrailEntry,
  buildRichDescriptionSkillTrailEntry,
  buildRichDescriptionTagTrailEntry,
  resolveRichDescriptionCardInfo,
} from './rich-description-entries'

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function useRichDescriptionTrail(fullData: AwakenerFull | null) {
  const [state, setState] = useState<RichDescriptionTrailState>(clearRichDescriptionTrailState)
  const ownerId = useId()

  const clearTrail = useCallback(() => {
    setState(clearRichDescriptionTrailState())
  }, [])

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      clearTrail()
    }

    globalThis.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    return () => {
      globalThis.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    }
  }, [clearTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    globalThis.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const openSkillTrail = useCallback(
    (name: string, anchorElement: PopoverAnchorElement) => {
      if (!fullData) return
      const result = resolveRichDescriptionCardInfo(fullData, name)
      if (!result) return
      const entry = buildRichDescriptionSkillTrailEntry(result.card, result.label, result.skillType)
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      announceTrailOpened()
      setState((prev) => openRootRichDescriptionTrail(prev, entry, anchor))
    },
    [announceTrailOpened, fullData],
  )

  const openTagTrail = useCallback(
    (tag: Tag, anchorElement: PopoverAnchorElement) => {
      const entry = buildRichDescriptionTagTrailEntry(tag)
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      announceTrailOpened()
      setState((prev) => openRootRichDescriptionTrail(prev, entry, anchor))
    },
    [announceTrailOpened],
  )

  const openScalingTrail = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      anchorElement: PopoverAnchorElement,
    ) => {
      const entry = buildRichDescriptionScalingTrailEntry(values, suffix, stat)
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      announceTrailOpened()
      setState((prev) => openRootRichDescriptionTrail(prev, entry, anchor))
    },
    [announceTrailOpened],
  )

  const openNestedSkillTrail = useCallback(
    (name: string, sourceIndex: number, anchorElement: PopoverAnchorElement) => {
      if (!fullData) return
      const result = resolveRichDescriptionCardInfo(fullData, name)
      if (!result) return
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      const entry = buildRichDescriptionSkillTrailEntry(
        result.card,
        result.label,
        result.skillType,
        anchor.anchorRect,
      )
      setState((prev) => pushNestedRichDescriptionTrail(prev, entry, sourceIndex))
    },
    [fullData],
  )

  const openNestedTagTrail = useCallback(
    (tag: Tag, sourceIndex: number, anchorElement: PopoverAnchorElement) => {
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      const entry = buildRichDescriptionTagTrailEntry(tag, anchor.anchorRect)
      setState((prev) => pushNestedRichDescriptionTrail(prev, entry, sourceIndex))
    },
    [],
  )

  const openNestedScalingTrail = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      sourceIndex: number,
      anchorElement: PopoverAnchorElement,
    ) => {
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      const entry = buildRichDescriptionScalingTrailEntry(values, suffix, stat, anchor.anchorRect)
      setState((prev) => pushNestedRichDescriptionTrail(prev, entry, sourceIndex))
    },
    [],
  )

  const closeTrailTop = useCallback(() => {
    setState((prev) => closeTopRichDescriptionTrail(prev))
  }, [])

  const closeTrailFrom = useCallback((index: number) => {
    setState((prev) => closeFromRichDescriptionTrail(prev, index))
  }, [])

  return {
    trail: state.trail,
    trailAnchorRect: state.trailAnchorRect,
    trailAnchorElement: state.trailAnchorElement,
    clearTrail,
    openSkillTrail,
    openTagTrail,
    openScalingTrail,
    openNestedSkillTrail,
    openNestedTagTrail,
    openNestedScalingTrail,
    closeTrailTop,
    closeTrailFrom,
  }
}
