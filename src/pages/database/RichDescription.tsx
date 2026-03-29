import {useCallback, useEffect, useId, useState} from 'react'

import {createPortal} from 'react-dom'

import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {
  closeTrailFromIndex,
  closeTrailTop as closeTrailTopEntry,
  isSameTrailRoot,
  openTrailRoot,
  pushTrailEntry,
  type ScalingTrailEntry,
  type SkillTrailEntry,
  type TagTrailEntry,
  type TrailEntry,
} from './popover-trail'
import {PopoverTrailPanel} from './PopoverTrailPanel'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {ScalingPopover} from './ScalingPopover'
import {SkillPopover} from './SkillPopover'
import {TagPopover} from './TagPopover'

interface RichDescriptionProps {
  text: string
  cardNames: Set<string>
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  skillLevel: number
  onNavigateToCards?: () => void
}

interface CardInfo {
  card: {name: string; description: string}
  label: string
}

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function RichDescription({
  text,
  cardNames,
  fullData,
  stats,
  skillLevel,
  onNavigateToCards,
}: RichDescriptionProps) {
  const rouseAwareCards =
    fullData && hasRouseCard(fullData) && !cardNames.has('Rouse')
      ? new Set([...cardNames, 'Rouse'])
      : cardNames
  const segments = parseRichDescription(text, rouseAwareCards)
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailAnchorRect, setTrailAnchorRect] = useState<DOMRect | null>(null)
  const [trailAnchorElement, setTrailAnchorElement] = useState<HTMLElement | null>(null)
  const ownerId = useId()

  const clearTrail = useCallback(() => {
    setTrail([])
    setTrailAnchorRect(null)
    setTrailAnchorElement(null)
  }, [])

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      clearTrail()
    }

    window.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    return () => {
      window.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    }
  }, [clearTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const handleSkillClick = useCallback(
    (name: string, e: React.MouseEvent) => {
      if (!fullData) return
      const result = resolveCardInfo(fullData, name)
      if (!result) return
      const entry = buildSkillTrailEntry(result.card, result.label)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = e.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, fullData, trail],
  )

  const handleMechanicClick = useCallback(
    (tag: Tag, e: React.MouseEvent) => {
      const entry = buildTagTrailEntry(tag)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = e.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, trail],
  )

  const handleScalingClick = useCallback(
    (values: number[], suffix: string, stat: string | null, e: React.MouseEvent) => {
      const entry = buildScalingTrailEntry(values, suffix, stat)
      if (isSameTrailRoot(trail, entry.key)) return
      const anchorElement = e.currentTarget as HTMLElement
      const rect = anchorElement.getBoundingClientRect()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(rect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, trail],
  )

  const openNestedSkill = useCallback(
    (name: string, sourceIndex: number, e: React.MouseEvent) => {
      if (!fullData) return
      const result = resolveCardInfo(fullData, name)
      if (!result) return
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const entry = buildSkillTrailEntry(result.card, result.label, rect)
      setTrail((prev) => pushTrailEntry(prev.slice(0, sourceIndex + 1), entry))
    },
    [fullData],
  )

  const openNestedTag = useCallback((tag: Tag, sourceIndex: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const entry = buildTagTrailEntry(tag, rect)
    setTrail((prev) => pushTrailEntry(prev.slice(0, sourceIndex + 1), entry))
  }, [])

  const openNestedScaling = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      sourceIndex: number,
      e: React.MouseEvent,
    ) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const entry = buildScalingTrailEntry(values, suffix, stat, rect)
      setTrail((prev) => pushTrailEntry(prev.slice(0, sourceIndex + 1), entry))
    },
    [],
  )

  const closeTrailTop = useCallback(() => {
    setTrail((prev) => {
      const next = closeTrailTopEntry(prev)
      if (next.length === 0) {
        setTrailAnchorRect(null)
      }
      return next
    })
  }, [])

  const closeTrailFrom = useCallback((index: number) => {
    setTrail((prev) => {
      const next = closeTrailFromIndex(prev, index)
      if (next.length === 0) {
        setTrailAnchorRect(null)
      }
      return next
    })
  }, [])

  const handleNavigateToCards = useCallback(() => {
    if (onNavigateToCards) {
      clearTrail()
      onNavigateToCards()
    }
  }, [clearTrail, onNavigateToCards])

  return (
    <>
      {segments.map((seg, i) => (
        <RichSegmentRenderer
          key={i}
          onMechanicClick={handleMechanicClick}
          onScalingClick={handleScalingClick}
          onSkillClick={handleSkillClick}
          segment={seg}
          skillLevel={skillLevel}
          stats={stats}
          variant='inline'
        />
      ))}
      {trail.length > 0 && trailAnchorRect && trailAnchorElement
        ? createPortal(
            <PopoverTrailPanel
              anchorElement={trailAnchorElement}
              anchorRect={trailAnchorRect}
              entryRects={trail.map((e) => e.rect)}
              itemCount={trail.length}
              onCloseTop={closeTrailTop}
            >
              {trail.map((entry, index) =>
                entry.kind === 'skill' ? (
                  <SkillPopover
                    cardNames={rouseAwareCards}
                    description={entry.description}
                    key={entry.key}
                    label={entry.label}
                    name={entry.name}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    onMechanicTokenClick={(tag, e) => {
                      openNestedTag(tag, index, e)
                    }}
                    onNavigateToCards={onNavigateToCards ? handleNavigateToCards : undefined}
                    onScalingTokenClick={(v, suf, st, e) => {
                      openNestedScaling(v, suf, st, index, e)
                    }}
                    onSkillTokenClick={(name, e) => {
                      openNestedSkill(name, index, e)
                    }}
                    skillLevel={skillLevel}
                    stats={stats}
                  />
                ) : entry.kind === 'tag' ? (
                  <TagPopover
                    cardNames={rouseAwareCards}
                    key={entry.key}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    onMechanicTokenClick={(tag, e) => {
                      openNestedTag(tag, index, e)
                    }}
                    onScalingTokenClick={(v, suf, st, e) => {
                      openNestedScaling(v, suf, st, index, e)
                    }}
                    onSkillTokenClick={(name, e) => {
                      openNestedSkill(name, index, e)
                    }}
                    skillLevel={skillLevel}
                    stats={stats}
                    tag={entry.tag}
                  />
                ) : (
                  <ScalingPopover
                    currentLevel={index === 0 ? skillLevel : 0}
                    key={entry.key}
                    onClose={() => {
                      closeTrailFrom(index)
                    }}
                    stat={entry.stat}
                    stats={stats}
                    suffix={entry.suffix}
                    values={entry.values}
                  />
                ),
              )}
            </PopoverTrailPanel>,
            document.body,
          )
        : null}
    </>
  )
}

