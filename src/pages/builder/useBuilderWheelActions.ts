import {
  nextSelectionAfterWheelSwap,
  shouldSetActiveWheelOnPickerAssign,
} from '@/pages/builder/selection-state';
import {
  assignWheelToSlot,
  swapWheelAssignments,
} from '@/pages/builder/team-state';
import type {
  ActiveSelection,
  TeamSlot,
  WheelUsageLocation,
} from '@/pages/builder/types';
import {useCallback} from 'react';

interface WheelTransferRequest {
  readonly wheelId: string;
  readonly fromTeamId: string;
  readonly fromSlotId: string;
  readonly fromWheelIndex: number;
  readonly toTeamId: string;
  readonly targetSlotId: string;
  readonly targetWheelIndex: number;
}

interface UseBuilderWheelActionsOptions {
  readonly teamSlots: readonly TeamSlot[];
  readonly effectiveActiveTeamId: string;
  readonly usedWheelByTeamOrder: Map<string, WheelUsageLocation>;
  readonly resolvedActiveSelection: ActiveSelection;
  readonly setActiveTeamSlots: (nextSlots: readonly TeamSlot[]) => void;
  readonly setActiveSelection: (nextSelection: ActiveSelection) => void;
  readonly requestWheelTransfer: (request: WheelTransferRequest) => void;
  readonly clearPendingDelete: () => void;
  readonly clearTransfer: () => void;
  readonly showToast: (message: string) => void;
  readonly allowDupes: boolean;
  readonly onPickerAssignSuccess?: (nextSlots: readonly TeamSlot[]) => void;
}

