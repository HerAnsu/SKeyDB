import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseReferenceLayer} from '@/domain/awakeners-database-view'

import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {useDatabasePopoverController} from './useDatabasePopoverController'

function buildReferenceLayer(
  description: string,
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null = null,
): ResolvedAwakenerDatabaseReferenceLayer {
  return {
    cardNames: new Set<string>(),
    accessibleOverlays: [],
    referenceInfoByName: new Map([
      [
        'strike',
        {
          kind: 'skill',
          id: 'skill.test.strike',
          name: 'Strike',
          label: 'Card · C2 · Cost 1',
          record: {
            id: 'skill.test.strike',
            ownerAwakenerId: 999,
            kind: 'strike',
            displayName: 'Strike',
            descriptionTemplate: description,
            descriptionArgs: {},
            cardKeywords: [],
            variants: [],
          },
          description,
          keywordFooterText: undefined,
          descriptionRank: 1,
          descriptionMaxRank: 6,
          influencingEnlightenSlots: [],
          influencingTalentIds: [],
          influenceBadges: selectedEnlightenSlot
            ? [
                {
                  kind: 'enlighten',
                  id: `enlighten.test.${selectedEnlightenSlot.toLowerCase()}`,
                  label: selectedEnlightenSlot,
                  referenceName: `Enlighten ${selectedEnlightenSlot}`,
                  slot: selectedEnlightenSlot,
                },
              ]
            : [],
        },
      ],
    ]),
    referenceInfoById: new Map([
      [
        'skill.test.strike',
        {
          kind: 'skill',
          id: 'skill.test.strike',
          name: 'Strike',
          label: 'Card · C2 · Cost 1',
          record: {
            id: 'skill.test.strike',
            ownerAwakenerId: 999,
            kind: 'strike',
            displayName: 'Strike',
            descriptionTemplate: description,
            descriptionArgs: {},
            cardKeywords: [],
            variants: [],
          },
          description,
          keywordFooterText: undefined,
          descriptionRank: 1,
          descriptionMaxRank: 6,
          influencingEnlightenSlots: [],
          influencingTalentIds: [],
          influenceBadges: selectedEnlightenSlot
            ? [
                {
                  kind: 'enlighten',
                  id: `enlighten.test.${selectedEnlightenSlot.toLowerCase()}`,
                  label: selectedEnlightenSlot,
                  referenceName: `Enlighten ${selectedEnlightenSlot}`,
                  slot: selectedEnlightenSlot,
                },
              ]
            : [],
        },
      ],
    ]),
    overlayByName: new Map(),
  } as unknown as ResolvedAwakenerDatabaseReferenceLayer
}

function ControllerHarness({
  referenceLayer,
  selectedEnlightenSlot = null,
}: {
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
}) {
  const popoverController = useDatabasePopoverController({referenceLayer, selectedEnlightenSlot})

  return (
    <>
      <button
        onClick={(event) => {
          popoverController.contextValue.openRootReferenceByName('Strike', event)
        }}
        type='button'
      >
        Open Strike
      </button>
      <DatabasePopoverRoot {...popoverController.popoverRootProps} />
    </>
  )
}

describe('useDatabasePopoverController', () => {
  it('live updates open popovers when the database view changes', async () => {
    const {rerender} = render(
      <ControllerHarness referenceLayer={buildReferenceLayer('Base text.')} />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'Open Strike'}))
    expect(await screen.findByText('Base text.')).toBeInTheDocument()

    rerender(
      <ControllerHarness
        referenceLayer={buildReferenceLayer('E1 text.', 'E1')}
        selectedEnlightenSlot='E1'
      />,
    )

    expect(screen.queryByText('Base text.')).not.toBeInTheDocument()
    expect(await screen.findByText('E1 text.')).toBeInTheDocument()
    expect(await screen.findByText('E1')).toBeInTheDocument()
  })
})
