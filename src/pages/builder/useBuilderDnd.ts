import {
  parseCovenantDropZoneId,
  parseWheelDropZoneId,
  PICKER_DROP_ZONE_ID,
} from '@/pages/builder/dnd-ids';
import type {DragData} from '@/pages/builder/types';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {useState} from 'react';

interface UseBuilderDndOptions {
  onDropPickerAwakener: (awakenerName: string, targetSlotId: string) => void;
  onDropPickerWheel: (
    wheelId: string,
    targetSlotId: string,
    targetWheelIndex?: number,
  ) => void;
  onDropPickerCovenant: (covenantId: string, targetSlotId: string) => void;
  onDropTeamSlot: (sourceSlotId: string, targetSlotId: string) => void;
  onDropTeamWheel: (
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
    targetWheelIndex: number,
  ) => void;
  onDropTeamWheelToSlot: (
    sourceSlotId: string,
    sourceWheelIndex: number,
    targetSlotId: string,
  ) => void;
  onDropTeamCovenant: (sourceSlotId: string, targetSlotId: string) => void;
  onDropTeamCovenantToSlot: (
    sourceSlotId: string,
    targetSlotId: string,
  ) => void;
  onDropTeamSlotToPicker: (sourceSlotId: string) => void;
  onDropTeamWheelToPicker: (
    sourceSlotId: string,
    sourceWheelIndex: number,
  ) => void;
  onDropTeamCovenantToPicker: (sourceSlotId: string) => void;
}

function isTeamSlotId(id: string): boolean {
  return id.startsWith('slot-');
}

export function useBuilderDnd({
  onDropPickerAwakener,
  onDropPickerWheel,
  onDropPickerCovenant,
  onDropTeamSlot,
  onDropTeamWheel,
  onDropTeamWheelToSlot,
  onDropTeamCovenant,
  onDropTeamCovenantToSlot,
  onDropTeamSlotToPicker,
  onDropTeamWheelToPicker,
  onDropTeamCovenantToPicker,
}: UseBuilderDndOptions) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [isRemoveIntent, setIsRemoveIntent] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {distance: 4},
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (!data) {
      return;
    }
    setIsRemoveIntent(false);
    setActiveDrag(data);
  }

  function handleDragOver(event: DragOverEvent) {
    const isTeamDrag =
      activeDrag?.kind === 'team-slot' ||
      activeDrag?.kind === 'team-wheel' ||
      activeDrag?.kind === 'team-covenant';

    if (!isTeamDrag) {
      if (isRemoveIntent) {
        setIsRemoveIntent(false);
      }
      return;
    }

    const overId = event.over?.id;
    const nextRemoveIntent = overId === PICKER_DROP_ZONE_ID;
    if (nextRemoveIntent !== isRemoveIntent) {
      setIsRemoveIntent(nextRemoveIntent);
    }
  }

  function handlePickerAwakenerDrop(
    data: Extract<DragData, {kind: 'picker-awakener'}>,
    overId: string,
  ) {
    const overWheelZone = parseWheelDropZoneId(overId);
    const overCovenantZone = parseCovenantDropZoneId(overId);
    const targetSlotId =
      overWheelZone?.slotId ??
      overCovenantZone?.slotId ??
      (isTeamSlotId(overId) ? overId : null);

    if (targetSlotId) {
      onDropPickerAwakener(data.awakenerName, targetSlotId);
    }
  }

  function handlePickerWheelDrop(
    data: Extract<DragData, {kind: 'picker-wheel'}>,
    overId: string,
  ) {
    const overWheelZone = parseWheelDropZoneId(overId);
    if (overWheelZone) {
      onDropPickerWheel(
        data.wheelId,
        overWheelZone.slotId,
        overWheelZone.wheelIndex,
      );
      return;
    }

    const overCovenantZone = parseCovenantDropZoneId(overId);
    const targetSlotId =
      overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null);
    if (targetSlotId) {
      onDropPickerWheel(data.wheelId, targetSlotId);
    }
  }

  function handlePickerCovenantDrop(
    data: Extract<DragData, {kind: 'picker-covenant'}>,
    overId: string,
  ) {
    const overCovenantZone = parseCovenantDropZoneId(overId);
    const targetSlotId =
      overCovenantZone?.slotId ?? (isTeamSlotId(overId) ? overId : null);
    if (targetSlotId) {
      onDropPickerCovenant(data.covenantId, targetSlotId);
    }
  }

  function handleTeamSlotDrop(
    data: Extract<DragData, {kind: 'team-slot'}>,
    overId: string,
  ) {
    if (overId === PICKER_DROP_ZONE_ID) {
      onDropTeamSlotToPicker(data.slotId);
      return;
    }

    const overWheelZone = parseWheelDropZoneId(overId);
    const overCovenantZone = parseCovenantDropZoneId(overId);
    const targetSlotId =
      overWheelZone?.slotId ?? (isTeamSlotId(overId) ? overId : null);
    const resolvedTargetSlotId = targetSlotId ?? overCovenantZone?.slotId;

    if (resolvedTargetSlotId) {
      onDropTeamSlot(data.slotId, resolvedTargetSlotId);
    }
  }

  function handleTeamCovenantDrop(
    data: Extract<DragData, {kind: 'team-covenant'}>,
    overId: string,
  ) {
    if (overId === PICKER_DROP_ZONE_ID) {
      onDropTeamCovenantToPicker(data.slotId);
      return;
    }

    const overCovenantZone = parseCovenantDropZoneId(overId);
    if (overCovenantZone) {
      onDropTeamCovenant(data.slotId, overCovenantZone.slotId);
      return;
    }

    if (isTeamSlotId(overId)) {
      onDropTeamCovenantToSlot(data.slotId, overId);
    }
  }

  function handleTeamWheelDrop(
    data: Extract<DragData, {kind: 'team-wheel'}>,
    overId: string,
  ) {
    if (overId === PICKER_DROP_ZONE_ID) {
      onDropTeamWheelToPicker(data.slotId, data.wheelIndex);
      return;
    }

    const overWheelZone = parseWheelDropZoneId(overId);
    if (!overWheelZone) {
      if (isTeamSlotId(overId)) {
        onDropTeamWheelToSlot(data.slotId, data.wheelIndex, overId);
      }
      return;
    }

    onDropTeamWheel(
      data.slotId,
      data.wheelIndex,
      overWheelZone.slotId,
      overWheelZone.wheelIndex,
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const data = event.active.data.current as DragData | undefined;
    const overId = event.over?.id;

    setIsRemoveIntent(false);
    setActiveDrag(null);

    if (!data || typeof overId !== 'string') {
      return;
    }

    switch (data.kind) {
      case 'picker-awakener':
        handlePickerAwakenerDrop(data, overId);
        break;
      case 'picker-wheel':
        handlePickerWheelDrop(data, overId);
        break;
      case 'picker-covenant':
        handlePickerCovenantDrop(data, overId);
        break;
      case 'team-slot':
        handleTeamSlotDrop(data, overId);
        break;
      case 'team-covenant':
        handleTeamCovenantDrop(data, overId);
        break;
      case 'team-wheel':
        handleTeamWheelDrop(data, overId);
        break;
    }
  }

  function handleDragCancel() {
    setIsRemoveIntent(false);
    setActiveDrag(null);
  }

  return {
    activeDrag,
    isRemoveIntent,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
