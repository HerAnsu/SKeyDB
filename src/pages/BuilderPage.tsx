import {Button} from '@/components/ui/Button';
import {PageToolkitBar} from '@/components/ui/PageToolkitBar';
import {TabbedContainer} from '@/components/ui/TabbedContainer';
import {Toast} from '@/components/ui/Toast';
import {useTimedToast} from '@/components/ui/useTimedToast';
import type {BuilderDraftPayload} from '@/pages/builder/builder-persistence';
import {BuilderActiveTeamPanel} from '@/pages/builder/BuilderActiveTeamPanel';
import {BuilderConfirmDialogs} from '@/pages/builder/BuilderConfirmDialogs';
import {BuilderImportExportDialogs} from '@/pages/builder/BuilderImportExportDialogs';
import {BuilderSelectionPanel} from '@/pages/builder/BuilderSelectionPanel';
import {BuilderTeamsPanel} from '@/pages/builder/BuilderTeamsPanel';
import {awakenerByName} from '@/pages/builder/constants';
import {
  parseTeamPreviewSlotDropZoneId,
  PICKER_DROP_ZONE_ID,
} from '@/pages/builder/dnd-ids';
import {
  PickerAwakenerGhost,
  PickerWheelGhost,
  TeamCardGhost,
  TeamPreviewGhost,
  TeamWheelGhost,
} from '@/pages/builder/DragGhosts';
import {resolvePredictedDropHover} from '@/pages/builder/predicted-drop-hover';
import {
  addTeam,
  applyTeamTemplate,
  MAX_TEAMS,
  reorderTeams,
  type TeamTemplateId,
} from '@/pages/builder/team-collection';
import {type TeamStateViolationCode} from '@/pages/builder/team-state';
import {
  clearTeamSlotTransfer,
  swapTeamSlotTransfer,
} from '@/pages/builder/transfer-resolution';
import type {
  DragData,
  PredictedDropHover,
  Team,
  TeamSlot,
} from '@/pages/builder/types';
import {useBuilderAwakenerActions} from '@/pages/builder/useBuilderAwakenerActions';
import {useBuilderCovenantActions} from '@/pages/builder/useBuilderCovenantActions';
import {useBuilderDnd} from '@/pages/builder/useBuilderDnd';
import {useBuilderDndCoordinator} from '@/pages/builder/useBuilderDndCoordinator';
import {useBuilderImportExport} from '@/pages/builder/useBuilderImportExport';
import {useBuilderViewModel} from '@/pages/builder/useBuilderViewModel';
import {useBuilderWheelActions} from '@/pages/builder/useBuilderWheelActions';
import {usePendingDeleteDialog} from '@/pages/builder/usePendingDeleteDialog';
import {usePendingResetTeamDialog} from '@/pages/builder/usePendingResetTeamDialog';
import {usePendingTransferDialog} from '@/pages/builder/usePendingTransferDialog';
import {useTransferConfirm} from '@/pages/builder/useTransferConfirm';
import {DndContext, DragOverlay} from '@dnd-kit/core';
import {useCallback, useEffect, useRef, useState} from 'react';
import {FaDownload, FaRotateLeft, FaUpload, FaXmark} from 'react-icons/fa6';

function useGlobalPointerDown(
  quickLineupSession: unknown,
  restoreQuickLineupFocus: () => void,
  setActiveSelection: (val: null) => void,
) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-picker-zone="true"]')) return;
      if (target.closest('[data-card-remove]')) return;
      if (target.closest('[data-selection-owner="true"]')) return;
      if (quickLineupSession) {
        restoreQuickLineupFocus();
        return;
      }
      setActiveSelection(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [quickLineupSession, restoreQuickLineupFocus, setActiveSelection]);
}

function useTeamEditSuppression() {
  const suppressTeamEditRef = useRef(false);
  const suppressTeamEditTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (suppressTeamEditTimeoutRef.current) {
        window.clearTimeout(suppressTeamEditTimeoutRef.current);
      }
    };
  }, []);

  const clearTeamEditSuppressionSoon = useCallback(() => {
    if (suppressTeamEditTimeoutRef.current) {
      window.clearTimeout(suppressTeamEditTimeoutRef.current);
    }
    suppressTeamEditTimeoutRef.current = window.setTimeout(() => {
      suppressTeamEditRef.current = false;
      suppressTeamEditTimeoutRef.current = null;
    }, 0);
  }, []);

  return {suppressTeamEditRef, clearTeamEditSuppressionSoon};
}

