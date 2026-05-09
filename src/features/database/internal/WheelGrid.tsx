import type {Wheel} from '@/domain/wheels'
import {CatalogGrid, HYBRID_DATABASE_GRID_CLASS_NAME} from '@/ui/cards/CatalogGrid'

import {WheelGridCard} from './WheelGridCard'

interface WheelGridProps {
  wheels: Wheel[]
  onSelectWheel: (wheelId: string) => void
}

export function WheelGrid({wheels, onSelectWheel}: WheelGridProps) {
  return (
    <CatalogGrid
      className={HYBRID_DATABASE_GRID_CLASS_NAME}
      emptyMessage='No wheels match the current filters.'
      items={wheels}
      renderItem={(wheel, index) => (
        <WheelGridCard index={index} key={wheel.id} onSelect={onSelectWheel} wheel={wheel} />
      )}
    />
  )
}
