import {type ReactNode} from 'react'

function isSafeLinkTarget(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function findClosingMarker(text: string, marker: string, from: number): number {
  const index = text.indexOf(marker, from)
  return index > from ? index : -1
}

function parseInlineRichText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let buffer = ''
  let index = 0

  const pushBuffer = () => {
    if (!buffer) return
    nodes.push(buffer)
    buffer = ''
  }

  while (index < text.length) {
    if (text.startsWith('[', index)) {
      const labelEnd = text.indexOf('](', index + 1)
      const hrefEnd = labelEnd >= 0 ? text.indexOf(')', labelEnd + 2) : -1
      if (labelEnd > index + 1 && hrefEnd > labelEnd + 2) {
        const label = text.slice(index + 1, labelEnd)
        const href = text.slice(labelEnd + 2, hrefEnd)
        if (isSafeLinkTarget(href)) {
          pushBuffer()
          const key = `${keyPrefix}-link-${String(index)}`
          nodes.push(
            <a className='text-link' href={href} key={key} rel='noreferrer' target='_blank'>
              {parseInlineRichText(label, key)}
              <span className='sr-only'> (opens in new tab)</span>
            </a>,
          )
          index = hrefEnd + 1
          continue
        }
      }
    }

    if (text.startsWith('**', index)) {
      const end = findClosingMarker(text, '**', index + 2)
      if (end >= 0) {
        pushBuffer()
        const key = `${keyPrefix}-strong-${String(index)}`
        nodes.push(
          <strong key={key}>{parseInlineRichText(text.slice(index + 2, end), key)}</strong>,
        )
        index = end + 2
        continue
      }
    }

    if (text[index] === '*' || text[index] === '_') {
      const marker = text[index]
      const end = findClosingMarker(text, marker, index + 1)
      if (end >= 0) {
        pushBuffer()
        const key = `${keyPrefix}-em-${String(index)}`
        nodes.push(<em key={key}>{parseInlineRichText(text.slice(index + 1, end), key)}</em>)
        index = end + 1
        continue
      }
    }

    buffer += text[index]
    index += 1
  }

  pushBuffer()
  return nodes
}

function renderTimelineRichText(text: string): ReactNode[] {
  return text.split('\n').flatMap((line, index) => {
    const nodes = parseInlineRichText(line, `line-${String(index)}`)
    if (index === 0) return nodes
    return [<br key={`line-${String(index)}-break`} />, ...nodes]
  })
}

export function TimelineRichText({text}: {text: string}) {
  return <>{renderTimelineRichText(text)}</>
}