export function useBuilderWheelActions({
  teamSlots,
  effectiveActiveTeamId,
  usedWheelByTeamOrder,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  requestWheelTransfer,
  clearPendingDelete,
  clearTransfer,
  showToast,
  allowDupes,
  onPickerAssignSuccess,
}: UseBuilderWheelActionsOptions) {
  const getFirstEmptyWheelIndex = useCallback(
    (slotId: string): number | null => {
      const slot = teamSlots.find((entry) => entry.slotId === slotId);
      if (!slot?.awakenerName) {
        return null;
      }
      const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel);
      return firstEmptyIndex === -1 ? null : firstEmptyIndex;
    },
    [teamSlots],
  );

  const assignPickerWheelToTarget = useCallback(
    (
      wheelId: string,
      targetSlotId: string,
      targetWheelIndex?: number,
      options?: {setActiveOnAssign?: boolean},
    ) => {
      const setActiveOnAssign = options?.setActiveOnAssign ?? true;
      const resolvedWheelIndex =
        targetWheelIndex ?? getFirstEmptyWheelIndex(targetSlotId);
      if (resolvedWheelIndex === null) {
        return;
      }

      const targetSlot = teamSlots.find(
        (entry) => entry.slotId === targetSlotId,
      );
      const wheelOwner = allowDupes
        ? undefined
        : usedWheelByTeamOrder.get(wheelId);

      if (
        wheelOwner?.teamId === effectiveActiveTeamId &&
        (wheelOwner.slotId !== targetSlotId ||
          wheelOwner.wheelIndex !== resolvedWheelIndex)
      ) {
        const result = swapWheelAssignments(
          teamSlots,
          wheelOwner.slotId,
          wheelOwner.wheelIndex,
          targetSlotId,
          resolvedWheelIndex,
        );
        setActiveTeamSlots(result.nextSlots);
        if (setActiveOnAssign) {
          setActiveSelection({
            kind: 'wheel',
            slotId: targetSlotId,
            wheelIndex: resolvedWheelIndex,
          });
        }
        onPickerAssignSuccess?.(result.nextSlots);
        return;
      }

      if (
        wheelOwner?.teamId &&
        wheelOwner.teamId !== effectiveActiveTeamId &&
        !targetSlot?.isSupport
      ) {
        requestWheelTransfer({
          wheelId,
          fromTeamId: wheelOwner.teamId,
          fromSlotId: wheelOwner.slotId,
          fromWheelIndex: wheelOwner.wheelIndex,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
          targetWheelIndex: resolvedWheelIndex,
        });
        return;
      }

      const result = assignWheelToSlot(
        teamSlots,
        targetSlotId,
        resolvedWheelIndex,
        wheelId,
      );
      setActiveTeamSlots(result.nextSlots);
      if (setActiveOnAssign) {
        setActiveSelection({
          kind: 'wheel',
          slotId: targetSlotId,
          wheelIndex: resolvedWheelIndex,
        });
      }
      onPickerAssignSuccess?.(result.nextSlots);
    },
    [
      effectiveActiveTeamId,
      getFirstEmptyWheelIndex,
      allowDupes,
      requestWheelTransfer,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedWheelByTeamOrder,
      onPickerAssignSuccess,
    ],
  );

  const handleDropPickerWheel = useCallback(
    (wheelId: string, targetSlotId: string, targetWheelIndex?: number) => {
      clearPendingDelete();
      clearTransfer();
      assignPickerWheelToTarget(wheelId, targetSlotId, targetWheelIndex, {
        setActiveOnAssign: true,
      });
    },
    [assignPickerWheelToTarget, clearPendingDelete, clearTransfer],
  );

  const handleDropTeamWheel = useCallback(
    (
      sourceSlotId: string,
      sourceWheelIndex: number,
      targetSlotId: string,
      targetWheelIndex: number,
    ) => {
      if (
        sourceSlotId === targetSlotId &&
        sourceWheelIndex === targetWheelIndex
      ) {
        return;
      }
      const result = swapWheelAssignments(
        teamSlots,
        sourceSlotId,
        sourceWheelIndex,
        targetSlotId,
        targetWheelIndex,
      );
      setActiveTeamSlots(result.nextSlots);

      if (sourceSlotId !== targetSlotId) {
        setActiveSelection({
          kind: 'wheel',
          slotId: targetSlotId,
          wheelIndex: targetWheelIndex,
        });
        return;
      }

      const nextSelection = nextSelectionAfterWheelSwap(
        resolvedActiveSelection,
        sourceSlotId,
        sourceWheelIndex,
        targetSlotId,
        targetWheelIndex,
      );
      if (nextSelection !== resolvedActiveSelection) {
        setActiveSelection(nextSelection);
      }
    },
    [
      resolvedActiveSelection,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
    ],
  );

  const handleDropTeamWheelToSlot = useCallback(
    (sourceSlotId: string, sourceWheelIndex: number, targetSlotId: string) => {
      const targetWheelIndex = getFirstEmptyWheelIndex(targetSlotId);
      if (targetWheelIndex === null) {
        return;
      }
      const result = swapWheelAssignments(
        teamSlots,
        sourceSlotId,
        sourceWheelIndex,
        targetSlotId,
        targetWheelIndex,
      );
      setActiveTeamSlots(result.nextSlots);
      setActiveSelection({
        kind: 'wheel',
        slotId: targetSlotId,
        wheelIndex: targetWheelIndex,
      });
    },
    [
      getFirstEmptyWheelIndex,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
    ],
  );

  const handlePickerWheelClick = useCallback(
    (wheelId?: string) => {
      clearPendingDelete();
      clearTransfer();

      const kind = resolvedActiveSelection?.kind;
      if (kind !== 'wheel' && kind !== 'awakener') {
        showToast('Select a wheel slot on a unit card first.');
        return;
      }

      if (!resolvedActiveSelection) {
        return;
      }

      const targetSlotId = resolvedActiveSelection.slotId;
      const targetWheelIndex =
        kind === 'wheel' ? resolvedActiveSelection.wheelIndex : undefined;
      const resolvedWheelIndex =
        targetWheelIndex ?? getFirstEmptyWheelIndex(targetSlotId);

      if (!wheelId) {
        if (resolvedWheelIndex === null) {
          return;
        }
        const result = assignWheelToSlot(
          teamSlots,
          targetSlotId,
          resolvedWheelIndex,
          null,
        );
        setActiveTeamSlots(result.nextSlots);
        return;
      }

      if (resolvedWheelIndex === null) {
        return;
      }

      assignPickerWheelToTarget(wheelId, targetSlotId, resolvedWheelIndex, {
        setActiveOnAssign: shouldSetActiveWheelOnPickerAssign(
          resolvedActiveSelection,
        ),
      });
    },
    [
      assignPickerWheelToTarget,
      clearPendingDelete,
      clearTransfer,
      getFirstEmptyWheelIndex,
      resolvedActiveSelection,
      setActiveTeamSlots,
      showToast,
      teamSlots,
    ],
  );

  return {
    handleDropPickerWheel,
    handleDropTeamWheel,
    handleDropTeamWheelToSlot,
    handlePickerWheelClick,
  };
}
