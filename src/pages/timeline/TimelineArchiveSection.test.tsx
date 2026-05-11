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

describe('TimelineArchiveSection', () => {
  it('keeps archive content mounted while toggling motion and focus state', () => {
    render(<ArchiveSectionHarness />)

    const toggle = screen.getByRole('button', {name: /ended banners/i})
    const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '')

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(content).toHaveClass('timeline-archive-motion')
    expect(content).toHaveAttribute('aria-hidden', 'true')
    expect(content).toHaveAttribute('inert')
    expect(screen.getByRole('button', {name: 'Archived banner', hidden: true})).toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(content).toHaveAttribute('aria-hidden', 'false')
    expect(content).not.toHaveAttribute('inert')
    expect(content).toHaveAttribute('data-expanded', 'true')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(content).toHaveAttribute('aria-hidden', 'true')
    expect(content).toHaveAttribute('inert')
    expect(content).toHaveAttribute('data-expanded', 'false')
  })
})
