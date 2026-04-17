import {parseRichDescription} from '@/domain/rich-text'

type ParseResult = ReturnType<typeof parseRichDescription>

const parseCache = new Map<string, ParseResult>()

/**
 * Memoized version of parseRichDescription to avoid redundant parsing
 * of the same text with the same card context.
 */
export function memoizedParseRichDescription(text: string, cardNames: Set<string>): ParseResult {
  // Create a stable key from text and sorted card names
  const cardKey = Array.from(cardNames).sort().join(',')
  const cacheKey = `${text}|||${cardKey}`

  const cached = parseCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const result = parseRichDescription(text, cardNames)

  // Limit cache size to prevent memory leaks in long sessions
  if (parseCache.size > 200) {
    const firstKey = parseCache.keys().next().value
    if (firstKey !== undefined) {
      parseCache.delete(firstKey)
    }
  }

  parseCache.set(cacheKey, result)
  return result
}

export function clearParseCache() {
  parseCache.clear()
}
