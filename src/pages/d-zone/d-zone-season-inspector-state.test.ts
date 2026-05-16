import {describe, expect, it} from 'vitest'

import type {DzoneAlertOption} from '@/domain/dzone'

import {
  buildDefaultOpenWaveIds,
  getResolvedOpenWaveIds,
  getSelectedAlertId,
  toggleResolvedOpenWaveId,
  type AlertSelectionState,
  type WaveDisclosureState,
} from './d-zone-season-inspector-state'

function option(id: string): DzoneAlertOption {
  return {id, name: id}
}

function ids(openWaveIds: Set<string>): string[] {
  return [...openWaveIds]
}

describe('d-zone season inspector state', () => {
  it('opens the first wave by default', () => {
    expect(ids(buildDefaultOpenWaveIds('wave-1'))).toEqual(['wave-1'])
  })

  it('resolves stale season open-wave state to the new season default', () => {
    const staleState: WaveDisclosureState = {
      openWaveIds: new Set(['old-wave']),
      seasonId: 'old-season',
    }

    expect(
      ids(
        getResolvedOpenWaveIds({
          defaultOpenWaveId: 'new-wave',
          seasonId: 'new-season',
          waveDisclosureState: staleState,
        }),
      ),
    ).toEqual(['new-wave'])
  })

  it('normalizes stale open-wave state before toggling', () => {
    const staleState: WaveDisclosureState = {
      openWaveIds: new Set(['old-wave']),
      seasonId: 'old-season',
    }

    const toggledState = toggleResolvedOpenWaveId({
      defaultOpenWaveId: 'new-wave',
      seasonId: 'new-season',
      waveDisclosureState: staleState,
      waveId: 'other-new-wave',
    })

    expect(toggledState.seasonId).toBe('new-season')
    expect(ids(toggledState.openWaveIds)).toEqual(['new-wave', 'other-new-wave'])
  })

  it('persists the selected alert only for the same season and valid option', () => {
    const alertSelectionState: AlertSelectionState = {
      alertId: 'alert-2',
      seasonId: 'season-1',
    }

    expect(
      getSelectedAlertId({
        alertOptions: [option('alert-1'), option('alert-2')],
        alertSelectionState,
        seasonId: 'season-1',
      }),
    ).toBe('alert-2')
  })

  it('falls back to the first alert option for stale or invalid alert state', () => {
    const alertOptions = [option('alert-1'), option('alert-2')]

    expect(
      getSelectedAlertId({
        alertOptions,
        alertSelectionState: {alertId: 'alert-2', seasonId: 'old-season'},
        seasonId: 'season-1',
      }),
    ).toBe('alert-1')
    expect(
      getSelectedAlertId({
        alertOptions,
        alertSelectionState: {alertId: 'missing-alert', seasonId: 'season-1'},
        seasonId: 'season-1',
      }),
    ).toBe('alert-1')
  })

  it('returns null for empty alert options', () => {
    expect(
      getSelectedAlertId({
        alertOptions: [],
        alertSelectionState: {alertId: 'alert-1', seasonId: 'season-1'},
        seasonId: 'season-1',
      }),
    ).toBeNull()
  })
})
