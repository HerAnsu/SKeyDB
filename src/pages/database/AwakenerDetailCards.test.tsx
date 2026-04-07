import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull} from '@/domain/awakeners-full'

import {AwakenerDetailCards} from './AwakenerDetailCards'

vi.mock('./DetailSection', () => ({
  DetailSection: ({title, items}: {title: string; items: {label: string; name: string}[]}) => (
    <div>
      <h4>{title}</h4>
      {items.map((item) => (
        <div key={`${item.label}-${item.name}`}>
          {item.label}: {item.name}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('./RichDescription', () => ({
  RichDescription: ({text}: {text: string}) => <span>{text}</span>,
}))

vi.mock('@/domain/relics', () => ({
  getPortraitRelicByAwakenerIngameId: () => null,
}))

vi.mock('@/domain/relic-assets', () => ({
  getRelicPortraitAssetByAssetId: () => null,
}))

const TEST_AWAKENER: Awakener = {
  id: 1,
  ingameId: '101',
  name: 'salvador',
  realm: 'AEQUOR',
  faction: 'Test',
  type: 'ASSAULT',
  rarity: 'SSR',
  aliases: ['salvador'],
  tags: [],
}

const TEST_FULL_DATA: AwakenerFull = {
  id: 1,
  name: 'salvador',
  stats: {
    CON: '100',
    ATK: '100',
    DEF: '100',
    CritRate: '5%',
    CritDamage: '50%',
    AliemusRegen: '0',
    KeyflareRegen: '0',
    RealmMastery: '0',
    SigilYield: '0%',
    DamageAmplification: '0%',
    DeathResistance: '0%',
  },
  primaryScalingBase: 20,
  statScaling: {
    CON: 1,
    ATK: 1,
    DEF: 1,
  },
  substatScaling: {},
  exalts: {
    exalt: {name: 'Exalt Name', description: 'Exalt description'},
    over_exalt: {name: 'Over Exalt Name', description: 'Over exalt description'},
  },
  cards: {
    C1: {name: 'First Card', cost: '2', description: 'First card description'},
    C2: {name: 'Second Card', cost: '3', description: 'Second card description'},
  },
  talents: {},
  enlightens: {},
}

describe('AwakenerDetailCards', () => {
  it('renders a loading state while full card data is absent', () => {
    render(
      <AwakenerDetailCards
        awakener={TEST_AWAKENER}
        cardNames={new Set()}
        fullData={null}
        skillLevel={1}
        stats={null}
      />,
    )

    expect(screen.getByText('Loading card data...')).toBeInTheDocument()
  })

  it('renders exalt items and command card meta labels', () => {
    render(
      <AwakenerDetailCards
        awakener={TEST_AWAKENER}
        cardNames={new Set(['First Card', 'Second Card'])}
        fullData={TEST_FULL_DATA}
        skillLevel={1}
        stats={TEST_FULL_DATA.stats}
      />,
    )

    expect(screen.getByText('Exalts')).toBeInTheDocument()
    expect(screen.getByText('Exalt: Exalt Name')).toBeInTheDocument()
    expect(screen.getByText('Over Exalt: Over Exalt Name')).toBeInTheDocument()
    expect(screen.getByText('Command Cards')).toBeInTheDocument()
    expect(screen.getByText('First Card')).toBeInTheDocument()
    expect(screen.getByText('Second Card')).toBeInTheDocument()
    expect(screen.getByText('Rouse')).toBeInTheDocument()
    expect(screen.getByText('C2')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('First card description')).toBeInTheDocument()
    expect(screen.getByText('Second card description')).toBeInTheDocument()
    expect(screen.getByText('Dimensional Image')).toBeInTheDocument()
  })
})
