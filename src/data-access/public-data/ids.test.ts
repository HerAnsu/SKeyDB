import {describe, expect, it} from 'vitest'

import {isPublicEntityId} from './ids'

describe('public data ids', () => {
  it('accepts generated public-v3 IDs with exactly four digits', () => {
    expect(isPublicEntityId('awakener', 'awakener-0001')).toBe(true)
    expect(isPublicEntityId('wheel', 'wheel-0001')).toBe(true)
    expect(isPublicEntityId('posse', 'posse-0001')).toBe(true)
    expect(isPublicEntityId('covenant', 'covenant-0001')).toBe(true)
  })

  it('rejects IDs with the wrong kind prefix', () => {
    expect(isPublicEntityId('wheel', 'awakener-0001')).toBe(false)
  })

  it('rejects numeric IDs outside the generated four-digit contract', () => {
    expect(isPublicEntityId('awakener', 'awakener-001')).toBe(false)
    expect(isPublicEntityId('awakener', 'awakener-00001')).toBe(false)
  })
})
