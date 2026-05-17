import {FaCaretDown, FaCaretUp} from 'react-icons/fa6'

import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'

const DATABASE_CONTROL_CLASS_NAME =
  'ui-compact-control ui-compact-control--field min-w-0 text-[11px] text-slate-200'

interface EntityViewControlsProps<TSortKey extends string> {
  sortKey: TSortKey
  sortDirection: CollectionSortDirection
  sortOptions: readonly TSortKey[]
  sortSelectAriaLabel: string
  sortDirectionAriaLabel: string
  getSortLabel: (key: TSortKey) => string
  getSortDirectionLabel: (key: TSortKey, direction: CollectionSortDirection) => string
  onSortKeyChange: (key: TSortKey) => void
  onSortDirectionToggle: () => void
  groupByRealm?: boolean
  onGroupByRealmChange?: (next: boolean) => void
}

export function EntityViewControls<TSortKey extends string>({
  getSortDirectionLabel,
  getSortLabel,
  groupByRealm,
  onGroupByRealmChange,
  onSortDirectionToggle,
  onSortKeyChange,
  sortDirection,
  sortDirectionAriaLabel,
  sortKey,
  sortOptions,
  sortSelectAriaLabel,
}: EntityViewControlsProps<TSortKey>) {
  const directionLabel = getSortDirectionLabel(sortKey, sortDirection)

  return (
    <div
      aria-label='Database view controls'
      className='flex flex-wrap items-center gap-1.5'
      role='group'
    >
      <span className='text-[10px] tracking-[0.16em] text-slate-500 uppercase'>Sort</span>
      <select
        aria-label={sortSelectAriaLabel}
        className={`database-sort-select flex-1 ${DATABASE_CONTROL_CLASS_NAME}`}
        onChange={(event) => {
          onSortKeyChange(event.target.value as TSortKey)
        }}
        value={sortKey}
      >
        {sortOptions.map((option) => (
          <option className='database-sort-select__option' key={option} value={option}>
            {getSortLabel(option)}
          </option>
        ))}
      </select>
      <button
        aria-label={sortDirectionAriaLabel}
        className={`inline-flex items-center justify-center gap-1 ${DATABASE_CONTROL_CLASS_NAME}`}
        onClick={onSortDirectionToggle}
        type='button'
      >
        {sortDirection === 'DESC' ? (
          <FaCaretDown aria-hidden className='text-[11px]' />
        ) : (
          <FaCaretUp aria-hidden className='text-[11px]' />
        )}
        <span>{directionLabel}</span>
      </button>
      {groupByRealm !== undefined && onGroupByRealmChange ? (
        <FilterChipButton
          active={groupByRealm}
          ariaLabel='Toggle grouping by realm'
          onClick={() => {
            onGroupByRealmChange(!groupByRealm)
          }}
        >
          Group by realm
        </FilterChipButton>
      ) : null}
    </div>
  )
}
