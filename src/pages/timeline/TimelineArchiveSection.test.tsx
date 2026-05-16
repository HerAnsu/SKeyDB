import {useState} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'

import {TimelineArchiveSection} from './TimelineArchiveSection'

function ArchiveSectionHarness() {
  const [expanded, setExpanded] = useState(false)

  return (
    <TimelineArchiveSection
      expanded={expanded}
      itemCount={2}
      onToggle={() => {
        setExpanded((current) => !current)
      }}
      title='Ended banners'
    >
      <button type='button'>Archived banner</button>
    </TimelineArchiveSection>
  )
}

function ExpandedArchiveSectionHarness() {
  return (
    <TimelineArchiveSection
      expanded
      itemCount={1}
      onToggle={() => undefined}
      title='Upcoming banners'
    >
      <button type='button'>Upcoming banner</button>
    </TimelineArchiveSection>
  )
}

describe('TimelineArchiveSection', () => {
  it('defers collapsed archive content until first expansion, then keeps it mounted', () => {
    render(<ArchiveSectionHarness />)

    const toggle = screen.getByRole('button', {name: /ended banners/i})
    const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '')

    expect(screen.queryByRole('heading', {name: /ended banners/i})).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(content).toHaveClass('timeline-archive-motion')
    expect(content).toHaveAttribute('aria-hidden', 'true')
    expect(content).toHaveAttribute('inert')
    expect(
      screen.queryByRole('button', {name: 'Archived banner', hidden: true}),
    ).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(content).toHaveAttribute('aria-hidden', 'false')
    expect(content).not.toHaveAttribute('inert')
    expect(content).toHaveAttribute('data-expanded', 'true')
    expect(screen.getByRole('button', {name: 'Archived banner'})).toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(content).toHaveAttribute('aria-hidden', 'true')
    expect(content).toHaveAttribute('inert')
    expect(content).toHaveAttribute('data-expanded', 'false')
    expect(screen.getByRole('button', {name: 'Archived banner', hidden: true})).toBeInTheDocument()
  })

  it('mounts initially expanded archive content immediately', () => {
    render(<ExpandedArchiveSectionHarness />)

    const toggle = screen.getByRole('button', {name: /upcoming banners/i})
    const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '')

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(content).toHaveAttribute('aria-hidden', 'false')
    expect(content).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', {name: 'Upcoming banner'})).toBeInTheDocument()
  })
})
