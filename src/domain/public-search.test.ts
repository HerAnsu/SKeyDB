import {describe, expect, it, vi} from 'vitest'

import type {PublicSearchDocument} from '@/data-access/public-data/contract'

import {searchPublicEntities} from './public-search'

const {documentsById} = vi.hoisted(() => ({
  documentsById: new Map<string, PublicSearchDocument>(),
}))

vi.mock('@/data-access/public-data/searchRepository', () => ({
  getPublicSearchDocument: (_scope: string, id: string) => documentsById.get(id),
}))

describe('searchPublicEntities', () => {
  it('keeps generated tag values to exact and prefix lookup matches', () => {
    documentsById.clear()
    documentsById.set('awakener-test', {
      kind: 'awakener',
      id: 'awakener-test',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['discard', 'machine', 'oath'],
      fields: {name: ['Machine Oath'], tag: ['Discard']},
    })
    const entities = [{id: 'awakener-test', name: 'Machine Oath'}]

    expect(searchPublicEntities('awakeners', entities, 'disc').map((entity) => entity.id)).toEqual([
      'awakener-test',
    ])
    expect(searchPublicEntities('awakeners', entities, 'car')).toEqual([])
  })

  it('keeps generated facet values to exact and prefix lookup matches', () => {
    documentsById.clear()
    documentsById.set('awakener-test', {
      kind: 'awakener',
      id: 'awakener-test',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['caro', 'machine', 'oath'],
      fields: {name: ['Machine Oath'], facet: ['CARO']},
    })
    const entities = [{id: 'awakener-test', name: 'Machine Oath'}]

    expect(searchPublicEntities('awakeners', entities, 'car').map((entity) => entity.id)).toEqual([
      'awakener-test',
    ])
    expect(searchPublicEntities('awakeners', entities, 'aro')).toEqual([])
  })

  it('keeps generated owner values to exact, prefix, and word-prefix lookup matches', () => {
    documentsById.clear()
    documentsById.set('posse-test', {
      kind: 'posse',
      id: 'posse-test',
      name: 'Blue Pact',
      aliases: [],
      tokens: ['blue', 'catena', 'helot', 'pact'],
      fields: {name: ['Blue Pact'], owner: ['Helot: Catena', 'g-helot']},
    })
    const entities = [{id: 'posse-test', name: 'Blue Pact'}]

    expect(searchPublicEntities('posses', entities, 'g-helot').map((entity) => entity.id)).toEqual([
      'posse-test',
    ])
    expect(searchPublicEntities('posses', entities, 'cat').map((entity) => entity.id)).toEqual([
      'posse-test',
    ])
    expect(searchPublicEntities('posses', entities, 'tena')).toEqual([])
  })

  it('does not search generated facets unless they are explicit search fields', () => {
    documentsById.clear()
    documentsById.set('covenant-test', {
      kind: 'covenant',
      id: 'covenant-test',
      name: 'Machine Oath',
      aliases: [],
      tokens: ['machine', 'oath'],
      fields: {name: ['Machine Oath']},
      facets: {setBonus: ['6-piece']},
    })

    expect(
      searchPublicEntities('covenants', [{id: 'covenant-test', name: 'Machine Oath'}], '6-piece'),
    ).toEqual([])
  })
})
