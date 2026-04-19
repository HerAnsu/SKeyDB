import {getAwakenerOverlays} from './awakener-overlays'
import type {AwakenerOverlayRecord} from './awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedAwakenerDatabaseReferenceLayer,
} from './awakeners-database-view'
import {resolveDescribedRecord, type WheelDatabaseDescriptionRecord} from './description-records'
import {getRealmLabel} from './factions'
import {getWheelsFullV1, type WheelFullV1Record} from './wheels-full-v1'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function addLookupValue<T>(lookup: Map<string, T>, key: string, value: T): void {
  const normalized = normalize(key)
  if (!normalized || lookup.has(normalized)) {
    return
  }

  lookup.set(normalized, value)
}

export function buildWheelDatabaseDescriptionRecord(
  record: WheelFullV1Record,
): WheelDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'wheel',
    displayName: record.name,
    ownerAwakenerId: record.ownerAwakenerId,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

function buildWheelReferenceInfo(
  record: WheelFullV1Record,
  descriptionRank: number,
): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord> {
  const describedRecord = buildWheelDatabaseDescriptionRecord(record)
  const resolved = resolveDescribedRecord(describedRecord, {rank: descriptionRank})

  return {
    kind: 'wheel',
    id: record.id,
    name: record.name,
    label: `Wheel · ${record.rarity} · ${getRealmLabel(record.realm)}`,
    record: describedRecord,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank,
    descriptionMaxRank: 4,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildOverlayReferenceInfo(
  overlay: AwakenerOverlayRecord,
): DatabaseReferenceInfo<AwakenerOverlayRecord> {
  const resolved = resolveDescribedRecord(overlay)
  return {
    kind: 'overlay',
    id: overlay.id,
    name: overlay.displayName,
    label: overlay.overlayType,
    record: overlay,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildAccessibleOverlays(
  ownerAwakenerId: number | undefined,
  overlays: AwakenerOverlayRecord[],
): AwakenerOverlayRecord[] {
  return overlays.filter(
    (overlay) =>
      overlay.ownerAwakenerId === undefined || overlay.ownerAwakenerId === ownerAwakenerId,
  )
}

interface BuildWheelReferenceInfoEntriesOptions {
  wheelRecords?: WheelFullV1Record[]
  activeWheelId?: string
  activeDescriptionRank?: number
}

export function buildWheelReferenceInfoEntries({
  activeDescriptionRank = 1,
  activeWheelId,
  wheelRecords = getWheelsFullV1(),
}: BuildWheelReferenceInfoEntriesOptions = {}): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>[] {
  return wheelRecords.map((record) =>
    buildWheelReferenceInfo(
      record,
      activeWheelId && record.id === activeWheelId ? activeDescriptionRank : 1,
    ),
  )
}

interface BuildWheelDatabaseReferenceLayerOptions extends BuildWheelReferenceInfoEntriesOptions {
  overlays?: AwakenerOverlayRecord[]
}

export function buildWheelDatabaseReferenceLayer({
  activeDescriptionRank = 1,
  activeWheelId,
  overlays = getAwakenerOverlays(),
  wheelRecords = getWheelsFullV1(),
}: BuildWheelDatabaseReferenceLayerOptions = {}): ResolvedAwakenerDatabaseReferenceLayer {
  const referenceInfoByName = new Map<string, DatabaseReferenceInfo>()
  const referenceInfoById = new Map<string, DatabaseReferenceInfo>()
  const wheelInfos = buildWheelReferenceInfoEntries({
    activeDescriptionRank,
    activeWheelId,
    wheelRecords,
  })
  const activeWheel = wheelRecords.find((record) => record.id === activeWheelId)
  const accessibleOverlays = buildAccessibleOverlays(activeWheel?.ownerAwakenerId, overlays)
  const overlayByName = new Map<string, AwakenerOverlayRecord>()

  wheelInfos.forEach((info, index) => {
    const sourceRecord = wheelRecords[index]
    addLookupValue(referenceInfoByName, info.name, info)
    for (const alias of sourceRecord.aliases) {
      addLookupValue(referenceInfoByName, alias, info)
    }
    if (!referenceInfoById.has(info.id)) {
      referenceInfoById.set(info.id, info)
    }
  })

  for (const overlay of accessibleOverlays) {
    const overlayInfo = buildOverlayReferenceInfo(overlay)
    addLookupValue(referenceInfoByName, overlay.displayName, overlayInfo)
    for (const alias of overlay.aliases) {
      addLookupValue(referenceInfoByName, alias, overlayInfo)
      addLookupValue(overlayByName, alias, overlay)
    }
    if (!referenceInfoById.has(overlay.id)) {
      referenceInfoById.set(overlay.id, overlayInfo)
    }
    addLookupValue(overlayByName, overlay.displayName, overlay)
  }

  return {
    cardNames: new Set(wheelInfos.map((info) => info.name)),
    accessibleOverlays,
    referenceInfoByName,
    referenceInfoById,
    overlayByName,
  }
}
