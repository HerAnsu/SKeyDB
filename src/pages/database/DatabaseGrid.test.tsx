import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {getAwakeners} from '@/domain/awakeners'

import {DatabaseGrid} from './DatabaseGrid'

describe('DatabaseGrid', () => {
  it('defers lower-priority grid portraits while keeping the first eight cards eager', () => {
    render(<DatabaseGrid awakeners={getAwakeners().slice(0, 10)} onSelectAwakener={vi.fn()} />)

    expect(screen.getAllByRole('button', {name: /View details for/})).toHaveLength(10)

    const images = screen.getAllByRole('img')

    expect(images).toHaveLength(10)
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[7]).toHaveAttribute('loading', 'eager')
    expect(images[7]).toHaveAttribute('fetchpriority', 'high')
    expect(images[8]).toHaveAttribute('loading', 'lazy')
    expect(images[8]).toHaveAttribute('fetchpriority', 'low')
    expect(images[9]).toHaveAttribute('loading', 'lazy')
    expect(images[9]).toHaveAttribute('fetchpriority', 'low')
  })
})
