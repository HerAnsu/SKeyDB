import type {ReactNode} from 'react'

import type {DatabaseDetailSharedPreferences} from '@/domain/database-detail-preferences'

import {FONT_SCALE_OPTIONS} from './font-scale'

interface DatabaseDetailSettingsPanelProps {
  children?: ReactNode
  sharedPreferences: DatabaseDetailSharedPreferences
  onUpdateSharedPreferences: (nextPartial: Partial<DatabaseDetailSharedPreferences>) => void
}

export function DatabaseDetailSettingsPanel({
  children,
  sharedPreferences,
  onUpdateSharedPreferences,
}: DatabaseDetailSettingsPanelProps) {
  return (
    <div className='absolute top-[calc(100%+0.45rem)] right-0 z-[905] w-[min(24rem,calc(100vw-2rem))] border border-amber-200/40 bg-slate-950/[.985] p-3 shadow-[0_16px_36px_rgba(2,6,23,0.64)]'>
      <div className='space-y-3'>
        <div className='space-y-2'>
          <label className='flex items-start gap-2 text-left'>
            <input
              checked={sharedPreferences.showTagIcons}
              className='mt-0.5 h-3.5 w-3.5 accent-amber-200'
              onChange={(event) => {
                onUpdateSharedPreferences({showTagIcons: event.target.checked})
              }}
              type='checkbox'
            />
            <span>
              <span className='block text-[11px] text-slate-200'>Show tag icons</span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Show overlay icons inline with colored mechanic tags in skills, popovers, and
                descriptions.
              </span>
            </span>
          </label>

          <label className='flex items-start gap-2 text-left'>
            <input
              checked={sharedPreferences.clickOutsideClosesPopovers}
              className='mt-0.5 h-3.5 w-3.5 accent-amber-200'
              onChange={(event) => {
                onUpdateSharedPreferences({clickOutsideClosesPopovers: event.target.checked})
              }}
              type='checkbox'
            />
            <span>
              <span className='block text-[11px] text-slate-200'>
                Click outside closes popovers
              </span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Clicking away from the popover stack closes all open popovers before closing the
                detail modal.
              </span>
            </span>
          </label>
        </div>

        <div>
          <p className='mb-1 text-[10px] tracking-[0.16em] text-slate-500 uppercase'>
            Default text size
          </p>
          <div className='flex items-center gap-1'>
            {FONT_SCALE_OPTIONS.map((option) => (
              <button
                className={`min-w-8 border px-2 py-1 text-[10px] tracking-wide uppercase transition-colors ${
                  sharedPreferences.fontScale === option.id
                    ? 'border-amber-200/60 bg-amber-200/12 text-amber-100'
                    : 'border-slate-600/35 bg-slate-950/50 text-slate-400 hover:border-slate-400/50 hover:text-slate-200'
                }`}
                key={option.id}
                onClick={() => {
                  onUpdateSharedPreferences({fontScale: option.id})
                }}
                type='button'
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
