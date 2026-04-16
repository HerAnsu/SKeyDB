import {createContext, useContext, type MouseEvent} from 'react'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'

export interface DatabasePopoverContextValue {
  openRootReferenceByName: (name: string, event: MouseEvent<HTMLElement>) => void
  openRootOverlay: (overlay: AwakenerOverlayRecord, event: MouseEvent<HTMLElement>) => void
  openNestedReferenceByName: (name: string) => void
  openNestedOverlay: (overlay: AwakenerOverlayRecord) => void
  hasOpenPopovers: boolean
  closeAllPopovers: () => void
}

export const DatabasePopoverContext = createContext<DatabasePopoverContextValue | null>(null)

export function useDatabasePopoverControllerContext(): DatabasePopoverContextValue | null {
  return useContext(DatabasePopoverContext)
}
