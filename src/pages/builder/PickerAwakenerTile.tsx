import {getAwakenerPortraitAsset} from '@/domain/awakener-assets';
import {getRealmTint} from '@/domain/factions';
import {formatAwakenerNameForUi} from '@/domain/name-format';
import {SHOW_PICKER_TILE_STATUS_LABELS} from '@/pages/builder/constants';
import type {DragData} from '@/pages/builder/types';
import {useDraggable} from '@dnd-kit/core';

export interface PickerAwakenerTileProps {
  readonly awakenerName: string;
  readonly realm: string;
  readonly isRealmBlocked: boolean;
  readonly isInUse: boolean;
  readonly isOwned: boolean;
  readonly onClick: () => void;
}

interface TileStatusBadgeProps {
  readonly statusText: string | null;
  readonly isOwned: boolean;
}

function TileStatusBadge({statusText, isOwned}: TileStatusBadgeProps) {
  if (statusText) {
    return (
      <span className='pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90'>
        {statusText}
      </span>
    );
  }
  if (!isOwned) {
    return (
      <span className='pointer-events-none absolute inset-x-0 top-0 truncate border-y border-rose-300/25 bg-slate-950/70 px-1 py-0.5 text-center text-[9px] tracking-wide text-rose-100/95'>
        Unowned
      </span>
    );
  }
  return null;
}

export function PickerAwakenerTile({
  awakenerName,
  realm,
  isRealmBlocked,
  isInUse,
  isOwned,
  onClick,
}: PickerAwakenerTileProps) {
  const displayName = formatAwakenerNameForUi(awakenerName);
  const portraitAsset = getAwakenerPortraitAsset(awakenerName);
  const isDimmed = isRealmBlocked || isInUse;
  const realmTint = getRealmTint(realm);

  const statusText = (() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!SHOW_PICKER_TILE_STATUS_LABELS) return null;
    if (isInUse) {
      return isRealmBlocked ? 'Already Used / Wrong Realm' : 'Already Used';
    }
    return isRealmBlocked ? 'Wrong Realm' : null;
  })();

  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: `picker:${awakenerName}`,
    data: {kind: 'picker-awakener', awakenerName} satisfies DragData,
  });

  return (
    <button
      className={joinClasses(
        'builder-picker-tile relative border border-slate-500/50 bg-slate-900/40 p-0.5 text-left transition-colors hover:border-amber-200/45',
        isDragging ? 'scale-[0.98] opacity-55' : '',
        isDimmed ? 'opacity-55' : '',
      )}
      data-in-use={isInUse ? 'true' : 'false'}
      data-realm-blocked={isRealmBlocked ? 'true' : 'false'}
      onClick={onClick}
      ref={setNodeRef}
      type='button'
      {...attributes}
      {...listeners}
    >
      <div className='relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70'>
        {portraitAsset ? (
          <img
            alt={`${displayName} portrait`}
            className={joinClasses(
              'h-full w-full object-cover',
              !isOwned ? 'builder-picker-art-unowned' : '',
              isDimmed ? 'builder-picker-art-dimmed' : '',
            )}
            src={portraitAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder' />
          </span>
        )}
        <span
          className='pointer-events-none absolute inset-0 z-10 border'
          style={{borderColor: realmTint}}
        />
        <TileStatusBadge isOwned={isOwned} statusText={statusText} />
      </div>
      <p className='mt-0.5 truncate text-[10px] text-slate-100'>
        {displayName}
      </p>
    </button>
  );
}

function joinClasses(
  ...classes: readonly (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(' ');
}
