import {useState} from 'react';

export interface PendingAwakenerTransfer {
  readonly kind: 'awakener';
  readonly itemName: string;
  readonly awakenerName: string;
  readonly canUseSupport?: boolean;
  readonly fromTeamId: string;
  readonly toTeamId: string;
  readonly targetSlotId?: string;
}

export interface PendingPosseTransfer {
  readonly kind: 'posse';
  readonly itemName: string;
  readonly posseId: string;
  readonly fromTeamId: string;
  readonly toTeamId: string;
}

export interface PendingWheelTransfer {
  readonly kind: 'wheel';
  readonly itemName: string;
  readonly wheelId: string;
  readonly fromTeamId: string;
  readonly fromSlotId: string;
  readonly fromWheelIndex: number;
  readonly toTeamId: string;
  readonly targetSlotId: string;
  readonly targetWheelIndex: number;
}

export type PendingTransfer =
  | PendingAwakenerTransfer
  | PendingPosseTransfer
  | PendingWheelTransfer;

interface RequestAwakenerTransfer {
  readonly awakenerName: string;
  readonly canUseSupport?: boolean;
  readonly fromTeamId: string;
  readonly toTeamId: string;
  readonly targetSlotId?: string;
}

interface RequestPosseTransfer {
  readonly posseId: string;
  readonly posseName: string;
  readonly fromTeamId: string;
  readonly toTeamId: string;
}

interface RequestWheelTransfer {
  readonly wheelId: string;
  readonly fromTeamId: string;
  readonly fromSlotId: string;
  readonly fromWheelIndex: number;
  readonly toTeamId: string;
  readonly targetSlotId: string;
  readonly targetWheelIndex: number;
}

export function useTransferConfirm() {
  const [pendingTransfer, setPendingTransfer] =
    useState<PendingTransfer | null>(null);

  function requestAwakenerTransfer({
    awakenerName,
    canUseSupport,
    fromTeamId,
    toTeamId,
    targetSlotId,
  }: RequestAwakenerTransfer) {
    setPendingTransfer({
      kind: 'awakener',
      itemName: awakenerName,
      awakenerName,
      canUseSupport,
      fromTeamId,
      toTeamId,
      targetSlotId,
    });
  }

  function requestPosseTransfer({
    posseId,
    posseName,
    fromTeamId,
    toTeamId,
  }: RequestPosseTransfer) {
    setPendingTransfer({
      kind: 'posse',
      itemName: posseName,
      posseId,
      fromTeamId,
      toTeamId,
    });
  }

  function requestWheelTransfer({
    wheelId,
    fromTeamId,
    fromSlotId,
    fromWheelIndex,
    toTeamId,
    targetSlotId,
    targetWheelIndex,
  }: RequestWheelTransfer) {
    setPendingTransfer({
      kind: 'wheel',
      itemName: wheelId,
      wheelId,
      fromTeamId,
      fromSlotId,
      fromWheelIndex,
      toTeamId,
      targetSlotId,
      targetWheelIndex,
    });
  }

  function clearTransfer() {
    setPendingTransfer(null);
  }

  return {
    pendingTransfer,
    requestAwakenerTransfer,
    requestPosseTransfer,
    requestWheelTransfer,
    clearTransfer,
  };
}
