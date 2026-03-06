import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay';
import {getCovenantAssetById} from '@/domain/covenant-assets';
import {getWheelAssetById} from '@/domain/wheel-assets';
import {
  makeCovenantDropZoneId,
  makeWheelDropZoneId,
} from '@/pages/builder/dnd-ids';
import type {
  DragData,
  PredictedDropHover,
  TeamSlot,
} from '@/pages/builder/types';
import {useDraggable, useDroppable} from '@dnd-kit/core';

export interface CardWheelZoneProps {
  readonly slot: TeamSlot;
  readonly interactive: boolean;
  readonly wheelKeyPrefix: string;
  readonly showOwnership?: boolean;
  readonly compactCovenant?: boolean;
  readonly activeWheelIndex?: number | null;
  readonly isCovenantActive?: boolean;
  readonly activeDragKind?: DragData['kind'] | null;
  readonly predictedDropHover?: PredictedDropHover;
  readonly onRemoveActiveWheel?: () => void;
  readonly onWheelSlotClick?: (wheelIndex: number) => void;
  readonly onCovenantSlotClick?: () => void;
  readonly awakenerLevel?: number;
  readonly awakenerOwnedLevel?: number | null;
  readonly wheelOwnedLevels?: [number | null, number | null];
  readonly allowActiveRemoval?: boolean;
}

export interface CardWheelTileProps {
  readonly slotId: string;
  readonly wheelId: string | null;
  readonly wheelIndex: number;
  readonly interactive: boolean;
  readonly allowActiveRemoval?: boolean;
  readonly activeDragKind?: DragData['kind'] | null;
  readonly predictedDropHover?: PredictedDropHover;
  readonly isActive: boolean;
  readonly ownedLevel?: number | null;
  readonly showOwnership?: boolean;
  readonly onRemove?: () => void;
  readonly onClick?: (wheelIndex: number) => void;
}

export interface CardCovenantTileProps {
  readonly slotId: string;
  readonly covenantId: string | undefined;
  readonly interactive: boolean;
  readonly activeDragKind?: DragData['kind'] | null;
  readonly predictedDropHover?: PredictedDropHover;
  readonly isActive: boolean;
  readonly onClick?: () => void;
}

function CovenantPlaceholderSvg() {
  return (
    <svg
      aria-hidden
      className='builder-covenant-placeholder-svg'
      preserveAspectRatio='xMidYMid meet'
      shapeRendering='geometricPrecision'
      viewBox='0 0 15 15'
    >
      <circle
        className='builder-covenant-placeholder-ring'
        cx='7.5'
        cy='7.5'
        fill='none'
        r='9.5'
        stroke='#eff0de33'
        strokeWidth='0.65'
      />
      <path
        d='M14 4.213 7.5.42 1 4.213v6.574l6.5 3.792 6.5-3.792z'
        fill='none'
        stroke='#eff0de33'
        strokeWidth='0.65'
      />
      <rect
        className='builder-covenant-placeholder-diamond'
        fill='none'
        height='72%'
        stroke='#080e18'
        strokeWidth='0.4'
        transform='rotate(45 7.5 7.5)'
        width='72%'
        x='14%'
        y='14%'
      />
      <rect
        className='builder-covenant-placeholder-diamond-accent'
        fill='none'
        height='64%'
        stroke='#e6d6a67a'
        strokeWidth='0.65'
        transform='rotate(45 7.5 7.5)'
        width='64%'
        x='18%'
        y='18%'
      />
      <line
        className='builder-covenant-placeholder-plus'
        x1='4'
        x2='11'
        y1='7.5'
        y2='7.5'
      />
      <line
        className='builder-covenant-placeholder-plus'
        x1='7.5'
        x2='7.5'
        y1='4'
        y2='11'
      />
    </svg>
  );
}

function renderCovenantTileVisual(covenantId: string | undefined) {
  const contentClassName =
    'covenant-tile-content absolute inset-0 rounded-full';

  if (!covenantId) {
    return (
      <span
        className={`${contentClassName} flex items-center justify-center bg-slate-900/60`}
      >
        <CovenantPlaceholderSvg />
      </span>
    );
  }

  const asset = getCovenantAssetById(covenantId);
  if (!asset) {
    return (
      <span
        className={`${contentClassName} bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]`}
      />
    );
  }

  return (
    <span className={`${contentClassName} bg-slate-950/85`}>
      <img
        alt=''
        className='builder-card-covenant-image h-full w-full object-cover'
        draggable={false}
        src={asset}
      />
    </span>
  );
}

