import {useCallback, useMemo} from 'react'

import {createPortal} from 'react-dom'

import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {type RichSegment} from '@/domain/rich-text'

import {type TokenNavigationRequest} from '../RichTextPopovers/core/popover-navigation'
import {renderTrailEntry} from '../RichTextPopovers/trail/popover-renderers'
import {PopoverTrailPanel} from '../RichTextPopovers/trail/PopoverTrailPanel'
import {hasRouseRichDescriptionCard} from './rich-description-entries'
import {nextRichSegmentKey} from './rich-segment-keys'
import {memoizedParseRichDescription} from './rich-text-cache'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {useRichDescriptionTrail} from './useRichDescriptionTrail'

type RichDescriptionProps = Readonly<{
  text: string
  cardNames: Set<string>
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  skillLevel: number
  onNavigateToCards?: () => void
}>

export function RichDescription({
  text,
  cardNames,
  fullData,
  stats,
  skillLevel,
  onNavigateToCards,
}: RichDescriptionProps) {
  const rouseAwareCards = useMemo(() => {
    const names = new Set(cardNames)
    if (fullData) {
      if (hasRouseRichDescriptionCard(fullData) && !names.has('Rouse')) {
        names.add('Rouse')
      }
      names.add('exalt')
      names.add('over_exalt')
    }
    return names
  }, [cardNames, fullData])

  const segments: RichSegment[] = memoizedParseRichDescription(text, rouseAwareCards)
  const {
    trail,
    trailAnchorRect,
    trailAnchorElement,
    clearTrail,
    openSkillTrail,
    openTagTrail,
    openScalingTrail,
    openNestedSkillTrail,
    openNestedTagTrail,
    openNestedScalingTrail,
    closeTrailTop,
    closeTrailFrom,
  } = useRichDescriptionTrail(fullData)

  const handleNavigateToCards = useCallback(() => {
    if (onNavigateToCards) {
      clearTrail()
      onNavigateToCards()
    }
  }, [clearTrail, onNavigateToCards])

  const handleRootTokenNavigate = useCallback(
    (request: TokenNavigationRequest) => {
      switch (request.kind) {
        case 'skill':
          openSkillTrail(request.name, request.anchorElement)
          return
        case 'tag':
          openTagTrail(request.tag, request.anchorElement)
          return
        case 'scaling':
          openScalingTrail(request.values, request.suffix, request.stat, request.anchorElement)
      }
    },
    [openScalingTrail, openSkillTrail, openTagTrail],
  )

  const renderedSegments = renderRichDescriptionSegments(
    segments,
    handleRootTokenNavigate,
    skillLevel,
    stats,
  )

  return (
    <>
      {renderedSegments}
      {trail.length > 0 &&
        trailAnchorRect &&
        trailAnchorElement &&
        createPortal(
          <PopoverTrailPanel
            anchorElement={trailAnchorElement}
            anchorRect={trailAnchorRect}
            entryRects={trail.map((entry) => entry.rect)}
            itemCount={trail.length}
            onCloseTop={closeTrailTop}
          >
            {trail.map((entry, index) => {
              const depth = index + 1
              const totalDepth = trail.length
              const onBack =
                index > 0
                  ? () => {
                      closeTrailFrom(index)
                    }
                  : undefined

              return renderTrailEntry(entry, {
                cardNames: rouseAwareCards,
                depth,
                onBack,
                onClose: () => {
                  closeTrailFrom(index)
                },
                onNavigateToCards: onNavigateToCards ? handleNavigateToCards : undefined,
                openNestedScalingTrail,
                openNestedSkillTrail,
                openNestedTagTrail,
                skillLevel,
                sourceIndex: index,
                stats,
                totalDepth,
              })
            })}
          </PopoverTrailPanel>,
          document.body,
        )}
    </>
  )
}

function renderRichDescriptionSegments(
  segments: RichSegment[],
  onTokenNavigate: (request: TokenNavigationRequest) => void,
  skillLevel: number,
  stats: AwakenerFullStats | null,
) {
  const keyCounts = new Map<string, number>()
  return segments.map((segment: RichSegment) => {
    const key = nextRichSegmentKey(keyCounts, segment)
    return (
      <RichSegmentRenderer
        key={key}
        onTokenNavigate={onTokenNavigate}
        segment={segment}
        skillLevel={skillLevel}
        stats={stats}
        variant='inline'
      />
    )
  })
}
