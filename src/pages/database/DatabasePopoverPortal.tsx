import {createElement} from 'react'

import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {
  ResolvedAwakenerDatabaseReferenceLayer,
  ResolvedAwakenerDatabaseShellView,
} from '@/domain/awakeners-database-view'

import {DatabaseReferencePopover} from './DatabaseReferencePopover'
import type {FontScale} from './font-scale'
import type {TrailEntry} from './popover-trail'
import {PopoverTrailPanel} from './PopoverTrailPanel'

export interface DatabasePopoverPortalEntry {
  activeEntry: TrailEntry
  key: string
  layerIndex: number
  onClose: () => void
  onMechanicTokenClick: (overlay: AwakenerOverlayRecord) => void
  onNavigateToCards?: () => void
  onSkillTokenClick: (name: string) => void
}

interface DatabasePopoverPortalProps {
  anchorElement?: HTMLElement | null
  anchorRect: DOMRect
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  stats: ResolvedAwakenerDatabaseShellView['stats']
  entries: DatabasePopoverPortalEntry[]
  onCloseAll: () => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  showTagIcons?: boolean
  showVisibleScaling?: boolean
  fontScale?: FontScale
}

export function DatabasePopoverPortal({
  anchorElement,
  anchorRect,
  referenceLayer,
  stats,
  entries,
  onCloseAll,
  onToggleEnlightenSlot,
  selectedEnlightenSlot = null,
  showTagIcons = true,
  showVisibleScaling = true,
  fontScale = 'small',
}: DatabasePopoverPortalProps) {
  return createElement(
    PopoverTrailPanel,
    {
      anchorElement,
      anchorRect,
      fontScale,
      itemCount: entries.length,
      onCloseAll,
    },
    entries.map((entry) =>
      createElement(DatabaseReferencePopover, {
        entry: entry.activeEntry,
        key: entry.key,
        layerCount: entries.length,
        layerIndex: entry.layerIndex,
        onClose: entry.onClose,
        onMechanicTokenClick: entry.onMechanicTokenClick,
        onNavigateToCards: entry.onNavigateToCards,
        onSkillTokenClick: entry.onSkillTokenClick,
        onToggleEnlightenSlot,
        referenceLayer,
        selectedEnlightenSlot,
        showTagIcons,
        showVisibleScaling,
        stats,
      }),
    ),
  )
}
