import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {SkillPopover} from './SkillPopover'

describe('SkillPopover', () => {
  it('renders card headers with a cost icon label instead of CX text', () => {
    const {container} = render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        cost='2'
        description='Deal damage.'
        label='C1'
        name='Strike'
        onClose={vi.fn()}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Strike')).toBeInTheDocument()
    expect(screen.queryByText('Cost 2')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="UI_Battel_White_Buff_094"]')).not.toBeNull()
  })

  it('renders exalt labels with aliemus icon in the popover header', () => {
    const {container} = render(
      <SkillPopover
        cardNames={new Set()}
        description='Boosts damage.'
        label='EXALT'
        name='Overdrive'
        onClose={vi.fn()}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='exalt'
        stats={null}
      />,
    )

    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('Overdrive')).toBeInTheDocument()
    expect(screen.queryByText('EXALT')).not.toBeInTheDocument()
    expect(container.querySelector('img[src*="Aliemus_Color"]')).not.toBeNull()
  })

  it('renders a shared header action button for card navigation', () => {
    const onClose = vi.fn()
    const onNavigateToCards = vi.fn()

    render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        description='Deal damage.'
        label='C1'
        name='Strike'
        onClose={onClose}
        onNavigateToCards={onNavigateToCards}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: /Strike/}))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onNavigateToCards).toHaveBeenCalledTimes(1)
  })

  it('shows nested depth controls and a close button for chained skill popovers', () => {
    const onBack = vi.fn()
    const onClose = vi.fn()

    render(
      <SkillPopover
        cardNames={new Set(['Strike'])}
        cost='2'
        depth={2}
        description='Deal damage.'
        label='C1'
        name='Strike'
        onBack={onBack}
        onClose={onClose}
        onNavigateToCards={undefined}
        onTokenNavigate={vi.fn()}
        skillLevel={1}
        skillType='command'
        stats={null}
        totalDepth={3}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Step 2 of 3'}))
    fireEvent.click(screen.getByRole('button', {name: 'Close popover'}))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
