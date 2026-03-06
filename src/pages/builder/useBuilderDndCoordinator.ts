import {getDragKind} from '@/pages/builder/utils';
import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core';

interface UseBuilderDndCoordinatorOptions {
  onTeamRowDragStart: (teamId: string) => void;
  onTeamRowDragEnd: () => void;
  onTeamRowDragCancel: () => void;
  onTeamPreviewSlotDragStart: (teamId: string, slotId: string) => void;
  onTeamPreviewSlotDragOver: (overId: string | null) => void;
  onTeamPreviewSlotDragEnd: (
    teamId: string,
    slotId: string,
    overId: string | null,
  ) => void;
  onTeamPreviewSlotDragCancel: () => void;
  onTeamRowReorder: (sourceTeamId: string, targetTeamId: string) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
}

function extractStringPayload(data: unknown, key: string): string | undefined {
  if (typeof data === 'object' && data !== null && key in data) {
    const value = (data as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

export function useBuilderDndCoordinator({
  onTeamRowDragStart,
  onTeamRowDragEnd,
  onTeamRowDragCancel,
  onTeamPreviewSlotDragStart,
  onTeamPreviewSlotDragOver,
  onTeamPreviewSlotDragEnd,
  onTeamPreviewSlotDragCancel,
  onTeamRowReorder,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
}: UseBuilderDndCoordinatorOptions) {
  function handleDragStart(event: DragStartEvent) {
    const dragData = event.active.data.current;
    const dragKind = getDragKind(dragData);

    if (dragKind === 'team-row') {
      const teamId = extractStringPayload(dragData, 'teamId');
      if (teamId !== undefined) {
        onTeamRowDragStart(teamId);
      }
      return;
    }

    if (dragKind === 'team-preview-slot') {
      const teamId = extractStringPayload(dragData, 'teamId');
      const slotId = extractStringPayload(dragData, 'slotId');
      if (teamId !== undefined && slotId !== undefined) {
        onTeamPreviewSlotDragStart(teamId, slotId);
      }
      return;
    }

    onDragStart(event);
  }

  function handleDragOver(event: DragOverEvent) {
    const dragData = event.active.data.current;
    const dragKind = getDragKind(dragData);

    if (dragKind === 'team-row') {
      return;
    }

    if (dragKind === 'team-preview-slot') {
      const overId = typeof event.over?.id === 'string' ? event.over.id : null;
      onTeamPreviewSlotDragOver(overId);
      return;
    }

    onDragOver(event);
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = event.active.data.current;
    const dragKind = getDragKind(dragData);

    if (dragKind === 'team-row') {
      const sourceTeamId = extractStringPayload(dragData, 'teamId');
      const targetTeamId =
        typeof event.over?.id === 'string' ? event.over.id : undefined;

      if (sourceTeamId !== undefined && targetTeamId !== undefined) {
        onTeamRowReorder(sourceTeamId, targetTeamId);
      }
      onTeamRowDragEnd();
      return;
    }

    if (dragKind === 'team-preview-slot') {
      const teamId = extractStringPayload(dragData, 'teamId');
      const slotId = extractStringPayload(dragData, 'slotId');
      const overId = typeof event.over?.id === 'string' ? event.over.id : null;

      if (teamId !== undefined && slotId !== undefined) {
        onTeamPreviewSlotDragEnd(teamId, slotId, overId);
      } else {
        onTeamPreviewSlotDragEnd('', '', null);
      }
      return;
    }

    onDragEnd(event);
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel: () => {
      onTeamPreviewSlotDragCancel();
      onTeamRowDragCancel();
      onDragCancel();
    },
  };
}
