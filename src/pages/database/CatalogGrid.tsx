import type {ReactNode} from 'react'

interface CatalogGridProps<TItem> {
  items: TItem[]
  emptyMessage: string
  renderItem: (item: TItem, index: number) => ReactNode
  className?: string
}

const DEFAULT_GRID_CLASS_NAME =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'

export function CatalogGrid<TItem>({
  className = DEFAULT_GRID_CLASS_NAME,
  emptyMessage,
  items,
  renderItem,
}: CatalogGridProps<TItem>) {
  if (items.length === 0) {
    return <div className='py-12 text-center text-sm text-slate-400'>{emptyMessage}</div>
  }

  return <div className={className}>{items.map((item, index) => renderItem(item, index))}</div>
}
