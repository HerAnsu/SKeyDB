import entitiesIndexJson from '@/data/public-v3/indexes/entities.json'

import type {PublicEntitiesIndex, PublicEntitySummary} from './contract'
import {publicEntitiesIndexSchema} from './schemas'

let entitiesIndexCache: PublicEntitiesIndex | undefined

export function getPublicEntitiesIndex(): PublicEntitiesIndex {
  entitiesIndexCache ??= publicEntitiesIndexSchema.parse(entitiesIndexJson)
  return entitiesIndexCache
}

export function getPublicEntity(entityId: string): PublicEntitySummary | undefined {
  return getPublicEntitiesIndex().byId[entityId]
}
