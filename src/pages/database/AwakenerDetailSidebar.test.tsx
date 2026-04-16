import {render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'

import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

vi.mock('../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('../../domain/mainstats', () => ({
  getMainstatIcon: () => null,
}))

const TEST_AWAKENER: Awakener = {
  id: 1,
  name: 'thais',
  realm: 'AEQUOR',
  faction: 'Test',
  type: 'ASSAULT',
  rarity: 'SSR',
  aliases: ['thais'],
  tags: [],
}

const TEST_STATS: FullStats = {
  CON: '140',
  ATK: '135',
  DEF: '126',
  CritRate: '14.6%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '15',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
}

const TEST_SUBSTAT_SCALING: SubstatScaling = {
  CritRate: '1.6%',
}

const TEST_CONTROLS: AwakenerDatabaseControls = {
  enlightenOptions: [
    {value: null, label: 'E0'},
    {value: 'E1', label: 'E1'},
    {value: 'E2', label: 'E2'},
    {value: 'E3', label: 'E3'},
  ],
  canAdjustPsycheSurge: true,
  psycheSurgeOffsetMin: 0,
  psycheSurgeOffsetMax: 12,
  hasSoulforgeTalent: false,
  skillLevelMin: 1,
  skillLevelMax: 6,
  soulforgeLevelMin: null,
  soulforgeLevelMax: null,
}

const TEST_SELECTION: AwakenerDatabaseSelection = {
  awakenerLevel: 60,
  psycheSurgeOffset: 0,
  skillLevel: 1,
  selectedEnlightenSlot: null,
  soulforgeLevel: 0,
}

describe('AwakenerDetailSidebar', () => {
  it('keeps the level label in the slider, shows the Psyche Surge stepper, and exposes substat scaling on hover', () => {
    render(
      <AwakenerDetailSidebar
        awakener={TEST_AWAKENER}
        controls={TEST_CONTROLS}
        onPatchSelection={vi.fn()}
        selection={TEST_SELECTION}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByRole('heading', {name: 'Attributes'})).toBeInTheDocument()
    expect(screen.queryByText('(Lv. 60)')).not.toBeInTheDocument()
    expect(screen.getByText('E3+0')).toBeInTheDocument()

    expect(screen.getByText('140')).toHaveClass('text-slate-200')
    expect(screen.getByText('14.6%')).toHaveClass('text-slate-200')
    expect(screen.getByTitle('Level scaling: +1.6% per 10 levels to Lv. 60')).toHaveTextContent(
      '14.6%',
    )
    expect(screen.getByText(/psyche surge bonuses shown from e3\+0 to e3\+12/i)).toBeInTheDocument()
  })

  it('shows attributes before progression in compact mode', () => {
    const {container} = render(
      <AwakenerDetailSidebar
        compact
        awakener={TEST_AWAKENER}
        controls={TEST_CONTROLS}
        onPatchSelection={vi.fn()}
        selection={TEST_SELECTION}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    const panels = Array.from(container.querySelectorAll('.border.border-slate-600\\/30'))
    expect(panels).toHaveLength(2)
    expect(
      within(panels[0] as HTMLElement).getByRole('heading', {name: 'Attributes'}),
    ).toBeInTheDocument()
    expect(
      within(panels[1] as HTMLElement).getByRole('heading', {name: 'Progression'}),
    ).toBeInTheDocument()
  })
})
