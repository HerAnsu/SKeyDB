import {render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {DzoneResolvedMonster, DzoneResolvedWave} from '@/domain/dzone'

import {toDZoneAccessibleText} from './d-zone-display-text'
import type {DZoneRelicPreview} from './d-zone-view-model'
import {DZoneWaveCard} from './DZoneWaveCard'

const relics: DZoneRelicPreview[] = [
  {id: 'relic-9001', name: '@1 Shared Sigil'},
  {id: 'relic-9002', name: '@2 Visible Charm'},
  {id: 'relic-9003', name: '@3 Overflow Relic'},
]

const monsters: DzoneResolvedMonster[] = Array.from({length: 11}, (_, index) => {
  const monsterNumber = index + 1
  const redactionLevel = (index % 4) + 1

  return {
    id: `dzone-monster-${monsterNumber.toString().padStart(4, '0')}`,
    name: `@${redactionLevel.toString()} Monster ${monsterNumber.toString()}`,
    characteristicIds: [],
    characteristics: [],
    descriptionTemplate: 'Test monster',
    assetName: `monster-${monsterNumber.toString()}.png`,
  }
})

const wave: DzoneResolvedWave = {
  id: 'wave-1',
  name: 'Wave 1',
  initialRelicIds: relics.map((relic) => relic.id),
  monsters,
}

function renderWaveCard(expanded: boolean) {
  return render(
    <DZoneWaveCard
      expanded={expanded}
      getMonsterAsset={() => undefined}
      onExpandedChange={vi.fn()}
      onMonsterOpen={vi.fn()}
      onRelicOpen={vi.fn()}
      relics={relics}
      wave={wave}
    />,
  )
}

describe('toDZoneAccessibleText', () => {
  it('strips lore markers and normalizes accessible display text', () => {
    expect(toDZoneAccessibleText('@1  Marked @4 Name')).toBe('Marked Name')
  })
})

describe('DZoneWaveCard', () => {
  it('keeps collapsed overflow relic buttons out of keyboard and accessibility reach', () => {
    renderWaveCard(false)

    const card = screen.getByRole('article', {name: 'Wave 1'})
    expect(
      within(card).getByRole('button', {name: 'View Wave 1 relic details for Shared Sigil'}),
    ).not.toHaveAttribute('tabIndex')
    expect(
      within(card).getByRole('button', {name: 'View Wave 1 relic details for Visible Charm'}),
    ).not.toHaveAttribute('tabIndex')
    expect(
      within(card).queryByRole('button', {name: 'View Wave 1 relic details for Overflow Relic'}),
    ).toBe(null)

    const overflowButton = within(card).getByTitle('Overflow Relic')
    expect(overflowButton).toHaveAttribute('aria-hidden', 'true')
    expect(overflowButton).toHaveAttribute('tabIndex', '-1')
  })

  it('shows all relic and monster buttons when expanded', () => {
    renderWaveCard(true)

    const card = screen.getByRole('article', {name: 'Wave 1'})
    expect(within(card).getAllByRole('button', {name: /View Wave 1 relic details/})).toHaveLength(
      relics.length,
    )
    expect(
      within(card).getByRole('button', {name: 'View Wave 1 relic details for Overflow Relic'}),
    ).not.toHaveAttribute('tabIndex')
    expect(within(card).getAllByRole('button', {name: /View Wave 1 monster details/})).toHaveLength(
      monsters.length,
    )
  })

  it('keeps the collapsed monster limit at ten', () => {
    renderWaveCard(false)

    const card = screen.getByRole('article', {name: 'Wave 1'})
    expect(within(card).getAllByRole('button', {name: /View Wave 1 monster details/})).toHaveLength(
      10,
    )
  })
})
