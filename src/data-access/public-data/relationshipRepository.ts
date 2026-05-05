import relationshipsIndexJson from '@/data/public-v3/indexes/relationships.json'

import type {PublicRelationshipsIndex} from './contract'
import {publicRelationshipsIndexSchema} from './schemas'

let relationshipsIndexCache: PublicRelationshipsIndex | undefined

export function getPublicRelationshipsIndex(): PublicRelationshipsIndex {
  relationshipsIndexCache ??= publicRelationshipsIndexSchema.parse(relationshipsIndexJson)
  return relationshipsIndexCache
}
