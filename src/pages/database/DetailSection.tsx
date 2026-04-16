import type {ReactNode} from 'react'

import type {DescribedRecord} from '@/domain/description-records'

import {scaledFontStyle} from './font-scale'
import {DATABASE_ITEM_NAME_CLASS, DATABASE_SECTION_TITLE_CLASS} from './text-styles'

export interface DetailSectionItem {
  key: string
  label: ReactNode
  name: string
  description: string
  keywordFooterText?: string
  record?: DescribedRecord
  descriptionRank?: number
  descriptionMaxRank?: number
  meta?: ReactNode
}

interface DetailSectionProps {
  title: string
  items: DetailSectionItem[]
  emptyMessage?: string
  children?: ReactNode
  renderDescription?: (item: DetailSectionItem) => ReactNode
}

export function DetailSection({
  title,
  items,
  emptyMessage,
  children,
  renderDescription,
}: DetailSectionProps) {
  return (
    <div className='border border-slate-600/30 bg-slate-900/30'>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(14)}>
        {title}
      </h4>

      {items.length === 0 && !children ? (
        <p className='px-4 pb-3 text-xs text-slate-400'>{emptyMessage ?? 'No data available.'}</p>
      ) : (
        <div>
          {items.map((item, index) => (
            <div key={item.key}>
              {index > 0 ? (
                <div className='mx-4 h-px bg-gradient-to-r from-slate-600/50 via-slate-600/20 to-transparent' />
              ) : null}
              <div className='px-4 py-2.5'>
                <div className='flex items-start justify-between gap-3'>
                  <p className='min-w-0 text-slate-300' style={scaledFontStyle(12)}>
                    <span className={DATABASE_ITEM_NAME_CLASS}>{item.name}</span>
                    <span className='mx-1.5 text-slate-600'>·</span>
                    <span className='text-slate-500'>{item.label}</span>
                  </p>
                  {item.meta ? <div className='shrink-0'>{item.meta}</div> : null}
                </div>
                <p className='mt-1 leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
                  {renderDescription ? renderDescription(item) : item.description}
                </p>
              </div>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
