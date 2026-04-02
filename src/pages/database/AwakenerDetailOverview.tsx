import {useCallback, useMemo} from 'react'

import enlightensStars from '@/assets/icons/Battle_Card_Buff_045.png'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {getRelicPortraitAssetByAssetId} from '@/domain/relic-assets'
import {getPortraitRelicByAwakenerIngameId} from '@/domain/relics'

import {DetailSection, type DetailSectionItem} from './DetailSection'
import {getStarSize, scaledFontStyle, type FontScale} from './font-scale'
import {RichDescription} from './RichDescription'
import {DATABASE_SECTION_TITLE_CLASS} from './text-styles'

type AwakenerDetailOverviewProps = Readonly<{
  awakener: Awakener
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
  fontScale: FontScale
  onNavigateToCards?: () => void
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
  awakener,
  fullData,
  stats,
  cardNames,
  skillLevel,
  fontScale,
  onNavigateToCards,
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
    if (!fullData) return []
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
  }, [fontScale, fullData])

  if (!fullData) {
    return <p className='py-4 text-xs text-slate-400'>Loading...</p>
  }
  const talentItems: DetailSectionItem[] = []
  for (const key of TALENT_ORDER) {
    if (!hasTalentEntry(fullData, key)) {
      continue
    }
    const entry = fullData.talents[key]
    talentItems.push({key, label: key, name: entry.name, description: entry.description})
  }

  const portraitRelic = getPortraitRelicByAwakenerIngameId(awakener.ingameId)
  const portraitRelicAsset = portraitRelic
    ? getRelicPortraitAssetByAssetId(portraitRelic.assetId)
    : undefined

  return (
    <div className='space-y-4'>
      <div>
        <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(20)}>
          Dimensional Image
        </h4>
        {portraitRelic ? (
          <div className='pt-1 pb-2'>
            <div className='flex items-start gap-3 border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 shadow-sm'>
              <div className='h-16 w-16 shrink-0 overflow-hidden'>
                {portraitRelicAsset ? (
                  <img
                    alt={`${portraitRelic.name} icon`}
                    className='h-full w-full object-cover object-center'
                    draggable={false}
                    src={portraitRelicAsset}
                  />
                ) : (
                  <div className='h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(125,165,215,0.2),rgba(8,13,25,0.95)_70%)]' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <div className='leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
                  {renderDescription(portraitRelic.description)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className='px-4 pb-3 text-xs text-slate-400'>
            No dimensional image linked yet for this awakener.
          </p>
        )}
      </div>
      <DetailSection
        emptyMessage='No enlighten data available.'
        items={enlightenItems}
        renderDescription={renderDescription}
        title='Enlightens'
      />
      <DetailSection
        emptyMessage='No talent data available.'
        items={talentItems}
        renderDescription={renderDescription}
        title='Talents'
      />
    </div>
  )
}
