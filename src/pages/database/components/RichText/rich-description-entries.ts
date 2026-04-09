import type {AwakenerFull} from '@/domain/awakeners-full'
import {type Tag} from '@/domain/tags'

import type {ScalingTrailEntry, SkillTrailEntry, TagTrailEntry} from '../../utils/popover-trail'

interface CardInfo {
  card: {name: string; description: string; cost?: string}
  label: string
}

export function resolveRichDescriptionCardInfo(
  awakener: AwakenerFull,
  name: string,
): CardInfo | null {
  for (const [, card] of Object.entries(awakener.cards)) {
    if (card.name === name) return {card, label: `Cost ${card.cost}`}
  }
  if (awakener.exalts.exalt.name === name) {
    return {card: awakener.exalts.exalt, label: 'EXALT'}
  }
  if (awakener.exalts.over_exalt.name === name) {
    return {card: awakener.exalts.over_exalt, label: 'OVER-EXALT'}
  }
  for (const [key, talent] of Object.entries(awakener.talents)) {
    if (talent.name === name) return {card: talent, label: `TALENT ${key}`}
  }
  for (const [key, enlighten] of Object.entries(awakener.enlightens)) {
    if (enlighten.name === name) return {card: enlighten, label: `ENLIGHTEN ${key}`}
  }
  return null
}

export function buildRichDescriptionSkillTrailEntry(
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

export function buildRichDescriptionTagTrailEntry(tag: Tag, rect?: DOMRect): TagTrailEntry {
  return {
    kind: 'tag',
    key: `tag:${tag.key}`,
    tag,
    rect,
  }
}

export function buildRichDescriptionScalingTrailEntry(
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

export function hasRouseRichDescriptionCard(awakener: AwakenerFull): boolean {
  return Object.values(awakener.cards).some((card) => card.name === 'Rouse')
}
