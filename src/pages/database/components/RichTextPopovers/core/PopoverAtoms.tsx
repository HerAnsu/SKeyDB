import {type ReactNode} from 'react'

import {FaXmark} from 'react-icons/fa6'

import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_DIVIDER_CLASS,
  DATABASE_POPOVER_HEADER_CLASS,
} from '@/pages/database/utils/text-styles'

import type {PopoverHeaderModel} from './popover-header-model'

interface PopoverHeaderProps {
  title?: ReactNode
  icon?: ReactNode
  header?: PopoverHeaderModel
  onClose: () => void
  depthIndicator?: ReactNode
  onBack?: () => void
}

export function PopoverHeader({
  title,
  icon,
  header,
  onClose,
  depthIndicator,
  onBack,
}: PopoverHeaderProps) {
  const headerIcon = header?.icon ?? icon

  return (
    <div className={DATABASE_POPOVER_HEADER_CLASS}>
      <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
        {headerIcon && <div className='shrink-0'>{headerIcon}</div>}
        <div className='min-w-0 flex-1 overflow-hidden'>
          {header ? (
            <PopoverHeaderContent header={header} />
          ) : typeof title === 'string' ? (
            <h3
              className={DATABASE_ENTRY_TITLE_CLASS}
              style={{fontSize: 'calc(var(--desc-font-scale, 1) * 14px)'}}
            >
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
        {depthIndicator && (
          <button
            className='shrink-0 rounded-sm bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase transition-colors hover:bg-white/10 hover:text-slate-300 disabled:cursor-default disabled:hover:bg-white/5 disabled:hover:text-slate-500'
            disabled={!onBack}
            onClick={onBack}
            type='button'
          >
            {depthIndicator}
          </button>
        )}
      </div>
      <button
        aria-label='Close popover'
        className='-mt-0.5 -mr-1 shrink-0 text-slate-400 transition-colors hover:text-white'
        onClick={onClose}
        type='button'
      >
        <FaXmark size={14} />
      </button>
    </div>
  )
}

function PopoverHeaderContent({header}: Readonly<{header: PopoverHeaderModel}>) {
  return (
    <div className='flex min-w-0 flex-col'>
      {header.eyebrow ? (
        <div
          className={`mb-0.5 min-w-0 overflow-hidden ${header.eyebrowClassName ?? ''}`}
          style={header.eyebrowStyle}
        >
          {header.eyebrow}
        </div>
      ) : null}

      <div className='flex min-w-0 items-center gap-2 overflow-hidden'>
        <h3
          className={`${DATABASE_ENTRY_TITLE_CLASS} min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
            header.titleClassName ?? ''
          }`}
          style={{
            fontSize: 'calc(var(--desc-font-scale, 1) * 14px)',
            ...header.titleStyle,
          }}
        >
          {header.title}
        </h3>

        {header.accent ? (
          <div className={`shrink-0 ${header.accentClassName ?? ''}`} style={header.accentStyle}>
            {header.accent}
          </div>
        ) : null}

        {header.action ? (
          <button
            className='shrink-0 rounded-sm border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-slate-300 uppercase transition-colors hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100'
            onClick={header.action.onClick}
            title={header.action.title}
            type='button'
          >
            {header.action.label}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function PopoverDivider() {
  return <div className={DATABASE_POPOVER_DIVIDER_CLASS} />
}

interface PopoverContentProps {
  children: ReactNode
  className?: string
}

export function PopoverContent({children, className = ''}: PopoverContentProps) {
  return (
    <div
      className={`leading-relaxed text-slate-400 ${className}`}
      style={{fontSize: 'calc(var(--desc-font-scale, 1) * 12px)'}}
    >
      {children}
    </div>
  )
}

interface PopoverFooterProps {
  children: ReactNode
}

export function PopoverFooter({children}: PopoverFooterProps) {
  return (
    <div className='mt-2.5 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-500'>
      {children}
    </div>
  )
}
