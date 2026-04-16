import {getAwakenerOverlays} from './awakener-overlays'
import {
  type AwakenerOverlayRecord,
  type DerivedSkillRecord,
  type FullStats,
} from './awakener-source-schema'
import type {
  DatabaseDescribedEntry,
  DatabaseReferenceInfo,
  ResolvedAwakenerDatabaseReferenceLayer,
  ResolvedAwakenerDatabaseShellView,
} from './awakeners-database-view'
import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {buildCardKeywordFooterText} from './card-keywords'
import {getDerivedSkills} from './derived-skills'
import {resolveDescribedRecord, type DescribedRecord} from './description-records'

type DatabaseReferenceKind = DatabaseReferenceInfo['kind']

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

function buildAccessibleOverlays(
  record: AwakenerFullV2Record,
  overlays: AwakenerOverlayRecord[],
  overlayOverridesById: Record<string, AwakenerOverlayRecord>,
): AwakenerOverlayRecord[] {
  const accessible = overlays.filter(
    (overlay) => overlay.ownerAwakenerId === undefined || overlay.ownerAwakenerId === record.id,
  )

  return accessible.map((overlay) => overlayOverridesById[overlay.id] ?? overlay)
}

function buildOverlayLookup(overlays: AwakenerOverlayRecord[]): Map<string, AwakenerOverlayRecord> {
  const lookup = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlays) {
    addLookupValue(lookup, overlay.displayName, overlay)
    for (const alias of overlay.aliases) {
      addLookupValue(lookup, alias, overlay)
    }
  }

  return lookup
}

export function collectAwakenerDatabaseCardNames(
  record: Pick<AwakenerFullV2Record, 'cards' | 'talents' | 'enlightens' | 'derivedSkills'>,
  derivedSkills: DerivedSkillRecord[] = getDerivedSkills(),
): Set<string> {
  const names = new Set<string>()

  for (const card of [
    record.cards.C1,
    record.cards.C2,
    record.cards.C3,
    record.cards.C4,
    record.cards.C5,
    record.cards.Exalt,
    ...(record.cards.OverExalt ? [record.cards.OverExalt] : []),
  ]) {
    names.add(card.displayName)
  }

  for (const entry of record.cards.promotedExtras) {
    names.add(entry.displayName)
  }

  for (const entry of [
    record.talents.T1,
    record.talents.T2,
    record.talents.T3,
    record.talents.T4,
    ...record.talents.extraTalents,
  ]) {
    if (entry) {
      names.add(entry.displayName)
    }
  }

  for (const entry of [
    record.enlightens.E1,
    record.enlightens.E2,
    record.enlightens.E3,
    ...(record.enlightens.AbsoluteAxiom ? [record.enlightens.AbsoluteAxiom] : []),
  ]) {
    names.add(entry.displayName)
  }

  for (const entry of record.derivedSkills) {
    names.add(entry.displayName)
  }

  for (const entry of derivedSkills) {
    if (entry.ownerAwakenerId === undefined) {
      names.add(entry.displayName)
    }
  }

  return names
}

function addReferenceInfo<TRecord extends DescribedRecord>(
  lookup: Map<string, DatabaseReferenceInfo>,
  key: string,
  info: DatabaseReferenceInfo<TRecord>,
): void {
  addLookupValue(lookup, key, info)
}

function addReferenceInfoById<TRecord extends DescribedRecord>(
  lookup: Map<string, DatabaseReferenceInfo>,
  info: DatabaseReferenceInfo<TRecord>,
): void {
  if (lookup.has(info.id)) {
    return
  }

  lookup.set(info.id, info)
}

function buildReferenceInfoFromEntry<TRecord extends DescribedRecord>(
  kind: DatabaseReferenceKind,
  entry: DatabaseDescribedEntry<TRecord>,
  overrides: Partial<
    Pick<
      DatabaseReferenceInfo<TRecord>,
      'keywordFooterText' | 'influencingEnlightenSlots' | 'influencingTalentIds' | 'influenceBadges'
    >
  > = {},
): DatabaseReferenceInfo<TRecord> {
  return {
    kind,
    id: entry.record.id,
    name: entry.record.displayName,
    label: entry.label,
    record: entry.record,
    description: entry.resolved.description,
    keywordFooterText: entry.keywordFooterText,
    descriptionRank: entry.descriptionRank,
    descriptionMaxRank: entry.descriptionMaxRank,
    influencingEnlightenSlots: entry.influencingEnlightenSlots,
    influencingTalentIds: entry.influencingTalentIds,
    influenceBadges: entry.influenceBadges,
    ...overrides,
  }
}

function addReferenceInfoToLookups<TRecord extends DescribedRecord>(
  byName: Map<string, DatabaseReferenceInfo>,
  byId: Map<string, DatabaseReferenceInfo>,
  info: DatabaseReferenceInfo<TRecord>,
  aliases: readonly string[] = [],
): void {
  addReferenceInfo(byName, info.name, info)
  addReferenceInfoById(byId, info)
  for (const alias of aliases) {
    addReferenceInfo(byName, alias, info)
  }
}

