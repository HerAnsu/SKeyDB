import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {getColoredMainstatIcon} from '@/domain/mainstats'
import {nextRichSegmentKey} from '@/pages/database/components/RichText/rich-segment-keys'
import {memoizedParseRichDescription} from '@/pages/database/components/RichText/rich-text-cache'
import {getDatabaseSkillNameColor} from '@/pages/database/utils/text-styles'

import {RichSegmentRenderer} from '../../RichText/RichSegmentRenderer'
import type {PopoverHeaderModel} from '../core/popover-header-model'
import {type TokenNavigationRequest} from '../core/popover-navigation'
import {PopoverContent, PopoverShell} from '../core/PopoverShell'

type SkillPopoverProps = Readonly<{
  name: string
  label: string
  description: string
  cardNames: Set<string>
  stats: AwakenerFullStats | null
  onClose: () => void
  onTokenNavigate: (request: TokenNavigationRequest) => void
  onNavigateToCards?: () => void
  skillLevel: number
  cost?: string
  skillType?: 'command' | 'exalt' | 'talent' | 'enlighten'
  depth?: number
  totalDepth?: number
  onBack?: () => void
}>

export function SkillPopover({
  name,
  label,
  description,
  cardNames,
  stats,
  onClose,
  onTokenNavigate,
  onNavigateToCards,
  skillLevel,
  cost,
  skillType,
  depth,
  totalDepth,
  onBack,
}: SkillPopoverProps) {
  const segments = memoizedParseRichDescription(description, cardNames)
  const isCommand = skillType === 'command'
  const isExalt = skillType === 'exalt'
  const isRouse = label.toLowerCase() === 'rouse' || name.toLowerCase() === 'rouse'
  const skillNameColor = getDatabaseSkillNameColor({
    skillType,
    isOverExalt: isExalt && name.toLowerCase().includes('over'),
    isRouse,
  })

  const aliemusIcon = getColoredMainstatIcon('ALIEMUS_REGEN')
  const baseAliemus = stats?.BaseAliemus ? Number.parseInt(stats.BaseAliemus, 10) : 100
  const exaltValue = isExalt
    ? name.toLowerCase().includes('over')
      ? baseAliemus * 2
      : baseAliemus
    : null

  const segmentKeyCounts = new Map<string, number>()

  const eyebrow = isCommand ? (
    <span
      className='inline-flex items-center gap-1.5 text-slate-300'
      style={{fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'}}
    >
      <img
        alt=''
        aria-hidden='true'
        className='h-[1.4em] w-[1.4em] object-contain opacity-90'
        draggable={false}
        src={costIcon}
      />
      <span className='pt-0.5 font-medium' style={{color: '#ededed'}}>
        {cost ?? label}
      </span>
    </span>
  ) : isExalt ? (
    <span
      className='inline-flex items-center gap-1.5 text-slate-300'
      style={{fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'}}
    >
      {aliemusIcon && (
        <img
          alt=''
          aria-hidden='true'
          className='h-[1.1em] w-[1.1em] translate-y-[1px] object-contain'
          draggable={false}
          src={aliemusIcon}
        />
      )}
      <span className='pt-0.5 font-medium text-amber-200/90'>{exaltValue}</span>
    </span>
  ) : (
    <span
      className='shrink-0 text-slate-500 italic'
      style={{fontSize: 'calc(var(--desc-font-scale, 1) * 11px)'}}
    >
      {label}
    </span>
  )

  const header: PopoverHeaderModel = {
    title: onNavigateToCards ? (
      <button
        className='flex min-w-0 items-center gap-2 text-left transition-colors hover:text-amber-100'
        onClick={() => {
          onClose()
          onNavigateToCards()
        }}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          letterSpacing: 'inherit',
          lineHeight: 'inherit',
        }}
        title='View in Skills tab'
        type='button'
      >
        <span className='flex min-w-0 items-center gap-3.5 overflow-hidden'>
          {eyebrow}
          <span
            className='min-w-0 overflow-hidden text-ellipsis whitespace-nowrap'
            style={{
              color: skillNameColor,
            }}
          >
            {name}
          </span>
          <span className='shrink-0 text-slate-600'>&#8599;</span>
        </span>
      </button>
    ) : (
      <span className='flex min-w-0 items-center gap-3.5 overflow-hidden'>
        {eyebrow}
        <span
          className='min-w-0 overflow-hidden text-ellipsis whitespace-nowrap'
          style={{
            color: skillNameColor,
          }}
        >
          {name}
        </span>
      </span>
    ),
  }

  const depthIndicator =
    totalDepth && totalDepth > 1 ? `Step ${String(depth)} of ${String(totalDepth)}` : undefined

  return (
    <PopoverShell depthIndicator={depthIndicator} header={header} onBack={onBack} onClose={onClose}>
      <PopoverContent className='mt-1.5'>
        {segments.map((segment) => (
          <RichSegmentRenderer
            key={nextRichSegmentKey(segmentKeyCounts, segment)}
            onTokenNavigate={onTokenNavigate}
            segment={segment}
            skillLevel={skillLevel}
            stats={stats}
            variant='popover'
          />
        ))}
      </PopoverContent>
    </PopoverShell>
  )
}
