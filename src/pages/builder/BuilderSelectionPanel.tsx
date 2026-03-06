import {Button} from '@/components/ui/Button';
import {CollectionSortControls} from '@/components/ui/CollectionSortControls';
import {OwnedTogglePill} from '@/components/ui/OwnedTogglePill';
import {TabbedContainer} from '@/components/ui/TabbedContainer';
import {getAwakenerIdentityKey} from '@/domain/awakener-identity';
import type {Awakener} from '@/domain/awakeners';
import type {
  AwakenerSortKey,
  CollectionSortDirection,
} from '@/domain/collection-sorting';
import {getCovenantAssetById} from '@/domain/covenant-assets';
import type {Covenant} from '@/domain/covenants';
import {getPosseAssetById} from '@/domain/posse-assets';
import type {Posse} from '@/domain/posses';
import {getWheelAssetById} from '@/domain/wheel-assets';
import type {Wheel} from '@/domain/wheels';
import {PICKER_DROP_ZONE_ID} from '@/pages/builder/dnd-ids';
import {PickerAwakenerTile} from '@/pages/builder/PickerAwakenerTile';
import {PickerCovenantTile} from '@/pages/builder/PickerCovenantTile';
import {PickerDropZone} from '@/pages/builder/PickerDropZone';
import {PickerWheelTile} from '@/pages/builder/PickerWheelTile';
import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  Team,
  WheelMainstatFilter,
  WheelRarityFilter,
  WheelUsageLocation,
} from '@/pages/builder/types';
import {toOrdinal} from '@/pages/builder/utils';
import {wheelMainstatFilterOptions} from '@/pages/builder/wheel-mainstats';
import {useEffect, useState, type RefObject} from 'react';
import {FaChevronDown, FaChevronRight} from 'react-icons/fa6';

const pickerTabs: {readonly id: PickerTab; readonly label: string}[] = [
  {id: 'awakeners', label: 'Awakeners'},
  {id: 'wheels', label: 'Wheels'},
  {id: 'covenants', label: 'Covenants'},
  {id: 'posses', label: 'Posses'},
];

const awakenerFilterTabs: {
  readonly id: AwakenerFilter;
  readonly label: string;
}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
];

const posseFilterTabs: {readonly id: PosseFilter; readonly label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'FADED_LEGACY', label: 'Faded Legacy'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
];

const wheelRarityFilterTabs: {
  readonly id: WheelRarityFilter;
  readonly label: string;
}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'SSR', label: 'SSR'},
  {id: 'SR', label: 'SR'},
  {id: 'R', label: 'R'},
];

const BUILDER_AWAKENER_SORT_EXPANDED_KEY =
  'skeydb.builder.awakenerSortExpanded.v1';

export interface BuilderSelectionPanelProps {
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly pickerTab: PickerTab;
  readonly activeSearchQuery: string;
  readonly awakenerFilter: AwakenerFilter;
  readonly posseFilter: PosseFilter;
  readonly wheelRarityFilter: WheelRarityFilter;
  readonly wheelMainstatFilter: WheelMainstatFilter;
  readonly awakenerSortKey: AwakenerSortKey;
  readonly awakenerSortDirection: CollectionSortDirection;
  readonly awakenerSortGroupByRealm: boolean;
  readonly displayUnowned: boolean;
  readonly allowDupes: boolean;
  readonly filteredAwakeners: readonly Awakener[];
  readonly filteredPosses: readonly Posse[];
  readonly filteredWheels: readonly Wheel[];
  readonly filteredCovenants: readonly Covenant[];
  readonly ownedAwakenerLevelByName: Map<string, number | null>;
  readonly ownedWheelLevelById: Map<string, number | null>;
  readonly ownedPosseLevelById: Map<string, number | null>;
  readonly teamRealmSet: Set<string>;
  readonly usedAwakenerIdentityKeys: Set<string>;
  readonly activePosseId?: string;
  readonly teams: readonly Team[];
  readonly usedPosseByTeamOrder: Map<string, number>;
  readonly usedWheelByTeamOrder: Map<string, WheelUsageLocation>;
  readonly effectiveActiveTeamId: string;
  readonly onSearchChange: (nextValue: string) => void;
  readonly onPickerTabChange: (nextTab: PickerTab) => void;
  readonly onAwakenerFilterChange: (nextFilter: AwakenerFilter) => void;
  readonly onPosseFilterChange: (nextFilter: PosseFilter) => void;
  readonly onWheelRarityFilterChange: (nextFilter: WheelRarityFilter) => void;
  readonly onWheelMainstatFilterChange: (
    nextFilter: WheelMainstatFilter,
  ) => void;
  readonly onAwakenerSortKeyChange: (nextKey: AwakenerSortKey) => void;
  readonly onAwakenerSortDirectionToggle: () => void;
  readonly onAwakenerSortGroupByRealmChange: (
    nextGroupByRealm: boolean,
  ) => void;
  readonly onDisplayUnownedChange: (displayUnowned: boolean) => void;
  readonly onAllowDupesChange: (allowDupes: boolean) => void;
  readonly onAwakenerClick: (awakenerName: string) => void;
  readonly onSetActiveWheel: (wheelId?: string) => void;
  readonly onSetActiveCovenant: (covenantId?: string) => void;
  readonly onSetActivePosse: (posseId?: string) => void;
}

