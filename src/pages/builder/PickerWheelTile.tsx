import type {DragData} from '@/pages/builder/types';
import {useDraggable} from '@dnd-kit/core';

export interface PickerWheelTileProps {
  readonly wheelId?: string;
  readonly wheelName?: string;
  readonly wheelAsset?: string;
  readonly blockedText?: string | null;
  readonly isBlocked?: boolean;
  readonly isInUse?: boolean;
  readonly isOwned?: boolean;
  readonly isNotSet?: boolean;
  readonly onClick: () => void;
}

interface WheelStatusBadgeProps {
  readonly isNotSet: boolean;
  readonly isOwned: boolean;
  readonly blockedText: string | null;
}

function WheelStatusBadge({
  isNotSet,
  isOwned,
  blockedText,
}: WheelStatusBadgeProps) {
  if (blockedText) {
    return (
      <span className='pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90'>
        {blockedText}
      </span>
    );
  }
  if (!isNotSet && !isOwned) {
    return (
      <span className='pointer-events-none absolute inset-x-0 top-0 truncate border-y border-rose-300/25 bg-slate-950/70 px-1 py-0.5 text-center text-[9px] tracking-wide text-rose-100/95'>
        Unowned
      </span>
    );
  }
  return null;
}

function getButtonClasses(
  isBlocked: boolean,
  isSoftDimmed: boolean,
  isDragging: boolean,
): string {
  return joinClasses(
    'border p-1 text-left transition-colors',
    isBlocked ? 'border-slate-500/45 bg-slate-900/45 opacity-55' : '',
    !isBlocked && isSoftDimmed
      ? 'border-slate-500/45 bg-slate-900/45 opacity-55 hover:border-amber-200/45'
      : '',
    !isBlocked && !isSoftDimmed
      ? 'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45'
      : '',
    isDragging ? 'scale-[0.98] opacity-60' : '',
  );
}

function renderWheelVisual(
  wheelAsset?: string,
  wheelName?: string,
  wheelId?: string,
  isOwned?: boolean,
  isNotSet?: boolean,
  isDimmed?: boolean,
) {
  if (wheelAsset) {
    return (
      <img
        alt={`${wheelName ?? wheelId ?? ''} wheel`}
        className={joinClasses(
          'builder-picker-wheel-image h-full w-full object-cover',
          !isOwned && !isNotSet ? 'builder-picker-art-unowned' : '',
          isDimmed ? 'builder-picker-art-dimmed' : '',
        )}
        draggable={false}
        src={wheelAsset}
      />
    );
  }
  return (
    <span className='relative block h-full w-full'>
      <span className='sigil-placeholder sigil-placeholder-wheel sigil-placeholder-no-plus sigil-placeholder-remove' />
      <span className='sigil-remove-x' />
    </span>
  );
}

export function PickerWheelTile({
  wheelId,
  wheelName,
  wheelAsset,
  blockedText = null,
  isBlocked = false,
  isInUse = false,
  isOwned = true,
  isNotSet = false,
  onClick,
}: PickerWheelTileProps) {
  const isDimmed = isBlocked || isInUse || (!isOwned && !isNotSet);
  const isSoftDimmed = !isBlocked && (isInUse || (!isOwned && !isNotSet));
  const draggableEnabled = !isNotSet && Boolean(wheelId);

  const dragData: DragData | undefined =
    draggableEnabled && wheelId ? {kind: 'picker-wheel', wheelId} : undefined;

  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: draggableEnabled
      ? `picker-wheel:${wheelId ?? 'unknown'}`
      : `picker-wheel:not-set`,
    data: dragData,
    disabled: !draggableEnabled,
  });

  const dragAttributes = {...attributes} as Record<string, unknown>;
  delete dragAttributes['aria-disabled'];

  const buttonClasses = getButtonClasses(isBlocked, isSoftDimmed, isDragging);

  return (
    <button
      aria-disabled={isBlocked ? 'true' : undefined}
      className={buttonClasses}
      onClick={onClick}
      ref={setNodeRef}
      type='button'
      {...(draggableEnabled ? dragAttributes : {})}
      {...(draggableEnabled ? listeners : {})}
    >
      <div className='relative aspect-[75/113] overflow-hidden border border-slate-400/35 bg-slate-900/70'>
        {renderWheelVisual(
          wheelAsset,
          wheelName,
          wheelId,
          isOwned,
          isNotSet,
          isDimmed,
        )}
        <WheelStatusBadge
          blockedText={blockedText}
          isNotSet={isNotSet}
          isOwned={isOwned}
        />
      </div>
      <p className='mt-1 truncate text-[11px] text-slate-200'>
        {isNotSet ? 'Not Set' : (wheelName ?? wheelId)}
      </p>
    </button>
  );
}

function joinClasses(
  ...classes: readonly (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(' ');
}
