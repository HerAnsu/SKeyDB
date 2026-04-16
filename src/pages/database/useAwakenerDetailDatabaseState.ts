import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {
  normalizeAwakenerDatabaseSelectionForRecord,
  patchAwakenerDatabaseSelection,
  resolveAwakenerDatabaseState,
  type AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import {type AwakenerFullV2Record} from '@/domain/awakeners-full-v2'
import {
  normalizeDatabaseDetailPreferences,
  readDatabaseDetailPreferences,
  resolveDatabaseDetailDefaultSelection,
  writeDatabaseDetailPreferences,
  type DatabaseDetailPreferences,
} from '@/domain/database-detail-preferences'

interface UseAwakenerDetailDatabaseStateOptions {
  fullDataV2: AwakenerFullV2Record
}

export function useAwakenerDetailDatabaseState({
  fullDataV2,
}: UseAwakenerDetailDatabaseStateOptions) {
  const [preferences, setPreferences] = useState<DatabaseDetailPreferences>(
    readDatabaseDetailPreferences,
  )

  const defaultSelection = useMemo(
    () => resolveDatabaseDetailDefaultSelection(fullDataV2, preferences),
    [fullDataV2, preferences],
  )
  const [selection, setSelection] = useState(defaultSelection)
  const previousRecordIdRef = useRef(fullDataV2.id)

  useEffect(() => {
    if (previousRecordIdRef.current === fullDataV2.id) {
      return
    }

    previousRecordIdRef.current = fullDataV2.id
    setSelection(defaultSelection)
  }, [defaultSelection, fullDataV2.id])

  const resolvedDatabaseState = useMemo(
    () => resolveAwakenerDatabaseState(fullDataV2, selection),
    [fullDataV2, selection],
  )

  const updatePreferences = useCallback((nextPartial: Partial<DatabaseDetailPreferences>) => {
    setPreferences((previous) => {
      const next = normalizeDatabaseDetailPreferences({
        ...previous,
        ...nextPartial,
      })
      writeDatabaseDetailPreferences(next)
      return next
    })
  }, [])

  const handlePatchDefaultSelection = useCallback(
    (nextPartial: Partial<AwakenerDatabaseSelection>) => {
      const nextSelection = normalizeAwakenerDatabaseSelectionForRecord(fullDataV2, {
        ...preferences.defaultSelection,
        ...nextPartial,
      })
      updatePreferences({defaultSelection: nextSelection})
    },
    [fullDataV2, preferences.defaultSelection, updatePreferences],
  )

  const handlePatchSelection = useCallback(
    (nextPartial: Partial<AwakenerDatabaseSelection>) => {
      setSelection((previousSelection) =>
        patchAwakenerDatabaseSelection(fullDataV2, previousSelection, nextPartial),
      )
    },
    [fullDataV2],
  )

  const handleToggleEnlightenSlot = useCallback(
    (slot: AwakenerDatabaseSelection['selectedEnlightenSlot']) => {
      handlePatchSelection({
        selectedEnlightenSlot:
          resolvedDatabaseState.selection.selectedEnlightenSlot === slot ? null : slot,
      })
    },
    [handlePatchSelection, resolvedDatabaseState.selection.selectedEnlightenSlot],
  )

  return {
    actions: {
      patchDefaultSelection: handlePatchDefaultSelection,
      patchSelection: handlePatchSelection,
      toggleEnlightenSlot: handleToggleEnlightenSlot,
      updatePreferences,
    },
    preferences: {
      defaultSelection,
      fontScale: preferences.fontScale,
      value: preferences,
    },
    runtime: {
      referenceLayer: resolvedDatabaseState.referenceLayer,
      resolvedControls: resolvedDatabaseState.controls,
      resolvedSelection: resolvedDatabaseState.selection,
      resolvedStats: resolvedDatabaseState.stats,
      shellView: resolvedDatabaseState.shellView,
    },
  }
}