function AwakenersPickerZone({
  filteredAwakeners,
  teamRealmSet,
  allowDupes,
  usedAwakenerIdentityKeys,
  ownedAwakenerLevelByName,
  onAwakenerClick,
}: {
  readonly filteredAwakeners: readonly Awakener[];
  readonly teamRealmSet: Set<string>;
  readonly allowDupes: boolean;
  readonly usedAwakenerIdentityKeys: Set<string>;
  readonly ownedAwakenerLevelByName: Map<string, number | null>;
  readonly onAwakenerClick: (awakenerName: string) => void;
}) {
  return (
    <div className='grid grid-cols-4 gap-1.5'>
      {filteredAwakeners.map((awakener) => (
        <PickerAwakenerTile
          awakenerName={awakener.name}
          isInUse={
            !allowDupes &&
            usedAwakenerIdentityKeys.has(getAwakenerIdentityKey(awakener.name))
          }
          isOwned={
            (ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null
          }
          isRealmBlocked={
            teamRealmSet.size >= 2 &&
            !teamRealmSet.has(awakener.realm.trim().toUpperCase())
          }
          key={awakener.name}
          onClick={() => {
            onAwakenerClick(awakener.name);
          }}
          realm={awakener.realm}
        />
      ))}
    </div>
  );
}

function WheelsPickerZone({
  filteredWheels,
  allowDupes,
  usedWheelByTeamOrder,
  effectiveActiveTeamId,
  ownedWheelLevelById,
  onSetActiveWheel,
}: {
  readonly filteredWheels: readonly Wheel[];
  readonly allowDupes: boolean;
  readonly usedWheelByTeamOrder: Map<string, WheelUsageLocation>;
  readonly effectiveActiveTeamId: string;
  readonly ownedWheelLevelById: Map<string, number | null>;
  readonly onSetActiveWheel: (wheelId?: string) => void;
}) {
  return (
    <div className='grid grid-cols-4 gap-2'>
      <PickerWheelTile
        isNotSet
        onClick={() => {
          onSetActiveWheel(undefined);
        }}
      />
      {filteredWheels.map((wheel) => {
        const wheelAsset = getWheelAssetById(wheel.id);
        const usedByTeam = allowDupes
          ? undefined
          : usedWheelByTeamOrder.get(wheel.id);
        const isUsedByOtherTeam =
          usedByTeam && usedByTeam.teamId !== effectiveActiveTeamId;
        let blockedText: string | null = null;
        if (usedByTeam) {
          if (isUsedByOtherTeam) {
            blockedText = `Used in ${toOrdinal(usedByTeam.teamOrder + 1)} team`;
          } else {
            blockedText = 'Already used';
          }
        }

        return (
          <PickerWheelTile
            blockedText={blockedText}
            isBlocked={Boolean(isUsedByOtherTeam)}
            isInUse={Boolean(usedByTeam)}
            isOwned={(ownedWheelLevelById.get(wheel.id) ?? null) !== null}
            key={wheel.id}
            onClick={() => {
              onSetActiveWheel(wheel.id);
            }}
            wheelAsset={wheelAsset}
            wheelId={wheel.id}
            wheelName={wheel.name}
          />
        );
      })}
    </div>
  );
}

function CovenantsPickerZone({
  filteredCovenants,
  onSetActiveCovenant,
}: {
  readonly filteredCovenants: readonly Covenant[];
  readonly onSetActiveCovenant: (covenantId?: string) => void;
}) {
  return (
    <div className='grid grid-cols-4 gap-2'>
      <PickerCovenantTile
        isNotSet
        onClick={() => {
          onSetActiveCovenant(undefined);
        }}
      />
      {filteredCovenants.map((covenant) => (
        <PickerCovenantTile
          covenantAsset={getCovenantAssetById(covenant.id)}
          covenantId={covenant.id}
          covenantName={covenant.name}
          key={covenant.id}
          onClick={() => {
            onSetActiveCovenant(covenant.id);
          }}
        />
      ))}
    </div>
  );
}

function PossesPickerZone({
  filteredPosses,
  activePosseId,
  allowDupes,
  usedPosseByTeamOrder,
  teams,
  effectiveActiveTeamId,
  ownedPosseLevelById,
  onSetActivePosse,
}: {
  readonly filteredPosses: readonly Posse[];
  readonly activePosseId?: string;
  readonly allowDupes: boolean;
  readonly usedPosseByTeamOrder: Map<string, number>;
  readonly teams: readonly Team[];
  readonly effectiveActiveTeamId: string;
  readonly ownedPosseLevelById: Map<string, number | null>;
  readonly onSetActivePosse: (posseId?: string) => void;
}) {
  const renderPosseButton = (posse: Posse) => {
    const posseAsset = getPosseAssetById(posse.id);
    const isActive = activePosseId === posse.id;
    const usedByTeamOrder = allowDupes
      ? undefined
      : usedPosseByTeamOrder.get(posse.id);
    const usedByTeam =
      usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder];
    const isUsedByOtherTeam =
      usedByTeamOrder !== undefined && usedByTeam?.id !== effectiveActiveTeamId;
    const blockedText = isUsedByOtherTeam
      ? `Used in ${toOrdinal(usedByTeamOrder + 1)} team`
      : null;
    const ownedLevel = ownedPosseLevelById.get(posse.id) ?? null;
    const isUnowned = ownedLevel === null;

    let stateClass =
      'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45';
    if (isActive) {
      stateClass = 'border-amber-200/60 bg-slate-800/80';
    } else if (isUsedByOtherTeam) {
      stateClass = 'border-slate-500/45 bg-slate-900/45 opacity-55';
    } else if (isUnowned) {
      stateClass =
        'border-rose-300/35 bg-slate-900/55 hover:border-rose-200/45';
    }
    const label = blockedText ?? (isUnowned ? 'Unowned' : null);

    return (
      <button
        key={posse.id}
        aria-disabled={isUsedByOtherTeam}
        className={`relative border p-1 text-left transition-colors ${stateClass}`}
        onClick={() => {
          onSetActivePosse(posse.id);
        }}
        type='button'
      >
        <div className='relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70'>
          {posseAsset ? (
            <img
              alt={`${posse.name} posse`}
              className={`h-full w-full object-cover ${isUnowned ? 'builder-picker-art-unowned' : ''} ${blockedText ? 'builder-picker-art-dimmed' : ''}`}
              draggable={false}
              src={posseAsset}
            />
          ) : (
            <span className='sigil-placeholder' />
          )}
          {label && (
            <span
              className={`pointer-events-none absolute inset-x-0 top-0 truncate border-y px-1 py-0.5 text-center text-[9px] tracking-wide ${isUnowned ? 'border-rose-300/25 bg-slate-950/70 text-rose-100/95' : 'border-slate-300/30 bg-slate-950/62 text-slate-100/90'}`}
            >
              {label}
            </span>
          )}
        </div>
        <p
          className={`mt-1 truncate text-[11px] ${isActive ? 'text-amber-100' : 'text-slate-200'}`}
        >
          {posse.name}
        </p>
      </button>
    );
  };

  return (
    <div className='grid grid-cols-4 gap-2'>
      <button
        className={`border p-1 text-left transition-colors ${!activePosseId ? 'border-amber-200/60 bg-slate-800/80 text-amber-100' : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'}`}
        onClick={() => {
          onSetActivePosse(undefined);
        }}
        type='button'
      >
        <div className='aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70' />
        <p className='mt-1 truncate text-[11px] text-slate-200'>Not Set</p>
      </button>
      {filteredPosses.map(renderPosseButton)}
    </div>
  );
}

