import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import * as tagsModule from '@/domain/tags'

import {RichSegmentRenderer} from './RichSegmentRenderer'

const BASE_STATS: AwakenerFullStats = {
  CON: '100',
  ATK: '200',
  DEF: '80',
  CritRate: '0%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '0',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
  BaseAliemus: '100',
}

describe('RichSegmentRenderer', () => {
  it('renders interactive skill tokens and forwards click callbacks', () => {
    const onTokenNavigate = vi.fn()

    render(
      <RichSegmentRenderer
        onTokenNavigate={onTokenNavigate}
        segment={{type: 'skill', name: 'Strike'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    const button = screen.getByRole('button', {name: 'Strike'})
    expect(button).toHaveStyle({
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
    })
    expect(button).toHaveClass('font-bold')
    fireEvent.click(button)
    expect(onTokenNavigate).toHaveBeenCalledWith({
      kind: 'skill',
      name: 'Strike',
      anchorElement: expect.any(HTMLButtonElement),
    })
  })

  it('renders inline scaling using selected skill level without a hover title', () => {
    render(
      <RichSegmentRenderer
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={2}
        stats={BASE_STATS}
        variant='inline'
      />,
    )

    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('40')).not.toHaveAttribute('title')
  })

  it('renders popover scaling as full-range text', () => {
    render(
      <RichSegmentRenderer
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='popover'
      />,
    )

    expect(screen.getByText('20~40')).toBeInTheDocument()
  })

  it('allows popover scaling tokens to open nested scaling details', () => {
    const onTokenNavigate = vi.fn()

    render(
      <RichSegmentRenderer
        onTokenNavigate={onTokenNavigate}
        segment={{type: 'scaling', values: [10, 20], suffix: '%', stat: 'ATK'}}
        skillLevel={1}
        stats={BASE_STATS}
        variant='popover'
      />,
    )

    const button = screen.getByRole('button', {name: '20~40'})
    expect(button).toHaveStyle({
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
    })
    expect(button).toHaveClass('font-bold')
    fireEvent.click(button)
    expect(onTokenNavigate).toHaveBeenCalledWith({
      kind: 'scaling',
      values: [10, 20],
      suffix: '%',
      stat: 'ATK',
      anchorElement: expect.any(HTMLButtonElement),
    })
  })

  it('keeps mechanics without description non-interactive', () => {
    vi.spyOn(tagsModule, 'resolveTag').mockReturnValueOnce({
      key: 'empty-desc',
      label: 'Empty Desc',
      description: '   ',
      iconId: '',
      aliases: [],
    })

    render(
      <RichSegmentRenderer
        onTokenNavigate={vi.fn()}
        segment={{type: 'mechanic', name: 'Empty Desc'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(screen.queryByRole('button', {name: 'Empty Desc'})).toBeNull()
    expect(screen.getByText('Empty Desc').closest('[title]')).toHaveAttribute(
      'title',
      'Details coming soon',
    )
  })

  it('renders interactive mechanic tokens and forwards anchor elements instead of event-shaped objects', () => {
    const onTokenNavigate = vi.fn()
    const weaknessTag = tagsModule.resolveTag('Weakness')
    if (!weaknessTag) {
      throw new Error('Expected Weakness tag fixture to exist')
    }

    render(
      <RichSegmentRenderer
        onTokenNavigate={onTokenNavigate}
        segment={{type: 'mechanic', name: 'Weakness'}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Weakness'}))

    expect(onTokenNavigate).toHaveBeenCalledWith({
      kind: 'tag',
      tag: weaknessTag,
      anchorElement: expect.any(HTMLButtonElement),
    })
    expect(onTokenNavigate.mock.calls[0]?.[0]).not.toHaveProperty('currentTarget')
  })

  it('renders indentation marker with the expected bullet sign', () => {
    const {container} = render(
      <RichSegmentRenderer
        segment={{type: 'line', indented: true, segments: [{type: 'text', value: 'Indented text'}]}}
        skillLevel={1}
        stats={null}
        variant='inline'
      />,
    )

    expect(container).toHaveTextContent('\u2022Indented text')
    expect(container).not.toHaveTextContent('В·')
  })
})
