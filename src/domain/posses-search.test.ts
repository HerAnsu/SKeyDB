import {describe, expect, it} from 'vitest'

import {getPosses} from './posses'
import {searchPosses} from './posses-search'

describe('searchPosses', () => {
  const posses = getPosses()

  it('matches by posse name fuzzy typo', () => {
    const names = searchPosses(posses, 'obsesion eternal').map((posse) => posse.name.toLowerCase())
    expect(names).toContain('obsession eternal')
  })

  it('matches generated owner and realm search fields', () => {
    expect(searchPosses(posses, 'ogier').map((posse) => posse.name)).toContain('The Final Vow')
    expect(searchPosses(posses, 'faded legacy').map((posse) => posse.realm)).toEqual(
      expect.arrayContaining(['FADED_LEGACY']),
    )
    expect(searchPosses(posses, 'caro').map((posse) => posse.realm)).toEqual(
      expect.arrayContaining(['CARO']),
    )
  })
})
