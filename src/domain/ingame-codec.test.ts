import {describe, expect, it} from 'vitest'

import type {Team} from '@/pages/builder/types'

import {decodeIngameTeamCode, encodeIngameTeamCode} from './ingame-codec'

function buildCodeWithCovenantBlocks(slotBlocks: string[], posseToken = 'd'): string {
  const filledBlocks = [
    slotBlocks[0] ?? 'aaaaaa',
    slotBlocks[1] ?? 'aaaaaa',
    slotBlocks[2] ?? 'aaaaaa',
    slotBlocks[3] ?? 'aaaaaa',
  ]
  return `@@NDklaaaaaaaa${filledBlocks.join('')}${posseToken}@@`
}

describe('decodeIngameTeamCode', () => {
  it('decodes in-game wrapper and consumes the 4 awakener prefix tokens in slot order', () => {
    const code = '@@NDklaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].awakenerName).toBeTruthy()
    expect(decoded.team.slots[1].awakenerName).toBeTruthy()
    expect(decoded.team.slots[2].awakenerName).toBeTruthy()
    expect(decoded.team.slots[3].awakenerName).toBeTruthy()
  })

  it('decodes wheel token order as wheel1 then wheel2 inside each slot', () => {
    const code = '@@NDklyT1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaad@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].wheels[0]).toBeTruthy()
    expect(decoded.team.slots[0].wheels[1]).toBeTruthy()
    expect(decoded.team.slots[1].wheels).toEqual([null, null])
    expect(decoded.team.slots[2].wheels).toEqual([null, null])
    expect(decoded.team.slots[3].wheels).toEqual([null, null])
  })

  it('decodes known covenant blocks into canonical covenant ids', () => {
    const code = '@@Oir7xbxSxYxHmJyUyTxfhQuExRxp6gNKxCxfhQuExRxfhQuEyAG@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots.map((slot) => slot.covenantId)).toEqual(['022', '016', '022', '022'])
    expect(decoded.warnings.some((warning) => warning.section === 'covenant')).toBe(false)
  })

  it('matches observed in-game sample token order for laaI prefix', () => {
    const code = '@@laaIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].awakenerName).toBe('doll')
    expect(decoded.team.slots[1].awakenerName).toBeUndefined()
    expect(decoded.team.slots[2].awakenerName).toBeUndefined()
    expect(decoded.team.slots[3].awakenerName).toBe('daffodil')
  })

  it('encodes in-game wrapper format with canonical slot ordering', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Team 1',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'ramona',
          realm: 'CHAOS',
          level: 60,
          wheels: ['SR22', 'C01'],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }

    const code = encodeIngameTeamCode(team)
    expect(code.startsWith('@@')).toBe(true)
    expect(code.endsWith('@@')).toBe(true)
    const decoded = decodeIngameTeamCode(code)
    expect(decoded.team.slots[0].awakenerName).toBe('ramona')
    expect(decoded.team.slots[0].wheels[0]).toBe('SR22')
    expect(decoded.team.slots[0].wheels[1]).toBe('C01')
  })

  it('re-encodes decoded covenant blocks canonically', () => {
    const source = '@@UliXxW5aaxY1xVxDxfhQuExRxp6gNKxCxfhQuExRxfhQuExR3@@'
    const decoded = decodeIngameTeamCode(source)
    const reEncoded = encodeIngameTeamCode(decoded.team)
    expect(reEncoded).toBe(source)
  })

  it('matches observed in-game export layout for no-covenant team with posse token', () => {
    const team: Team = {
      id: 'team-2',
      name: 'Team 2',
      posseId: 'manor-echoes',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'doll: inferno',
          realm: 'CHAOS',
          level: 60,
          wheels: ['C02EX', 'SR01'],
        },
        {slotId: 'slot-2', awakenerName: 'doll', realm: 'CHAOS', level: 60, wheels: [null, null]},
        {
          slotId: 'slot-3',
          awakenerName: 'helot: catena',
          realm: 'CARO',
          level: 60,
          wheels: ['B05EX', 'O06'],
        },
        {
          slotId: 'slot-4',
          awakenerName: 'tawil',
          realm: 'CHAOS',
          level: 60,
          wheels: ['C15', 'SR02'],
        },
      ],
    }

    expect(encodeIngameTeamCode(team)).toBe('@@UliXxW5aaxY1xVxDaaaaaaaaaaaaaaaaaaaaaaaa3@@')
  })

  it('encodes canonical covenant blocks into the covenant payload zone', () => {
    const team: Team = {
      id: 'team-2b',
      name: 'Team 2b',
      posseId: 'manor-echoes',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'doll: inferno',
          realm: 'CHAOS',
          level: 60,
          wheels: ['C02EX', 'SR01'],
          covenantId: '022',
        },
        {slotId: 'slot-2', awakenerName: 'doll', realm: 'CHAOS', level: 60, wheels: [null, null]},
        {
          slotId: 'slot-3',
          awakenerName: 'helot: catena',
          realm: 'CARO',
          level: 60,
          wheels: ['B05EX', 'O06'],
        },
        {
          slotId: 'slot-4',
          awakenerName: 'tawil',
          realm: 'CHAOS',
          level: 60,
          wheels: ['C15', 'SR02'],
        },
      ],
    }

    expect(encodeIngameTeamCode(team)).toBe('@@UliXxW5aaxY1xVxDxfhQuExRaaaaaaaaaaaaaaaaaa3@@')
  })

  it('encodes feast from afar using the observed fifth covenant piece token', () => {
    const team: Team = {
      id: 'team-investigation',
      name: 'ASDFTEST',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null],
          covenantId: '020',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }

    expect(encodeIngameTeamCode(team)).toContain('ymxhyEx6TxD')
  })

  it('encodes chrysalis of the maiden without inserting an extra h into the second piece', () => {
    const team: Team = {
      id: 'team-chrysalis',
      name: 'Team Chrysalis',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null],
          covenantId: '023',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }

    expect(encodeIngameTeamCode(team)).toContain('ywXypyoxux7')
  })

  it('resolves mixed covenant blocks to the covenant with the most matching pieces', () => {
    const decoded = decodeIngameTeamCode(buildCodeWithCovenantBlocks(['xfhQuKxC']))

    expect(decoded.team.slots[0].covenantId).toBe('022')
    expect(decoded.warnings.some((warning) => warning.section === 'covenant')).toBe(false)
  })

  it('leaves covenant unset and warns when a mixed covenant block ties for best match', () => {
    const decoded = decodeIngameTeamCode(buildCodeWithCovenantBlocks(['xfhQNKxC']))

    expect(decoded.team.slots[0].covenantId).toBeUndefined()
    expect(
      decoded.warnings.some(
        (warning) =>
          warning.section === 'covenant' &&
          warning.slotIndex === 0 &&
          warning.reason === 'ambiguous_parse',
      ),
    ).toBe(true)
  })

  it('decodes covenant slice noise without shifting wheel or posse parsing', () => {
    const code = '@@UliXxW5aaxY1xVxDaaaaaaaaax1aaaaaaaaaaaaaa3@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].awakenerName).toBe('doll: inferno')
    expect(decoded.team.slots[0].wheels).toEqual(['C02EX', 'SR01'])
    expect(decoded.team.slots[1].awakenerName).toBe('doll')
    expect(decoded.team.slots[1].wheels).toEqual([null, null])
    expect(decoded.team.slots[2].awakenerName).toBe('helot: catena')
    expect(decoded.team.slots[2].wheels).toEqual(['B05EX', 'O06'])
    expect(decoded.team.slots[3].awakenerName).toBe('tawil')
    expect(decoded.team.slots[3].wheels).toEqual(['C15', 'SR02'])
    expect(decoded.team.posseId).toBe('manor-echoes')
    expect(
      decoded.warnings.some(
        (warning) => warning.section === 'covenant' && warning.reason === 'unknown_token',
      ),
    ).toBe(true)
  })
})