function renderWheelTileVisual(wheelId: string | null) {
  if (!wheelId) {
    return (
      <span className='wheel-tile-content absolute inset-[2px] border border-slate-700/70 bg-slate-900/60'>
        <span className='sigil-placeholder sigil-placeholder-wheel' />
      </span>
    );
  }

  const asset = getWheelAssetById(wheelId);
  if (!asset) {
    return (
      <span className='wheel-tile-content absolute inset-[2px] border border-slate-200/20 bg-[linear-gradient(180deg,#1e3a5f_0%,#0b1220_100%)]' />
    );
  }

  return (
    <span className='wheel-tile-content absolute inset-[2px] overflow-hidden border border-slate-200/20'>
      <img
        alt={`${wheelId} wheel`}
        className='builder-card-wheel-image h-full w-full object-cover'
        draggable={false}
        src={asset}
      />
    </span>
  );
}

function CardCovenantTile({
  slotId,
  covenantId,
  interactive,
  activeDragKind,
  predictedDropHover,
  isActive,
  onClick,
}: CardCovenantTileProps) {
  const dropZoneId = makeCovenantDropZoneId(slotId);
  const {isOver, setNodeRef: setDroppableRef} = useDroppable({id: dropZoneId});
  const draggableEnabled = interactive && Boolean(covenantId);

  const dragData: DragData | undefined =
    draggableEnabled && covenantId
      ? {kind: 'team-covenant', slotId, covenantId}
      : undefined;

  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team-covenant:${slotId}`,
    data: dragData,
    disabled: !draggableEnabled,
  });

  const canShowDirectOver =
    activeDragKind === 'picker-covenant' || activeDragKind === 'team-covenant';
  const isPredictedOver =
    predictedDropHover?.kind === 'covenant' &&
    predictedDropHover.slotId === slotId;
  const showOver = isPredictedOver || (isOver && canShowDirectOver);

  let tileClassName =
    'covenant-tile group/covenant relative z-20 aspect-square';
  if (isActive) tileClassName += ' covenant-tile-active';
  if (showOver) tileClassName += ' covenant-tile-over';
  if (isDragging) tileClassName += ' opacity-65';

  const tileVisual = <>{renderCovenantTileVisual(covenantId)}</>;

  if (!interactive) {
    return <div className={tileClassName}>{tileVisual}</div>;
  }

  return (
    <div className={tileClassName} ref={setDroppableRef}>
      <button
        aria-label={covenantId ? 'Edit covenant' : 'Set covenant'}
        className='absolute inset-0 z-20'
        onClick={() => {
          onClick?.();
        }}
        ref={draggableEnabled ? setDraggableRef : undefined}
        type='button'
        {...(draggableEnabled ? attributes : {})}
        {...(draggableEnabled ? listeners : {})}
      />
      {tileVisual}
    </div>
  );
}

function getWheelTileClassName(
  isActive: boolean,
  showOver: boolean,
  isDragging: boolean,
  isOwned: boolean,
  wheelId: string | null,
) {
  let cls =
    'wheel-tile group/wheel relative z-20 aspect-[75/113] overflow-hidden bg-slate-700/30 p-[1px]';
  if (isActive) cls += ' wheel-tile-active';
  if (showOver) cls += ' wheel-tile-over';
  if (isDragging) cls += ' opacity-65';
  if (!isOwned && wheelId) cls += ' wheel-tile-unowned';
  return cls;
}

function WheelOwnershipDisplay({
  showOwnership,
  wheelId,
  isOwned,
  ownedLevel,
}: Readonly<{
  showOwnership: boolean;
  wheelId: string | null;
  isOwned: boolean;
  ownedLevel: number | null;
}>) {
  if (!showOwnership || !wheelId) {
    return null;
  }
  if (isOwned && ownedLevel !== null) {
    return (
      <DupeLevelDisplay
        className='builder-wheel-dupe builder-wheel-dupe-stacked builder-dupe-owned pb-1'
        level={ownedLevel}
      />
    );
  }
  return <span className='builder-unowned-chip'>Unowned</span>;
}

function CardWheelTile({
  slotId,
  wheelId,
  wheelIndex,
  interactive,
  allowActiveRemoval = true,
  activeDragKind,
  predictedDropHover,
  isActive,
  ownedLevel = null,
  showOwnership = true,
  onRemove,
  onClick,
}: CardWheelTileProps) {
  const dropZoneId = makeWheelDropZoneId(slotId, wheelIndex);
  const {isOver, setNodeRef: setDroppableRef} = useDroppable({id: dropZoneId});
  const draggableEnabled = interactive && Boolean(wheelId);

  const dragData: DragData | undefined =
    draggableEnabled && wheelId
      ? {kind: 'team-wheel', slotId, wheelIndex, wheelId}
      : undefined;

  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team-wheel:${slotId}:${String(wheelIndex)}`,
    data: dragData,
    disabled: !draggableEnabled,
  });

  const canShowDirectOver =
    activeDragKind === 'picker-wheel' || activeDragKind === 'team-wheel';
  const isPredictedOver =
    predictedDropHover?.kind === 'wheel' &&
    predictedDropHover.slotId === slotId &&
    predictedDropHover.wheelIndex === wheelIndex;
  const showOver = isPredictedOver || (isOver && canShowDirectOver);

  const isOwned = ownedLevel !== null;
  const tileClassName = getWheelTileClassName(
    isActive,
    showOver,
    isDragging,
    isOwned,
    wheelId,
  );

  const tileVisual = (
    <>
      <span className='wheel-tile-frame absolute inset-0 border border-slate-200/45' />
      {renderWheelTileVisual(wheelId)}
    </>
  );

  if (!interactive) {
    return <div className={tileClassName}>{tileVisual}</div>;
  }

  return (
    <div className={tileClassName} ref={setDroppableRef}>
      <button
        aria-label={wheelId ? 'Edit wheel' : 'Set wheel'}
        className='absolute inset-0 z-20'
        onClick={() => {
          onClick?.(wheelIndex);
        }}
        ref={draggableEnabled ? setDraggableRef : undefined}
        type='button'
        {...(draggableEnabled ? attributes : {})}
        {...(draggableEnabled ? listeners : {})}
      />
      {allowActiveRemoval && isActive && wheelId ? (
        <button
          aria-label='Remove active wheel'
          className='builder-card-remove-button absolute -top-0.5 -right-0.5 z-40 h-7 w-7'
          data-card-remove='true'
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove?.();
          }}
          type='button'
        >
          <span className='sigil-placeholder sigil-placeholder-no-plus sigil-placeholder-remove builder-card-remove-sigil builder-card-remove-sigil-wheel' />
          <span className='sigil-remove-x builder-card-remove-x' />
        </button>
      ) : null}
      <WheelOwnershipDisplay
        isOwned={isOwned}
        ownedLevel={ownedLevel}
        showOwnership={showOwnership}
        wheelId={wheelId}
      />
      {tileVisual}
    </div>
  );
}

