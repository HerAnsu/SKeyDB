import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {DZoneHistoryPage} from './DZoneHistoryPage'

function renderHistoryPage() {
  return render(
    <MemoryRouter>
      <DZoneHistoryPage />
    </MemoryRouter>,
  )
}

function getDrawerCloseButton() {
  const closeButton = screen
    .getAllByRole('button', {name: 'Close season browser'})
    .find((button) => button.classList.contains('d-zone-history-drawer-close'))

  if (!(closeButton instanceof HTMLButtonElement)) {
    throw new Error('Expected drawer close button to render.')
  }

  return closeButton
}

function getDrawerBackdropButton() {
  const backdropButton = screen
    .getAllByRole('button', {name: 'Close season browser'})
    .find((button) => button.classList.contains('d-zone-history-drawer-backdrop'))

  if (!(backdropButton instanceof HTMLButtonElement)) {
    throw new Error('Expected drawer backdrop button to render.')
  }

  return backdropButton
}

function installWaveCardLayoutMock() {
  const originalGetBoundingClientRect = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'getBoundingClientRect',
  )
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
  )

  HTMLElement.prototype.getBoundingClientRect = function getMockBoundingClientRect(
    this: HTMLElement,
  ): DOMRect {
    const inlineHeight = Number.parseFloat(this.style.height)
    const height = this.classList.contains('d-zone-wave-card')
      ? Number.isFinite(inlineHeight)
        ? inlineHeight
        : this.classList.contains('d-zone-wave-card--expanded')
          ? 328
          : 96
      : 0

    return new DOMRect(0, 0, 100, height)
  }

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: function getMockOffsetHeight(this: HTMLElement) {
      return Math.round(this.getBoundingClientRect().height)
    },
  })

  return () => {
    if (originalGetBoundingClientRect) {
      Object.defineProperty(
        HTMLElement.prototype,
        'getBoundingClientRect',
        originalGetBoundingClientRect,
      )
    }
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
    }
  }
}

function installMatchMediaMock() {
  const originalMatchMedia = window.matchMedia

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  })

  return () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    })
  }
}

