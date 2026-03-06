import {
  getAwakenerCardAsset,
  getAwakenerPortraitAsset,
} from '@/domain/awakener-assets';
import {getCovenantAssetById} from '@/domain/covenant-assets';
import {formatAwakenerNameForUi} from '@/domain/name-format';
import {getWheelAssetById} from '@/domain/wheel-assets';
import {BuilderTeamPreviewStrip} from '@/pages/builder/BuilderTeamPreviewStrip';
import {CardWheelZone} from '@/pages/builder/CardWheelZone';
import type {Team, TeamPreviewMode, TeamSlot} from '@/pages/builder/types';

export interface PickerAwakenerGhostProps {
  readonly awakenerName: string;
}

export function PickerAwakenerGhost({awakenerName}: PickerAwakenerGhostProps) {
  const displayName = formatAwakenerNameForUi(awakenerName);
  const portraitAsset = getAwakenerPortraitAsset(awakenerName);

  return (
    <div className='w-[72px] border border-slate-400/65 bg-slate-900/90 p-0.5 text-left shadow-[0_6px_20px_rgba(2,6,23,0.45)]'>
      <div className='aspect-square overflow-hidden border border-slate-300/45 bg-slate-900/70'>
        {portraitAsset ? (
          <img
            alt={`${displayName} portrait`}
            className='h-full w-full object-cover'
            src={portraitAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder' />
          </span>
        )}
      </div>
      <p className='mt-0.5 truncate text-[10px] text-slate-100'>
        {displayName}
      </p>
    </div>
  );
}

export interface TeamCardGhostProps {
  readonly slot: TeamSlot | undefined;
  readonly removeIntent?: boolean;
  readonly awakenerOwnedLevel?: number | null;
  readonly wheelOwnedLevels?: [number | null, number | null];
}

export function TeamCardGhost({
  slot,
  removeIntent = false,
  awakenerOwnedLevel = null,
  wheelOwnedLevels = [null, null],
}: TeamCardGhostProps) {
  if (!slot?.awakenerName) {
    return null;
  }

  const displayName = formatAwakenerNameForUi(slot.awakenerName);
  const cardAsset = getAwakenerCardAsset(slot.awakenerName);

  return (
    <article
      className={`builder-card builder-drag-ghost relative aspect-[25/56] w-[96px] border bg-slate-900/90 shadow-[0_8px_24px_rgba(2,6,23,0.5)] ${
        removeIntent ? 'border-rose-300/75' : 'border-slate-400/70'
      }`}
    >
      {cardAsset ? (
        <img
          alt=''
          className={`absolute inset-0 h-full w-full object-cover object-top ${awakenerOwnedLevel === null ? 'builder-card-art-unowned' : ''}`}
          src={cardAsset}
        />
      ) : null}
      <div
        className={`builder-card-bottom-shade pointer-events-none absolute inset-0 ${
          removeIntent ? 'brightness-[0.55] saturate-[0.45]' : ''
        }`}
      />
      {removeIntent ? (
        <div className='pointer-events-none absolute inset-0 z-20 bg-slate-950/58'>
          <span className='sigil-placeholder sigil-placeholder-card sigil-placeholder-no-plus sigil-placeholder-remove' />
          <span className='sigil-remove-x' />
        </div>
      ) : null}
      <div className='builder-card-name-wrap pointer-events-none absolute inset-x-0 top-0 px-2 pt-1 pb-[18%]'>
        <p className='builder-card-name builder-card-name-ghost ui-title text-slate-100'>
          {displayName}
        </p>
        {slot.isSupport ? (
          <span className='builder-support-badge'>Support Awakener</span>
        ) : null}
        {awakenerOwnedLevel === null ? (
          <span className='builder-unowned-badge'>Unowned</span>
        ) : null}
      </div>
      {!removeIntent ? (
        <CardWheelZone
          awakenerLevel={slot.level ?? 60}
          awakenerOwnedLevel={awakenerOwnedLevel}
          compactCovenant
          interactive={false}
          showOwnership
          slot={slot}
          wheelKeyPrefix='ghost'
          wheelOwnedLevels={wheelOwnedLevels}
        />
      ) : null}
    </article>
  );
}

export interface TeamPreviewGhostProps {
  readonly team: Team;
  readonly mode: TeamPreviewMode;
  readonly ownedAwakenerLevelByName?: Map<string, number | null>;
  readonly ownedWheelLevelById?: Map<string, number | null>;
  readonly removeIntent?: boolean;
}

export function TeamPreviewGhost({
  team,
  mode,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  removeIntent = false,
}: TeamPreviewGhostProps) {
  return (
    <div
      className={`builder-team-preview-ghost builder-drag-ghost ${removeIntent ? 'builder-team-preview-ghost-remove' : ''}`}
    >
      <BuilderTeamPreviewStrip
        className='builder-team-preview-ghost-strip'
        mode={mode}
        ownedAwakenerLevelByName={ownedAwakenerLevelByName}
        ownedWheelLevelById={ownedWheelLevelById}
        slots={team.slots}
        teamId={`${team.id}::ghost`}
      />
    </div>
  );
}

export interface PickerWheelGhostProps {
  readonly wheelId: string;
  readonly isCovenant?: boolean;
}

export function PickerWheelGhost({
  wheelId,
  isCovenant = false,
}: PickerWheelGhostProps) {
  const wheelAsset = isCovenant
    ? getCovenantAssetById(wheelId)
    : getWheelAssetById(wheelId);
  const containerClass = isCovenant
    ? 'w-[54px] shadow-[0_6px_20px_rgba(2,6,23,0.45)]'
    : 'w-[62px] border border-slate-400/65 bg-slate-900/90 p-0.5 shadow-[0_6px_20px_rgba(2,6,23,0.45)]';

  const imgContainerClass = isCovenant
    ? 'relative overflow-hidden border border-slate-300/45 bg-slate-900/70 aspect-square rounded-full'
    : 'relative overflow-hidden border border-slate-300/45 bg-slate-900/70 aspect-[75/113]';

  const imgClass = isCovenant
    ? 'builder-card-covenant-image h-full w-full object-cover'
    : 'builder-card-wheel-image h-full w-full object-cover';

  return (
    <div className={containerClass}>
      <div className={imgContainerClass}>
        {wheelAsset ? (
          <img
            alt={isCovenant ? '' : `${wheelId} wheel`}
            className={imgClass}
            src={wheelAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder sigil-placeholder-wheel' />
          </span>
        )}
      </div>
    </div>
  );
}

export interface TeamWheelGhostProps {
  readonly wheelId: string;
  readonly removeIntent?: boolean;
  readonly isCovenant?: boolean;
  readonly ownedLevel?: number | null;
}

function getTeamWheelGhostClasses(
  isCovenant: boolean,
  removeIntent: boolean,
  isOwned: boolean,
) {
  let containerClass =
    'builder-drag-ghost shadow-[0_8px_24px_rgba(2,6,23,0.5)]';
  if (isCovenant) {
    containerClass += ' w-[54px]';
  } else {
    containerClass += ' w-[62px] border bg-slate-900/95 p-0.5';
    if (removeIntent) {
      containerClass += ' border-rose-300/75';
    } else {
      containerClass += ' border-slate-400/70';
    }
  }

  let imgContainerClass =
    'relative overflow-hidden border border-slate-300/45 bg-slate-900/70';
  if (isCovenant) {
    imgContainerClass += ' aspect-square rounded-full';
  } else {
    imgContainerClass += ' aspect-[75/113]';
  }

  let imgClass = 'h-full w-full object-cover';
  if (isCovenant) {
    imgClass += ' builder-card-covenant-image';
  } else {
    imgClass += ' builder-card-wheel-image';
    if (!isOwned) imgClass += ' wheel-tile-unowned';
  }
  if (removeIntent) imgClass += ' brightness-[0.55] saturate-[0.45]';

  let overlayClass =
    'pointer-events-none absolute inset-0 z-20 bg-slate-950/58';
  if (isCovenant) overlayClass += ' rounded-full';

  let overlaySigilClass =
    'sigil-placeholder sigil-placeholder-wheel sigil-placeholder-no-plus sigil-placeholder-remove';
  if (isCovenant) overlaySigilClass += ' rounded-full';

  return {
    containerClass,
    imgContainerClass,
    imgClass,
    overlayClass,
    overlaySigilClass,
  };
}

export function TeamWheelGhost({
  wheelId,
  removeIntent = false,
  isCovenant = false,
  ownedLevel = null,
}: TeamWheelGhostProps) {
  const wheelAsset = isCovenant
    ? getCovenantAssetById(wheelId)
    : getWheelAssetById(wheelId);
  const isOwned = ownedLevel !== null;

  const {
    containerClass,
    imgContainerClass,
    imgClass,
    overlayClass,
    overlaySigilClass,
  } = getTeamWheelGhostClasses(isCovenant, removeIntent, isOwned);

  return (
    <div className={containerClass}>
      <div className={imgContainerClass}>
        {wheelAsset ? (
          <img
            alt={isCovenant ? '' : `${wheelId} wheel`}
            className={imgClass}
            src={wheelAsset}
          />
        ) : (
          <span className='relative block h-full w-full'>
            <span className='sigil-placeholder sigil-placeholder-wheel' />
          </span>
        )}
        {removeIntent ? (
          <span className={overlayClass}>
            <span className={overlaySigilClass} />
            <span className='sigil-remove-x' />
          </span>
        ) : null}
        {!isCovenant && !isOwned ? (
          <span className='builder-unowned-chip'>Unowned</span>
        ) : null}
      </div>
    </div>
  );
}
