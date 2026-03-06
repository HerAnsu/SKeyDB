import type {Awakener} from '@/domain/awakeners';

export interface TeamSlot {
  readonly slotId: string;
  readonly awakenerName?: string;
  readonly realm?: Awakener['realm'];
  readonly level?: number;
  readonly isSupport?: boolean;
  readonly wheels: readonly [string | null, string | null];
  readonly covenantId?: string;
}

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly slots: readonly TeamSlot[];
  readonly posseId?: string;
}

export interface WheelUsageLocation {
  readonly teamOrder: number;
  readonly teamId: string;
  readonly slotId: string;
  readonly wheelIndex: number;
}

export interface CovenantUsageLocation {
  readonly teamOrder: number;
  readonly teamId: string;
  readonly slotId: string;
}

export type PickerTab = 'awakeners' | 'wheels' | 'posses' | 'covenants';
export type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA';
export type PosseFilter =
  | 'ALL'
  | 'FADED_LEGACY'
  | 'AEQUOR'
  | 'CARO'
  | 'CHAOS'
  | 'ULTRA';
export type WheelRarityFilter = 'ALL' | 'SSR' | 'SR' | 'R';
export type WheelMainstatFilter =
  | 'ALL'
  | 'CRIT_RATE'
  | 'CRIT_DMG'
  | 'REALM_MASTERY'
  | 'DMG_AMP'
  | 'ALIEMUS_REGEN'
  | 'KEYFLARE_REGEN'
  | 'SIGIL_YIELD'
  | 'DEATH_RESISTANCE';
export type TeamPreviewMode = 'compact' | 'expanded';
export type QuickLineupStep =
  | {kind: 'awakener'; slotId: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: number}
  | {kind: 'covenant'; slotId: string}
  | {kind: 'posse'};

export interface QuickLineupSession {
  readonly isActive: true;
  readonly currentStepIndex: number;
  readonly currentStep: QuickLineupStep;
  readonly totalSteps: number;
  readonly canGoBack: boolean;
}

export type ActiveSelection =
  | {kind: 'awakener'; slotId: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: number}
  | {kind: 'covenant'; slotId: string}
  | null;

export type PredictedDropHover =
  | {kind: 'wheel'; slotId: string; wheelIndex: number}
  | {kind: 'covenant'; slotId: string}
  | null;

export type DragData =
  | {kind: 'picker-awakener'; awakenerName: string}
  | {kind: 'picker-wheel'; wheelId: string}
  | {kind: 'picker-covenant'; covenantId: string}
  | {kind: 'team-slot'; slotId: string; awakenerName: string}
  | {kind: 'team-preview-slot'; teamId: string; slotId: string}
  | {kind: 'team-wheel'; slotId: string; wheelIndex: number; wheelId: string}
  | {kind: 'team-covenant'; slotId: string; covenantId: string}
  | {kind: 'team-row'; teamId: string};
