import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {OwnerAwakenerMetaLink} from './OwnerAwakenerMetaLink'

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
}))

describe('OwnerAwakenerMetaLink', () => {
  it('renders a formatted owner link and opens the owner awakener overview', () => {
    const onSelectAwakener = vi.fn()

    render(
      <OwnerAwakenerMetaLink
        onSelectAwakener={onSelectAwakener}
        ownerAwakenerId='awakener-0001'
        ownerAwakenerName='alpha'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Alpha'}))

    expect(screen.getByText('•')).toBeInTheDocument()
    expect(onSelectAwakener).toHaveBeenCalledWith({id: 'awakener-0001', name: 'alpha'}, 'overview')
  })

  it('omits the link when owner identity is incomplete', () => {
    const {rerender} = render(<OwnerAwakenerMetaLink ownerAwakenerName='alpha' />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(<OwnerAwakenerMetaLink ownerAwakenerId='awakener-0001' />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
