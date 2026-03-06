import {getAwakenerIdentityKey} from '@/domain/awakener-identity';
import type {Awakener} from '@/domain/awakeners';
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  type TeamStateViolationCode,
} from '@/pages/builder/team-state';
import type {ActiveSelection, TeamSlot} from '@/pages/builder/types';
import {useCallback} from 'react';

interface AwakenerTransferRequest {
  awakenerName: string;
  canUseSupport?: boolean;
  fromTeamId: string;
  toTeamId: string;
  targetSlotId?: string;
}

interface UseBuilderAwakenerActionsOptions {
  readonly teamSlots: readonly TeamSlot[];
  readonly awakenerByName: Map<string, Awakener>;
  readonly effectiveActiveTeamId: string;
  readonly usedAwakenerByIdentityKey: Map<string, string>;
  readonly resolvedActiveSelection: ActiveSelection;
  readonly setActiveTeamSlots: (nextSlots: readonly TeamSlot[]) => void;
  readonly setActiveSelection: (nextSelection: ActiveSelection) => void;
  readonly requestAwakenerTransfer: (request: AwakenerTransferRequest) => void;
  readonly clearPendingDelete: () => void;
  readonly clearTransfer: () => void;
  readonly notifyViolation: (
    violation: TeamStateViolationCode | undefined,
  ) => void;
  readonly allowDupes: boolean;
  readonly hasSupportAwakener: boolean;
  readonly onPickerAssignSuccess?: (nextSlots: readonly TeamSlot[]) => void;
}

export function useBuilderAwakenerActions({
  teamSlots,
  awakenerByName,
  effectiveActiveTeamId,
  usedAwakenerByIdentityKey,
  resolvedActiveSelection,
  setActiveTeamSlots,
  setActiveSelection,
  requestAwakenerTransfer,
  clearPendingDelete,
  clearTransfer,
  notifyViolation,
  allowDupes,
  hasSupportAwakener,
  onPickerAssignSuccess,
}: UseBuilderAwakenerActionsOptions) {
  const handleDropPickerAwakener = useCallback(
    (awakenerName: string, targetSlotId: string) => {
      const result = assignAwakenerToSlot(
        teamSlots,
        awakenerName,
        targetSlotId,
        awakenerByName,
        {
          allowDuplicateIdentity: allowDupes,
        },
      );
      notifyViolation(result.violation);
      if (result.nextSlots === teamSlots) {
        return;
      }

      const identityKey = getAwakenerIdentityKey(awakenerName);
      const owningTeamId = allowDupes
        ? undefined
        : usedAwakenerByIdentityKey.get(identityKey);
      const targetSlot = teamSlots.find((slot) => slot.slotId === targetSlotId);
      if (
        owningTeamId &&
        owningTeamId !== effectiveActiveTeamId &&
        !targetSlot?.isSupport
      ) {
        clearPendingDelete();
        requestAwakenerTransfer({
          awakenerName,
          canUseSupport: !hasSupportAwakener,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        });
        return;
      }

      clearTransfer();
      setActiveTeamSlots(result.nextSlots);
      setActiveSelection({kind: 'awakener', slotId: targetSlotId});
      onPickerAssignSuccess?.(result.nextSlots);
    },
    [
      awakenerByName,
      allowDupes,
      clearPendingDelete,
      clearTransfer,
      effectiveActiveTeamId,
      notifyViolation,
      requestAwakenerTransfer,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedAwakenerByIdentityKey,
      hasSupportAwakener,
      onPickerAssignSuccess,
    ],
  );

  const handlePickerAwakenerClick = useCallback(
    (awakenerName: string) => {
      clearPendingDelete();
      clearTransfer();

      const targetSlotId =
        resolvedActiveSelection?.kind === 'awakener'
          ? resolvedActiveSelection.slotId
          : undefined;
      const result = targetSlotId
        ? assignAwakenerToSlot(
            teamSlots,
            awakenerName,
            targetSlotId,
            awakenerByName,
            {
              allowDuplicateIdentity: allowDupes,
            },
          )
        : assignAwakenerToFirstEmptySlot(
            teamSlots,
            awakenerName,
            awakenerByName,
            {
              allowDuplicateIdentity: allowDupes,
            },
          );

      notifyViolation(result.violation);
      if (result.nextSlots === teamSlots) {
        return;
      }

      const identityKey = getAwakenerIdentityKey(awakenerName);
      const owningTeamId = allowDupes
        ? undefined
        : usedAwakenerByIdentityKey.get(identityKey);
      const targetSlot = targetSlotId
        ? teamSlots.find((slot) => slot.slotId === targetSlotId)
        : undefined;
      if (
        owningTeamId &&
        owningTeamId !== effectiveActiveTeamId &&
        !targetSlot?.isSupport
      ) {
        requestAwakenerTransfer({
          awakenerName,
          canUseSupport: !hasSupportAwakener,
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId,
        });
        return;
      }

      setActiveTeamSlots(result.nextSlots);
      clearTransfer();
      onPickerAssignSuccess?.(result.nextSlots);
    },
    [
      awakenerByName,
      allowDupes,
      clearPendingDelete,
      clearTransfer,
      effectiveActiveTeamId,
      notifyViolation,
      requestAwakenerTransfer,
      resolvedActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedAwakenerByIdentityKey,
      hasSupportAwakener,
      onPickerAssignSuccess,
    ],
  );

  return {
    handleDropPickerAwakener,
    handlePickerAwakenerClick,
  };
}
