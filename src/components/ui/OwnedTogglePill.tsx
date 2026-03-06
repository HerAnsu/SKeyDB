import {TogglePill} from '@/components/ui/TogglePill';

interface OwnedTogglePillProps {
  readonly owned: boolean;
  readonly onToggle: () => void;
  readonly className?: string;
  readonly variant?: 'default' | 'flat';
  readonly onLabel?: string;
  readonly offLabel?: string;
}

export function OwnedTogglePill({
  owned,
  onToggle,
  className = '',
  variant = 'default',
  onLabel = 'Owned',
  offLabel = 'Unowned',
}: OwnedTogglePillProps) {
  return (
    <TogglePill
      aria-label={owned ? 'Set unowned' : 'Set owned'}
      checked={owned}
      className={className}
      offLabel={offLabel}
      onChange={() => {
        onToggle();
      }}
      onLabel={onLabel}
      variant={variant}
    />
  );
}
