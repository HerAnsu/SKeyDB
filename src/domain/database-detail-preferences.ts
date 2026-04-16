import {z} from 'zod'

import {
  normalizeAwakenerDatabaseSelection,
  normalizeAwakenerDatabaseSelectionForRecord,
  selectedEnlightenSlotSchema,
  type AwakenerDatabaseSelection,
} from './awakener-database-state'
import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {
  getBrowserLocalStorage,
  safeStorageRead,
  safeStorageWrite,
  type StorageLike,
} from './storage'

const STORAGE_KEY = 'database-detail-preferences'

const fontScaleSchema = z.enum(['small', 'medium', 'large'])
export type DatabaseDetailFontScale = z.infer<typeof fontScaleSchema>

const databaseDetailPreferencesSchema = z.object({
  showVisibleScaling: z.boolean().default(true),
  showTagIcons: z.boolean().default(true),
  clickOutsideClosesPopovers: z.boolean().default(true),
  fontScale: fontScaleSchema.default('small'),
  defaultSelection: z
    .object({
      awakenerLevel: z.number().optional(),
      psycheSurgeOffset: z.number().optional(),
      skillLevel: z.number().optional(),
      selectedEnlightenSlot: selectedEnlightenSlotSchema.optional(),
      soulforgeLevel: z.number().optional(),
    })
    .default({}),
})

export interface DatabaseDetailPreferences {
  showVisibleScaling: boolean
  showTagIcons: boolean
  clickOutsideClosesPopovers: boolean
  fontScale: DatabaseDetailFontScale
  defaultSelection: AwakenerDatabaseSelection
}

export const DEFAULT_DATABASE_DETAIL_PREFERENCES: DatabaseDetailPreferences = {
  showVisibleScaling: true,
  showTagIcons: true,
  clickOutsideClosesPopovers: true,
  fontScale: 'small',
  defaultSelection: normalizeAwakenerDatabaseSelection(),
}

export function normalizeDatabaseDetailPreferences(input: unknown = {}): DatabaseDetailPreferences {
  const parsed = databaseDetailPreferencesSchema.parse(input)

  return {
    showVisibleScaling: parsed.showVisibleScaling,
    showTagIcons: parsed.showTagIcons,
    clickOutsideClosesPopovers: parsed.clickOutsideClosesPopovers,
    fontScale: parsed.fontScale,
    defaultSelection: normalizeAwakenerDatabaseSelection(parsed.defaultSelection),
  }
}

export function readDatabaseDetailPreferences(
  storage: StorageLike | null = getBrowserLocalStorage(),
): DatabaseDetailPreferences {
  const raw = safeStorageRead(storage, STORAGE_KEY)
  if (!raw) {
    return DEFAULT_DATABASE_DETAIL_PREFERENCES
  }

  try {
    return normalizeDatabaseDetailPreferences(JSON.parse(raw))
  } catch {
    return DEFAULT_DATABASE_DETAIL_PREFERENCES
  }
}

export function writeDatabaseDetailPreferences(
  next: Partial<DatabaseDetailPreferences>,
  storage: StorageLike | null = getBrowserLocalStorage(),
): boolean {
  const normalized = normalizeDatabaseDetailPreferences({
    ...readDatabaseDetailPreferences(storage),
    ...next,
  })

  return safeStorageWrite(storage, STORAGE_KEY, JSON.stringify(normalized))
}

export function resolveDatabaseDetailDefaultSelection(
  record: AwakenerFullV2Record,
  preferences:
    | Partial<DatabaseDetailPreferences>
    | DatabaseDetailPreferences = DEFAULT_DATABASE_DETAIL_PREFERENCES,
): AwakenerDatabaseSelection {
  const normalizedPreferences = normalizeDatabaseDetailPreferences(preferences)
  return normalizeAwakenerDatabaseSelectionForRecord(record, normalizedPreferences.defaultSelection)
}
