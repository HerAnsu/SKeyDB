import type {KeyboardEvent as ReactKeyboardEvent} from 'react'

import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {useAwakenerDetailSearch} from './useAwakenerDetailSearch'

const AWAKENERS: Awakener[] = [
  {
    id: 1,
    name: 'alpha',
    realm: 'CHAOS',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: ['alpha'],
    tags: [],
  },
  {
    id: 2,
    name: 'beta',
    realm: 'AEQUOR',
    faction: 'Test',
    type: 'WARDEN',
    rarity: 'SR',
    aliases: ['beta'],
    tags: [],
  },
]

function createKeyboardEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as ReactKeyboardEvent<HTMLInputElement>
}

describe('useAwakenerDetailSearch', () => {
  it('cycles results with arrow keys and selects the active result on enter', () => {
    const onSelectAwakener = vi.fn()
    const {result} = renderHook(() =>
      useAwakenerDetailSearch({
        activeTab: 'cards',
        awakeners: AWAKENERS,
        onSelectAwakener,
      }),
    )

    act(() => {
      result.current.handleSearchQueryChange('a')
    })

    expect(result.current.searchResults.map((awakener) => awakener.id)).toEqual([1, 2])
    expect(result.current.activeSearchIndex).toBe(0)

    act(() => {
      result.current.handleSearchInputKeyDown(createKeyboardEvent('ArrowDown'))
    })
    expect(result.current.activeSearchIndex).toBe(1)

    act(() => {
      result.current.handleSearchInputKeyDown(createKeyboardEvent('ArrowUp'))
    })
    expect(result.current.activeSearchIndex).toBe(0)

    act(() => {
      result.current.handleSearchInputKeyDown(createKeyboardEvent('Enter'))
    })

    expect(onSelectAwakener).toHaveBeenCalledWith(expect.objectContaining({id: 1}), 'cards')
    expect(result.current.searchQuery).toBe('')
    expect(result.current.isSearchOpen).toBe(false)
  })
})