function addDescribedReferenceInfos<TRecord extends DescribedRecord>(
  byName: Map<string, DatabaseReferenceInfo>,
  byId: Map<string, DatabaseReferenceInfo>,
  entries: DatabaseDescribedEntry<TRecord>[],
  buildInfo: (entry: DatabaseDescribedEntry<TRecord>) => DatabaseReferenceInfo<TRecord>,
): void {
  for (const entry of entries) {
    addReferenceInfoToLookups(byName, byId, buildInfo(entry))
  }
}

function getDerivedSkillLabel(record: DerivedSkillRecord): string {
  return `Derived · ${record.displayName}`
}

function buildGlobalDerivedReferenceInfo(
  record: DerivedSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
): DatabaseReferenceInfo<DerivedSkillRecord> {
  const resolved = resolveDescribedRecord(record, {rank: skillLevel, stats}, {maxRank: 6, stats})
  return {
    kind: 'derived-skill',
    id: record.id,
    name: record.displayName,
    label: getDerivedSkillLabel(record),
    record,
    description: resolved.description,
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: skillLevel,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
  }
}

export function buildAwakenerDatabaseOverlayLabel(overlay: AwakenerOverlayRecord): string {
  return `${overlay.overlayType.charAt(0).toUpperCase()}${overlay.overlayType.slice(1)}`
}

function buildOverlayReferenceInfo(
  overlay: AwakenerOverlayRecord,
  stats: FullStats | null,
): DatabaseReferenceInfo<AwakenerOverlayRecord> {
  const resolved = resolveDescribedRecord(overlay, {stats}, {stats})
  return {
    kind: 'overlay',
    id: overlay.id,
    name: overlay.displayName,
    label: buildAwakenerDatabaseOverlayLabel(overlay),
    record: overlay,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
  }
}

function buildReferenceLookups(
  shellView: ResolvedAwakenerDatabaseShellView,
  accessibleOverlays: AwakenerOverlayRecord[],
  globalDerivedSkills: DerivedSkillRecord[],
): {byId: Map<string, DatabaseReferenceInfo>; byName: Map<string, DatabaseReferenceInfo>} {
  const byName = new Map<string, DatabaseReferenceInfo>()
  const byId = new Map<string, DatabaseReferenceInfo>()

  addDescribedReferenceInfos(byName, byId, shellView.commandCards, (entry) =>
    buildReferenceInfoFromEntry('skill', entry),
  )
  addDescribedReferenceInfos(byName, byId, shellView.exalts, (entry) =>
    buildReferenceInfoFromEntry('skill', entry),
  )
  addDescribedReferenceInfos(byName, byId, shellView.talents, (entry) =>
    buildReferenceInfoFromEntry('talent', entry, {
      keywordFooterText: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }),
  )
  addDescribedReferenceInfos(byName, byId, shellView.enlightens, (entry) =>
    buildReferenceInfoFromEntry('enlighten', entry, {
      keywordFooterText: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }),
  )
  addDescribedReferenceInfos(byName, byId, shellView.derivedSkills, (entry) =>
    buildReferenceInfoFromEntry('derived-skill', entry),
  )
  addDescribedReferenceInfos(byName, byId, shellView.promotedExtras, (entry) =>
    buildReferenceInfoFromEntry('derived-skill', entry),
  )

  for (const record of globalDerivedSkills) {
    addReferenceInfoToLookups(
      byName,
      byId,
      buildGlobalDerivedReferenceInfo(record, shellView.skillLevel, shellView.stats),
    )
  }

  for (const overlay of accessibleOverlays) {
    addReferenceInfoToLookups(
      byName,
      byId,
      buildOverlayReferenceInfo(overlay, shellView.stats),
      overlay.aliases,
    )
  }

  return {byId, byName}
}

export interface BuildAwakenerDatabaseReferenceLayerOptions {
  shellView: ResolvedAwakenerDatabaseShellView
  overlays?: AwakenerOverlayRecord[]
  derivedSkills?: DerivedSkillRecord[]
}

export function buildAwakenerDatabaseReferenceLayer({
  shellView,
  overlays = getAwakenerOverlays(),
  derivedSkills = getDerivedSkills(),
}: BuildAwakenerDatabaseReferenceLayerOptions): ResolvedAwakenerDatabaseReferenceLayer {
  const globalDerivedSkills = derivedSkills.filter((entry) => entry.ownerAwakenerId === undefined)
  const accessibleOverlays = buildAccessibleOverlays(
    shellView.record,
    overlays,
    shellView.overlayOverridesById,
  )
  const referenceLookups = buildReferenceLookups(shellView, accessibleOverlays, globalDerivedSkills)

  return {
    cardNames: collectAwakenerDatabaseCardNames(shellView.resolvedRecord, globalDerivedSkills),
    accessibleOverlays,
    referenceInfoByName: referenceLookups.byName,
    referenceInfoById: referenceLookups.byId,
    overlayByName: buildOverlayLookup(accessibleOverlays),
  }
}
