import {
  getAwakenerCardAsset,
  getAwakenerPortraitAsset,
} from '@/domain/awakener-assets';
import {getCovenantAssetById} from '@/domain/covenant-assets';
import {getRealmTint} from '@/domain/factions';
import {getWheelAssetById} from '@/domain/wheel-assets';
import {makeTeamPreviewSlotDropZoneId} from '@/pages/builder/dnd-ids';
import type {DragData, TeamPreviewMode, TeamSlot} from '@/pages/builder/types';
import {useDraggable, useDroppable} from '@dnd-kit/core';

export interface BuilderTeamSlotPreviewProps {
  readonly slot: TeamSlot;
  readonly teamId: string;
  readonly slotIndex: number;
  readonly mode: TeamPreviewMode;
  readonly ownedAwakenerLevelByName: Map<string, number | null>;
  readonly ownedWheelLevelById: Map<string, number | null>;
  readonly enableDragAndDrop: boolean;
}

const EMPTY_OWNERSHIP_MAP = new Map<string, number | null>();

function CompactSlotContent({
  slot,
  isOwned,
}: Readonly<{slot: TeamSlot; isOwned: boolean}>) {
  if (!slot.awakenerName) {
    return (
      <span className='relative block h-full w-full'>
        <span className='sigil-placeholder sigil-placeholder-no-plus' />
      </span>
    );
  }
  return (
    <>
      <img
        alt={`${slot.awakenerName} team preview portrait`}
        className={`h-full w-full object-cover ${!isOwned ? 'builder-picker-art-unowned' : ''}`}
        draggable={false}
        src={getAwakenerPortraitAsset(slot.awakenerName)}
      />
      <span
        className='pointer-events-none absolute inset-0 z-10 border'
        style={{borderColor: getRealmTint(slot.realm)}}
      />
      {slot.isSupport && (
        <span className='builder-team-preview-support-overlay'>
          <span className='builder-team-preview-support-chip builder-team-preview-support-chip-compact'>
            Support
          </span>
        </span>
      )}
      {!isOwned && (
        <span className='builder-team-preview-unowned-chip'>Unowned</span>
      )}
    </>
  );
}

