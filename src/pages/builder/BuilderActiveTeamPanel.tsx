import {Button} from '@/components/ui/Button';
import {formatAwakenerNameForUi} from '@/domain/name-format';
import {ActiveTeamHeader} from '@/pages/builder/ActiveTeamHeader';
import {AwakenerCard} from '@/pages/builder/AwakenerCard';
import type {
  ActiveSelection,
  DragData,
  PredictedDropHover,
  QuickLineupSession,
  TeamSlot,
} from '@/pages/builder/types';
import {FaCheck, FaChevronLeft, FaChevronRight, FaXmark} from 'react-icons/fa6';

export interface BuilderActiveTeamPanelProps {
  readonly activeTeamId: string;
  readonly activeTeamName: string;
  readonly isEditingTeamName: boolean;
  readonly editingTeamName: string;
  readonly activePosseAsset?: string;
  readonly activePosseName?: string;
  readonly isActivePosseOwned: boolean;
  readonly teamRealms: ReadonlySet<string>;
  readonly teamSlots: readonly TeamSlot[];
  readonly awakenerLevelByName: Map<string, number>;
  readonly ownedAwakenerLevelByName: Map<string, number | null>;
  readonly ownedWheelLevelById: Map<string, number | null>;
  readonly resolvedActiveSelection: ActiveSelection;
  readonly quickLineupSession: QuickLineupSession | null;
  readonly activeDragKind?: DragData['kind'] | null;
  readonly predictedDropHover?: PredictedDropHover;
  readonly onBeginTeamRename: (
    teamId: string,
    currentName: string,
    surface?: 'header' | 'list',
  ) => void;
  readonly onCommitTeamRename: (teamId: string) => void;
  readonly onCancelTeamRename: () => void;
  readonly onEditingTeamNameChange: (nextName: string) => void;
  readonly onOpenPossePicker: () => void;
  readonly onStartQuickLineup: () => void;
  readonly onFinishQuickLineup: () => void;
  readonly onCancelQuickLineup: () => void;
  readonly onBackQuickLineupStep: () => void;
  readonly onSkipQuickLineupStep: () => void;
  readonly onCardClick: (slotId: string) => void;
  readonly onWheelSlotClick: (slotId: string, wheelIndex: number) => void;
  readonly onCovenantSlotClick: (slotId: string) => void;
  readonly onRemoveActiveSelection: (slotId: string) => void;
}