function useTeamPreviewDrag(teams: readonly Team[]) {
  const [activeTeamPreviewSlotDrag, setActiveTeamPreviewSlotDrag] = useState<{
    teamId: string;
    slotId: string;
  } | null>(null);
  const [isTeamPreviewRemoveIntent, setIsTeamPreviewRemoveIntent] =
    useState(false);

  const activePreviewDraggedTeam = activeTeamPreviewSlotDrag
    ? (teams.find((team) => team.id === activeTeamPreviewSlotDrag.teamId) ??
      null)
    : null;
  const activePreviewDraggedSlot = activeTeamPreviewSlotDrag
    ? activePreviewDraggedTeam?.slots.find(
        (slot) => slot.slotId === activeTeamPreviewSlotDrag.slotId,
      )
    : undefined;

  const clearPreviewSlotDragState = useCallback(() => {
    setActiveTeamPreviewSlotDrag(null);
    setIsTeamPreviewRemoveIntent(false);
  }, []);

  return {
    activeTeamPreviewSlotDrag,
    setActiveTeamPreviewSlotDrag,
    isTeamPreviewRemoveIntent,
    setIsTeamPreviewRemoveIntent,
    activePreviewDraggedTeam,
    activePreviewDraggedSlot,
    clearPreviewSlotDragState,
  };
}

interface BuilderToolkitBarProps {
  readonly teamsCount: number;
  readonly activeTeamId: string;
  readonly canUndoReset: boolean;
  readonly onImport: () => void;
  readonly onExportAll: () => void;
  readonly onExportInGame: (id: string) => void;
  readonly onUndoReset: () => void;
  readonly onResetBuilder: () => void;
}

function BuilderToolkitBar({
  teamsCount,
  activeTeamId,
  canUndoReset,
  onImport,
  onExportAll,
  onExportInGame,
  onUndoReset,
  onResetBuilder,
}: BuilderToolkitBarProps) {
  return (
    <PageToolkitBar className='collection-toolkit-drawer' sticky>
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        onClick={onImport}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaUpload aria-hidden className='text-[9px]' />
          <span>Import</span>
        </span>
      </Button>
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        disabled={teamsCount === 0}
        onClick={onExportAll}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaDownload aria-hidden className='text-[9px]' />
          <span>Export All</span>
        </span>
      </Button>
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        onClick={() => {
          onExportInGame(activeTeamId);
        }}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          <FaDownload aria-hidden className='text-[9px]' />
          <span>Export In-Game</span>
        </span>
      </Button>
      <Button
        className={`px-2 py-1 text-[10px] tracking-wide uppercase ${
          canUndoReset
            ? 'border-amber-300/65 bg-amber-500/15 text-amber-100 hover:border-amber-200/85'
            : 'border-rose-300/70 bg-rose-500/14 text-rose-100 hover:border-rose-200/85'
        }`}
        onClick={canUndoReset ? onUndoReset : onResetBuilder}
        type='button'
      >
        <span className='inline-flex items-center gap-1'>
          {canUndoReset ? (
            <FaRotateLeft aria-hidden className='text-[9px]' />
          ) : (
            <FaXmark aria-hidden className='text-[9px]' />
          )}
          <span>{canUndoReset ? 'Undo Reset' : 'Reset Builder'}</span>
        </span>
      </Button>
    </PageToolkitBar>
  );
}

interface BuilderDragOverlayWrapperProps {
  readonly activeDrag: DragData | null;
  readonly activePreviewDraggedSlot?: TeamSlot;
  readonly activePreviewDraggedTeam?: Team | null;
  readonly teamPreviewMode: string;
  readonly ownedAwakenerLevelByName: Map<string, number | null>;
  readonly ownedWheelLevelById: Map<string, number | null>;
  readonly isTeamPreviewRemoveIntent: boolean;
  readonly isRemoveIntent: boolean;
  readonly slotById: Map<string, TeamSlot>;
}

