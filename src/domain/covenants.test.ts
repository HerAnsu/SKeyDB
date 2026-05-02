import {describe, expect, it} from 'vitest'

import {getCovenants} from './covenants'

describe('getCovenants', () => {
  it('returns parsed covenants with ids and asset ids', () => {
    const covenants = getCovenants()

    expect(covenants.length).toBeGreaterThan(0)
    expect(covenants[0]).toMatchObject({
      id: 'covenant-0001',
      assetId: 'covenant-icon-001',
      name: 'Deus Ex Machina',
    })
    expect(
      covenants.every(
        (covenant) =>
          !('source' in covenant) &&
          !('legacyId' in covenant) &&
          !('sourceConfigId' in covenant) &&
          !('publicId' in covenant),
      ),
    ).toBe(true)
  })
})
