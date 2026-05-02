import {describe, expect, it} from 'vitest'

import {getCovenantAssetById} from './covenant-assets'

describe('getCovenantAssetById', () => {
  it('resolves public covenant ids to the current icon folder assets', () => {
    expect(getCovenantAssetById('covenant-0001')).toMatch(
      /covenants\/Icon\/Icon_Trinket_001\.webp$/,
    )
  })

  it('does not resolve compact pre-public asset ids', () => {
    expect(getCovenantAssetById('001')).toBeUndefined()
  })
})