function ExpandedSlotContent({
  slot,
  isOwned,
  covenantAsset,
  ownedWheelLevelById,
}: Readonly<{
  slot: TeamSlot;
  isOwned: boolean;
  covenantAsset?: string;
  ownedWheelLevelById: Map<string, number | null>;
}>) {
  return (
    <div className='builder-team-slot-preview-card'>
      {slot.awakenerName ? (
        <>
          <img
            alt={`${slot.awakenerName} expanded team preview card`}
            className={`builder-team-slot-preview-card-art ${!isOwned ? 'builder-picker-art-unowned' : ''}`}
            draggable={false}
            src={
              getAwakenerCardAsset(slot.awakenerName) ??
              getAwakenerPortraitAsset(slot.awakenerName)
            }
          />
          <span
            className='pointer-events-none absolute inset-0 z-10 border'
            style={{borderColor: getRealmTint(slot.realm)}}
          />
          {slot.isSupport && (
            <span className='builder-team-preview-support-chip builder-team-preview-support-chip-expanded'>
              Support
            </span>
          )}
          {!isOwned && (
            <span className='builder-team-preview-unowned-chip'>Unowned</span>
          )}
        </>
      ) : (
        <span className='relative block h-full w-full'>
          <span className='sigil-placeholder sigil-placeholder-no-plus' />
        </span>
      )}
      <span className='builder-team-preview-covenant'>
        {covenantAsset ? (
          <img
            alt=''
            className='h-full w-full object-cover'
            draggable={false}
            src={covenantAsset}
          />
        ) : (
          <span className='builder-team-preview-covenant-empty' />
        )}
      </span>
      <div className='builder-team-slot-preview-wheel-strip builder-team-slot-preview-wheel-strip-embedded'>
        {slot.wheels.map((wheelId, index) => {
          const wheelAsset = wheelId ? getWheelAssetById(wheelId) : undefined;
          const isWheelOwned =
            !wheelId || (ownedWheelLevelById.get(wheelId) ?? null) !== null;
          return (
            <span
              className='builder-team-preview-wheel'
              key={`${slot.slotId}-wheel-${String(index)}`}
            >
              {wheelAsset ? (
                <img
                  alt=''
                  className={`h-full w-full object-cover ${!isWheelOwned ? 'builder-picker-art-unowned' : ''}`}
                  draggable={false}
                  src={wheelAsset}
                />
              ) : (
                <span className='sigil-placeholder sigil-placeholder-wheel' />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function BuilderTeamSlotPreview({
  slot,
  teamId,
  slotIndex,
  mode,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  enableDragAndDrop,
}: BuilderTeamSlotPreviewProps) {
  const isOwned =
    !slot.awakenerName ||
    (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null) !== null;
  const covenantAsset = slot.covenantId
    ? getCovenantAssetById(slot.covenantId)
    : undefined;
  const dropZoneId = makeTeamPreviewSlotDropZoneId(teamId, slot.slotId);

  const {isOver, setNodeRef: setDroppableRef} = useDroppable({
    id: dropZoneId,
    disabled: !enableDragAndDrop,
  });
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `${dropZoneId}:drag`,
    data: slot.awakenerName
      ? ({
          kind: 'team-preview-slot',
          teamId,
          slotId: slot.slotId,
        } satisfies DragData)
      : undefined,
    disabled: !enableDragAndDrop || !slot.awakenerName,
  });

  const setPreviewRef = (node: HTMLDivElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };
  const containerBase =
    mode === 'compact'
      ? 'builder-picker-tile h-12 w-12 border border-slate-500/50 bg-slate-900/40 p-0.5'
      : 'builder-team-slot-preview builder-team-slot-preview-expanded';
  const stateClass = `${isDragging ? 'opacity-45' : ''} ${isOver ? 'builder-team-slot-preview-drop-over' : ''}`;

  return (
    <div
      className={`${containerBase} ${stateClass}`}
      ref={setPreviewRef}
      aria-label={`Team preview slot ${String(slotIndex + 1)}`}
      {...attributes}
      {...listeners}
    >
      {mode === 'compact' ? (
        <div className='builder-team-slot-preview-compact-surface relative h-full w-full overflow-hidden border border-slate-400/35 bg-slate-900/70'>
          <CompactSlotContent slot={slot} isOwned={isOwned} />
        </div>
      ) : (
        <ExpandedSlotContent
          slot={slot}
          isOwned={isOwned}
          covenantAsset={covenantAsset}
          ownedWheelLevelById={ownedWheelLevelById}
        />
      )}
    </div>
  );
}

export interface BuilderTeamPreviewStripProps {
  readonly teamId: string;
  readonly slots: readonly TeamSlot[];
  readonly mode: TeamPreviewMode;
  readonly ownedAwakenerLevelByName?: Map<string, number | null>;
  readonly ownedWheelLevelById?: Map<string, number | null>;
  readonly className?: string;
  readonly enableDragAndDrop?: boolean;
}

export function BuilderTeamPreviewStrip({
  teamId,
  slots,
  mode,
  ownedAwakenerLevelByName = EMPTY_OWNERSHIP_MAP,
  ownedWheelLevelById = EMPTY_OWNERSHIP_MAP,
  className = '',
  enableDragAndDrop = false,
}: BuilderTeamPreviewStripProps) {
  return (
    <div
      className={`${mode === 'expanded' ? 'builder-team-preview-grid-expanded' : 'flex gap-1.5'} ${className}`.trim()}
    >
      {slots.map((slot: TeamSlot, index: number) => (
        <BuilderTeamSlotPreview
          key={`${teamId}-${slot.slotId}`}
          slotIndex={index}
          mode={mode}
          ownedAwakenerLevelByName={ownedAwakenerLevelByName}
          ownedWheelLevelById={ownedWheelLevelById}
          slot={slot}
          teamId={teamId}
          enableDragAndDrop={enableDragAndDrop}
        />
      ))}
    </div>
  );
}
