import {useMemo, useState, type MouseEvent} from 'react'

import {FaCalendarDays} from 'react-icons/fa6'

import {
  getDzoneSeasonAlertOptions,
  type DzoneAlertOption,
  type DzoneRealm,
  type DzoneResolvedMonster,
  type DzoneSeason,
} from '@/domain/dzone'

import {getDzoneAlertShortName} from './d-zone-display-text'
import {buildDZoneWaveCardViewModels, type DZoneRelicPreview} from './d-zone-view-model'
import {DZoneWaveCard} from './DZoneWaveCard'

interface DZoneSeasonInspectorProps {
  countdownDisplay?: string
  dateRange: string
  getMonsterAsset: (monster: DzoneResolvedMonster) => string | undefined
  onMonsterOpen: (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => void
  onRelicOpen: (relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) => void
  realm?: DzoneRealm | null
  realmBadgeSrc?: string
  realmName?: string | null
  season: DzoneSeason
  showHeader?: boolean
  title: string
  waveHeadingLevel?: 2 | 3
}

interface WaveDisclosureState {
  openWaveIds: Set<string>
  seasonId: string
}

interface AlertSelectionState {
  alertId: string | null
  seasonId: string
}

function buildDefaultOpenWaveIds(defaultOpenWaveId: string | undefined): Set<string> {
  return new Set(defaultOpenWaveId ? [defaultOpenWaveId] : [])
}

function getRealmThemeClass(realm: DzoneRealm | null | undefined): string {
  return `d-zone-season-inspector--realm-${realm ? realm.toLowerCase() : 'legacy'}`
}

function getSelectedAlertId(
  season: DzoneSeason,
  alertOptions: DzoneAlertOption[],
  alertSelectionState: AlertSelectionState,
) {
  if (alertOptions.length === 0) {
    return null
  }
  if (
    alertSelectionState.seasonId === season.id &&
    alertSelectionState.alertId &&
    alertOptions.some((alert) => alert.id === alertSelectionState.alertId)
  ) {
    return alertSelectionState.alertId
  }
  return alertOptions[0]?.id ?? null
}

export function DZoneSeasonInspector({
  countdownDisplay,
  dateRange,
  getMonsterAsset,
  onMonsterOpen,
  onRelicOpen,
  realm,
  realmBadgeSrc,
  realmName,
  season,
  showHeader = false,
  title,
  waveHeadingLevel = 2,
}: DZoneSeasonInspectorProps) {
  const defaultOpenWaveId = season.waves[0]?.id
  const waveCardViewModels = useMemo(() => buildDZoneWaveCardViewModels(season), [season])
  const alertOptions = useMemo(() => getDzoneSeasonAlertOptions(season), [season])
  const [waveDisclosureState, setWaveDisclosureState] = useState<WaveDisclosureState>(() => ({
    openWaveIds: buildDefaultOpenWaveIds(defaultOpenWaveId),
    seasonId: season.id,
  }))
  const [alertSelectionState, setAlertSelectionState] = useState<AlertSelectionState>(() => ({
    alertId: alertOptions[0]?.id ?? null,
    seasonId: season.id,
  }))
  const selectedAlertId = getSelectedAlertId(season, alertOptions, alertSelectionState)
  const openWaveIds =
    waveDisclosureState.seasonId === season.id
      ? waveDisclosureState.openWaveIds
      : buildDefaultOpenWaveIds(defaultOpenWaveId)

  function selectAlert(alertId: string) {
    setAlertSelectionState({alertId, seasonId: season.id})
  }

  function toggleWave(waveId: string) {
    setWaveDisclosureState((currentDisclosureState) => {
      const currentOpenWaveIds =
        currentDisclosureState.seasonId === season.id
          ? currentDisclosureState.openWaveIds
          : buildDefaultOpenWaveIds(defaultOpenWaveId)
      const nextOpenWaveIds = new Set(currentOpenWaveIds)
      if (nextOpenWaveIds.has(waveId)) {
        nextOpenWaveIds.delete(waveId)
      } else {
        nextOpenWaveIds.add(waveId)
      }
      return {openWaveIds: nextOpenWaveIds, seasonId: season.id}
    })
  }

  return (
    <section
      aria-label={`Season ${season.period.toString()} inspector`}
      className={`d-zone-season-inspector ${getRealmThemeClass(realm)} ${
        showHeader ? 'd-zone-season-inspector--with-header' : ''
      }`}
    >
      {showHeader ? (
        <header className='d-zone-season-inspector-header'>
          <div className='d-zone-season-inspector-copy'>
            <h2 className='d-zone-season-title ui-title'>{title}</h2>
            <div className='d-zone-stage-chips'>
              <span className='d-zone-stage-chip-label'>{season.stageEffect}</span>
              {realmName ? <span className='d-zone-stage-chip-label'>{realmName}</span> : null}
            </div>
            <DZoneAlertSwitcher
              alertOptions={alertOptions}
              selectedAlertId={selectedAlertId}
              variant='header'
              onAlertChange={selectAlert}
            />

            <div className='d-zone-season-meta-row'>
              <span className='d-zone-season-date'>
                <FaCalendarDays aria-hidden className='d-zone-season-date-icon' />
                {dateRange}
              </span>
              {countdownDisplay ? (
                <span className='d-zone-season-countdown'>{countdownDisplay}</span>
              ) : null}
            </div>
          </div>
          {realmBadgeSrc ? (
            <div aria-hidden className='d-zone-season-realm-emblem'>
              <img
                alt=''
                className='d-zone-season-realm-emblem-image'
                decoding='async'
                draggable={false}
                src={realmBadgeSrc}
              />
            </div>
          ) : null}
        </header>
      ) : null}

      {!showHeader ? (
        <DZoneAlertSwitcher
          alertOptions={alertOptions}
          selectedAlertId={selectedAlertId}
          variant='toolbar'
          onAlertChange={selectAlert}
        />
      ) : null}

      <div className='d-zone-season-wave-list'>
        {waveCardViewModels.map(({wave, relics}) => (
          <DZoneWaveCard
            expanded={openWaveIds.has(wave.id)}
            getMonsterAsset={getMonsterAsset}
            headingLevel={waveHeadingLevel}
            key={wave.id}
            onExpandedChange={() => {
              toggleWave(wave.id)
            }}
            onMonsterOpen={onMonsterOpen}
            onRelicOpen={onRelicOpen}
            relics={relics}
            selectedAlertId={selectedAlertId}
            wave={wave}
          />
        ))}
      </div>
    </section>
  )
}

function DZoneAlertSwitcher({
  alertOptions,
  selectedAlertId,
  variant,
  onAlertChange,
}: {
  alertOptions: DzoneAlertOption[]
  selectedAlertId: string | null
  variant: 'header' | 'toolbar'
  onAlertChange: (alertId: string) => void
}) {
  if (alertOptions.length <= 1) {
    return null
  }

  return (
    <div className={`d-zone-alert-switcher d-zone-alert-switcher--${variant}`}>
      <span className='d-zone-alert-switcher-label'>Alert</span>
      <div aria-label='D-zone alert' className='d-zone-alert-switcher-options' role='group'>
        {alertOptions.map((alert) => (
          <button
            aria-label={`Select ${alert.name}`}
            aria-pressed={alert.id === selectedAlertId}
            className='d-zone-alert-switcher-button'
            key={alert.id}
            onClick={() => {
              onAlertChange(alert.id)
            }}
            type='button'
          >
            {getDzoneAlertShortName(alert.name)}
          </button>
        ))}
      </div>
    </div>
  )
}
