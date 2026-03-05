import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Awakener } from '../../domain/awakeners'
import { AwakenerDetailModal } from './AwakenerDetailModal'

vi.mock('../../domain/awakeners-full', () => ({
  loadAwakenersFull: async () => [
    {
      id: 1,
      cards: {},
      exalts: { exalt: { name: 'Exalt', description: 'x' }, over_exalt: { name: 'Over Exalt', description: 'x' } },
      talents: {},
      enlightens: {},
    },
    {
      id: 2,
      cards: {},
      exalts: { exalt: { name: 'Exalt', description: 'x' }, over_exalt: { name: 'Over Exalt', description: 'x' } },
      talents: {},
      enlightens: {},
    },
  ],
  getAwakenerFullById: (id: number, data: Array<{ id: number }>) => data.find((entry) => entry.id === id) ?? null,
}))

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerPortraitAsset: () => null,
}))

vi.mock('../../domain/rich-text', () => ({
  getCardNamesFromFull: () => new Set<string>(),
}))

vi.mock('../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('../../domain/factions', () => ({
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmTint: () => '#ffffff',
}))

vi.mock('./AwakenerDetailSidebar', () => ({
  AwakenerDetailSidebar: () => <div>Sidebar</div>,
}))

vi.mock('./AwakenerDetailOverview', () => ({
  AwakenerDetailOverview: () => <div>Overview Tab</div>,
}))

vi.mock('./AwakenerDetailCards', () => ({
  AwakenerDetailCards: () => <div>Cards Tab</div>,
}))

vi.mock('./AwakenerGuideTab', () => ({
  AwakenerGuideTab: () => <div>Guide Tab</div>,
}))

vi.mock('./AwakenerTeamsTab', () => ({
  AwakenerTeamsTab: () => <div>Teams Tab</div>,
}))

vi.mock('./SkillLevelSlider', () => ({
  SkillLevelSlider: () => <div>Skill Slider</div>,
}))

function makeAwakener(id: number, name: string): Awakener {
  return {
    id,
    name,
    realm: 'AEQUOR',
    faction: 'Test',
    type: 'ASSAULT',
    rarity: 'SSR',
    aliases: [name],
    tags: [],
  }
}

describe('AwakenerDetailModal', () => {
  it('resets active tab to overview when switching awakeners', async () => {
    const onClose = vi.fn()
    const first = makeAwakener(1, 'alpha')
    const second = makeAwakener(2, 'beta')

    const { rerender } = render(<AwakenerDetailModal awakener={first} key={first.id} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cards' }))
    expect(screen.getByRole('button', { name: 'Cards' }).className).toContain('border-amber-200/70')

    rerender(<AwakenerDetailModal awakener={second} key={second.id} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Overview' }).className).toContain('border-amber-200/70')
    })
  })
})
