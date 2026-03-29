import {FaXmark} from 'react-icons/fa6'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {RichSegmentRenderer} from './RichSegmentRenderer'
import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'

interface SkillPopoverProps {
  name: string
  label: string
  description: string
  cardNames: Set<string>
  stats: AwakenerFullStats | null
  onClose: () => void
  onSkillTokenClick: (name: string) => void
  onMechanicTokenClick: (tag: Tag) => void
  onScalingTokenClick: (values: number[], suffix: string, stat: string | null) => void
  onNavigateToCards?: () => void
}

export function SkillPopover({
  name,
  label,
  description,
  cardNames,
  stats,
  onClose,
  onSkillTokenClick,
  onMechanicTokenClick,
  onScalingTokenClick,
  onNavigateToCards,
}: SkillPopoverProps) {
  const segments = parseRichDescription(description, cardNames)

  return (
    <div
      className='w-max max-w-[320px] border border-slate-700/60 bg-slate-950/[.98] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.8)]'
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      style={{
        fontSize: 'calc(var(--desc-font-scale, 1) * 10px)',
      }}
    >
      <div className='mb-2 flex items-start justify-between gap-6'>
        <div>
          {onNavigateToCards ? (
            <button
              className={`${DATABASE_ENTRY_TITLE_CLASS} transition-colors hover:text-amber-100`}
              onClick={() => {
                onClose()
                onNavigateToCards()
              }}
              style={{fontSize: '1.15em'}}
              title='View in Cards tab'
              type='button'
            >
              {name} ↗
            </button>
          ) : (
            <p className={DATABASE_ENTRY_TITLE_CLASS} style={{fontSize: '1.15em'}}>
              {name}
            </p>
          )}
          <p className='text-slate-500' style={{fontSize: '0.95em'}}>
            {label}
          </p>
        </div>
        <button
          aria-label='Close skill popover'
          className='-mt-0.5 -mr-1 text-slate-400 transition-colors hover:text-white'
          onClick={() => {
            onClose()
          }}
          type='button'
        >
          <FaXmark size={14} />
        </button>
      </div>
      <div>
        <p className='leading-relaxed text-slate-400' style={{fontSize: '1.1em'}}>
          {segments.map((seg, i) => (
            <RichSegmentRenderer
              key={i}
              onMechanicClick={(tag) => {
                onMechanicTokenClick(tag)
              }}
              onSkillClick={(name) => {
                onSkillTokenClick(name)
              }}
              onScalingClick={(values, suffix, stat) => {
                onScalingTokenClick(values, suffix, stat)
              }}
              segment={seg}
              skillLevel={1}
              stats={stats}
              variant='popover'
            />
          ))}
        </p>
      </div>
    </div>
  )
}
