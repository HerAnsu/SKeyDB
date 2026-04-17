import {
  closeTrailFromIndex,
  closeTrailTop as closeTrailTopEntry,
  openTrailRoot,
  pushTrailEntry,
  type TrailEntry,
} from '@/pages/database/utils/popover-trail'

import {type PopoverAnchorSnapshot} from '../core/popover-anchor'

export type RichDescriptionTrailState = Readonly<{
  trail: TrailEntry[]
  trailAnchorRect: DOMRect | null
  trailAnchorElement: HTMLElement | null
}>

export const EMPTY_RICH_DESCRIPTION_TRAIL_STATE: RichDescriptionTrailState = {
  trail: [],
  trailAnchorRect: null,
  trailAnchorElement: null,
}

export function clearRichDescriptionTrailState(): RichDescriptionTrailState {
  return EMPTY_RICH_DESCRIPTION_TRAIL_STATE
}

export function openRootRichDescriptionTrail(
  state: RichDescriptionTrailState,
  entry: TrailEntry,
  anchor: PopoverAnchorSnapshot,
): RichDescriptionTrailState {
  return {
    trail: openTrailRoot(state.trail, entry),
    trailAnchorElement: anchor.anchorElement,
    trailAnchorRect: anchor.anchorRect,
  }
}

export function pushNestedRichDescriptionTrail(
  state: RichDescriptionTrailState,
  entry: TrailEntry,
  sourceIndex: number,
): RichDescriptionTrailState {
  return {
    ...state,
    trail: pushTrailEntry(state.trail.slice(0, sourceIndex + 1), entry),
  }
}

export function closeTopRichDescriptionTrail(
  state: RichDescriptionTrailState,
): RichDescriptionTrailState {
  const trail = closeTrailTopEntry(state.trail)
  if (trail.length === 0) {
    return {
      ...state,
      trail,
      trailAnchorRect: null,
      trailAnchorElement: null,
    }
  }

  return {
    ...state,
    trail,
  }
}

export function closeFromRichDescriptionTrail(
  state: RichDescriptionTrailState,
  index: number,
): RichDescriptionTrailState {
  const trail = closeTrailFromIndex(state.trail, index)
  if (trail.length === 0) {
    return {
      ...state,
      trail,
      trailAnchorRect: null,
      trailAnchorElement: null,
    }
  }

  return {
    ...state,
    trail,
  }
}
