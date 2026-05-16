import type {DzoneAlertOption} from '@/domain/dzone'

export interface WaveDisclosureState {
  openWaveIds: Set<string>
  seasonId: string
}

export interface AlertSelectionState {
  alertId: string | null
  seasonId: string
}

export function buildDefaultOpenWaveIds(defaultOpenWaveId: string | undefined): Set<string> {
  return new Set(defaultOpenWaveId ? [defaultOpenWaveId] : [])
}

export function getResolvedOpenWaveIds({
  defaultOpenWaveId,
  seasonId,
  waveDisclosureState,
}: {
  defaultOpenWaveId: string | undefined
  seasonId: string
  waveDisclosureState: WaveDisclosureState
}): Set<string> {
  return waveDisclosureState.seasonId === seasonId
    ? waveDisclosureState.openWaveIds
    : buildDefaultOpenWaveIds(defaultOpenWaveId)
}

export function toggleResolvedOpenWaveId({
  defaultOpenWaveId,
  seasonId,
  waveDisclosureState,
  waveId,
}: {
  defaultOpenWaveId: string | undefined
  seasonId: string
  waveDisclosureState: WaveDisclosureState
  waveId: string
}): WaveDisclosureState {
  const nextOpenWaveIds = new Set(
    getResolvedOpenWaveIds({defaultOpenWaveId, seasonId, waveDisclosureState}),
  )
  if (nextOpenWaveIds.has(waveId)) {
    nextOpenWaveIds.delete(waveId)
  } else {
    nextOpenWaveIds.add(waveId)
  }
  return {openWaveIds: nextOpenWaveIds, seasonId}
}

export function getSelectedAlertId({
  alertOptions,
  alertSelectionState,
  seasonId,
}: {
  alertOptions: DzoneAlertOption[]
  alertSelectionState: AlertSelectionState
  seasonId: string
}): string | null {
  if (alertOptions.length === 0) {
    return null
  }
  if (
    alertSelectionState.seasonId === seasonId &&
    alertSelectionState.alertId &&
    alertOptions.some((alert) => alert.id === alertSelectionState.alertId)
  ) {
    return alertSelectionState.alertId
  }
  return alertOptions[0]?.id ?? null
}
