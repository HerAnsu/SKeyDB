import {FaCaretDown, FaCaretUp} from 'react-icons/fa6'

import type {CollectionSortDirection} from '@/domain/collection-sorting'

const chipSurfaceClass =
  'h-8 rounded-[2px] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(13,20,34,0.9),rgba(8,13,24,0.84))] px-2.5 text-[11px] leading-none text-slate-200 outline-none transition-colors hover:border-slate-500/70 focus:border-amber-300/60 focus-visible:border-amber-300/60'

interface DatabaseSortControlsProps<TSortKey extends string> {
  sortKey: TSortKey
  sortDirection: CollectionSortDirection
  sortOptions: readonly TSortKey[]
  sortSelectAriaLabel: string
  sortDirectionAriaLabel: string
  getSortLabel: (key: TSortKey) => string
  getSortDirectionLabel: (key: TSortKey, direction: CollectionSortDirection) => string
  onSortKeyChange: (key: TSortKey) => void
  onSortDirectionToggle: () => void
}

export function DatabaseSortControls<TSortKey extends string>({
  getSortDirectionLabel,
  getSortLabel,
  onSortDirectionToggle,
  onSortKeyChange,
  sortDirection,
  sortDirectionAriaLabel,
  sortKey,
  sortOptions,
  sortSelectAriaLabel,
}: DatabaseSortControlsProps<TSortKey>) {
  return (
    <div className='inline-flex items-center gap-1.5'>
      <span className='text-[10px] tracking-[0.16em] text-slate-500 uppercase'>Sort</span>
      <select
        aria-label={sortSelectAriaLabel}
        className={`${chipSurfaceClass} min-w-0 [color-scheme:dark]`}
        onChange={(event) => {
          onSortKeyChange(event.target.value as TSortKey)
        }}
        value={sortKey}
      >
        {sortOptions.map((option) => (
          <option key={option} value={option}>
            {getSortLabel(option)}
          </option>
        ))}
      </select>
      <button
        aria-label={sortDirectionAriaLabel}
        className={`${chipSurfaceClass} inline-flex items-center gap-1`}
        onClick={onSortDirectionToggle}
        type='button'
      >
        {sortDirection === 'DESC' ? (
          <FaCaretDown aria-hidden className='text-[11px]' />
        ) : (
          <FaCaretUp aria-hidden className='text-[11px]' />
        )}
        <span>{getSortDirectionLabel(sortKey, sortDirection)}</span>
      </button>
    </div>
  )
}
