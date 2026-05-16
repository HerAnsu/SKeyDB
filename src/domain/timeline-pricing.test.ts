import {describe, expect, it} from 'vitest'

import {formatTimelinePrice} from './timeline-pricing'

describe('timeline pricing display helpers', () => {
  it('keeps authored prices in Silver Prime mode', () => {
    expect(formatTimelinePrice('1980 Silver Prime', 'silver-prime')).toBe('1980 Silver Prime')
    expect(formatTimelinePrice('USD 29.99', 'silver-prime')).toBe('USD 29.99')
  })

  it('formats Silver Prime prices as rounded estimated dollars', () => {
    expect(formatTimelinePrice('980 Silver Prime', 'usd-estimate')).toBe('~$15')
    expect(formatTimelinePrice('1980 Silver Prime', 'usd-estimate')).toBe('~$30')
    expect(formatTimelinePrice('3980 Silver Prime', 'usd-estimate')).toBe('~$61')
    expect(formatTimelinePrice('680-1280 Silver Prime', 'usd-estimate')).toBe('~$12-20')
  })

  it('formats embedded Silver Prime prose and exact USD prices', () => {
    expect(
      formatTimelinePrice(
        'Spend up to 30k Silver Prime to claim rewards. Each gift box costs 1980 Silver Prime.',
        'usd-estimate',
      ),
    ).toBe('Spend up to ~$455 to claim rewards. Each gift box costs ~$30.')
    expect(formatTimelinePrice('USD 29.99', 'usd-estimate')).toBe('$30')
  })
})
