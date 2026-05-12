import {Fragment} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'

import type {BannerEntry, BannerTag} from '@/domain/timeline'

import {TimelineRichText} from './TimelineRichText'

const BANNER_TAG_LABEL: Record<BannerTag, string> = {
  awaken: 'New Awakener',
  limited: 'Limited',
  standard: 'Standard',
  rerun: 'Rerun',
  selector: 'Selector',
  wheel: 'Wheel',
  combo: 'Combo',
  collab: 'Collab',
  preliminary: 'Preliminary',
}

const BANNER_TAG_COLOR: Record<BannerTag, string> = {
  awaken: 'text-amber-300/95',
  limited: 'text-sky-300/90',
  standard: 'text-slate-400/80',
  rerun: 'text-violet-300/90',
  selector: 'text-pink-300/90',
  wheel: 'text-cyan-300/90',
  combo: 'text-emerald-300/95',
  collab: 'text-fuchsia-300/90',
  preliminary: 'text-amber-200/76',
}

const DRAWER_BASE_CLASS =
  'absolute inset-y-0 right-0 z-30 w-[calc(50%_+_1.75rem)] min-w-[11.75rem] max-w-[calc(100%_-_1.75rem)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'

const DRAWER_SURFACE_CLASS =
  'absolute inset-0 border-l border-amber-100/16 bg-[linear-gradient(180deg,rgba(9,16,29,0.42)_0%,rgba(9,16,29,0.88)_44%,rgba(4,8,16,0.98)_100%)] shadow-[-14px_0_26px_rgba(2,6,14,0.36)] backdrop-blur-[10px]'

const DRAWER_TOGGLE_CLASS =
  'absolute inset-y-0 left-0 z-30 grid w-7 place-items-center border-l border-amber-100/14 bg-slate-950/58 text-amber-100/78 shadow-[-6px_0_14px_rgba(2,6,14,0.32)] transition-[background-color,color] duration-150 hover:bg-slate-900/88 hover:text-amber-50 focus-visible:ring-2 focus-visible:ring-amber-200/45 focus-visible:outline-none motion-reduce:transition-none'

const DRAWER_BODY_BASE_CLASS =
  'relative z-10 flex h-full min-w-0 flex-col justify-center overflow-hidden py-5'

const DRAWER_BODY_STACK_CLASS =
  'flex max-h-full min-h-0 min-w-0 flex-col justify-center overflow-hidden'

const DRAWER_TITLE_BASE_CLASS =
  'ui-title line-clamp-3 shrink-0 text-[1.02rem] leading-[1.16] tracking-tight sm:text-[1.08rem]'

const DRAWER_TAGS_CLASS =
  'mt-2 flex min-w-0 shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.58rem] leading-none font-bold tracking-[0.16em] uppercase'

const DRAWER_DESCRIPTION_CLASS =
  'mt-3 min-h-0 max-h-[6.75rem] overflow-hidden text-xs leading-[1.5] text-slate-400'

const DRAWER_BOTTOM_FADE_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-b from-transparent via-slate-950/25 to-slate-950/75'

interface BannerInfoDrawerProps {
  banner: BannerEntry
  canCollapse: boolean
  countdownTitle: string | undefined
  isEnded: boolean
  open: boolean
  onToggle: () => void
}

export function BannerInfoDrawer({
  banner,
  canCollapse,
  countdownTitle,
  isEnded,
  open,
  onToggle,
}: BannerInfoDrawerProps) {
  const drawerTransform = open ? 'translate-x-0' : 'translate-x-[calc(100%_-_1.75rem)]'
  const contentInset = canCollapse ? 'pr-4 pl-11' : 'px-5'

  return (
    <div className={`${DRAWER_BASE_CLASS} ${drawerTransform}`}>
      <div className={DRAWER_SURFACE_CLASS} />

      {canCollapse ? (
        <button
          aria-expanded={open}
          aria-label={
            open ? `Hide details for ${banner.title}` : `Show details for ${banner.title}`
          }
          className={DRAWER_TOGGLE_CLASS}
          onClick={onToggle}
          title={open ? 'Hide details' : 'Show details'}
          type='button'
        >
          {open ? <FaChevronRight aria-hidden /> : <FaChevronLeft aria-hidden />}
          {!open ? (
            <span
              aria-hidden
              className='absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.46rem] leading-none font-bold tracking-[0.18em] uppercase [writing-mode:vertical-rl]'
            >
              Details
            </span>
          ) : null}
        </button>
      ) : null}

      <BannerDrawerBody
        banner={banner}
        contentInset={contentInset}
        countdownTitle={countdownTitle}
        isEnded={isEnded}
      />
    </div>
  )
}

function getBannerDisplayTags(banner: BannerEntry): BannerTag[] {
  if (banner.tags && banner.tags.length > 0) return banner.tags
  return banner.preliminary ? ([banner.type, 'preliminary'] satisfies BannerTag[]) : [banner.type]
}

function BannerDrawerBody({
  banner,
  contentInset,
  countdownTitle,
  isEnded,
}: {
  banner: BannerEntry
  contentInset: string
  countdownTitle: string | undefined
  isEnded: boolean
}) {
  const displayTags = getBannerDisplayTags(banner)

  return (
    <div
      className={`${DRAWER_BODY_BASE_CLASS} ${contentInset} ${isEnded ? 'text-slate-500' : 'text-slate-100'}`}
      title={countdownTitle}
    >
      <div className={DRAWER_BODY_STACK_CLASS}>
        <h3
          className={`${DRAWER_TITLE_BASE_CLASS} ${isEnded ? 'text-slate-500' : 'text-amber-50'}`}
        >
          {banner.title}
        </h3>
        <div className={DRAWER_TAGS_CLASS}>
          {displayTags.map((tag, index) => (
            <Fragment key={tag}>
              {index > 0 ? (
                <span aria-hidden className={isEnded ? 'text-slate-700' : 'text-slate-600/75'}>
                  &middot;
                </span>
              ) : null}
              <span className={isEnded ? 'text-slate-600' : BANNER_TAG_COLOR[tag]}>
                {BANNER_TAG_LABEL[tag]}
              </span>
            </Fragment>
          ))}
        </div>
        {banner.description ? (
          <p className={DRAWER_DESCRIPTION_CLASS}>
            <TimelineRichText text={banner.description} />
          </p>
        ) : null}
      </div>
      {banner.description ? <div aria-hidden className={DRAWER_BOTTOM_FADE_CLASS} /> : null}
    </div>
  )
}
