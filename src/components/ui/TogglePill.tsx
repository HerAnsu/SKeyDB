interface TogglePillProps {
  readonly checked: boolean;
  readonly onChange: (nextChecked: boolean) => void;
  readonly className?: string;
  readonly variant?: 'default' | 'flat';
  readonly onLabel?: string;
  readonly offLabel?: string;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
}

export function TogglePill({
  checked,
  onChange,
  className = '',
  variant = 'default',
  onLabel = 'On',
  offLabel = 'Off',
  ariaLabel,
  disabled = false,
}: TogglePillProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`ownership-pill ${variant === 'flat' ? 'ownership-pill-flat' : ''} ${className}`.trim()}
      data-checked={checked ? 'true' : 'false'}
      data-owned={checked ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
      }}
      type='button'
    >
      <span className='ownership-pill__track' />
      <span className='ownership-pill__thumb'>
        <span className='ownership-pill__label ownership-pill__label-unowned'>
          {offLabel}
        </span>
        <span className='ownership-pill__label ownership-pill__label-owned'>
          {onLabel}
        </span>
      </span>
    </button>
  );
}
