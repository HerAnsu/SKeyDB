import {FaXmark} from 'react-icons/fa6'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {getTagColor, getTagIcon, type Tag} from '@/domain/tags'

import {RichSegmentRenderer} from './RichSegmentRenderer'
import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'

interface TagPopoverProps {
  tag: Tag
  cardNames: Set<string>
  onClose: () => void
  onSkillTokenClick: (name: string, e: React.MouseEvent) => void
  onMechanicTokenClick: (tag: Tag, e: React.MouseEvent) => void
  onScalingTokenClick: (
    values: number[],
    suffix: string,
    stat: string | null,
    e: React.MouseEvent,
  ) => void
  skillLevel: number
  stats: AwakenerFullStats | null
}

export function TagPopover({
  tag,
  cardNames,
  onClose,
  onSkillTokenClick,
  onMechanicTokenClick,
  onScalingTokenClick,
  skillLevel,
  stats,
}: TagPopoverProps) {
  const segments = parseRichDescription(tag.description, cardNames)
  const color = getTagColor(tag)

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
        <div className='flex items-center gap-1.5'>
          {tag.iconId && getTagIcon(tag.iconId) ? (
            <img alt='' className='h-[0.9em] w-auto shrink-0' src={getTagIcon(tag.iconId)} />
          ) : null}
          <p
            className={`${DATABASE_ENTRY_TITLE_CLASS} text-[1.15em] font-medium tracking-wide`}
            style={{color: color ?? undefined}}
          >
            {tag.label}
          </p>
        </div>
        <button
          className='-mt-0.5 -mr-1 text-slate-400 transition-colors hover:text-white'
          onClick={onClose}
        >
          <FaXmark size={14} />
        </button>
      </div>
      <div>
        <div className='leading-relaxed text-slate-400' style={{fontSize: '1.1em'}}>
          {segments.map((seg, i) => (
            <RichSegmentRenderer
              key={i}
              onMechanicClick={(tag, e) => {
                onMechanicTokenClick(tag, e)
              }}
              onSkillClick={(name, e) => {
                onSkillTokenClick(name, e)
              }}
              onScalingClick={(values, suffix, stat, e) => {
                onScalingTokenClick(values, suffix, stat, e)
              }}
              segment={seg}
              skillLevel={skillLevel}
              stats={stats}
              variant='popover'
            />
          ))}
        </div>
      </div>
    </div>
  )
}
