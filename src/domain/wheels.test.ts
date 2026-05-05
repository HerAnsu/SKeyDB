import {describe, expect, it} from 'vitest'

import {getMainstatByKey} from './mainstats'
import {getWheelMainstatLabel, getWheels} from './wheels'

describe('getWheels', () => {
  it('returns parsed wheels with stable ids and valid asset ids', () => {
    const wheels = getWheels()

    expect(wheels.length).toBeGreaterThan(0)
    expect(wheels[0]).toMatchObject({
      id: expect.stringMatching(/^wheel-\d{4}$/),
      assetId: expect.any(String),
      name: expect.any(String),
      rarity: expect.stringMatching(/^(SSR|SR|R)$/),
      realm: expect.stringMatching(/^(AEQUOR|CARO|CHAOS|ULTRA|NEUTRAL|OTHER)$/),
      awakener: expect.any(String),
      mainstatKey: expect.any(String),
    })
    expect(wheels.every((wheel) => wheel.id.trim().length > 0)).toBe(true)
    expect(
      wheels.every((wheel) => wheel.assetId === 'TBD' || wheel.assetId.startsWith('Weapon_Full_')),
    ).toBe(true)
    expect(wheels.every((wheel) => wheel.name.trim().length > 0)).toBe(true)
    expect(wheels.every((wheel) => typeof wheel.awakener === 'string')).toBe(true)
    expect(wheels.every((wheel) => Array.isArray(wheel.aliases))).toBe(true)
    expect(wheels.every((wheel) => Array.isArray(wheel.tags))).toBe(true)
    expect(wheels.every((wheel) => typeof wheel.mainstatKey === 'string')).toBe(true)
  })

  it('uses public V3 wheel ids as runtime ids without legacy leakage', () => {
    const wheels = getWheels()
    const firstWheel = wheels.find((wheel) => wheel.id === 'wheel-0001')

    expect(firstWheel).toMatchObject({
      id: 'wheel-0001',
      ownerAwakenerId: 'awakener-0048',
    })
    expect(
      wheels.every(
        (wheel) =>
          !('source' in wheel) &&
          !('legacyId' in wheel) &&
          !('sourceConfigId' in wheel) &&
          !('publicId' in wheel),
      ),
    ).toBe(true)
  })

  it('ensures wheel ids are unique', () => {
    const wheels = getWheels()
    const ids = wheels.map((wheel) => wheel.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('applies wheel metadata overrides and defaults', () => {
    const wheels = getWheels()

    const d12 = wheels.find((wheel) => wheel.assetId === 'Weapon_Full_D12')
    const sr01 = wheels.find((wheel) => wheel.assetId === 'Weapon_Full_SR01')
    const p01 = wheels.find((wheel) => wheel.assetId === 'Weapon_Full_P01')
    const jp01 = wheels.find((wheel) => wheel.assetId === 'Weapon_Full_JP01')

    expect(d12?.realm).toBe('CHAOS')
    expect(sr01?.rarity).toBe('SR')
    expect(sr01?.realm).toBe('NEUTRAL')
    expect(p01?.rarity).toBe('R')
    expect(p01?.realm).toBe('NEUTRAL')
    expect(jp01?.rarity).toBe('SSR')
    expect(jp01?.realm).toBe('NEUTRAL')
  })

  it('keeps wheel mainstats linked to canonical mainstat keys', () => {
    const wheels = getWheels()
    expect(wheels.length).toBeGreaterThan(0)

    wheels.forEach((wheel) => {
      expect(wheel.mainstatKey.trim().length).toBeGreaterThan(0)
      expect(getMainstatByKey(wheel.mainstatKey)).toBeDefined()
      expect(getWheelMainstatLabel(wheel)).toBe(getMainstatByKey(wheel.mainstatKey)?.label ?? '')
    })
  })
})
