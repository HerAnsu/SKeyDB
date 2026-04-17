export const POPOVER_LAYOUT = {
  MARGIN: 12,
  GAP: 6,
  MAX_WIDTH: 480,
  BASE_Z_INDEX: 950,
} as const

export const POPOVER_TIMINGS = {
  HOVER_DELAY: 300,
  ANIMATION_DURATION: 150,
} as const

export type PopoverLayout = typeof POPOVER_LAYOUT
export type PopoverTimings = typeof POPOVER_TIMINGS
