import {describe, expect, it} from 'vitest'

import {
  createDescriptionArgTokenPattern,
  createPluralMacroPattern,
  extractDescriptionArgToken,
} from './description-token-grammar'

describe('description-token-grammar', () => {
  it('extracts accepted public V3 description arg tokens', () => {
    expect(
      [
        '[Arg1]',
        '[DescArg12]',
        '[StateArg3]',
        '[Layer]',
        '[Power:Arg2]',
        '[{Poison}:Arg2]',
        '[{ Poison }:Layer]',
      ].map((token) => extractDescriptionArgToken(token)),
    ).toEqual([
      {argKey: 'Arg1', channel: null},
      {argKey: 'DescArg12', channel: null},
      {argKey: 'StateArg3', channel: null},
      {argKey: 'Layer', channel: null},
      {argKey: 'Arg2', channel: 'Power'},
      {argKey: 'Arg2', channel: 'Poison'},
      {argKey: 'Layer', channel: 'Poison'},
    ])
  })

  it('rejects malformed or partial public V3 description arg tokens', () => {
    expect(extractDescriptionArgToken('[Bad-Key]')).toBeNull()
    expect(extractDescriptionArgToken('prefix [Arg1]')).toBeNull()
    expect(extractDescriptionArgToken('[{Poison}:Bad-Key]')).toBeNull()
  })

  it('creates reusable token and plural macro patterns', () => {
    const tokenPattern = createDescriptionArgTokenPattern('g')
    const pluralPattern = createPluralMacroPattern('g')

    expect(
      [...String.raw`Draw [Arg1] and [{Poison}:Layer].`.matchAll(tokenPattern)].map(
        (match) => match.groups?.argKey,
      ),
    ).toEqual(['Arg1', 'Layer'])

    const pluralMatch = pluralPattern.exec('{plural:[{Poison}:Layer]|stack|stacks}')
    expect(pluralMatch?.groups).toMatchObject({
      argToken: '[{Poison}:Layer]',
      singular: 'stack',
      plural: 'stacks',
    })
  })
})
