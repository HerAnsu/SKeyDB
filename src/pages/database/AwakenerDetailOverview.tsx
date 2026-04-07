import {useCallback, useMemo} from 'react'

import enlightensStars from '@/assets/icons/Battle_Card_Buff_045.png'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'

import {DetailSection, type DetailSectionItem} from './DetailSection'
import {getStarSize, type FontScale} from './font-scale'
import {RichDescription} from './RichDescription'

type AwakenerDetailOverviewProps = Readonly<{
  awakener: Awakener
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
  fontScale: FontScale
  onNavigateToCards?: () => void
  mode: 'copies' | 'talents'
}>

const ENLIGHTEN_ORDER = ['E1', 'E2', 'E3'] as const
const TALENT_ORDER = ['T1', 'T2', 'T3', 'T4'] as const

function hasEnlightenEntry(fullData: AwakenerFull, key: string): boolean {
  return Object.hasOwn(fullData.enlightens, key)
}

function hasTalentEntry(fullData: AwakenerFull, key: string): boolean {
  return Object.hasOwn(fullData.talents, key)
}

function buildStarKeys(prefix: string, count: number): string[] {
  const keys: string[] = []
  for (let starNumber = 1; starNumber <= count; starNumber += 1) {
    keys.push(`${prefix}-star-${String(starNumber)}`)
  }
  return keys
}

export function AwakenerDetailOverview({
  awakener: _awakener,
  fullData,
  stats,
  cardNames,
  skillLevel,
  fontScale,
  onNavigateToCards,
  mode,
}: AwakenerDetailOverviewProps) {
  const renderDescription = useCallback(
    (description: string) => (
      <RichDescription
        cardNames={cardNames}
        fullData={fullData}
        onNavigateToCards={onNavigateToCards}
        skillLevel={skillLevel}
        stats={stats}
        text={description}
      />
    ),
    [cardNames, fullData, onNavigateToCards, skillLevel, stats],
  )

  const enlightenItems = useMemo(() => {
    if (!fullData || mode !== 'copies') return []
    const items: DetailSectionItem[] = []
    const starStyle = getStarSize(fontScale)

    for (const key of ENLIGHTEN_ORDER) {
      if (!hasEnlightenEntry(fullData, key)) continue

      const entry = fullData.enlightens[key]
      const starCount = Number.parseInt(key.replace('E', ''), 10)
      const starKeys = buildStarKeys(key, starCount)

      items.push({
        key,
        label: (
          <span className={`relative inline-flex h-[1em] items-center ${starStyle.space}`}>
            {starKeys.map((starKey, index) => (
              <img
                key={starKey}
                src={enlightensStars}
                alt={`E${String(index + 1)}`}
                className='relative'
                style={{width: starStyle.width, height: starStyle.height}}
              />
            ))}
          </span>
        ),
        name: entry.name,
        description: entry.description,
      })
    }

    let absoluteAxiom = null
    if (hasEnlightenEntry(fullData, 'AbsoluteAxiom')) {
      absoluteAxiom = fullData.enlightens.AbsoluteAxiom
    } else if (hasEnlightenEntry(fullData, 'E4')) {
      absoluteAxiom = fullData.enlightens.E4
    }

    if (absoluteAxiom) {
      items.push({
        key: 'AbsoluteAxiom',
        label: 'Р•15',
        name: absoluteAxiom.name,
        description: absoluteAxiom.description,
      })
    }

    return items
  }, [fontScale, fullData, mode])

  if (!fullData) {
    return <p className='py-4 text-xs text-slate-400'>Loading...</p>
  }

  const talentItems: DetailSectionItem[] = []
  if (mode === 'talents') {
    for (const key of TALENT_ORDER) {
      if (!hasTalentEntry(fullData, key)) {
        continue
      }
      const entry = fullData.talents[key]
      talentItems.push({key, label: key, name: entry.name, description: entry.description})
    }
  }

  return (
    <div className='space-y-4'>
      {mode === 'copies' && (
        <DetailSection
          emptyMessage='No enlighten data available.'
          items={enlightenItems}
          renderDescription={renderDescription}
          title='Enlightens'
        />
      )}
      {mode === 'talents' && (
        <DetailSection
          emptyMessage='No talent data available.'
          items={talentItems}
          renderDescription={renderDescription}
          title='Talents'
        />
      )}
    </div>
  )
}
