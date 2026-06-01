import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {Toast} from './Toast'

describe('Toast', () => {
  it('renders a stack when messages are provided', () => {
    render(<Toast messages={['one', 'two']} />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('one')
    expect(status).toHaveTextContent('two')
  })

  it('prefers stable entry ids when provided', () => {
    render(
      <Toast
        entries={[
          {id: 5, message: 'one'},
          {id: 7, message: 'two'},
        ]}
      />,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('one')
    expect(status).toHaveTextContent('two')
  })
})