function BuilderDragOverlayWrapper({
  activeDrag,
  activePreviewDraggedSlot,
  activePreviewDraggedTeam,
  teamPreviewMode,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  isTeamPreviewRemoveIntent,
  isRemoveIntent,
  slotById,
}: BuilderDragOverlayWrapperProps) {
  if (activePreviewDraggedSlot && activePreviewDraggedTeam) {
    return (
      <TeamPreviewGhost
        mode={teamPreviewMode as 'compact' | 'expanded'}
        ownedAwakenerLevelByName={ownedAwakenerLevelByName}
        ownedWheelLevelById={ownedWheelLevelById}
        removeIntent={isTeamPreviewRemoveIntent}
        team={{
          ...activePreviewDraggedTeam,
          slots: [activePreviewDraggedSlot],
        }}
      />
    );
  }

  if (!activeDrag) {
    return null;
  }

  switch (activeDrag.kind) {
    case 'picker-awakener':
      return <PickerAwakenerGhost awakenerName={activeDrag.awakenerName} />;
    case 'picker-wheel':
      return <PickerWheelGhost wheelId={activeDrag.wheelId} />;
    case 'picker-covenant':
      return <PickerWheelGhost wheelId={activeDrag.covenantId} isCovenant />;
    case 'team-slot': {
      const slot = slotById.get(activeDrag.slotId);
      const awakenerLevel = slot?.awakenerName
        ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null)
        : null;
      const w0 = slot?.wheels[0]
        ? (ownedWheelLevelById.get(slot.wheels[0]) ?? null)
        : null;
      const w1 = slot?.wheels[1]
        ? (ownedWheelLevelById.get(slot.wheels[1]) ?? null)
        : null;

      return (
        <TeamCardGhost
          removeIntent={isRemoveIntent}
          slot={slot}
          awakenerOwnedLevel={awakenerLevel}
          wheelOwnedLevels={[w0, w1]}
        />
      );
    }
    case 'team-wheel':
      return (
        <TeamWheelGhost
          removeIntent={isRemoveIntent}
          wheelId={activeDrag.wheelId}
          ownedLevel={ownedWheelLevelById.get(activeDrag.wheelId) ?? null}
        />
      );
    case 'team-covenant':
      return (
        <TeamWheelGhost
          removeIntent={isRemoveIntent}
          wheelId={activeDrag.covenantId}
          isCovenant
        />
      );
    default:
      return null;
  }
}

// --- Main Component ---

