import {useCallback} from 'react'

import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {getRelicPortraitAssetByAssetId} from '@/domain/relic-assets'
import {getPortraitRelicByAwakenerIngameId} from '@/domain/relics'

import {DetailSection} from './DetailSection'
import {scaledFontStyle} from './font-scale'
import {RichDescription} from './RichDescription'
import {DATABASE_ITEM_NAME_CLASS, DATABASE_SECTION_TITLE_CLASS} from './text-styles'

type AwakenerDetailCardsProps = Readonly<{
  awakener: Awakener
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
}>

const CARD_KEYS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] as const

function hasCard(fullData: AwakenerFull, key: (typeof CARD_KEYS)[number]): boolean {
  return Object.hasOwn(fullData.cards, key)
}

export function AwakenerDetailCards({
  awakener,
  fullData,
  stats,
  cardNames,
  skillLevel,
}: AwakenerDetailCardsProps) {
  const renderDescription = useCallback(
    (description: string) => (
      <RichDescription
        cardNames={cardNames}
        fullData={fullData}
        skillLevel={skillLevel}
        stats={stats}
        text={description}
      />
    ),
    [cardNames, fullData, skillLevel, stats],
  )

  if (!fullData) {
    return <p className='py-4 text-xs text-slate-400'>Loading card data...</p>
  }

  const {exalt, over_exalt} = fullData.exalts
  const exaltItems = [
    {key: 'exalt', label: 'Exalt', name: exalt.name, description: exalt.description},
    {
      key: 'over_exalt',
      label: 'Over Exalt',
      name: over_exalt.name,
      description: over_exalt.description,
    },
  ]

  const cardEntries: {key: string; card: {name: string; cost: string; description: string}}[] = []
  for (const key of CARD_KEYS) {
    if (!hasCard(fullData, key)) {
      continue
    }
    const card = fullData.cards[key]
    cardEntries.push({key, card})
  }

  const portraitRelic = getPortraitRelicByAwakenerIngameId(awakener.ingameId)
  const portraitRelicAsset = portraitRelic
    ? getRelicPortraitAssetByAssetId(portraitRelic.assetId)
    : undefined

  return (
    <div className='space-y-4'>
      <DetailSection items={exaltItems} renderDescription={renderDescription} title='Exalts' />

      <div>
        <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(20)}>
          Command Cards
        </h4>
        <div className='flex flex-col gap-y-3 pt-0 pb-2'>
          {cardEntries.map(({key, card}) => (
            <div
              className='border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 shadow-sm'
              key={key}
            >
              <div className='flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <span
                    className='inline-flex shrink-0 items-center gap-1.5 text-slate-300'
                    style={scaledFontStyle(12)}
                  >
                    <img
                      alt=''
                      aria-hidden='true'
                      className='h-[1.3em] w-[1.3em] object-contain opacity-90'
                      draggable={false}
                      src={costIcon}
                    />
                    <span className='font-medium text-amber-100/90'>{card.cost}</span>
                  </span>
                  <span className='shrink-0 text-slate-600'>·</span>
                  <p
                    className={`m-0 min-w-0 ${DATABASE_ITEM_NAME_CLASS}`}
                    style={scaledFontStyle(12)}
                  >
                    {card.name}
                  </p>
                </div>
                <span className='shrink-0 text-slate-500' style={scaledFontStyle(10)}>
                  {key === 'C1' ? 'Rouse' : key}
                </span>
              </div>
              <div className='my-2 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent' />
              <div
                className='mt-1.5 pl-2 leading-relaxed text-slate-400'
                style={scaledFontStyle(12)}
              >
                {renderDescription(card.description)}
              </div>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  )
}
