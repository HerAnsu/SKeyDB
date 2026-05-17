import {useState} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {CatalogMobileFilterGroup, type CatalogMobileFilterGroupItem} from './DatabaseChipPrimitives'

const groups = [
  {
    activeId: 'ALL',
    defaultId: 'ALL',
    key: 'rarity',
    label: 'Rarity',
    onChange: vi.fn(),
    options: [
      {id: 'ALL', label: 'All', summaryLabel: 'All'},
      {id: 'SSR', label: 'SSR', summaryLabel: 'SSR'},
    ],
  },
  {
    activeId: 'ALL',
    defaultId: 'ALL',
    key: 'source',
    label: 'Source',
    onChange: vi.fn(),
    options: [
      {id: 'ALL', label: 'All', summaryLabel: 'All'},
      {id: 'WHEEL', label: 'Wheel', summaryLabel: 'Wheel'},
    ],
  },
] satisfies CatalogMobileFilterGroupItem<'rarity' | 'source'>[]

function MobileFilterGroupHarness() {
  const [openKey, setOpenKey] = useState<'rarity' | 'source' | null>(null)

  return <CatalogMobileFilterGroup groups={groups} onOpenKeyChange={setOpenKey} openKey={openKey} />
}

describe('CatalogMobileFilterGroup', () => {
  it('keeps one mobile filter panel open and wires toggle controls to panels', () => {
    render(<MobileFilterGroupHarness />)

    const rarityToggle = screen.getByRole('button', {name: /Rarity\s*All/})
    const sourceToggle = screen.getByRole('button', {name: /Source\s*All/})

    expect(rarityToggle).toHaveAttribute('aria-expanded', 'false')
    expect(sourceToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', {name: 'Rarity filter options'})).not.toBeInTheDocument()

    fireEvent.click(rarityToggle)

    const rarityPanel = screen.getByRole('group', {name: 'Rarity filter options'})
    expect(rarityToggle).toHaveAttribute('aria-expanded', 'true')
    expect(rarityToggle).toHaveAttribute('aria-controls', rarityPanel.id)
    expect(sourceToggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(sourceToggle)

    const sourcePanel = screen.getByRole('group', {name: 'Source filter options'})
    expect(screen.queryByRole('group', {name: 'Rarity filter options'})).not.toBeInTheDocument()
    expect(sourceToggle).toHaveAttribute('aria-expanded', 'true')
    expect(sourceToggle).toHaveAttribute('aria-controls', sourcePanel.id)

    fireEvent.click(screen.getByRole('button', {name: 'Wheel'}))

    expect(groups[1].onChange).toHaveBeenCalledWith('WHEEL')
  })
})
