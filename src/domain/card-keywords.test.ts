import {describe, expect, it} from 'vitest'

import {buildCardKeywordFooterText, formatCardKeyword} from './card-keywords'

describe('card-keywords', () => {
  it('keeps valued mechanic keywords inside a single braced token', () => {
    expect(formatCardKeyword({id: 'mechanic.prepare', value: 2})).toBe('{Prepare 2}')
  })

  it('builds comma-separated footer text with valued mechanic aliases intact', () => {
    expect(
      buildCardKeywordFooterText([{id: 'mechanic.retain'}, {id: 'mechanic.prepare', value: 2}]),
    ).toBe('{Retain}, {Prepare 2}')
  })
})
