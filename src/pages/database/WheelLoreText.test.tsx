import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {WheelLoreText} from './WheelLoreText'

function getGlyphKeys(node: HTMLElement): string[] {
  return Array.from(node.querySelectorAll<SVGElement>('[data-lore-redaction-glyph]')).map(
    (glyph) => glyph.dataset.glyphKey ?? '',
  )
}

describe('WheelLoreText', () => {
  it('maps censor tokens to the intended glyph sequences', () => {
    render(<WheelLoreText lore={'One @1.\n\nTwo @2.\n\nThree @3.\n\nFour @4.'} />)

    const redactions = screen.getAllByLabelText('Redacted lore text')

    expect(redactions).toHaveLength(4)
    expect(getGlyphKeys(redactions[0])).toEqual(['glyph-1'])
    expect(getGlyphKeys(redactions[1])).toEqual(['glyph-2', 'glyph-3'])
    expect(getGlyphKeys(redactions[2])).toEqual(['glyph-2', 'glyph-3', 'glyph-4'])
    expect(getGlyphKeys(redactions[3])).toEqual(['glyph-2', 'glyph-3', 'glyph-4', 'glyph-5'])
  })

  it('collapses long lore and expands on demand', () => {
    render(<WheelLoreText lore={'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'} />)

    expect(screen.getByText(/Line 1/)).toBeInTheDocument()
    expect(screen.getByText('Show More')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Show More'))

    expect(screen.getByText('Show Less')).toBeInTheDocument()
    expect(screen.getByText(/Line 5/)).toBeInTheDocument()
    expect(screen.getByText(/Line 6/)).toBeInTheDocument()
  })
})
