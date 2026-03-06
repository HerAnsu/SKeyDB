import type {DragData} from '@/pages/builder/types';
import {useDraggable} from '@dnd-kit/core';

export interface PickerCovenantTileProps {
  readonly covenantId?: string;
  readonly covenantName?: string;
  readonly covenantAsset?: string;
  readonly isNotSet?: boolean;
  readonly onClick: () => void;
}

function renderCovenantVisual(
  covenantAsset?: string,
  isNotSet?: boolean,
  displayName?: string,
) {
  if (covenantAsset) {
    return (
      <img
        alt={`${displayName ?? 'Unknown'} covenant`}
        className='h-full w-full object-cover'
        draggable={false}
        src={covenantAsset}
      />
    );
  }
  if (isNotSet) {
    return (
      <span className='builder-disabled-icon'>
        <span className='builder-disabled-icon__glyph' />
      </span>
    );
  }
  return (
    <span className='relative block h-full w-full'>
      <span className='sigil-placeholder' />
    </span>
  );
}

export function PickerCovenantTile({
  covenantId,
  covenantName,
  covenantAsset,
  isNotSet = false,
  onClick,
}: PickerCovenantTileProps) {
  const safeId = covenantId ?? 'unknown';
  const displayName = isNotSet
    ? 'Not Set'
    : (covenantName ?? covenantId ?? 'Unknown');
  const draggableEnabled = !isNotSet && Boolean(covenantId);

  const dragData: DragData | undefined =
    draggableEnabled && covenantId
      ? {kind: 'picker-covenant', covenantId}
      : undefined;

  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: draggableEnabled
      ? `picker-covenant:${safeId}`
      : 'picker-covenant:not-set',
    data: dragData,
    disabled: !draggableEnabled,
  });

  const dragAttributes = {...attributes} as Record<string, unknown>;
  delete dragAttributes['aria-disabled'];

  let buttonClassName =
    'border p-1 text-left transition-colors border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45';
  if (isDragging) {
    buttonClassName += ' scale-[0.98] opacity-60';
  }

  return (
    <button
      aria-label={isNotSet ? 'Not set covenant' : `${displayName} covenant`}
      className={buttonClassName}
      onClick={() => {
        onClick();
      }}
      ref={setNodeRef}
      type='button'
      {...(draggableEnabled ? dragAttributes : {})}
      {...(draggableEnabled ? listeners : {})}
    >
      <div className='relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70'>
        {renderCovenantVisual(covenantAsset, isNotSet, displayName)}
      </div>
      <p className='mt-1 truncate text-[11px] text-slate-200'>{displayName}</p>
    </button>
  );
}
