interface SegmentedControlOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface SegmentedControlProps<T extends string> {
  readonly value: T;
  readonly options: readonly SegmentedControlOption<T>[];
  readonly onChange: (nextValue: T) => void;
  readonly ariaLabel: string;
  readonly className?: string;
  readonly buttonClassName?: string;
  readonly activeButtonClassName?: string;
}

function joinClasses(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  buttonClassName = '',
  activeButtonClassName = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={`segmented-control ${className}`.trim()}
      role='group'
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            aria-pressed={isActive}
            className={joinClasses(
              'segmented-control__button',
              index === 0 && 'segmented-control__button-first',
              buttonClassName,
              isActive && 'segmented-control__button-active',
              isActive && activeButtonClassName,
            ).trim()}
            key={option.value}
            onClick={() => {
              onChange(option.value);
            }}
            type='button'
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
