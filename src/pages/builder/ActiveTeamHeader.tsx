import tempPosseIcon from '@/assets/posse/00-temposse.png';
import {
  DEFAULT_REALM_TINT,
  getRealmIcon,
  getRealmLabel,
  getRealmTint,
  normalizeRealmId,
} from '@/domain/factions';
import {TeamNameInlineEditor} from '@/pages/builder/TeamNameInlineEditor';
import type {QuickLineupSession} from '@/pages/builder/types';
import type {CSSProperties} from 'react';

export interface ActiveTeamHeaderProps {
  readonly activeTeamId: string;
  readonly activeTeamName: string;
  readonly isEditingTeamName: boolean;
  readonly editingTeamName: string;
  readonly activePosseAsset: string | undefined;
  readonly activePosseName: string | undefined;
  readonly isActivePosseOwned: boolean;
  readonly teamRealms: string[];
  readonly quickLineupSession: QuickLineupSession | null;
  readonly onBackQuickLineupStep: () => void;
  readonly onBeginTeamRename: (
    teamId: string,
    currentName: string,
    surface: 'header' | 'list',
  ) => void;
  readonly onCancelQuickLineup: () => void;
  readonly onCommitTeamRename: (teamId: string) => void;
  readonly onCancelTeamRename: () => void;
  readonly onEditingTeamNameChange: (nextValue: string) => void;
  readonly onFinishQuickLineup: () => void;
  readonly onOpenPossePicker: () => void;
  readonly onStartQuickLineup: () => void;
}

interface RealmMeta {
  label: string;
  icon: string;
  tint: string;
}

const realmMetaById: Record<string, RealmMeta> = {
  AEQUOR: {
    label: getRealmLabel('AEQUOR'),
    icon: getRealmIcon('AEQUOR') ?? '',
    tint: getRealmTint('AEQUOR'),
  },
  CARO: {
    label: getRealmLabel('CARO'),
    icon: getRealmIcon('CARO') ?? '',
    tint: getRealmTint('CARO'),
  },
  CHAOS: {
    label: getRealmLabel('CHAOS'),
    icon: getRealmIcon('CHAOS') ?? '',
    tint: getRealmTint('CHAOS'),
  },
  ULTRA: {
    label: getRealmLabel('ULTRA'),
    icon: getRealmIcon('ULTRA') ?? '',
    tint: getRealmTint('ULTRA'),
  },
};