export function CardWheelZone({
  slot,
  interactive,
  wheelKeyPrefix,
  showOwnership = true,
  compactCovenant = false,
  activeWheelIndex = null,
  isCovenantActive = false,
  activeDragKind = null,
  predictedDropHover = null,
  onRemoveActiveWheel,
  onWheelSlotClick,
  onCovenantSlotClick,
  awakenerLevel = 60,
  awakenerOwnedLevel = null,
  wheelOwnedLevels = [null, null],
  allowActiveRemoval = true,
}: CardWheelZoneProps) {
  return (
    <div
      className={`builder-card-wheel-zone pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2 ${
        compactCovenant ? 'builder-card-wheel-zone-ghost' : ''
      }`}
    >
      <div className='builder-card-meta-row flex items-end gap-2 pb-2'>
        <div className='builder-card-meta-left pointer-events-none min-w-0 flex-1 pb-1'>
          {showOwnership && slot.awakenerName && awakenerOwnedLevel !== null ? (
            <p className='builder-awakener-level'>
              <span className='builder-awakener-level-prefix'>Lv.</span>
              <span className='builder-awakener-level-value'>
                {awakenerLevel}
              </span>
            </p>
          ) : null}
          {showOwnership && awakenerOwnedLevel !== null ? (
            <DupeLevelDisplay
              className='builder-awakener-dupe builder-awakener-dupe-meta builder-dupe-owned'
              level={awakenerOwnedLevel}
            />
          ) : null}
        </div>
        <div className='builder-card-covenant-wrap shrink-0 self-end'>
          <CardCovenantTile
            activeDragKind={activeDragKind}
            covenantId={slot.covenantId}
            interactive={interactive}
            isActive={isCovenantActive}
            onClick={() => {
              onCovenantSlotClick?.();
            }}
            predictedDropHover={predictedDropHover}
            slotId={slot.slotId}
          />
        </div>
      </div>

      <div className='builder-card-wheel-grid mt-1.5 grid grid-cols-2 gap-1.5'>
        {slot.wheels.map((wheelId, index) => (
          <CardWheelTile
            activeDragKind={activeDragKind}
            allowActiveRemoval={allowActiveRemoval}
            interactive={interactive}
            isActive={activeWheelIndex === index}
            key={`${wheelKeyPrefix}-wheel-${String(index)}`}
            onClick={() => {
              onWheelSlotClick?.(index);
            }}
            onRemove={
              allowActiveRemoval
                ? () => {
                    onRemoveActiveWheel?.();
                  }
                : undefined
            }
            ownedLevel={wheelOwnedLevels[index] ?? null}
            predictedDropHover={predictedDropHover}
            showOwnership={showOwnership}
            slotId={slot.slotId}
            wheelId={wheelId}
            wheelIndex={index}
          />
        ))}
      </div>
    </div>
  );
}
