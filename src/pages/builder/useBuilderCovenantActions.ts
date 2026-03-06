import {
  assignCovenantToSlot,
  swapCovenantAssignments,
} from '@/pages/builder/team-state';
import type {ActiveSelection, TeamSlot} from '@/pages/builder/types';
import {useCallback} from 'react';

interface UseBuilderCovenantActionsOptions {
  readonly teamSlots: readonly TeamSlot[];
  readonly resolvedActiveSelection: ActiveSelection;
  readonly setActiveTeamSlots: (nextSlots: readonly TeamSlot[]) => void;
  readonly setActiveSelection: (nextSelection: ActiveSelection) => void;
  readonly clearPendingDelete: () => void;
  readonly clearTransfer: () => void;
  readonly showToast: (message: string) => void;
  readonly onPickerAssignSuccess?: (nextSlots: readonly TeamSlot[]) => void;
}

export function useBuilderCovenantActions({
  teamSlots,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  clearPendingDelete,
  clearTransfer,
  showToast,
  onPickerAssignSuccess,
}: UseBuilderCovenantActionsOptions) {
  const moveTeamCovenant = useCallback(
    (sourceSlotId: string, targetSlotId: string) => {
      if (sourceSlotId === targetSlotId) {
        return;
      }
      const result = swapCovenantAssignments(
        teamSlots,
        sourceSlotId,
        targetSlotId,
      );
      setActiveTeamSlots(result.nextSlots);
      setActiveSelection({kind: 'covenant', slotId: targetSlotId});
    },
    [setActiveSelection, setActiveTeamSlots, teamSlots],
  );

  const assignPickerCovenantToTarget = useCallback(
    (
      covenantId: string | undefined,
      targetSlotId: string,
      options?: {setActiveOnAssign?: boolean},
    ) => {
      const targetSlot = teamSlots.find((slot) => slot.slotId === targetSlotId);
      if (!targetSlot?.awakenerName) {
        return;
      }

      const result = assignCovenantToSlot(teamSlots, targetSlotId, covenantId);
      setActiveTeamSlots(result.nextSlots);
      if (options?.setActiveOnAssign ?? true) {
        setActiveSelection({kind: 'covenant', slotId: targetSlotId});
      }
      onPickerAssignSuccess?.(result.nextSlots);
    },
    [onPickerAssignSuccess, setActiveSelection, setActiveTeamSlots, teamSlots],
  );

  const handleDropPickerCovenant = useCallback(
    (covenantId: string, targetSlotId: string) => {
      clearPendingDelete();
      clearTransfer();
      assignPickerCovenantToTarget(covenantId, targetSlotId, {
        setActiveOnAssign: true,
      });
    },
    [assignPickerCovenantToTarget, clearPendingDelete, clearTransfer],
  );

  const handleDropTeamCovenant = useCallback(
    (sourceSlotId: string, targetSlotId: string) => {
      moveTeamCovenant(sourceSlotId, targetSlotId);
    },
    [moveTeamCovenant],
  );

  const handleDropTeamCovenantToSlot = useCallback(
    (sourceSlotId: string, targetSlotId: string) => {
      moveTeamCovenant(sourceSlotId, targetSlotId);
    },
    [moveTeamCovenant],
  );

  const handlePickerCovenantClick = useCallback(
    (covenantId?: string) => {
      clearPendingDelete();
      clearTransfer();
      if (
        resolvedActiveSelection?.kind !== 'covenant' &&
        resolvedActiveSelection?.kind !== 'awakener'
      ) {
        showToast('Select a covenant slot on a unit card first.');
        return;
      }

      const targetSlotId = resolvedActiveSelection.slotId;
      assignPickerCovenantToTarget(covenantId, targetSlotId, {
        setActiveOnAssign: resolvedActiveSelection.kind === 'covenant',
      });
    },
    [
      assignPickerCovenantToTarget,
      clearPendingDelete,
      clearTransfer,
      resolvedActiveSelection,
      showToast,
    ],
  );

  return {
    handleDropPickerCovenant,
    handleDropTeamCovenant,
    handleDropTeamCovenantToSlot,
    handlePickerCovenantClick,
  };
}
