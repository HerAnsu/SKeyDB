import {useState} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {getTimelineCountdownDisplay, getTimelineStatus, type BannerEntry} from '@/domain/timeline'

import {BannerArtwork} from './BannerArtwork'
import {BannerInfoDrawer} from './BannerInfoDrawer'

const BANNER_CARD_BASE_CLASS =
  'group/banner relative aspect-[8/5] w-full max-w-[30rem] overflow-hidden rounded-[2px] border shadow-[0_12px_26px_rgba(2,6,23,0.28),inset_0_1px_0_rgba(255,244,202,0.05)] transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none'

const BANNER_CARD_DEFAULT_CLASS =
  'border-slate-700/50 bg-[radial-gradient(circle_at_14%_0%,rgba(76,96,128,0.2),transparent_44%),linear-gradient(180deg,rgba(9,16,29,0.96),rgba(4,9,17,0.98))] hover:border-amber-200/46 hover:shadow-[0_18px_34px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,244,202,0.08)]'

const BANNER_CARD_PINNED_CLASS =
  'border-amber-300/45 bg-[radial-gradient(circle_at_18%_0%,rgba(181,124,34,0.22),transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(5,10,18,0.98))] ring-1 ring-amber-300/10 ring-inset hover:border-amber-200/46 hover:shadow-[0_18px_34px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,244,202,0.08)]'

const BANNER_CARD_ENDED_CLASS =
  'border-slate-700/25 bg-[radial-gradient(circle_at_14%_0%,rgba(76,96,128,0.14),transparent_44%),linear-gradient(180deg,rgba(9,16,29,0.9),rgba(4,9,17,0.98))]'

const BANNER_ART_CLASS = 'absolute inset-0 bg-slate-950'
const BANNER_ART_ENDED_CLASS = `${BANNER_ART_CLASS} opacity-[0.58] saturate-50`

interface BannerCardProps {
  banner: BannerEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

export function BannerCard({banner, now, onOpenDetail}: BannerCardProps) {
  const [drawerPinnedOpen, setDrawerPinnedOpen] = useState(false)
  const status = getTimelineStatus(banner.startDate, banner.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(banner.startDate, banner.endDate, now)
  const isEnded = status === 'ended'
  const drawerCanCollapse =
    Boolean(banner.customArt) ||
    (banner.featured?.length ?? 0) > 0 ||
    (banner.poolSlots?.length ?? 0) > 0
  const drawerOpen = !drawerCanCollapse || drawerPinnedOpen
  const showPinned = banner.pinned === true && status === 'active'
  const cardStateClass = isEnded
    ? BANNER_CARD_ENDED_CLASS
    : showPinned
      ? BANNER_CARD_PINNED_CLASS
      : BANNER_CARD_DEFAULT_CLASS

  return (
    <article className={`${BANNER_CARD_BASE_CLASS} ${cardStateClass}`}>
      <div className={isEnded ? BANNER_ART_ENDED_CLASS : BANNER_ART_CLASS}>
        <BannerArtwork
          customArt={banner.customArt}
          featured={banner.featured}
          onOpenDetail={onOpenDetail}
          poolSlots={banner.poolSlots}
          title={banner.title}
        />
      </div>

      <div className='pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_24%_12%,rgba(255,244,202,0.06),transparent_34%),linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_58%,rgba(2,6,14,0.68))]' />
      <div className='pointer-events-none absolute inset-1 z-20 border border-amber-100/10' />

      {countdownDisplay ? (
        <span
          className='absolute bottom-2.5 left-3 z-40 text-[0.68rem] leading-none font-medium text-slate-300/86 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]'
          title={countdownDisplay.title}
        >
          {countdownDisplay.text}
        </span>
      ) : null}

      <BannerInfoDrawer
        banner={banner}
        canCollapse={drawerCanCollapse}
        countdownTitle={countdownDisplay?.title}
        isEnded={isEnded}
        onToggle={() => {
          setDrawerPinnedOpen((current) => !current)
        }}
        open={drawerOpen}
      />
    </article>
  )
}