describe('DZoneHistoryPage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the archive selector with the current season selected', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-12T00:00:00Z'))

    renderHistoryPage()

    expect(screen.getByRole('heading', {level: 1, name: 'D-Zone Archive'})).toBeInTheDocument()
    expect(
      screen.getAllByText('Inspect past seasons, their stage lineups and relics.'),
    ).toHaveLength(2)

    const currentSeasonButton = screen.getByRole('button', {name: /Select Season 60/i})
    expect(currentSeasonButton).toHaveAttribute('aria-current', 'true')
    expect(within(currentSeasonButton).getByText('Season 60')).toBeInTheDocument()
    expect(
      within(currentSeasonButton).getByRole('img', {name: 'Aequor Ring realm'}),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: 'Season 60'})).toBeInTheDocument()
    expect(screen.getByRole('region', {name: 'Season 60 inspector'})).toHaveClass(
      'd-zone-season-inspector--realm-aequor',
    )
    expect(
      screen.getByText('Aequor Ring', {selector: '.d-zone-stage-chip-label'}),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Astral Reign', {selector: '.d-zone-stage-chip-label'}),
    ).toBeInTheDocument()

    const waveOneToggle = screen.getByRole('button', {name: 'Collapse Wave 1'})
    const waveTwoToggle = screen.getByRole('button', {name: 'Expand Wave 2'})
    expect(waveOneToggle).toHaveAttribute('aria-expanded', 'true')
    expect(waveTwoToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('button', {name: /Expand Wave/i})).toHaveLength(4)

    const waveTwo = screen.getByRole('article', {name: 'Wave 2'})
    expect(
      within(waveTwo).getByRole('heading', {level: 3, name: 'Initial Relics'}),
    ).toBeInTheDocument()
    expect(within(waveTwo).getByRole('heading', {level: 3, name: 'Monsters'})).toBeInTheDocument()
    expect(waveTwo.querySelector('.d-zone-monster-grid')).toHaveClass(
      'd-zone-monster-grid--overflowing',
    )
    expect(
      screen.getByRole('article', {name: 'Wave 3'}).querySelector('.d-zone-monster-grid'),
    ).not.toHaveClass('d-zone-monster-grid--overflowing')
    const waveTwoRelicButtons = within(waveTwo).getAllByRole('button', {
      name: /View Wave 2 relic details/i,
    })
    expect(waveTwoRelicButtons[1]).toHaveClass('d-zone-relic-button--compact')
    fireEvent.click(waveTwoToggle)
    expect(waveTwoToggle).toHaveAttribute('aria-expanded', 'true')
    expect(waveTwoRelicButtons[1]).not.toHaveClass('d-zone-relic-button--compact')
  })

  it('filters and selects a legacy season', () => {
    renderHistoryPage()

    fireEvent.change(screen.getByRole('searchbox', {name: /Search D-zone seasons/i}), {
      target: {value: 'season 1'},
    })

    const archivePanel = screen.getByRole('region', {name: /D-zone season archive/i})
    fireEvent.click(within(archivePanel).getByRole('button', {name: /^Select Season 1/i}))

    expect(screen.getByRole('heading', {level: 2, name: 'Season 1'})).toBeInTheDocument()
    expect(screen.getByRole('region', {name: 'Season 1 inspector'})).toHaveClass(
      'd-zone-season-inspector--realm-legacy',
    )
    expect(
      screen.getByText('Faded Legacy', {selector: '.d-zone-stage-chip-label'}),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Jan 31, 2024 - Feb 14, 2024/, {selector: '.d-zone-season-date'}),
    ).toBeInTheDocument()
    expect(screen.queryByText('Dissoluted Abyss', {selector: '.d-zone-stage-chip-label'})).toBe(
      null,
    )
  })

  it('keeps wave card height in sync after an interrupted toggle animation', () => {
    vi.useFakeTimers()
    const restoreLayoutMock = installWaveCardLayoutMock()
    const restoreMatchMediaMock = installMatchMediaMock()

    try {
      renderHistoryPage()

      const waveTwo = screen.getByRole('article', {name: 'Wave 2'})
      const waveTwoToggle = within(waveTwo).getByRole('button', {name: 'Expand Wave 2'})

      fireEvent.click(waveTwoToggle)
      expect(waveTwo).toHaveClass('d-zone-wave-card--expanded')
      expect(waveTwo).toHaveStyle({height: '328px'})

      fireEvent.click(waveTwoToggle)
      expect(waveTwo).toHaveClass('d-zone-wave-card--collapsed')
      expect(waveTwo).toHaveStyle({height: '96px'})

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(waveTwo).toHaveClass('d-zone-wave-card--collapsed')
      expect(waveTwo).not.toHaveAttribute('data-wave-motion')
      expect(waveTwo.style.height).toBe('')
      expect(within(waveTwo).getByRole('button', {name: 'Expand Wave 2'})).toHaveAttribute(
        'aria-expanded',
        'false',
      )
    } finally {
      restoreMatchMediaMock()
      restoreLayoutMock()
    }
  })

  it('opens and closes the season browser drawer from the trigger, close button, backdrop, and Escape', async () => {
    const user = userEvent.setup()
    renderHistoryPage()

    const trigger = screen.getByRole('button', {name: 'Open season browser drawer'})
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', {name: 'D-zone season archive'})).toHaveAttribute(
      'aria-modal',
      'true',
    )
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => {
      expect(getDrawerCloseButton()).toHaveFocus()
    })

    await user.click(getDrawerCloseButton())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(getDrawerBackdropButton())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    fireEvent.keyDown(document, {key: 'Escape'})
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the drawer when selecting a season', async () => {
    const user = userEvent.setup()
    renderHistoryPage()

    const trigger = screen.getByRole('button', {name: 'Open season browser drawer'})
    await user.click(trigger)

    fireEvent.change(screen.getByRole('searchbox', {name: /Search D-zone seasons/i}), {
      target: {value: 'season 1'},
    })
    await user.click(screen.getByRole('button', {name: /^Select Season 1/i}))

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('heading', {level: 2, name: 'Season 1'})).toBeInTheDocument()
  })

  it('traps Tab inside the open drawer and restores focus to the opener', async () => {
    const user = userEvent.setup()
    renderHistoryPage()

    const trigger = screen.getByRole('button', {name: 'Open season browser drawer'})
    await user.click(trigger)

    const drawerCloseButton = getDrawerCloseButton()

    await waitFor(() => {
      expect(drawerCloseButton).toHaveFocus()
    })

    await user.tab({shift: true})
    expect(document.getElementById('d-zone-history-year-2024-button')).toHaveFocus()

    await user.click(drawerCloseButton)
    expect(trigger).toHaveFocus()
  })

  it('connects year disclosure buttons to deterministic panels', () => {
    renderHistoryPage()

    const yearButton = document.getElementById('d-zone-history-year-2026-button')
    expect(yearButton).toBeInstanceOf(HTMLButtonElement)
    expect(yearButton).toHaveAttribute('id', 'd-zone-history-year-2026-button')
    expect(yearButton).toHaveAttribute('aria-controls', 'd-zone-history-year-2026-panel')

    const panel = document.getElementById('d-zone-history-year-2026-panel')
    expect(panel).toHaveAttribute('aria-labelledby', 'd-zone-history-year-2026-button')
  })
})
