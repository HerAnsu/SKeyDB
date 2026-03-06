import {useHoldRepeatAction} from '@/pages/collection/useHoldRepeatAction';

export interface CollectionLevelStepButtonProps {
  readonly ariaLabel: string;
  readonly disabled: boolean;
  readonly direction: 'up' | 'down';
  readonly onStep: () => void;
  readonly className?: string;
  readonly glyphClassName?: string;
}

export function CollectionLevelStepButton({
  ariaLabel,
  disabled,
  direction,
  onStep,
  className,
  glyphClassName,
}: CollectionLevelStepButtonProps) {
  const hold = useHoldRepeatAction({onStep, disabled});
  const glyphPath =
    direction === 'up' ? 'M3.2 10.2 8 5.5l4.8 4.7' : 'M3.2 5.8 8 10.5l4.8-4.7';

  return (
    <button
      aria-label={ariaLabel}
      className={className ?? 'collection-step-btn'}
      disabled={disabled}
      onBlur={hold.onBlur}
      onClick={hold.onClick}
      onPointerCancel={hold.onPointerCancel}
      onPointerDown={hold.onPointerDown}
      onPointerLeave={hold.onPointerLeave}
      onPointerUp={hold.onPointerUp}
      type='button'
    >
      <svg
        aria-hidden='true'
        className={glyphClassName ?? 'collection-step-glyph'}
        viewBox='0 0 16 16'
      >
        <path
          d={glyphPath}
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='1.8'
        />
      </svg>
    </button>
  );
}
