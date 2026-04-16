import {describe, expect, it} from 'vitest'

import {getAwakenerFullV2ById, getAwakenersFullV2} from './awakeners-full-v2'
import {loadAwakenerFullV2ById} from './awakeners-full-v2-loader'

describe('awakeners-full-v2-loader', () => {
  it('loads individual records that match the compiled full dataset', async () => {
    const records = getAwakenersFullV2()
    const thais = getAwakenerFullV2ById(48, records)

    await expect(loadAwakenerFullV2ById(48)).resolves.toEqual(thais)
  })

  it('returns undefined when no compiled record exists for an id', async () => {
    await expect(loadAwakenerFullV2ById(99999)).resolves.toBeUndefined()
  })
})
