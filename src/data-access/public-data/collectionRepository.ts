import builderCatalogJson from '@/data/public-v3/indexes/builder-catalog.json'
import collectionCatalogJson from '@/data/public-v3/indexes/collection-catalog.json'

import type {PublicBuilderCatalog, PublicCollectionCatalog} from './contract'
import {publicBuilderCatalogSchema, publicCollectionCatalogSchema} from './schemas'

let builderCatalogCache: PublicBuilderCatalog | undefined
let collectionCatalogCache: PublicCollectionCatalog | undefined

export function getPublicBuilderCatalog(): PublicBuilderCatalog {
  builderCatalogCache ??= publicBuilderCatalogSchema.parse(builderCatalogJson)
  return builderCatalogCache
}

export function getPublicCollectionCatalog(): PublicCollectionCatalog {
  collectionCatalogCache ??= publicCollectionCatalogSchema.parse(collectionCatalogJson)
  return collectionCatalogCache
}