export function BuilderSelectionPanel(props: BuilderSelectionPanelProps) {
  const [isAwakenerSortExpanded, setIsAwakenerSortExpanded] = useState<boolean>(
    () => {
      try {
        return (
          typeof window !== 'undefined' &&
          window.localStorage.getItem(BUILDER_AWAKENER_SORT_EXPANDED_KEY) ===
            '1'
        );
      } catch {
        return false;
      }
    },
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        BUILDER_AWAKENER_SORT_EXPANDED_KEY,
        isAwakenerSortExpanded ? '1' : '0',
      );
    } catch {
      /* noop */
    }
  }, [isAwakenerSortExpanded]);

  const {
    searchInputRef,
    pickerTab,
    activeSearchQuery,
    awakenerFilter,
    posseFilter,
    wheelRarityFilter,
    wheelMainstatFilter,
    awakenerSortKey,
    awakenerSortDirection,
    awakenerSortGroupByRealm,
    displayUnowned,
    allowDupes,
    filteredAwakeners,
    filteredPosses,
    filteredWheels,
    filteredCovenants,
    ownedAwakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    teamRealmSet,
    usedAwakenerIdentityKeys,
    activePosseId,
    teams,
    usedPosseByTeamOrder,
    usedWheelByTeamOrder,
    effectiveActiveTeamId,
    onSearchChange,
    onPickerTabChange,
    onAwakenerFilterChange,
    onPosseFilterChange,
    onWheelRarityFilterChange,
    onWheelMainstatFilterChange,
    onAwakenerSortKeyChange,
    onAwakenerSortDirectionToggle,
    onAwakenerSortGroupByRealmChange,
    onDisplayUnownedChange,
    onAllowDupesChange,
    onAwakenerClick,
    onSetActiveWheel,
    onSetActiveCovenant,
    onSetActivePosse,
  } = props;

  const searchPlaceholder = {
    awakeners: 'Search awakeners (name, realm, aliases)',
    wheels: 'Search wheels (name, rarity, realm, awakener, main stat)',
    posses: 'Search posses (name, realm, awakener)',
    covenants: 'Search covenants (name, id)',
  }[pickerTab];

  return (
    <aside
      className='flex max-h-[calc(100dvh-11.5rem)] min-h-0 flex-col'
      data-picker-zone='true'
    >
      <TabbedContainer
        activeTabId={pickerTab}
        bodyClassName='flex min-h-0 flex-1 flex-col p-2'
        className='flex min-h-0 flex-1 flex-col'
        leftEarMaxWidth='100%'
        onTabChange={(tabId) => {
          onPickerTabChange(tabId as PickerTab);
        }}
        tabs={pickerTabs}
      >
        <div className='mt-2'>
          <Button
            aria-expanded={isAwakenerSortExpanded}
            className='w-full px-2 py-1.5 text-[11px] tracking-wide'
            onClick={() => {
              setIsAwakenerSortExpanded(!isAwakenerSortExpanded);
            }}
            type='button'
            variant='secondary'
          >
            <span className='inline-flex w-full items-center justify-between gap-2'>
              <span className='uppercase'>Sorting & Toggles</span>
              {isAwakenerSortExpanded ? (
                <FaChevronDown aria-hidden className='text-[13px]' />
              ) : (
                <FaChevronRight aria-hidden className='text-[13px]' />
              )}
            </span>
          </Button>
          {isAwakenerSortExpanded && (
            <div className='-mt-px space-y-2 border border-slate-500/45 bg-slate-900/45 p-2'>
              {pickerTab === 'awakeners' && (
                <CollectionSortControls
                  groupByRealm={awakenerSortGroupByRealm}
                  layout='stacked'
                  onGroupByRealmChange={onAwakenerSortGroupByRealmChange}
                  onSortDirectionToggle={onAwakenerSortDirectionToggle}
                  onSortKeyChange={onAwakenerSortKeyChange}
                  sortDirection={awakenerSortDirection}
                  sortDirectionAriaLabel='Toggle builder awakener sort direction'
                  sortKey={awakenerSortKey}
                  sortSelectAriaLabel='Builder awakener sort key'
                />
              )}
              <div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
                <span>Display Unowned</span>
                <OwnedTogglePill
                  className='ownership-pill-builder'
                  offLabel='Off'
                  onLabel='On'
                  onToggle={() => {
                    onDisplayUnownedChange(!displayUnowned);
                  }}
                  owned={displayUnowned}
                  variant='flat'
                />
              </div>
              <div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
                <span>Allow Dupes</span>
                <OwnedTogglePill
                  className='ownership-pill-builder'
                  offLabel='Off'
                  onLabel='On'
                  onToggle={() => {
                    onAllowDupesChange(!allowDupes);
                  }}
                  owned={allowDupes}
                  variant='flat'
                />
              </div>
            </div>
          )}
        </div>
        <input
          className='mt-3 w-full border border-slate-800/95 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          placeholder={searchPlaceholder}
          ref={searchInputRef}
          type='search'
          value={activeSearchQuery}
        />

        {pickerTab === 'awakeners' && (
          <div className='mt-2 grid grid-cols-5 gap-1'>
            {awakenerFilterTabs.map((f) => (
              <button
                key={f.id}
                className={`compact-filter-chip border transition-colors ${awakenerFilter === f.id ? 'border-amber-200/60 bg-slate-800/80 text-amber-100' : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'}`}
                onClick={() => {
                  onAwakenerFilterChange(f.id);
                }}
                type='button'
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {pickerTab === 'posses' && (
          <div className='mt-2 grid grid-cols-3 gap-1'>
            {posseFilterTabs.map((f) => (
              <button
                key={f.id}
                className={`compact-filter-chip border transition-colors ${posseFilter === f.id ? 'border-amber-200/60 bg-slate-800/80 text-amber-100' : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'}`}
                onClick={() => {
                  onPosseFilterChange(f.id);
                }}
                type='button'
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {pickerTab === 'wheels' && (
          <>
            <div className='mt-2 grid grid-cols-4 gap-1'>
              {wheelRarityFilterTabs.map((f) => (
                <button
                  aria-pressed={wheelRarityFilter === f.id}
                  key={f.id}
                  className={`compact-filter-chip border transition-colors ${wheelRarityFilter === f.id ? 'border-amber-200/60 bg-slate-800/80 text-amber-100' : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'}`}
                  onClick={() => {
                    onWheelRarityFilterChange(f.id);
                  }}
                  type='button'
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className='mt-1.5 grid grid-cols-9 gap-1'>
              {wheelMainstatFilterOptions.map((f) => (
                <button
                  aria-label={`Filter wheels by ${f.label}`}
                  aria-pressed={wheelMainstatFilter === f.id}
                  key={f.id}
                  className={`flex h-7 items-center justify-center border transition-colors ${wheelMainstatFilter === f.id ? 'border-amber-200/60 bg-slate-800/80 text-amber-100' : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'}`}
                  onClick={() => {
                    onWheelMainstatFilterChange(f.id);
                  }}
                  type='button'
                >
                  {f.iconAsset ? (
                    <img
                      alt={f.label}
                      className='h-[17px] w-[17px] object-contain opacity-95'
                      draggable={false}
                      src={f.iconAsset}
                    />
                  ) : (
                    <span className='text-[10px] tracking-wide uppercase'>
                      All
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <p className='mt-2 text-xs text-slate-200'>
          Drag and drop from the list to deploy or replace, clicking replaces
          the active slot, or fills an empty one if available.
        </p>

        <PickerDropZone
          className='builder-picker-scrollbar mt-3 min-h-0 flex-1 overflow-auto pr-1'
          id={PICKER_DROP_ZONE_ID}
        >
          {pickerTab === 'awakeners' && (
            <AwakenersPickerZone
              allowDupes={allowDupes}
              filteredAwakeners={filteredAwakeners}
              onAwakenerClick={onAwakenerClick}
              ownedAwakenerLevelByName={ownedAwakenerLevelByName}
              teamRealmSet={teamRealmSet}
              usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
            />
          )}
          {pickerTab === 'wheels' && (
            <WheelsPickerZone
              allowDupes={allowDupes}
              effectiveActiveTeamId={effectiveActiveTeamId}
              filteredWheels={filteredWheels}
              onSetActiveWheel={onSetActiveWheel}
              ownedWheelLevelById={ownedWheelLevelById}
              usedWheelByTeamOrder={usedWheelByTeamOrder}
            />
          )}
          {pickerTab === 'covenants' && (
            <CovenantsPickerZone
              filteredCovenants={filteredCovenants}
              onSetActiveCovenant={onSetActiveCovenant}
            />
          )}
          {pickerTab === 'posses' && (
            <PossesPickerZone
              activePosseId={activePosseId}
              allowDupes={allowDupes}
              effectiveActiveTeamId={effectiveActiveTeamId}
              filteredPosses={filteredPosses}
              onSetActivePosse={onSetActivePosse}
              ownedPosseLevelById={ownedPosseLevelById}
              teams={teams}
              usedPosseByTeamOrder={usedPosseByTeamOrder}
            />
          )}
        </PickerDropZone>
      </TabbedContainer>
    </aside>
  );
}
