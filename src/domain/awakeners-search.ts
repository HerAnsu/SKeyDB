import type {Awakener} from './awakeners'
import {searchPublicEntities} from './public-search'

export function searchAwakeners(awakeners: Awakener[], query: string): Awakener[] {
  return searchPublicEntities('awakeners', awakeners, query, {
    getFallbackFields: (awakener) => ({
      alias: awakener.aliases,
      tag: awakener.tags,
      facet: [awakener.realm, awakener.rarity, awakener.type, awakener.faction].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      ),
    }),
  })
}
