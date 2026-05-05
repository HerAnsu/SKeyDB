import {describe, expect, it} from 'vitest'

import {getPosseAssetById} from './posse-assets'

describe('getPosseAssetById', () => {
  it('resolves public posse ids to the current icon folder assets', () => {
    expect(getPosseAssetById('posse-0001')).toMatch(/posse\/Icon\/KeyToken_Skill_01\.webp$/)
  })

  it('uses public V3 asset ids when public ids differ from icon numbers', () => {
    expect(getPosseAssetById('posse-0039')).toMatch(/posse\/Icon\/KeyToken_Skill_41\.webp$/)
  })
})
