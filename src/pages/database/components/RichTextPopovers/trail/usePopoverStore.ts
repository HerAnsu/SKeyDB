import {produce} from 'immer'
import {create} from 'zustand'

import {POPOVER_LAYOUT} from '../core/popover-config'

export type PopoverKind = 'skill' | 'tag' | 'scaling'

export interface PopoverEntry {
  id: string
  kind: PopoverKind
  props: Record<string, unknown>
  rect: DOMRect
  zIndex: number
}

interface PopoverState {
  trail: PopoverEntry[]
  anchorElement: HTMLElement | null
  anchorRect: DOMRect | null
}

interface PopoverActions {
  push: (entry: Omit<PopoverEntry, 'id' | 'zIndex'>, fromIndex?: number) => void
  pop: () => void
  closeFrom: (index: number) => void
  closeAll: () => void
  setAnchor: (element: HTMLElement, rect: DOMRect) => void
  bringToFront: (id: string) => void
}

export const usePopoverStore = create<PopoverState & PopoverActions>((set) => ({
  trail: [],
  anchorElement: null,
  anchorRect: null,

  push: (entry, fromIndex) => {
    set(
      produce((state: PopoverState) => {
        const index = fromIndex !== undefined ? fromIndex + 1 : state.trail.length
        if (fromIndex !== undefined) {
          state.trail = state.trail.slice(0, index)
        }

        const id = `${entry.kind}-${Math.random().toString(36).slice(2, 9)}`
        const zIndex = POPOVER_LAYOUT.BASE_Z_INDEX + state.trail.length

        state.trail.push({
          ...entry,
          id,
          zIndex,
        })
      }),
    )
  },

  pop: () => {
    set(
      produce((state: PopoverState) => {
        state.trail.pop()
      }),
    )
  },

  closeFrom: (index) => {
    set(
      produce((state: PopoverState) => {
        state.trail = state.trail.slice(0, index)
      }),
    )
  },

  closeAll: () => {
    set({
      trail: [],
      anchorElement: null,
      anchorRect: null,
    })
  },

  setAnchor: (element, rect) => {
    set({
      anchorElement: element,
      anchorRect: rect,
    })
  },

  bringToFront: (id) => {
    set(
      produce((state: PopoverState) => {
        const index = state.trail.findIndex((e) => e.id === id)
        if (index > -1 && index < state.trail.length - 1) {
          const [entry] = state.trail.splice(index, 1)
          state.trail.push(entry)

          state.trail.forEach((e, i) => {
            e.zIndex = POPOVER_LAYOUT.BASE_Z_INDEX + i
          })
        }
      }),
    )
  },
}))
