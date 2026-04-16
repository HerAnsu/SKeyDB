import {describe, expect, it} from 'vitest'

import type {FullStats} from './awakener-source-schema'
import {
  buildRichScalingHover,
  computeRichScalingStatRange,
  computeRichScalingStatValue,
  formatRichScalingRange,
} from './rich-scaling'
import type {ScalingSegment} from './rich-text'

const BASE_STATS: FullStats = {
  CON: '100',
  ATK: '200',
  DEF: '80',
  CritRate: '0%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '0',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
}

describe('rich-scaling', () => {
  it('computes absolute values from stat-based percentage scaling', () => {
    expect(computeRichScalingStatValue(20, '%', 'ATK', BASE_STATS)).toBe(40)
    expect(computeRichScalingStatValue(20, '', 'ATK', BASE_STATS)).toBeNull()
  })

  it('formats progression ranges from one scaling segment', () => {
    const segment: ScalingSegment = {type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}

    expect(formatRichScalingRange(segment)).toBe('10% (+10%/Lv)')
    expect(computeRichScalingStatRange(segment, BASE_STATS)).toBe('20~40')
    expect(buildRichScalingHover(segment, BASE_STATS)).toContain('Lv1: 10% ATK = 20')
  })
})
