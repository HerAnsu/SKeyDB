import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {renderTrailEntry, type TrailEntryRenderContext} from './popover-renderers'

const skillPopoverSpy = vi.fn()
const tagPopoverSpy = vi.fn()
const scalingPopoverSpy = vi.fn()

vi.mock('../entries/SkillPopover', () => ({
  SkillPopover: (props: {name: string}) => {
    skillPopoverSpy(props)
    return <div>Skill Renderer {props.name}</div>
  },
}))

vi.mock('../entries/TagPopover', () => ({
  TagPopover: (props: {tag: {label: string}}) => {
    tagPopoverSpy(props)
    return <div>Tag Renderer {props.tag.label}</div>
  },
}))

vi.mock('../entries/ScalingPopover', () => ({
  ScalingPopover: (props: {values: number[]}) => {
    scalingPopoverSpy(props)
    return <div>Scaling Renderer {props.values.join('/')}</div>
  },
}))

const RENDER_CONTEXT: TrailEntryRenderContext = {
  cardNames: new Set(['Strike']),
  depth: 1,
  onBack: undefined,
  onClose: vi.fn(),
  onNavigateToCards: undefined,
  openNestedScalingTrail: vi.fn(),
  openNestedSkillTrail: vi.fn(),
  openNestedTagTrail: vi.fn(),
  skillLevel: 2,
  sourceIndex: 0,
  stats: null,
  totalDepth: 1,
}

describe('popover-renderers', () => {
  it('routes skill entries through the skill renderer', () => {
    skillPopoverSpy.mockClear()

    render(
      renderTrailEntry(
        {
          key: 'skill:strike',
          kind: 'skill',
          name: 'Strike',
          label: 'C1',
          description: 'desc',
        },
        RENDER_CONTEXT,
      ),
    )

    expect(screen.getByText('Skill Renderer Strike')).toBeInTheDocument()
    expect(skillPopoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cardNames: RENDER_CONTEXT.cardNames,
        depth: 1,
        label: 'C1',
        name: 'Strike',
        onBack: undefined,
        onClose: RENDER_CONTEXT.onClose,
        skillLevel: 2,
        stats: null,
        totalDepth: 1,
      }),
    )
  })

  it('routes tag entries through the tag renderer', () => {
    tagPopoverSpy.mockClear()

    render(
      renderTrailEntry(
        {
          key: 'tag:weakness',
          kind: 'tag',
          tag: {
            key: 'weakness',
            label: 'Weakness',
            description: 'desc',
            iconId: 'UI_Battle_White_Buff_001',
            aliases: [],
          },
        },
        RENDER_CONTEXT,
      ),
    )

    expect(screen.getByText('Tag Renderer Weakness')).toBeInTheDocument()
    expect(tagPopoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cardNames: RENDER_CONTEXT.cardNames,
        depth: 1,
        onBack: undefined,
        onClose: RENDER_CONTEXT.onClose,
        skillLevel: 2,
        stats: null,
        totalDepth: 1,
      }),
    )
  })

  it('routes scaling entries through the scaling renderer', () => {
    scalingPopoverSpy.mockClear()

    render(
      renderTrailEntry(
        {
          key: 'scaling:atk:10/20',
          kind: 'scaling',
          values: [10, 20],
          suffix: '%',
          stat: 'ATK',
        },
        RENDER_CONTEXT,
      ),
    )

    expect(screen.getByText('Scaling Renderer 10/20')).toBeInTheDocument()
    expect(scalingPopoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLevel: 2,
        depth: 1,
        onBack: undefined,
        onClose: RENDER_CONTEXT.onClose,
        stat: 'ATK',
        stats: null,
        suffix: '%',
        totalDepth: 1,
        values: [10, 20],
      }),
    )
  })

  it('uses sourceIndex to zero out nested scaling current level and passes navigation action to skills', () => {
    skillPopoverSpy.mockClear()
    scalingPopoverSpy.mockClear()

    const nestedContext: TrailEntryRenderContext = {
      ...RENDER_CONTEXT,
      onBack: vi.fn(),
      onNavigateToCards: vi.fn(),
      sourceIndex: 2,
    }

    render(
      <>
        {renderTrailEntry(
          {
            key: 'skill:guard',
            kind: 'skill',
            name: 'Guard',
            label: 'C2',
            description: 'guard',
          },
          nestedContext,
        )}
        {renderTrailEntry(
          {
            key: 'scaling:def:5/10',
            kind: 'scaling',
            values: [5, 10],
            suffix: '%',
            stat: 'DEF',
          },
          nestedContext,
        )}
      </>,
    )

    expect(skillPopoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        onBack: nestedContext.onBack,
        onNavigateToCards: nestedContext.onNavigateToCards,
      }),
    )
    expect(scalingPopoverSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLevel: 0,
        onBack: nestedContext.onBack,
      }),
    )
  })
})