export function BuilderActiveTeamPanel({
  activeTeamId,
  activeTeamName,
  isEditingTeamName,
  editingTeamName,
  activePosseAsset,
  activePosseName,
  isActivePosseOwned,
  teamRealms,
  teamSlots,
  awakenerLevelByName,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  resolvedActiveSelection,
  quickLineupSession,
  activeDragKind = null,
  predictedDropHover = null,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditingTeamNameChange,
  onOpenPossePicker,
  onStartQuickLineup,
  onFinishQuickLineup,
  onCancelQuickLineup,
  onBackQuickLineupStep,
  onSkipQuickLineupStep,
  onCardClick,
  onWheelSlotClick,
  onCovenantSlotClick,
  onRemoveActiveSelection,
}: BuilderActiveTeamPanelProps) {
  const currentQuickLineupLabel = (() => {
    const step = quickLineupSession?.currentStep;
    if (!step) {
      return null;
    }
    if (step.kind === 'posse') {
      return 'Posse';
    }

    const slot = teamSlots.find((entry) => entry.slotId === step.slotId);
    const slotLabel = `Awakener ${step.slotId.replace('slot-', '')}`;
    const awakenerLabel = slot?.awakenerName
      ? formatAwakenerNameForUi(slot.awakenerName)
      : `Empty Slot ${step.slotId.replace('slot-', '')}`;

    if (step.kind === 'awakener') {
      return slotLabel;
    }
    if (step.kind === 'wheel') {
      return `${awakenerLabel} - Wheel ${String(step.wheelIndex + 1)}`;
    }
    return `${awakenerLabel} - Covenant`;
  })();

  return (
    <div className='px-4 pt-4 pb-1'>
      <ActiveTeamHeader
        activeTeamId={activeTeamId}
        activeTeamName={activeTeamName}
        isEditingTeamName={isEditingTeamName}
        editingTeamName={editingTeamName}
        activePosseAsset={activePosseAsset}
        activePosseName={activePosseName}
        isActivePosseOwned={isActivePosseOwned}
        onBeginTeamRename={onBeginTeamRename}
        onCommitTeamRename={onCommitTeamRename}
        onCancelTeamRename={onCancelTeamRename}
        onEditingTeamNameChange={onEditingTeamNameChange}
        onOpenPossePicker={onOpenPossePicker}
        onBackQuickLineupStep={onBackQuickLineupStep}
        onCancelQuickLineup={onCancelQuickLineup}
        onFinishQuickLineup={onFinishQuickLineup}
        onStartQuickLineup={onStartQuickLineup}
        quickLineupSession={quickLineupSession}
        teamRealms={Array.from(teamRealms)}
      />

      <div className='mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {teamSlots.map((slot) => {
          let awakenerLevel = 60;
          let ownedLevel: number | null = null;
          const wheelOwnedLevels: [number | null, number | null] = [null, null];

          if (slot.awakenerName) {
            awakenerLevel = slot.isSupport
              ? 90
              : (awakenerLevelByName.get(slot.awakenerName) ?? 60);
            ownedLevel = slot.isSupport
              ? 15
              : (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null);
          }

          if (slot.wheels[0]) {
            wheelOwnedLevels[0] = slot.isSupport
              ? 15
              : (ownedWheelLevelById.get(slot.wheels[0]) ?? null);
          }
          if (slot.wheels[1]) {
            wheelOwnedLevels[1] = slot.isSupport
              ? 15
              : (ownedWheelLevelById.get(slot.wheels[1]) ?? null);
          }

          return (
            <AwakenerCard
              key={`${slot.slotId}:${slot.awakenerName ?? 'empty'}`}
              activeKind={
                resolvedActiveSelection?.slotId === slot.slotId
                  ? resolvedActiveSelection.kind
                  : null
              }
              activeWheelIndex={
                resolvedActiveSelection?.slotId === slot.slotId &&
                resolvedActiveSelection.kind === 'wheel'
                  ? resolvedActiveSelection.wheelIndex
                  : null
              }
              activeDragKind={activeDragKind}
              isActiveSelection={
                resolvedActiveSelection?.slotId === slot.slotId &&
                resolvedActiveSelection.kind === 'awakener'
              }
              onCardClick={onCardClick}
              onCovenantSlotClick={onCovenantSlotClick}
              onRemoveActiveSelection={() => {
                onRemoveActiveSelection(slot.slotId);
              }}
              onWheelSlotClick={onWheelSlotClick}
              awakenerLevel={awakenerLevel}
              ownedLevel={ownedLevel}
              wheelOwnedLevels={wheelOwnedLevels}
              predictedDropHover={predictedDropHover}
              card={slot}
              slotId={slot.slotId}
              isSupportTeamSlot={Boolean(slot.isSupport)}
              allowActiveRemoval={!quickLineupSession}
            />
          );
        })}
      </div>

      <div className='mt-4 flex justify-end border-t border-slate-500/40 pt-3'>
        <div className='flex max-w-full flex-col items-end gap-1.5 text-right'>
          <div className='flex flex-wrap items-center justify-end gap-1.5'>
            {quickLineupSession ? (
              <>
                <Button
                  className='h-[26px] px-2 py-1 text-[10px] tracking-wide uppercase'
                  disabled={!quickLineupSession.canGoBack}
                  onClick={() => {
                    onBackQuickLineupStep();
                  }}
                  type='button'
                >
                  <span className='inline-flex items-center gap-1'>
                    <FaChevronLeft aria-hidden className='text-[9px]' />
                    <span>Back</span>
                  </span>
                </Button>
                <Button
                  className='h-[26px] px-2 py-1 text-[10px] tracking-wide uppercase'
                  onClick={() => {
                    onSkipQuickLineupStep();
                  }}
                  type='button'
                >
                  <span className='inline-flex items-center gap-1'>
                    <span>Next</span>
                    <FaChevronRight aria-hidden className='text-[9px]' />
                  </span>
                </Button>
                <Button
                  aria-label='Cancel quick team lineup'
                  className='h-[26px] px-2 py-1 text-[10px] tracking-wide uppercase'
                  onClick={() => {
                    onCancelQuickLineup();
                  }}
                  title='Cancel quick team lineup'
                  type='button'
                  variant='danger'
                >
                  <span className='inline-flex items-center gap-1'>
                    <FaXmark aria-hidden className='text-[9px]' />
                    <span>Cancel</span>
                  </span>
                </Button>
                <Button
                  aria-label='Finish quick team lineup'
                  className='h-[26px] px-2 py-1 text-[10px] tracking-wide uppercase'
                  onClick={() => {
                    onFinishQuickLineup();
                  }}
                  title='Finish quick team lineup'
                  type='button'
                  variant='success'
                >
                  <span className='inline-flex items-center gap-1'>
                    <FaCheck aria-hidden className='text-[9px]' />
                    <span>Finish</span>
                  </span>
                </Button>
              </>
            ) : (
              <Button
                className='h-[26px] px-2 py-1 text-[10px] tracking-wide uppercase'
                onClick={() => {
                  onStartQuickLineup();
                }}
                type='button'
              >
                Quick Team Lineup
              </Button>
            )}
          </div>
          <p className='min-h-[1rem] text-[11px] tracking-wide text-slate-300'>
            {quickLineupSession
              ? `Step ${String(quickLineupSession.currentStepIndex + 1)} / ${String(quickLineupSession.totalSteps)}: ${currentQuickLineupLabel ?? ''}`
              : null}
          </p>
        </div>
      </div>
    </div>
  );
}
