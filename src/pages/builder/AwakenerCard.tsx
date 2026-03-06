import {getAwakenerCardAsset} from '@/domain/awakener-assets';
import {formatAwakenerNameForUi} from '@/domain/name-format';
import {CardWheelZone} from '@/pages/builder/CardWheelZone';
import type {
  DragData,
  PredictedDropHover,
  TeamSlot,
} from '@/pages/builder/types';
import {useDraggable, useDroppable} from '@dnd-kit/core';
import {useState} from 'react';

const loadedCardAssets = new Set<string>();

export interface AwakenerCardProps {
  readonly slotId: string;
  readonly card: TeamSlot; // Assuming AwakenerTeamSlot is TeamSlot for now, as it's not defined elsewhere
  readonly isActiveSelection: boolean;
  readonly isSupportTeamSlot: boolean;
  readonly predictedDropHover: PredictedDropHover | null;
  readonly ownedLevel: number | null;
  readonly onCardClick: (slotId: string) => void;
  readonly onRemoveActiveSelection: (slotId: string) => void;
  readonly onWheelSlotClick: (slotId: string, wheelIndex: number) => void;
  readonly onCovenantSlotClick: (slotId: string) => void;
  readonly activeKind?: 'awakener' | 'wheel' | 'covenant' | null;
  readonly activeWheelIndex?: number | null;
  readonly activeDragKind?: DragData['kind'] | null;
  readonly awakenerLevel?: number;
  readonly wheelOwnedLevels?: [number | null, number | null];
  readonly allowActiveRemoval?: boolean;
}

function AwakenerCardContent({
  hasAwakener,
  cardAsset,
  cardImageLoaded,
  ownedLevel,
  setLoadedCardAsset,
  awakenerName,
  displayName,
  isSupportTeamSlot,
  activeDragKind,
  activeKind,
  activeWheelIndex,
  onCovenantSlotClick,
  onRemoveActiveSelection,
  onWheelSlotClick,
  awakenerLevel,
  allowActiveRemoval,
  wheelOwnedLevels,
  predictedDropHover,
  card,
  slotId,
}: Readonly<{
  hasAwakener: boolean;
  cardAsset: string | undefined;
  cardImageLoaded: boolean;
  ownedLevel: number | null;
  setLoadedCardAsset: (asset: string) => void;
  awakenerName: string;
  displayName: string;
  isSupportTeamSlot: boolean;
  activeDragKind: DragData['kind'] | null;
  activeKind: 'awakener' | 'wheel' | 'covenant' | null;
  activeWheelIndex: number | null;
  onCovenantSlotClick: (slotId: string) => void;
  onRemoveActiveSelection: (slotId: string) => void;
  onWheelSlotClick: (slotId: string, wheelIndex: number) => void;
  awakenerLevel: number;
  allowActiveRemoval: boolean;
  wheelOwnedLevels: [number | null, number | null];
  predictedDropHover: PredictedDropHover | null;
  card: TeamSlot;
  slotId: string;
}>) {
  if (!hasAwakener) {
    return (
      <div className='pointer-events-none absolute inset-0 z-10 bg-slate-700/15'>
        <span className='sigil-placeholder sigil-placeholder-card' />
      </div>
    );
  }

  return (
    <>
      {cardAsset ? (
        <img
          alt={`${awakenerName} card`}
          className={`absolute inset-0 z-0 h-full w-full object-cover object-top transition-opacity duration-150 ${
            cardImageLoaded ? 'opacity-100' : 'opacity-0'
          } ${ownedLevel === null ? 'builder-card-art-unowned' : ''}`}
          onError={() => {
            setLoadedCardAsset(cardAsset);
          }}
          onLoad={() => {
            loadedCardAssets.add(cardAsset);
            setLoadedCardAsset(cardAsset);
          }}
          src={cardAsset}
        />
      ) : null}
      {cardImageLoaded ? (
        <div className='builder-card-bottom-shade pointer-events-none absolute inset-0 z-10' />
      ) : null}
      {cardAsset && !cardImageLoaded ? (
        <div className='absolute inset-0 z-30 bg-slate-700/15'>
          <span className='absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(125,165,215,0.16),rgba(6,12,24,0)_62%)]' />
          <span className='sigil-placeholder sigil-placeholder-card sigil-placeholder-no-plus' />
          <span className='sigil-loading-ring' />
        </div>
      ) : null}

      <div className='builder-card-name-wrap pointer-events-none absolute inset-x-0 top-0 z-20 px-2 pt-1 pb-[18%]'>
        <p className='builder-card-name ui-title text-slate-100'>
          {displayName}
        </p>
        {isSupportTeamSlot ? (
          <span className='builder-support-badge'>Support Awakener</span>
        ) : null}
        {ownedLevel === null ? (
          <span className='builder-unowned-badge'>Unowned</span>
        ) : null}
      </div>

      {cardImageLoaded ? (
        <CardWheelZone
          activeDragKind={activeDragKind}
          activeWheelIndex={activeKind === 'wheel' ? activeWheelIndex : null}
          allowActiveRemoval={allowActiveRemoval}
          awakenerLevel={awakenerLevel}
          awakenerOwnedLevel={ownedLevel}
          interactive
          isCovenantActive={activeKind === 'covenant'}
          onCovenantSlotClick={() => {
            onCovenantSlotClick(slotId);
          }}
          onRemoveActiveWheel={() => {
            onRemoveActiveSelection(slotId);
          }}
          onWheelSlotClick={(wheelIndex) => {
            onWheelSlotClick(slotId, wheelIndex);
          }}
          predictedDropHover={predictedDropHover}
          slot={card}
          wheelKeyPrefix={slotId}
          wheelOwnedLevels={wheelOwnedLevels}
        />
      ) : null}
    </>
  );
}

