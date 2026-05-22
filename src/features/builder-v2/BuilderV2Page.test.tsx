import {fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import App from '@/App'

import {BuilderV2Page} from './BuilderV2Page'

describe('BuilderV2Page', () => {
  it('renders a concept-informed shell with four slots and an awakener picker', () => {
    render(<BuilderV2Page />)

    expect(screen.getByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /my teams/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /builder v2 armory/i})).toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
    expect(screen.getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
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
