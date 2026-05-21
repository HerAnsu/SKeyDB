import type {Wheel} from '@/domain/wheels'

import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {WheelGridCard} from './WheelGridCard'

interface WheelGridProps {
  wheels: Wheel[]
  onPreloadWheel?: (wheelId: string) => void
  onSelectWheel: (wheelId: string) => void
}

export function WheelGrid({wheels, onPreloadWheel, onSelectWheel}: WheelGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No wheels match the current filters.'
      gridLayout='hybrid'
      items={wheels}
      renderItem={(wheel, index, variant) => (
        <WheelGridCard
          index={index}
          key={wheel.id}
          onPreload={onPreloadWheel}
          onSelect={onSelectWheel}
          variant={variant}
          wheel={wheel}
        />
      )}
    />
  )
}
