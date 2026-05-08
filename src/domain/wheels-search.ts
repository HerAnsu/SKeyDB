import {getMainstatByKey} from './mainstats'
import {searchPublicEntities} from './public-search'
import type {Wheel} from './wheels'

export function searchWheels(wheels: Wheel[], query: string): Wheel[] {
  return searchPublicEntities('wheels', wheels, query, {
    getFallbackFields: (wheel) => ({
      alias: wheel.aliases,
      owner: [wheel.ownerAwakenerName, wheel.awakener].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      ),
      tag: wheel.tags,
      facet: [
        wheel.realm,
        wheel.rarity,
        wheel.mainstatKey,
        getWheelSearchMainstatLabel(wheel),
      ].filter((value): value is string => typeof value === 'string' && value.length > 0),
    }),
  })
}

function getWheelSearchMainstatLabel(wheel: Wheel): string {
  return getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey
}
