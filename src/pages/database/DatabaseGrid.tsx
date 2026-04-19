import type {Awakener} from '@/domain/awakeners'

import {AwakenerGridCard} from './AwakenerGridCard'
import {CatalogGrid} from './CatalogGrid'

interface DatabaseGridProps {
  awakeners: Awakener[]
  onSelectAwakener: (id: number) => void
}

export function DatabaseGrid({awakeners, onSelectAwakener}: DatabaseGridProps) {
  return (
    <CatalogGrid
      emptyMessage='No awakeners match the current filters.'
      items={awakeners}
      renderItem={(awakener, index) => (
        <AwakenerGridCard
          awakener={awakener}
          index={index}
          key={awakener.id}
          onSelect={onSelectAwakener}
        />
      )}
    />
  )
}
