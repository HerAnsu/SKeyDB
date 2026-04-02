import type {ReactNode} from 'react'

import {scaledFontStyle} from './font-scale'
import {DATABASE_ITEM_NAME_CLASS, DATABASE_SECTION_TITLE_CLASS} from './text-styles'

export interface DetailSectionItem {
  key: string
  label: ReactNode
  name: string
  description: string
}

type DetailSectionProps = Readonly<{
  title: string
  items: DetailSectionItem[]
  emptyMessage?: string
  children?: ReactNode
  renderDescription?: (description: string) => ReactNode
}>

export function DetailSection({
  title,
  items,
  emptyMessage,
  children,
  renderDescription,
}: DetailSectionProps) {
  return (
    <div>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(20)}>
        {title}
      </h4>

      {items.length === 0 && !children ? (
        <p className='px-4 pb-3 text-xs text-slate-400'>{emptyMessage ?? 'No data available.'}</p>
      ) : (
        <div className='flex flex-col gap-y-3 pt-0 pb-2'>
          {items.map((item) => (
            <div
              className='border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 shadow-sm'
              key={item.key}
            >
              <div className='m-0 flex items-center text-slate-300' style={scaledFontStyle(12)}>
                <span className='flex items-center text-slate-500'>{item.label}</span>
                <span className='mx-1.5 self-center text-slate-600'>·</span>
                <span className={`${DATABASE_ITEM_NAME_CLASS} self-center`}>{item.name}</span>
              </div>
              <div className='my-2 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent' />
              <div className='mt-1 pl-2 leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
                {renderDescription ? renderDescription(item.description) : item.description}
              </div>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