function resolveCardInfo(awakener: AwakenerFull, name: string): CardInfo | null {
  for (const [key, card] of Object.entries(awakener.cards)) {
    if (card.name === name) return {card, label: key.toUpperCase()}
  }
  if (awakener.exalts.exalt.name === name) return {card: awakener.exalts.exalt, label: 'EXALT'}
  if (awakener.exalts.over_exalt.name === name)
    return {card: awakener.exalts.over_exalt, label: 'OVER-EXALT'}
  for (const [key, talent] of Object.entries(awakener.talents)) {
    if (talent.name === name) return {card: talent, label: `TALENT ${key}`}
  }
  for (const [key, enlighten] of Object.entries(awakener.enlightens)) {
    if (enlighten.name === name) return {card: enlighten, label: `ENLIGHTEN ${key}`}
  }
  return null
}

function buildSkillTrailEntry(
  card: {name: string; description: string},
  label: string,
  rect?: DOMRect,
): SkillTrailEntry {
  return {
    kind: 'skill',
    key: `skill:${card.name}`,
    name: card.name,
    label,
    description: card.description,
    rect,
  }
}

function buildTagTrailEntry(tag: Tag, rect?: DOMRect): TagTrailEntry {
  return {
    kind: 'tag',
    key: `tag:${tag.key}`,
    tag,
    rect,
  }
}

function buildScalingTrailEntry(
  values: number[],
  suffix: string,
  stat: string | null,
  rect?: DOMRect,
): ScalingTrailEntry {
  return {
    kind: 'scaling',
    key: `scaling:${stat ?? 'unnamed'}:${values.join(',')}`,
    values,
    suffix,
    stat,
    rect,
  }
}

function hasRouseCard(awakener: AwakenerFull): boolean {
  return Object.values(awakener.cards).some((c) => c.name === 'Rouse')
}
