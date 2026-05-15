import {useId, type ReactNode} from 'react'

import {FaChevronRight} from 'react-icons/fa6'

interface TimelineArchiveSectionProps {
  children: ReactNode
  contentClassName?: string
  dividerClassName?: string
  expanded: boolean
  itemCount: number
  onToggle: () => void
  title: string
  titleClassName?: string
}

const DEFAULT_ARCHIVE_DIVIDER_CLASS =
  'bg-gradient-to-r from-amber-200/15 via-slate-500/20 to-transparent'

export function TimelineArchiveSection({
  children,
  contentClassName,
  dividerClassName = DEFAULT_ARCHIVE_DIVIDER_CLASS,
  expanded,
  itemCount,
  onToggle,
  title,
  titleClassName = 'text-slate-400',
}: TimelineArchiveSectionProps) {
  const contentId = useId()

  return (
    <div className='mt-4'>
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        className='flex min-h-10 w-full items-center gap-3 text-left transition-colors hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none sm:min-h-8'
        onClick={onToggle}
        type='button'
      >
        <FaChevronRight
          aria-hidden
          className={`shrink-0 text-[13px] text-slate-400 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${expanded ? 'rotate-90' : 'rotate-0'}`}
        />
        <span className={`ui-title text-sm ${titleClassName}`}>{title}</span>
        <span className='text-[10px] font-medium tracking-wider text-slate-500/80'>
          {itemCount}
        </span>
        <div className={`h-px flex-1 ${dividerClassName}`} />
      </button>
      <div
        aria-hidden={!expanded}
        aria-label={title}
        className='timeline-archive-motion'
        data-expanded={expanded}
        id={contentId}
        inert={!expanded}
        role='region'
      >
        <div className='timeline-archive-motion__clip'>
          <div className='timeline-archive-motion__content'>
            <div className={contentClassName}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
