import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'

import {AwakenerBuildsTab, AwakenerDetailCards, AwakenerDetailOverview, AwakenerTeamsTab} from '..'
import type {TabId} from '../../../constants'
import type {FontScale} from '../../../utils/font-scale'

type AwakenerDetailModalTabContentProps = Readonly<{
  activeTab: TabId
  awakener: Awakener
  cardNames: Set<string>
  fontScale: FontScale
  fullData: AwakenerFull | null
  onNavigateToCards: () => void
  skillLevel: number
  stats: AwakenerFullStats | null
}>

export function AwakenerDetailModalTabContent({
  activeTab,
  awakener,
  cardNames,
  fontScale,
  fullData,
  onNavigateToCards,
  skillLevel,
  stats,
}: AwakenerDetailModalTabContentProps) {
  return (
    <div className='database-tab-content w-full transition-all duration-200 ease-in-out'>
      {activeTab === 'copies' && (
        <AwakenerDetailOverview
          awakener={awakener}
          cardNames={cardNames}
          fontScale={fontScale}
          fullData={fullData}
          mode='copies'
          onNavigateToCards={onNavigateToCards}
          skillLevel={skillLevel}
          stats={stats}
        />
      )}
      {activeTab === 'talents' && (
        <AwakenerDetailOverview
          awakener={awakener}
          cardNames={cardNames}
          fontScale={fontScale}
          fullData={fullData}
          mode='talents'
          onNavigateToCards={onNavigateToCards}
          skillLevel={skillLevel}
          stats={stats}
        />
      )}
      {activeTab === 'cards' && (
        <AwakenerDetailCards
          awakener={awakener}
          cardNames={cardNames}
          fullData={fullData}
          skillLevel={skillLevel}
          stats={stats}
        />
      )}
      {activeTab === 'builds' && <AwakenerBuildsTab awakenerId={awakener.id} />}
      {activeTab === 'teams' && <AwakenerTeamsTab />}
    </div>
  )
}
