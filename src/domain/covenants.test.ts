import {describe, expect, it} from 'vitest'

import {getCovenants} from './covenants'
import {getCovenantsFull} from './covenants-full'

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

  it('loads public acquisition copy from V3 detail records', () => {
    const covenants = getCovenantsFull()
    const deusExMachina = covenants.find((covenant) => covenant.id === 'covenant-0001')

    expect(deusExMachina?.acquisitionSource).toBe(
      'Clear Interlude - Verboten Covenant: City of Big Smoke',
    )
    expect(deusExMachina).not.toHaveProperty('source')
  })
})
