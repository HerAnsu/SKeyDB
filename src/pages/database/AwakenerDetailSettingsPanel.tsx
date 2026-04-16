import {useState} from 'react'

import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import type {DatabaseDetailPreferences} from '@/domain/database-detail-preferences'

import {AwakenerDetailStateControls} from './AwakenerDetailStateControls'
import {FONT_SCALE_OPTIONS} from './font-scale'

interface AwakenerDetailSettingsPanelProps {
  controls: AwakenerDatabaseControls
  defaultSelection: AwakenerDatabaseSelection
  preferences: DatabaseDetailPreferences
  onPatchDefaultSelection: (nextPartial: Partial<AwakenerDatabaseSelection>) => void
  onUpdatePreferences: (nextPartial: Partial<DatabaseDetailPreferences>) => void
}

export function AwakenerDetailSettingsPanel({
  controls,
  defaultSelection,
  preferences,
  onPatchDefaultSelection,
  onUpdatePreferences,
}: AwakenerDetailSettingsPanelProps) {
  const [showDefaultProgression, setShowDefaultProgression] = useState(false)

  return (
    <div className='absolute top-[calc(100%+0.45rem)] right-0 z-[905] w-[min(24rem,calc(100vw-2rem))] border border-amber-200/40 bg-slate-950/[.985] p-3 shadow-[0_16px_36px_rgba(2,6,23,0.64)]'>
      <div className='space-y-3'>
        <div className='space-y-2'>
          <label className='flex items-start gap-2 text-left'>
            <input
              checked={preferences.showVisibleScaling}
              className='mt-0.5 h-3.5 w-3.5 accent-amber-200'
              onChange={(event) => {
                onUpdatePreferences({showVisibleScaling: event.target.checked})
              }}
              type='checkbox'
            />
            <span>
              <span className='block text-[11px] text-slate-200'>Show visible scaling</span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Show formulas inline as <span className='text-slate-400'>(24% ATK)</span> next to
                computed numbers.
              </span>
            </span>
          </label>

          <label className='flex items-start gap-2 text-left'>
            <input
              checked={preferences.showTagIcons}
              className='mt-0.5 h-3.5 w-3.5 accent-amber-200'
              onChange={(event) => {
                onUpdatePreferences({showTagIcons: event.target.checked})
              }}
              type='checkbox'
            />
            <span>
              <span className='block text-[11px] text-slate-200'>Show tag icons</span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Show overlay icons inline with colored mechanic tags in cards, popovers, and
                descriptions.
              </span>
            </span>
          </label>

          <label className='flex items-start gap-2 text-left'>
            <input
              checked={preferences.clickOutsideClosesPopovers}
              className='mt-0.5 h-3.5 w-3.5 accent-amber-200'
              onChange={(event) => {
                onUpdatePreferences({clickOutsideClosesPopovers: event.target.checked})
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
                  preferences.fontScale === option.id
                    ? 'border-amber-200/60 bg-amber-200/12 text-amber-100'
                    : 'border-slate-600/35 bg-slate-950/50 text-slate-400 hover:border-slate-400/50 hover:text-slate-200'
                }`}
                key={option.id}
                onClick={() => {
                  onUpdatePreferences({fontScale: option.id})
                }}
                type='button'
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className='border border-slate-700/45 bg-slate-900/40'>
          <button
            aria-expanded={showDefaultProgression}
            className='flex w-full items-center justify-between px-3 py-2 text-left'
            onClick={() => {
              setShowDefaultProgression((prev) => !prev)
            }}
            type='button'
          >
            <span>
              <span className='block text-[11px] text-slate-200'>Default progression</span>
              <span className='block text-[10px] text-slate-500'>
                Applies when opening a different awakener next time.
              </span>
            </span>
            <span className='text-[10px] text-slate-500 uppercase'>
              {showDefaultProgression ? 'Hide' : 'Show'}
            </span>
          </button>
          {showDefaultProgression ? (
            <div className='border-t border-slate-700/45 px-3 py-3'>
              <AwakenerDetailStateControls
                compact
                controls={controls}
                onPatchSelection={onPatchDefaultSelection}
                selection={defaultSelection}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
