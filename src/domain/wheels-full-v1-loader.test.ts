import {describe, expect, it} from 'vitest'

import {getWheelFullV1ById, getWheelsFullV1} from './wheels-full-v1'
import {loadWheelFullV1ById} from './wheels-full-v1-loader'

describe('wheels-full-v1-loader', () => {
  it('loads individual records that match the compiled full dataset', async () => {
    const records = getWheelsFullV1()
    const b03 = getWheelFullV1ById('B03', records)

    await expect(loadWheelFullV1ById('B03')).resolves.toEqual(b03)
  })

  it('returns undefined when no compiled record exists for an id', async () => {
    await expect(loadWheelFullV1ById('NOPE')).resolves.toBeUndefined()
  })
})
