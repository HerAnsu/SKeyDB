import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {PopoverContent, PopoverFooter, PopoverHeader} from './PopoverAtoms'

describe('PopoverAtoms', () => {
  it('renders a string title fallback with close and depth controls', () => {
    const onClose = vi.fn()
    const onBack = vi.fn()

    render(
      <PopoverHeader
        depthIndicator='Step 2 of 3'
        onBack={onBack}
        onClose={onClose}
        title='Fallback Title'
      />,
    )

    expect(screen.getByText('Fallback Title')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Step 2 of 3'}))
    fireEvent.click(screen.getByRole('button', {name: 'Close popover'}))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a model-based header with eyebrow, accent, action, and icon override', () => {
    const onClose = vi.fn()
    const onAction = vi.fn()

    render(
      <PopoverHeader
        header={{
          action: {label: 'Open', onClick: onAction, title: 'Open details'},
          accent: <span>Accent</span>,
          eyebrow: <span>Eyebrow</span>,
          icon: <img alt='Header Icon' src='header-icon.png' />,
          title: 'Modeled Title',
          titleClassName: 'custom-title',
        }}
        icon={<img alt='Fallback Icon' src='fallback-icon.png' />}
        onClose={onClose}
      />,
    )

    expect(screen.getByText('Eyebrow')).toBeInTheDocument()
    expect(screen.getByText('Modeled Title')).toHaveClass('custom-title')
    expect(screen.getByText('Accent')).toBeInTheDocument()
    expect(screen.getByAltText('Header Icon')).toBeInTheDocument()
    expect(screen.queryByAltText('Fallback Icon')).toBeNull()

    fireEvent.click(screen.getByRole('button', {name: 'Open'}))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('disables the depth indicator when no back handler exists', () => {
    render(<PopoverHeader depthIndicator='Step 1 of 1' onClose={vi.fn()} title='Title' />)

    expect(screen.getByRole('button', {name: 'Step 1 of 1'})).toBeDisabled()
  })

  it('renders content and footer wrappers with their children', () => {
    const {container} = render(
      <>
        <PopoverContent className='extra-content'>
          <span>Popover body</span>
        </PopoverContent>
        <PopoverFooter>
          <span>Footer body</span>
        </PopoverFooter>
      </>,
    )

    expect(screen.getByText('Popover body')).toBeInTheDocument()
    expect(screen.getByText('Footer body')).toBeInTheDocument()
    expect(container.querySelector('.extra-content')).not.toBeNull()
  })
})
