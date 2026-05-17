import type {ReactNode} from 'react'

import {HybridDatabaseCardModeContext} from './hybrid-database-card-mode'
import {useMeasuredHybridCardMode} from './useMeasuredHybridCardMode'

interface CatalogGridProps<TItem> {
  items: TItem[]
  emptyMessage: string
  renderItem: (item: TItem, index: number) => ReactNode
  layout?: 'hybrid' | 'portrait' | 'square-art'
}

export function DatabaseCatalogGrid<TItem>({
  emptyMessage,
  items,
  layout = 'portrait',
  renderItem,
}: CatalogGridProps<TItem>) {
  const isHybridGrid = layout === 'hybrid'
  const {mode, ref} = useMeasuredHybridCardMode(isHybridGrid, items.length > 0)
  const gridClassName =
    layout === 'hybrid'
      ? 'database-card-grid database-card-grid--hybrid'
      : layout === 'square-art'
        ? 'database-card-grid database-card-grid--square-art'
        : 'database-card-grid'

  if (items.length === 0) {
    return (
      <div className='border border-slate-700/55 bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(9,15,27,0.28))] px-4 py-12 text-center text-sm text-slate-400'>
        {emptyMessage}
      </div>
    )
  }

  return (
    <HybridDatabaseCardModeContext.Provider value={mode}>
      <div className='database-card-roster' data-hybrid-mode={mode ?? 'pending'} ref={ref}>
        <div className={gridClassName}>{items.map((item, index) => renderItem(item, index))}</div>
      </div>
    </HybridDatabaseCardModeContext.Provider>
  )
}
