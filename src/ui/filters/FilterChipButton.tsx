import type {CSSProperties, ReactNode} from 'react'

interface FilterChipButtonProps {
  active: boolean
  ariaLabel?: string
  children: ReactNode
  className?: string
  onClick: () => void
  style?: CSSProperties
}

function chipClass(active: boolean): string {
  return `ui-compact-control ui-compact-control--pressed shrink-0 text-[11px] ${
    active ? 'text-amber-50' : ''
  }`
}

export function FilterChipButton({
  active,
  ariaLabel,
  children,
  className = '',
  onClick,
  style,
}: FilterChipButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`${chipClass(active)} ${className}`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}
