import {
  parseCovenantDropZoneId,
  parseWheelDropZoneId,
  PICKER_DROP_ZONE_ID,
} from '@/pages/builder/dnd-ids';
import type {
  DragData,
  PredictedDropHover,
  TeamSlot,
} from '@/pages/builder/types';

function findFirstEmptyWheelIndex(slot: TeamSlot | undefined): number | null {
  if (!slot?.awakenerName) {
    return null;
  }
  const firstEmptyIndex = slot.wheels.findIndex((wheel) => !wheel);
  return firstEmptyIndex === -1 ? null : firstEmptyIndex;
}

export function resolvePredictedDropHover(
  dragData: DragData | null | undefined,
  overId: string | undefined,
  slotById: Map<string, TeamSlot>,
): PredictedDropHover {
  if (!dragData || !overId || overId === PICKER_DROP_ZONE_ID) return null;

  const overWheelZone = parseWheelDropZoneId(overId);
  const overCovenantZone = parseCovenantDropZoneId(overId);
  const targetSlotId =
    overCovenantZone?.slotId ??
    overWheelZone?.slotId ??
    (overId.startsWith('slot-') ? overId : null);

  if (dragData.kind === 'picker-wheel' || dragData.kind === 'team-wheel') {
    if (overWheelZone)
      return {
        kind: 'wheel',
        slotId: overWheelZone.slotId,
        wheelIndex: overWheelZone.wheelIndex,
      };
    if (!targetSlotId) return null;

    const wheelIndex = findFirstEmptyWheelIndex(slotById.get(targetSlotId));
    return wheelIndex !== null
      ? {kind: 'wheel', slotId: targetSlotId, wheelIndex}
      : null;
  }

  if (
    dragData.kind === 'picker-covenant' ||
    dragData.kind === 'team-covenant'
  ) {
    if (!targetSlotId) return null;
    const slot = slotById.get(targetSlotId);
    if (!slot?.awakenerName) return null;
    return {kind: 'covenant', slotId: targetSlotId};
  }

  return null;
}
