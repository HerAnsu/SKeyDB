import {useId, type CSSProperties, type ReactNode, type RefObject} from 'react'

interface CatalogFiltersShellProps {
  searchLabel: string
  searchPlaceholder: string
  query: string
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  children: ReactNode
}

interface CatalogFilterRowProps {
  label: string
  children: ReactNode
  controlsClassName?: string
}

interface CatalogFilterChipButtonProps {
  active: boolean
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
}

function chipClass(active: boolean): string {
  return `inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors ${
    active
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

export function CatalogFilterRow({children, controlsClassName, label}: CatalogFilterRowProps) {
  return (
    <div className='flex items-center gap-3'>
      <span className='w-14 shrink-0 text-[10px] tracking-wide text-slate-500 uppercase'>
        {label}
      </span>
      <div className={controlsClassName ?? 'flex flex-wrap items-center gap-1.5'}>{children}</div>
    </div>
  )
}

export function CatalogFilterChipButton({
  active,
  children,
  onClick,
  style,
}: CatalogFilterChipButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={`${chipClass(active)} focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}

export function CatalogFiltersShell({
  children,
  filteredCount,
  onQueryChange,
  query,
  searchInputRef,
  searchLabel,
  searchPlaceholder,
  totalCount,
}: CatalogFiltersShellProps) {
  const searchInputId = useId()

  return (
    <div className='space-y-2 border-b border-slate-600/40 pb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <label className='sr-only' htmlFor={searchInputId}>
          {searchLabel}
        </label>
        <input
          autoComplete='off'
          className='max-w-md min-w-0 flex-1 border border-slate-800/95 bg-slate-950/90 px-3 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
          id={searchInputId}
          name='database-search'
          onChange={(event) => {
            onQueryChange(event.target.value)
          }}
          placeholder={searchPlaceholder}
          ref={searchInputRef}
          type='search'
          value={query}
        />
        <span className='text-[10px] text-slate-400'>
          {filteredCount}/{totalCount}
        </span>
      </div>
      {children}
    </div>
  )
}