export function ActiveTeamHeader({
  activeTeamId,
  activeTeamName,
  isEditingTeamName,
  editingTeamName,
  activePosseAsset,
  activePosseName,
  isActivePosseOwned,
  teamRealms,
  onBeginTeamRename,
  onCommitTeamRename,
  onCancelTeamRename,
  onEditingTeamNameChange,
  onOpenPossePicker,
  onBackQuickLineupStep,
  onCancelQuickLineup,
  onFinishQuickLineup,
  onStartQuickLineup,
  quickLineupSession,
}: ActiveTeamHeaderProps) {
  const normalizedRealms = Array.from(
    new Set(teamRealms.map(normalizeRealmId)),
  ).slice(0, 2);

  const activeRealms = normalizedRealms
    .map((realmId) => realmMetaById[realmId] as RealmMeta | undefined)
    .filter((meta): meta is NonNullable<RealmMeta> => meta !== undefined);

  const hasSingleRealm = activeRealms.length === 1;
  const tintA = activeRealms[0]?.tint ?? DEFAULT_REALM_TINT;
  const tintB = activeRealms[1]?.tint ?? tintA;

  let badgeStateClass = 'builder-team-realm-badge-empty';
  if (activeRealms.length === 1) {
    badgeStateClass = 'builder-team-realm-badge-single';
  } else if (activeRealms.length === 2) {
    badgeStateClass = 'builder-team-realm-badge-split';
  }

  const badgeStyle = {
    '--team-realm-tint-a': tintA,
    '--team-realm-tint-b': tintB,
  } as CSSProperties;

  const displayedPosseAsset = activePosseAsset ?? tempPosseIcon;

  return (
    <div className='builder-team-header border-b border-slate-500/50 pb-3'>
      <div
        className={`builder-team-realm-badge ${badgeStateClass}`}
        style={badgeStyle}
      >
        {activeRealms.length === 0 ? (
          <span className='sigil-placeholder' />
        ) : (
          <div
            className={`builder-team-realm-stack ${hasSingleRealm ? 'builder-team-realm-stack-single' : ''}`}
          >
            <div
              className={`builder-team-realm-icons ${hasSingleRealm ? 'builder-team-realm-icons-single' : ''}`}
            >
              {activeRealms.map((realm) => (
                <span
                  className='builder-team-realm-icon-wrap'
                  key={realm.label}
                >
                  <img
                    alt={`${realm.label} realm`}
                    className='builder-team-realm-icon'
                    draggable={false}
                    src={realm.icon}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='builder-team-realm-copy'>
        <TeamNameInlineEditor
          draftName={editingTeamName}
          isEditing={isEditingTeamName}
          onBeginEdit={() => {
            onBeginTeamRename(activeTeamId, activeTeamName, 'header');
          }}
          onCancel={onCancelTeamRename}
          onCommit={() => {
            onCommitTeamRename(activeTeamId);
          }}
          onDraftChange={onEditingTeamNameChange}
          teamName={activeTeamName}
          variant='header'
        />
        <p className='text-xs tracking-wide text-slate-300'>
          {activeRealms.length > 0 ? (
            <>
              {activeRealms.map((realm, index) => (
                <span key={realm.label}>
                  <span
                    className='builder-team-realm-label-segment'
                    style={{color: realm.tint}}
                  >
                    {realm.label}
                  </span>
                  {index < activeRealms.length - 1 ? (
                    <span className='text-slate-400'> / </span>
                  ) : null}
                </span>
              ))}
            </>
          ) : (
            'No Realm'
          )}
        </p>
      </div>

      <button
        className='builder-team-posse-button'
        onClick={onOpenPossePicker}
        type='button'
      >
        <span className='builder-team-posse-copy'>
          <span className='ui-title text-xl text-amber-100'>Posse</span>
          <span className='text-xs tracking-wide text-slate-300/90'>
            {activePosseName ?? 'Not Set'}
            {activePosseName && !isActivePosseOwned ? ' (Unowned)' : ''}
          </span>
        </span>
        <span className='builder-team-posse-icon-wrap'>
          <img
            alt={
              activePosseName ? `${activePosseName} posse` : 'Posse placeholder'
            }
            className='builder-team-posse-icon'
            draggable={false}
            src={displayedPosseAsset}
          />
        </span>
      </button>

      <div className='builder-header-actions border-l border-slate-500/30 pl-3'>
        {quickLineupSession?.isActive ? (
          <div className='flex items-center gap-2'>
            {quickLineupSession.canGoBack ? (
              <button
                className='builder-action-button builder-action-button-cancel'
                onClick={onBackQuickLineupStep}
                type='button'
              >
                Back
              </button>
            ) : (
              <button
                className='builder-action-button builder-action-button-cancel'
                onClick={onCancelQuickLineup}
                type='button'
              >
                Cancel
              </button>
            )}
            <div className='flex flex-col items-center'>
              <span className='text-[10px] tracking-widest whitespace-nowrap text-slate-400 uppercase'>
                Quick Lineup
              </span>
              <span className='ui-title text-sm text-amber-100'>
                {quickLineupSession.currentStepIndex + 1} /{' '}
                {quickLineupSession.totalSteps}
              </span>
            </div>
            <button
              className='builder-action-button builder-action-button-primary'
              onClick={onFinishQuickLineup}
              type='button'
            >
              Finish
            </button>
          </div>
        ) : (
          <button
            className='builder-action-button builder-action-button-primary'
            onClick={onStartQuickLineup}
            type='button'
          >
            Quick Lineup
          </button>
        )}
      </div>
    </div>
  );
}
