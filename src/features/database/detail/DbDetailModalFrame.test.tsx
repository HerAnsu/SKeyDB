import {render} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {DbDetailModalFrame} from './DbDetailModalFrame'

describe('DbDetailModalFrame', () => {
  afterEach(() => {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  })

  it('locks page and root scroll while database detail dialogs are open', () => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'scroll'

    const {unmount} = render(
      <DbDetailModalFrame ariaLabel='Database detail'>
        <p>Detail content</p>
      </DbDetailModalFrame>,
    )

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('scroll')
  })
})
