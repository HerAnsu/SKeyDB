import type {CardKeyword} from './awakener-source-schema'
import {fmtNum} from './scaling'

const CARD_KEYWORD_NAME_BY_ID: Record<string, string> = {
  'mechanic.echo': 'Echo',
  'mechanic.exhaust': 'Exhaust',
  'mechanic.prepare': 'Prepare',
  'mechanic.retain': 'Retain',
}

function humanizeCardKeywordId(id: string): string {
  const tail = id.split('.').at(-1) ?? id
  return tail.replace(/[-_]+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}

export function getCardKeywordDisplayName(keyword: CardKeyword): string {
  return CARD_KEYWORD_NAME_BY_ID[keyword.id] ?? humanizeCardKeywordId(keyword.id)
}

export function formatCardKeyword(keyword: CardKeyword): string {
  const label =
    keyword.value === undefined
      ? getCardKeywordDisplayName(keyword)
      : `${getCardKeywordDisplayName(keyword)} ${fmtNum(keyword.value)}`
  return `{${label}}`
}

export function buildCardKeywordFooterText(keywords: CardKeyword[]): string | undefined {
  if (keywords.length === 0) {
    return undefined
  }

  return keywords.map((keyword) => formatCardKeyword(keyword)).join(', ')
}
