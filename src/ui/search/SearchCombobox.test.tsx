import {createRef} from 'react'

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {SearchCombobox} from './SearchCombobox'

interface TestSearchResult {
  id: string
  label: string
}

describe('SearchCombobox', () => {
  it('does not call getResultId with an undefined result when activeIndex is stale', () => {
    const inputRef = createRef<HTMLInputElement>()

    expect(() => {
      render(
        <SearchCombobox
          activeIndex={4}
          emptyMessage='No results'
          getResultId={(result: TestSearchResult) => result.id}
          inputAriaLabel='Search'
          inputRef={inputRef}
          isOpen
          onQueryChange={vi.fn()}
          onSelectResult={vi.fn()}
          placeholder='Search'
          query='a'
          renderResult={(result: TestSearchResult) => result.label}
          results={[{id: 'first', label: 'First'}]}
        />,
      )
    }).not.toThrow()

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-activedescendant',
      expect.stringContaining('first'),
    )
  })
})