function getShowCardOver(
  isOver: boolean,
  isPredictedForThisCard: boolean,
  activeDragKind: DragData['kind'] | null,
): boolean {
  if (!isOver && !isPredictedForThisCard) return false;
  return (
    activeDragKind === 'picker-awakener' ||
    activeDragKind === 'team-slot' ||
    activeDragKind === 'picker-wheel' ||
    activeDragKind === 'team-wheel' ||
    activeDragKind === 'picker-covenant' ||
    activeDragKind === 'team-covenant'
  );
}

export function AwakenerCard({
  slotId,
  card,
  isActiveSelection,
  isSupportTeamSlot,
  predictedDropHover,
  ownedLevel,
  onCardClick,
  onRemoveActiveSelection,
  onWheelSlotClick,
  onCovenantSlotClick,
  activeKind = null,
  activeWheelIndex = null,
  activeDragKind = null,
  awakenerLevel = 60,
  wheelOwnedLevels = [null, null],
  allowActiveRemoval = true,
}: AwakenerCardProps) {
  const awakenerName = card.awakenerName ?? '';
  const hasAwakener = Boolean(awakenerName);
  const displayName = hasAwakener ? formatAwakenerNameForUi(awakenerName) : '';
  const cardAsset = hasAwakener
    ? getAwakenerCardAsset(awakenerName)
    : undefined;
  const [loadedCardAsset, setLoadedCardAsset] = useState<string | undefined>(
    () =>
      cardAsset && loadedCardAssets.has(cardAsset) ? cardAsset : undefined,
  );
  const cardImageLoaded = !cardAsset || loadedCardAsset === cardAsset;

  const {isOver, setNodeRef: setDroppableRef} = useDroppable({id: slotId});

  const dragData: DragData | undefined = hasAwakener
    ? {kind: 'team-slot', slotId, awakenerName}
    : undefined;

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    isDragging,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `team:${slotId}`,
    disabled: !hasAwakener,
    data: dragData,
  });

  const hasRemovableAwakenerSelection =
    allowActiveRemoval &&
    activeKind === 'awakener' &&
    isActiveSelection &&
    hasAwakener;
  const isPredictedForThisCard =
    predictedDropHover !== null && predictedDropHover.slotId === slotId;
  const showCardOver = getShowCardOver(
    isOver,
    isPredictedForThisCard,
    activeDragKind,
  );

  let containerClass =
    'builder-card group relative aspect-[25/56] w-full border bg-slate-900/80 text-left';
  if (showCardOver) {
    containerClass +=
      ' border-amber-200/80 shadow-[0_0_0_1px_rgba(251,191,36,0.24)]';
  } else {
    containerClass += ' border-slate-500/60';
  }
  if (isDragging) containerClass += ' opacity-60';
  if (isActiveSelection) containerClass += ' builder-card-active';

  return (
    <article
      className={containerClass}
      data-selection-owner='true'
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (
          target.closest('[data-card-remove]') ||
          target.closest('.wheel-tile') ||
          target.closest('.covenant-tile')
        ) {
          return;
        }
        onCardClick(slotId);
      }}
      ref={setDroppableRef}
    >
      {hasRemovableAwakenerSelection ? (
        <button
          aria-label='Remove active awakener'
          className='builder-card-remove-button absolute top-1 right-1 z-40 h-9 w-9'
          data-card-remove='true'
          onClick={() => {
            onRemoveActiveSelection(slotId);
          }}
          type='button'
        >
          <span className='sigil-placeholder sigil-placeholder-no-plus sigil-placeholder-remove builder-card-remove-sigil' />
          <span className='sigil-remove-x builder-card-remove-x' />
        </button>
      ) : null}
      <button
        aria-label={hasAwakener ? `Change ${awakenerName}` : 'Deploy awakeners'}
        className='builder-card-hitbox absolute inset-0 z-10'
        ref={hasAwakener ? setDraggableRef : undefined}
        type='button'
        {...(hasAwakener ? dragAttributes : {})}
        {...(hasAwakener ? dragListeners : {})}
      />

      <AwakenerCardContent
        activeDragKind={activeDragKind}
        activeKind={activeKind}
        activeWheelIndex={activeWheelIndex}
        allowActiveRemoval={allowActiveRemoval}
        awakenerLevel={awakenerLevel}
        awakenerName={awakenerName}
        card={card}
        cardAsset={cardAsset}
        cardImageLoaded={cardImageLoaded}
        displayName={displayName}
        hasAwakener={hasAwakener}
        isSupportTeamSlot={isSupportTeamSlot}
        onCovenantSlotClick={onCovenantSlotClick}
        onRemoveActiveSelection={onRemoveActiveSelection}
        onWheelSlotClick={onWheelSlotClick}
        ownedLevel={ownedLevel}
        predictedDropHover={predictedDropHover}
        setLoadedCardAsset={setLoadedCardAsset}
        slotId={slotId}
        wheelOwnedLevels={wheelOwnedLevels}
      />
    </article>
  );
}
