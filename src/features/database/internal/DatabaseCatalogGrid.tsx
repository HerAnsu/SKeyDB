import type {ReactNode} from 'react'

import type {HybridDatabaseCardMode} from './DatabaseGridCardFrame'
import {useMeasuredHybridCardMode} from './useMeasuredHybridCardMode'

interface CatalogGridBaseProps<TItem> {
  items: TItem[]
  emptyMessage: string
}

interface HybridCatalogGridProps<TItem> extends CatalogGridBaseProps<TItem> {
  gridLayout: 'hybrid'
  renderItem: (item: TItem, index: number, variant: HybridDatabaseCardMode) => ReactNode
}

interface StaticCatalogGridProps<TItem> extends CatalogGridBaseProps<TItem> {
  gridLayout: 'square-art'
  renderItem: (item: TItem, index: number) => ReactNode
}

type CatalogGridProps<TItem> = HybridCatalogGridProps<TItem> | StaticCatalogGridProps<TItem>

function HybridCatalogGrid<TItem>({items, renderItem}: HybridCatalogGridProps<TItem>) {
  const {mode: variant, ref} = useMeasuredHybridCardMode()

  return (
    <div className='database-card-roster' data-hybrid-mode={variant} ref={ref}>
      <div className='database-card-grid' data-grid-layout='hybrid'>
        {items.map((item, index) => renderItem(item, index, variant))}
      </div>
    </div>
  )
}

function StaticCatalogGrid<TItem>({gridLayout, items, renderItem}: StaticCatalogGridProps<TItem>) {
  return (
    <div className='database-card-roster'>
      <div className='database-card-grid' data-grid-layout={gridLayout}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  )
}

export function DatabaseCatalogGrid<TItem>(props: CatalogGridProps<TItem>) {
  const {emptyMessage, gridLayout, items} = props
  if (items.length === 0) {
    return <div className='database-card-grid-empty'>{emptyMessage}</div>
  }

  return gridLayout === 'hybrid' ? (
    <HybridCatalogGrid {...props} />
  ) : (
    <StaticCatalogGrid {...props} />
  )
}
