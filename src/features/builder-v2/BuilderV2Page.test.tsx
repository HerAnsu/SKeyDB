import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import App from '@/App'
import {builderDraftStore} from '@/stores/builderDraftStore'

import {createEmptyTeamSlots} from '../builder/constants'
import {BuilderV2Page} from './BuilderV2Page'

function resizeBuilderV2Viewport(width: number, dispatchResize = true) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  if (dispatchResize) {
    window.dispatchEvent(new Event('resize'))
  }
}

afterEach(() => {
  resizeBuilderV2Viewport(1200, false)
})

describe('BuilderV2Page', () => {
  it('renders a concept-informed shell with four slots and an awakener picker', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    expect(screen.getByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /my teams/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /builder v2 armory/i})).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
    expect(screen.getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
  })

  it('renders an adaptive workbench instead of the mobile app or desktop armory at tablet widths', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    expect(screen.getByRole('region', {name: /adaptive workbench/i})).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /mobile team overview/i})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', {name: /builder v2 armory/i}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /open adaptive picker/i})).toBeInTheDocument()
    expect(screen.getByRole('group', {name: /adaptive teams/i})).toBeInTheDocument()
  })

  it('switches teams through the adaptive compact team rail', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    const adaptiveTeams = screen.getByRole('group', {name: /adaptive teams/i})
    fireEvent.click(within(adaptiveTeams).getByRole('button', {name: /02 team 2 1 \/ 4 deployed/i}))

    expect(screen.getByRole('heading', {level: 2, name: /team 2/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - awakener/i)).toBeInTheDocument()
  })

  it('opens an adaptive picker drawer with search focus and Escape focus return', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const pickerTrigger = screen.getByRole('button', {name: /open adaptive picker/i})
    fireEvent.click(screen.getByRole('button', {name: /^select slot 2$/i}))
    fireEvent.click(pickerTrigger)

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    expect(drawer).toBeInTheDocument()
    expect(drawer.parentElement).toHaveClass('builder-v2-adaptive-picker-backdrop')
    expect(document.querySelector('.builder-v2-adaptive-workbench')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(screen.queryByRole('dialog', {name: /adaptive picker/i})).not.toBeInTheDocument()
    expect(pickerTrigger).toHaveFocus()
  })

  it('opens the adaptive picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /open adaptive picker/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 2$/i}))
    fireEvent.click(screen.getByRole('button', {name: /open adaptive picker/i}))

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toHaveFocus()
  })

  it('keeps the adaptive picker open and surfaces violations when an assignment target is invalid', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /open adaptive picker/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByRole('alert')).toHaveTextContent(/wheels require an awakener/i)
  })

  it('keeps the adaptive picker open when an awakened slot has no empty wheel target', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const fullWheelSlots = createEmptyTeamSlots()
    fullWheelSlots[0] = {
      ...fullWheelSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
      wheels: ['wheel-0050', 'wheel-0051'],
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [{id: 'team-1', name: 'Team 1', slots: fullWheelSlots}],
      })
    })

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /open adaptive picker/i}))

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    fireEvent.click(within(drawer).getByRole('tab', {name: /^wheels$/i}))
    fireEvent.click(within(drawer).getByRole('button', {name: /signal through silence/i}))

    expect(screen.getByRole('dialog', {name: /adaptive picker/i})).toBeInTheDocument()
    expect(within(drawer).getByRole('alert')).toHaveTextContent(
      /select a wheel slot or an awakened slot/i,
    )
  })

  it('renders the mobile overview and enters the focused slot builder', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    expect(screen.getByRole('region', {name: /mobile team overview/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))

    expect(screen.getByRole('region', {name: /mobile focused builder/i})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick awakener for slot 2/i})).toBeInTheDocument()
  })

  it('opens the mobile picker drawer from a focused slot and focuses search', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))

    const drawer = screen.getByRole('dialog', {name: /pick awakener for slot 2/i})
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()
    expect(screen.getByText(/editing slot 2 - awakener/i)).toBeInTheDocument()
  })

  it('opens the mobile picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 1 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 1/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /pick wheel 2 for goliath/i}))

    const drawer = screen.getByRole('dialog', {name: /pick wheel 2 for goliath/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toHaveFocus()
    expect(screen.getByText(/editing slot 1 - wheel 2/i)).toBeInTheDocument()
  })

  it('closes the mobile picker drawer with Escape and returns focus to the invoking target', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 3 builder/i}))
    const pickerTrigger = screen.getByRole('button', {name: /pick awakener for slot 3/i})
    fireEvent.click(pickerTrigger)

    expect(screen.getByRole('dialog', {name: /pick awakener for slot 3/i})).toBeInTheDocument()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(
      screen.queryByRole('dialog', {name: /pick awakener for slot 3/i}),
    ).not.toBeInTheDocument()
    expect(pickerTrigger).toHaveFocus()
  })

  it('keeps the same mobile target when reopening a picker after closing it', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))
    fireEvent.keyDown(document, {key: 'Escape'})
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick wheel 1 for goliath/i})).toBeInTheDocument()
  })

  it('syncs the mobile focused slot when quick lineup advances to the next slot', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 1/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick wheel 1 for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick wheel 2 for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /tablet of scriptures/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick covenant for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina/i}))

    expect(screen.getByText(/step 5 \/ 17: slot 2 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick awakener for slot 2/i})).toBeInTheDocument()

    const lineupControls = screen.getByLabelText(/mobile quick lineup controls/i)

    fireEvent.click(within(lineupControls).getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 4 \/ 17: slot 1 - covenant/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()

    fireEvent.click(within(lineupControls).getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 5 \/ 17: slot 2 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
  })

  it('selects a slot and assigns an awakener there', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 3$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    const slot3 = screen.getByText('Slot 3').closest('article')
    if (!slot3) {
      throw new Error('Expected slot 3 article to render')
    }
    expect(within(slot3).getByText(/^Goliath$/)).toBeInTheDocument()
    expect(screen.getByText(/editing slot 3 - awakener/i)).toBeInTheDocument()
  })

  it('removes an assigned awakener from a slot', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /remove goliath/i}))

    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
  })

  it('assigns and clears wheel and covenant loadout targets', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const slot1 = screen.getByText('Slot 1').closest('article')
    if (!slot1) {
      throw new Error('Expected slot 1 article to render')
    }
    expect(within(slot1).getByText(/merciful nurturing/i)).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 wheel 1/i}))
    expect(within(slot1).queryByText(/merciful nurturing/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 covenant$/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina/i}))
    expect(within(slot1).getByText(/deus ex machina/i)).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 covenant/i}))
    expect(within(slot1).queryByText(/deus ex machina/i)).not.toBeInTheDocument()
  })

  it('assigns and clears the team posse target', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /select team posse/i}))
    fireEvent.click(screen.getByRole('button', {name: /taverns opening/i}))

    expect(screen.getByRole('button', {name: /clear posse/i})).toBeInTheDocument()
    expect(screen.getByText(/editing team 1 - posse/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /clear posse/i}))

    expect(screen.queryByRole('button', {name: /clear posse/i})).not.toBeInTheDocument()
  })

  it('drives quick lineup through visible V2 controls and picker tabs', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    expect(screen.getByText(/step 1 \/ 17: slot 1 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^wheels$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 3 \/ 17: slot 1 - wheel 2/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
  })

  it('cancels quick lineup and restores the original V2 team', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /cancel quick team lineup/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
    expect(screen.queryByText(/step 1 \/ 17/i)).not.toBeInTheDocument()
  })

  it('is reachable through /builder-v2 without adding a nav link', async () => {
    render(
      <MemoryRouter initialEntries={['/builder-v2']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    expect(within(desktopNav).queryByRole('link', {name: /builder v2/i})).not.toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', {name: /^builder$/i})).toBeInTheDocument()
  })
})
