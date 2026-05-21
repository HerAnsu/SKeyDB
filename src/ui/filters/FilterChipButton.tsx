import type {CSSProperties, KeyboardEventHandler, MouseEventHandler, ReactNode} from 'react'

interface FilterChipButtonProps {
  active: boolean
  ariaControls?: string
  ariaExpanded?: boolean
  ariaHasPopup?: 'menu'
  ariaLabel?: string
  children: ReactNode
  className?: string
  onClick: () => void
  onContextMenu?: MouseEventHandler<HTMLButtonElement>
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>
  style?: CSSProperties
}

function chipClass(active: boolean): string {
  return `ui-compact-control ui-compact-control--pressed shrink-0 text-[11px] ${
    active ? 'text-amber-50' : ''
  }`
}

export function FilterChipButton({
  active,
  ariaControls,
  ariaExpanded,
  ariaHasPopup,
  ariaLabel,
  children,
  className = '',
  onClick,
  onContextMenu,
  onKeyDown,
  style,
}: FilterChipButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-pressed={active}
      className={`${chipClass(active)} ${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}