export function BuilderPage() {
  const [predictedDropHover, setPredictedDropHover] =
    useState<PredictedDropHover>(null);
  const [pendingResetBuilder, setPendingResetBuilder] = useState(false);
  const [undoResetSnapshot, setUndoResetSnapshot] =
    useState<BuilderDraftPayload | null>(null);
  const resetUndoTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const {toastEntries, showToast} = useTimedToast({defaultDurationMs: 3200});
  const {suppressTeamEditRef, clearTeamEditSuppressionSoon} =
    useTeamEditSuppression();
  const {
    pendingTransfer,
    requestAwakenerTransfer,
    requestPosseTransfer,
    requestWheelTransfer,
    clearTransfer,
  } = useTransferConfirm();

  const {
    displayUnowned,
    setDisplayUnowned,
    allowDupes,
    setAllowDupes,
    teamPreviewMode,
    setTeamPreviewMode,
    quickLineupSession,
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    teams,
    setTeams,
    setActiveTeamId,
    editingTeamId,
    editingTeamName,
    editingTeamSurface,
    setEditingTeamName,
    pickerTab,
    setPickerTab,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    setPickerSearchByTab,
    setActiveSelection,
    effectiveActiveTeamId,
    teamSlots,
    activeTeam,
    activePosseId,
    pickerPosses,
    activePosse,
    activePosseAsset,
    activeSearchQuery,
    filteredAwakeners,
    filteredPosses,
    filteredWheels,
    filteredCovenants,
    teamRealmSet,
    usedAwakenerByIdentityKey,
    usedAwakenerIdentityKeys,
    hasSupportAwakener,
    usedPosseByTeamOrder,
    usedWheelByTeamOrder,
    resolvedActiveSelection,
    slotById,
    updateActiveTeam,
    setActiveTeamSlots,
    beginTeamRename,
    cancelTeamRename,
    commitTeamRename,
    handleCardClick,
    handleWheelSlotClick,
    handleCovenantSlotClick,
    handleRemoveActiveSelection,
    clearTeamSlot,
    swapActiveTeamSlots,
    replaceBuilderDraft,
    resetBuilderDraft,
    startQuickLineup,
    advanceQuickLineupStep,
    skipQuickLineupStep,
    goBackQuickLineupStep,
    finishQuickLineup,
    cancelQuickLineup,
    restoreQuickLineupFocus,
    clearTeamWheel,
    clearTeamCovenant,
  } = useBuilderViewModel({searchInputRef});

  const {
    setActiveTeamPreviewSlotDrag,
    isTeamPreviewRemoveIntent,
    setIsTeamPreviewRemoveIntent,
    activePreviewDraggedTeam,
    activePreviewDraggedSlot,
    clearPreviewSlotDragState,
  } = useTeamPreviewDrag(teams);

  useGlobalPointerDown(quickLineupSession, restoreQuickLineupFocus, () => {
    setActiveSelection(null);
  });

  const {clearPendingDelete, requestDeleteTeam, pendingDeleteDialog} =
    usePendingDeleteDialog({
      teams,
      setTeams,
      effectiveActiveTeamId,
      setActiveTeamId,
      clearActiveSelection: () => {
        setActiveSelection(null);
      },
    });

  const {clearPendingResetTeam, requestResetTeam, pendingResetTeamDialog} =
    usePendingResetTeamDialog({
      teams,
      setTeams,
      effectiveActiveTeamId,
      clearActiveSelection: () => {
        setActiveSelection(null);
      },
    });

  function notifyViolation(violation: TeamStateViolationCode | undefined) {
    if (violation !== 'TOO_MANY_REALMS_IN_TEAM') {
      if (violation === 'INVALID_BUILD_RULES') {
        showToast(
          'Invalid move: this would break duplicate or support team rules.',
        );
      }
      return;
    }
    showToast('Invalid move: a team can only contain up to 2 realms.');
  }

  const {handleDropPickerAwakener, handlePickerAwakenerClick} =
    useBuilderAwakenerActions({
      allowDupes,
      awakenerByName,
      clearPendingDelete,
      clearTransfer,
      effectiveActiveTeamId,
      notifyViolation,
      requestAwakenerTransfer,
      resolvedActiveSelection,
      setActiveSelection,
      setActiveTeamSlots,
      teamSlots,
      usedAwakenerByIdentityKey,
      hasSupportAwakener,
      onPickerAssignSuccess: quickLineupSession
        ? advanceQuickLineupStep
        : undefined,
    });

  const {
    handleDropPickerWheel,
    handleDropTeamWheel,
    handleDropTeamWheelToSlot,
    handlePickerWheelClick,
  } = useBuilderWheelActions({
    allowDupes,
    clearPendingDelete,
    clearTransfer,
    effectiveActiveTeamId,
    requestWheelTransfer,
    resolvedActiveSelection,
    setActiveSelection,
    setActiveTeamSlots,
    showToast,
    teamSlots,
    usedWheelByTeamOrder,
    onPickerAssignSuccess: quickLineupSession
      ? advanceQuickLineupStep
      : undefined,
  });

  const {
    handleDropPickerCovenant,
    handleDropTeamCovenant,
    handleDropTeamCovenantToSlot,
    handlePickerCovenantClick,
  } = useBuilderCovenantActions({
    clearPendingDelete,
    clearTransfer,
    resolvedActiveSelection,
    setActiveSelection,
    setActiveTeamSlots,
    showToast,
    teamSlots,
    onPickerAssignSuccess: quickLineupSession
      ? advanceQuickLineupStep
      : undefined,
  });

  useEffect(() => {
    return () => {
      if (resetUndoTimeoutRef.current)
        window.clearTimeout(resetUndoTimeoutRef.current);
    };
  }, []);

  function requestResetBuilder() {
    clearPendingDelete();
    clearPendingResetTeam();
    clearTransfer();
    cancelTeamRename();
    setPendingResetBuilder(true);
  }

  function cancelResetBuilder() {
    setPendingResetBuilder(false);
  }

  function confirmResetBuilder() {
    const snapshot: BuilderDraftPayload = {
      teams,
      activeTeamId: effectiveActiveTeamId,
    };
    resetBuilderDraft();
    setActiveSelection(null);
    setPendingResetBuilder(false);
    setUndoResetSnapshot(snapshot);
    showToast('Builder reset. Undo is available for 15 seconds.');

    if (resetUndoTimeoutRef.current)
      window.clearTimeout(resetUndoTimeoutRef.current);
    resetUndoTimeoutRef.current = window.setTimeout(() => {
      setUndoResetSnapshot(null);
      resetUndoTimeoutRef.current = null;
    }, 15_000);
  }

  function undoResetBuilder() {
    if (!undoResetSnapshot) return;
    replaceBuilderDraft(undoResetSnapshot);
    setActiveSelection(null);
    setUndoResetSnapshot(null);
    showToast('Builder reset has been undone.');

    if (resetUndoTimeoutRef.current) {
      window.clearTimeout(resetUndoTimeoutRef.current);
      resetUndoTimeoutRef.current = null;
    }
  }

  const {
    activeDrag,
    isRemoveIntent,
    sensors,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
  } = useBuilderDnd({
    onDropPickerAwakener: handleDropPickerAwakener,
    onDropPickerWheel: handleDropPickerWheel,
    onDropPickerCovenant: handleDropPickerCovenant,
    onDropTeamSlot: swapActiveTeamSlots,
    onDropTeamSlotToPicker: clearTeamSlot,
    onDropTeamWheel: handleDropTeamWheel,
    onDropTeamWheelToSlot: handleDropTeamWheelToSlot,
    onDropTeamWheelToPicker: clearTeamWheel,
    onDropTeamCovenant: handleDropTeamCovenant,
    onDropTeamCovenantToSlot: handleDropTeamCovenantToSlot,
    onDropTeamCovenantToPicker: clearTeamCovenant,
  });

  const {
    handleDragCancel: handleCoordinatedDragCancel,
    handleDragEnd: handleCoordinatedDragEnd,
    handleDragOver: handleCoordinatedDragOver,
    handleDragStart: handleCoordinatedDragStart,
  } = useBuilderDndCoordinator({
    onTeamRowDragStart: () => {
      clearPendingDelete();
      clearPendingResetTeam();
      clearTransfer();
      cancelTeamRename();
    },
    onTeamRowDragEnd: () => {
      /* noop */
    },
    onTeamRowDragCancel: () => {
      /* noop */
    },
    onTeamPreviewSlotDragStart: (teamId, slotId) => {
      setActiveTeamPreviewSlotDrag({teamId, slotId});
      setIsTeamPreviewRemoveIntent(false);
      clearPendingDelete();
      clearPendingResetTeam();
      clearTransfer();
      cancelTeamRename();
    },
    onTeamPreviewSlotDragOver: (overId) => {
      setIsTeamPreviewRemoveIntent(overId === PICKER_DROP_ZONE_ID);
    },
    onTeamPreviewSlotDragEnd: (sourceTeamId, sourceSlotId, overId) => {
      if (!sourceTeamId || !sourceSlotId) {
        clearPreviewSlotDragState();
        return;
      }
      if (overId === PICKER_DROP_ZONE_ID) {
        setTeams((prev) =>
          clearTeamSlotTransfer(prev, sourceTeamId, sourceSlotId),
        );
        clearPreviewSlotDragState();
        return;
      }

      const previewTarget = overId
        ? parseTeamPreviewSlotDropZoneId(overId)
        : null;
      if (!previewTarget) {
        clearPreviewSlotDragState();
        return;
      }

      setTeams((prev) => {
        const result = swapTeamSlotTransfer(
          prev,
          sourceTeamId,
          sourceSlotId,
          previewTarget.teamId,
          previewTarget.slotId,
          {allowDupes},
        );
        if (result.violation) notifyViolation(result.violation);
        return result.nextTeams;
      });
      clearPreviewSlotDragState();
    },
    onTeamPreviewSlotDragCancel: clearPreviewSlotDragState,
    onTeamRowReorder: (sourceTeamId, targetTeamId) => {
      setTeams((prev) => reorderTeams(prev, sourceTeamId, targetTeamId));
    },
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  });

  const {
    isImportDialogOpen,
    openImportDialog,
    submitImportCode,
    closeImportFlow,
    exportDialog,
    closeExportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    pendingDuplicateOverrideImport,
    cancelDuplicateOverrideImport,
    confirmDuplicateOverrideImport,
    pendingReplaceImport,
    cancelReplaceImport,
    confirmReplaceImport,
    pendingStrategyImport,
    pendingStrategyConflictSummary,
    cancelStrategyImport,
    applyMoveStrategyImport,
    applySkipStrategyImport,
  } = useBuilderImportExport({
    teams,
    setTeams,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots,
    allowDupes,
    setAllowDupes,
    setActiveTeamId,
    setActiveSelection: () => {
      setActiveSelection(null);
    },
    clearTransfer,
    clearPendingDelete,
    showToast,
  });

  const handleSetActivePosse = useCallback(
    (posseId: string | undefined) => {
      clearPendingDelete();
      clearTransfer();
      if (!posseId) {
        updateActiveTeam((team) => ({...team, posseId: undefined}));
        clearTransfer();
        if (quickLineupSession?.currentStep.kind === 'posse')
          advanceQuickLineupStep();
        return;
      }

      const usedByTeamOrder = allowDupes
        ? undefined
        : usedPosseByTeamOrder.get(posseId);
      const usedByTeam =
        usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder];
      const isUsedByOtherTeam =
        usedByTeam && usedByTeam.id !== effectiveActiveTeamId;

      if (isUsedByOtherTeam) {
        const posse = pickerPosses.find((entry) => entry.id === posseId);
        requestPosseTransfer({
          posseId,
          posseName: posse?.name ?? 'Posse',
          fromTeamId: usedByTeam.id,
          toTeamId: effectiveActiveTeamId,
        });
        return;
      }

      updateActiveTeam((team) => ({...team, posseId}));
      clearTransfer();
      if (quickLineupSession?.currentStep.kind === 'posse')
        advanceQuickLineupStep();
    },
    [
      clearPendingDelete,
      clearTransfer,
      updateActiveTeam,
      quickLineupSession,
      advanceQuickLineupStep,
      allowDupes,
      usedPosseByTeamOrder,
      teams,
      effectiveActiveTeamId,
      pickerPosses,
      requestPosseTransfer,
    ],
  );

  const handleTabChange = useCallback(
    (teamId: string) => {
      if (suppressTeamEditRef.current) return;
      clearPendingDelete();
      clearTransfer();
      cancelTeamRename();
      setActiveTeamId(teamId);
      setActiveSelection(null);
    },
    [
      clearPendingDelete,
      clearTransfer,
      cancelTeamRename,
      setActiveTeamId,
      setActiveSelection,
      suppressTeamEditRef,
    ],
  );

  const handleTabClose = useCallback(
    (teamId: string) => {
      const team = teams.find((entry) => entry.id === teamId);
      if (!team) return;
      clearTransfer();
      cancelTeamRename();
      requestDeleteTeam(team.id, team.name);
    },
    [teams, clearTransfer, cancelTeamRename, requestDeleteTeam],
  );

  const handleAppTeamTab = useCallback(() => {
    clearPendingDelete();
    clearPendingResetTeam();
    clearTransfer();
    cancelTeamRename();
    const result = addTeam(teams);
    setTeams(result.nextTeams);
  }, [
    clearPendingDelete,
    clearPendingResetTeam,
    clearTransfer,
    cancelTeamRename,
    teams,
    setTeams,
  ]);

  const pendingTransferDialog = usePendingTransferDialog({
    pendingTransfer,
    teams,
    setTeams,
    clearTransfer,
  });

  function handleDndDragStart(
    event: Parameters<typeof handleCoordinatedDragStart>[0],
  ) {
    suppressTeamEditRef.current = true;
    setPredictedDropHover(null);
    handleCoordinatedDragStart(event);
  }

  function handleDndDragOver(
    event: Parameters<typeof handleCoordinatedDragOver>[0],
  ) {
    const overId =
      typeof event.over?.id === 'string' ? event.over.id : undefined;
    const dragData = event.active.data.current as DragData | undefined;
    setPredictedDropHover(
      resolvePredictedDropHover(dragData, overId, slotById),
    );
    handleCoordinatedDragOver(event);
  }

  function handleDndDragEnd(
    event: Parameters<typeof handleCoordinatedDragEnd>[0],
  ) {
    setPredictedDropHover(null);
    handleCoordinatedDragEnd(event);
    clearTeamEditSuppressionSoon();
  }

  function handleDndDragCancel() {
    setPredictedDropHover(null);
    handleCoordinatedDragCancel();
    clearTeamEditSuppressionSoon();
  }

  const canUndoReset = Boolean(undoResetSnapshot);

  return (
    <DndContext
      onDragCancel={handleDndDragCancel}
      onDragEnd={handleDndDragEnd}
      onDragOver={handleDndDragOver}
      onDragStart={handleDndDragStart}
      sensors={sensors}
    >
      <section className='space-y-4'>
        <BuilderToolkitBar
          activeTeamId={activeTeam.id}
          canUndoReset={canUndoReset}
          onExportAll={openExportAllDialog}
          onExportInGame={openTeamIngameExportDialog}
          onImport={() => {
            clearPendingDelete();
            clearTransfer();
            cancelTeamRename();
            openImportDialog();
          }}
          onResetBuilder={requestResetBuilder}
          onUndoReset={undoResetBuilder}
          teamsCount={teams.length}
        />

        <div className='grid items-start gap-4 lg:grid-cols-[2fr_1fr]'>
          <div className='min-w-0 space-y-3'>
            <TabbedContainer
              activeTabId={effectiveActiveTeamId}
              bodyClassName='p-0'
              canCloseTab={() => teams.length > 1}
              className='overflow-hidden'
              getTabCloseAriaLabel={(tab) => `Close ${tab.label}`}
              leftEarMaxWidth='100%'
              leftTrailingAction={
                teams.length < MAX_TEAMS ? (
                  <button
                    aria-label='Add team tab'
                    className='tabbed-container-tab tabbed-container-tab-inactive h-full px-3 text-[11px] tracking-wide text-slate-300 transition-colors'
                    onClick={handleAppTeamTab}
                    type='button'
                  >
                    +
                  </button>
                ) : null
              }
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              tabSizing='content'
              tabs={teams.map((team) => ({id: team.id, label: team.name}))}
              tone='amber'
            >
              <BuilderActiveTeamPanel
                activeDragKind={activeDrag?.kind ?? null}
                activePosseAsset={activePosseAsset}
                activePosseName={activePosse?.name}
                activeTeamId={effectiveActiveTeamId}
                activeTeamName={activeTeam.name}
                awakenerLevelByName={awakenerLevelByName}
                editingTeamName={editingTeamName}
                isActivePosseOwned={
                  activePosseId
                    ? (ownedPosseLevelById.get(activePosseId) ?? null) !== null
                    : true
                }
                isEditingTeamName={
                  editingTeamId === effectiveActiveTeamId &&
                  editingTeamSurface === 'header'
                }
                onBackQuickLineupStep={goBackQuickLineupStep}
                onBeginTeamRename={beginTeamRename}
                onCancelQuickLineup={cancelQuickLineup}
                onCancelTeamRename={cancelTeamRename}
                onCardClick={handleCardClick}
                onCommitTeamRename={commitTeamRename}
                onCovenantSlotClick={handleCovenantSlotClick}
                onEditingTeamNameChange={setEditingTeamName}
                onFinishQuickLineup={finishQuickLineup}
                onOpenPossePicker={() => {
                  setPickerTab('posses');
                }}
                onRemoveActiveSelection={handleRemoveActiveSelection}
                onSkipQuickLineupStep={skipQuickLineupStep}
                onStartQuickLineup={startQuickLineup}
                onWheelSlotClick={handleWheelSlotClick}
                ownedAwakenerLevelByName={ownedAwakenerLevelByName}
                ownedWheelLevelById={ownedWheelLevelById}
                predictedDropHover={predictedDropHover}
                quickLineupSession={quickLineupSession}
                resolvedActiveSelection={resolvedActiveSelection}
                teamRealms={teamRealmSet}
                teamSlots={teamSlots}
              />
            </TabbedContainer>

            <BuilderTeamsPanel
              activeTeamId={effectiveActiveTeamId}
              editingTeamId={editingTeamId}
              editingTeamName={editingTeamName}
              editingTeamSurface={editingTeamSurface}
              onAddTeam={() => {
                setTeams(addTeam(teams).nextTeams);
              }}
              onApplyTeamTemplate={(templateId: TeamTemplateId) => {
                clearPendingDelete();
                clearPendingResetTeam();
                clearTransfer();
                cancelTeamRename();
                const result = applyTeamTemplate(teams, templateId);
                setTeams(result.nextTeams);
                const templateLabel =
                  templateId === 'DTIDE_10' ? 'D-Tide (10)' : 'D-Tide (5)';
                if (
                  result.createdCount === 0 &&
                  result.renamedCount === 0 &&
                  result.removedCount === 0
                ) {
                  showToast(
                    `${templateLabel} already matches current team layout.`,
                  );
                  return;
                }
                showToast(
                  `Applied ${templateLabel}: renamed ${String(result.renamedCount)}, created ${String(result.createdCount)}, removed ${String(result.removedCount)}.`,
                );
              }}
              onBeginTeamRename={(teamId, currentName, surface) => {
                clearPendingDelete();
                clearTransfer();
                beginTeamRename(teamId, currentName, surface);
              }}
              onCancelTeamRename={cancelTeamRename}
              onCommitTeamRename={commitTeamRename}
              onDeleteTeam={(teamId, teamName) => {
                clearTransfer();
                cancelTeamRename();
                requestDeleteTeam(teamId, teamName);
              }}
              onEditTeam={(teamId) => {
                if (suppressTeamEditRef.current) return;
                clearPendingDelete();
                clearPendingResetTeam();
                clearTransfer();
                cancelTeamRename();
                setActiveTeamId(teamId);
                setActiveSelection(null);
              }}
              onEditingTeamNameChange={setEditingTeamName}
              onExportTeam={openTeamExportDialog}
              onResetTeam={(teamId, teamName) => {
                clearTransfer();
                cancelTeamRename();
                requestResetTeam(teamId, teamName);
              }}
              onTeamPreviewModeChange={setTeamPreviewMode}
              ownedAwakenerLevelByName={ownedAwakenerLevelByName}
              ownedPosseLevelById={ownedPosseLevelById}
              ownedWheelLevelById={ownedWheelLevelById}
              posses={pickerPosses}
              teamPreviewMode={teamPreviewMode}
              teams={teams}
            />
          </div>

          <BuilderSelectionPanel
            activePosseId={activePosseId}
            activeSearchQuery={activeSearchQuery}
            allowDupes={allowDupes}
            awakenerFilter={awakenerFilter}
            awakenerSortDirection={awakenerSortDirection}
            awakenerSortGroupByRealm={awakenerSortGroupByRealm}
            awakenerSortKey={awakenerSortKey}
            displayUnowned={displayUnowned}
            effectiveActiveTeamId={effectiveActiveTeamId}
            filteredAwakeners={filteredAwakeners}
            filteredCovenants={filteredCovenants}
            filteredPosses={filteredPosses}
            filteredWheels={filteredWheels}
            onAllowDupesChange={setAllowDupes}
            onAwakenerClick={handlePickerAwakenerClick}
            onAwakenerFilterChange={setAwakenerFilter}
            onAwakenerSortDirectionToggle={toggleAwakenerSortDirection}
            onAwakenerSortGroupByRealmChange={setAwakenerSortGroupByRealm}
            onAwakenerSortKeyChange={setAwakenerSortKey}
            onDisplayUnownedChange={setDisplayUnowned}
            onPickerTabChange={setPickerTab}
            onPosseFilterChange={setPosseFilter}
            onSearchChange={(nextValue) => {
              setPickerSearchByTab((prev) => ({
                ...prev,
                [pickerTab]: nextValue,
              }));
            }}
            onSetActiveCovenant={handlePickerCovenantClick}
            onSetActivePosse={handleSetActivePosse}
            onSetActiveWheel={handlePickerWheelClick}
            onWheelMainstatFilterChange={setWheelMainstatFilter}
            onWheelRarityFilterChange={setWheelRarityFilter}
            ownedAwakenerLevelByName={ownedAwakenerLevelByName}
            ownedPosseLevelById={ownedPosseLevelById}
            ownedWheelLevelById={ownedWheelLevelById}
            pickerTab={pickerTab}
            posseFilter={posseFilter}
            searchInputRef={searchInputRef}
            teamRealmSet={teamRealmSet}
            teams={teams}
            usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
            usedPosseByTeamOrder={usedPosseByTeamOrder}
            usedWheelByTeamOrder={usedWheelByTeamOrder}
            wheelMainstatFilter={wheelMainstatFilter}
            wheelRarityFilter={wheelRarityFilter}
          />
        </div>
      </section>

      <DragOverlay dropAnimation={null}>
        <BuilderDragOverlayWrapper
          activeDrag={activeDrag}
          activePreviewDraggedSlot={activePreviewDraggedSlot}
          activePreviewDraggedTeam={activePreviewDraggedTeam}
          isRemoveIntent={isRemoveIntent}
          isTeamPreviewRemoveIntent={isTeamPreviewRemoveIntent}
          ownedAwakenerLevelByName={ownedAwakenerLevelByName}
          ownedWheelLevelById={ownedWheelLevelById}
          slotById={slotById}
          teamPreviewMode={teamPreviewMode}
        />
      </DragOverlay>

      <BuilderConfirmDialogs
        deleteDialog={pendingDeleteDialog}
        onCancelDelete={clearPendingDelete}
        onCancelReset={cancelResetBuilder}
        onCancelResetTeam={clearPendingResetTeam}
        onCancelTransfer={clearTransfer}
        resetDialog={
          pendingResetBuilder
            ? {
                title: 'Reset Builder',
                message: 'Reset all teams back to a fresh builder state?',
                onConfirm: confirmResetBuilder,
              }
            : null
        }
        resetTeamDialog={pendingResetTeamDialog}
        transferDialog={pendingTransferDialog}
      />

      <BuilderImportExportDialogs
        exportDialog={exportDialog}
        isImportDialogOpen={isImportDialogOpen}
        onCancelDuplicateOverrideImport={cancelDuplicateOverrideImport}
        onCancelImport={closeImportFlow}
        onCancelReplaceImport={cancelReplaceImport}
        onCancelStrategyImport={cancelStrategyImport}
        onCloseExportDialog={closeExportDialog}
        onConfirmDuplicateOverrideImport={confirmDuplicateOverrideImport}
        onConfirmReplaceImport={confirmReplaceImport}
        onMoveStrategyImport={applyMoveStrategyImport}
        onSkipStrategyImport={applySkipStrategyImport}
        onSubmitImport={submitImportCode}
        pendingDuplicateOverrideImport={pendingDuplicateOverrideImport}
        pendingReplaceImport={pendingReplaceImport}
        pendingStrategyConflictSummary={pendingStrategyConflictSummary}
        pendingStrategyImport={pendingStrategyImport}
      />

      <Toast entries={toastEntries} />
    </DndContext>
  );
}
