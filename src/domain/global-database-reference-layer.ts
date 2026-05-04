import {getAwakenerOverlays} from './awakener-overlays'
import {getAwakenerSkills} from './awakener-skills'
import type {
  AwakenerOverlayRecord,
  AwakenerSkillRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'
import {buildCardKeywordFooterText} from './card-keywords'
import {getCovenants, type Covenant} from './covenants'
import {
  addDatabaseReferenceInfoToLookups,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'
import {getDerivedSkills} from './derived-skills'
import {
  resolveDescribedRecord,
  type CovenantDatabaseDescriptionRecord,
  type PosseDatabaseDescriptionRecord,
  type WheelDatabaseDescriptionRecord,
} from './description-records'
import {getPosses, type Posse} from './posses'
import type {PosseFullV2Record} from './posses-full-v2'
import type {PublicFormulaContext} from './public-formula-context'
import {getRealmLabel} from './realms'
import {getWheels, type Wheel} from './wheels'
import {buildWheelDatabaseDescriptionRecord} from './wheels-database-reference-layer'

type ArtifactDescriptionRecord =
  | WheelDatabaseDescriptionRecord
  | PosseDatabaseDescriptionRecord
  | CovenantDatabaseDescriptionRecord

export function buildPosseDatabaseDescriptionRecord(
  record: Pick<
    PosseFullV2Record,
    'id' | 'name' | 'ownerAwakenerId' | 'descriptionTemplate' | 'descriptionArgs'
  >,
): PosseDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'posse',
    displayName: record.name,
    ownerAwakenerId: record.ownerAwakenerId,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

export function buildCovenantDatabaseDescriptionRecord(record: {
  id: string
  name: string
  descriptionTemplate: string
  descriptionArgs: CovenantDatabaseDescriptionRecord['descriptionArgs']
}): CovenantDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'covenant',
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

function buildArtifactReferenceInfo(
  record: ArtifactDescriptionRecord,
  label: string,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<ArtifactDescriptionRecord> {
  const resolved = resolveDescribedRecord(record, {formulaContext}, {formulaContext})

  return {
    kind: record.kind,
    id: record.id,
    name: record.displayName,
    label,
    record,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildArtifactReferenceStub(
  record: ArtifactDescriptionRecord,
  label: string,
): DatabaseReferenceInfo<ArtifactDescriptionRecord> {
  return {
    kind: record.kind,
    id: record.id,
    name: record.displayName,
    label,
    record,
    description: '',
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildDerivedSkillReferenceInfo(
  record: DerivedSkillRecord,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<DerivedSkillRecord> {
  const resolved = resolveDescribedRecord(
    record,
    {rank: 1, formulaContext},
    {maxRank: 6, formulaContext},
  )

  return {
    kind: 'derived-skill',
    id: record.id,
    name: record.displayName,
    label: `Derived · ${record.displayName}`,
    record,
    description: resolved.description,
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildAwakenerSkillReferenceInfo(
  record: AwakenerSkillRecord,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<AwakenerSkillRecord> {
  const resolved = resolveDescribedRecord(
    record,
    {rank: 1, formulaContext},
    {maxRank: 6, formulaContext},
  )

  return {
    kind: 'skill',
    id: record.id,
    name: record.displayName,
    label: record.displayName,
    record,
    description: resolved.description,
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildOverlayNameSet(overlays: AwakenerOverlayRecord[]): Set<string> {
  const names = new Set<string>()
  for (const overlay of overlays) {
    names.add(overlay.displayName.toLowerCase())
    for (const alias of overlay.aliases) {
      names.add(alias.toLowerCase())
    }
  }
  return names
}

function addReferenceInfos(
  referenceInfoByName: Map<string, DatabaseReferenceInfo>,
  referenceInfoById: Map<string, DatabaseReferenceInfo>,
  infos: DatabaseReferenceInfo[],
): void {
  for (const info of infos) {
    addDatabaseReferenceInfoToLookups(referenceInfoByName, referenceInfoById, info)
  }
}

function buildPosseReferenceEntries(
  records: Posse[],
): DatabaseReferenceInfo<ArtifactDescriptionRecord>[] {
  return records.map((record) =>
    buildArtifactReferenceStub(
      {
        id: record.id,
        kind: 'posse',
        displayName: record.name,
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      `Posse · ${getRealmLabel(record.realm)}`,
    ),
  )
}

function buildCovenantReferenceEntries(
  records: Covenant[],
): DatabaseReferenceInfo<ArtifactDescriptionRecord>[] {
  return records.map((record) =>
    buildArtifactReferenceStub(
      {
        id: record.id,
        kind: 'covenant',
        displayName: record.name,
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      'Covenant',
    ),
  )
}

function buildWheelReferenceEntries(
  records: Wheel[],
): DatabaseReferenceInfo<ArtifactDescriptionRecord>[] {
  return records.map((record) =>
    buildArtifactReferenceStub(
      buildWheelDatabaseDescriptionRecord({
        id: record.id,
        name: record.name,
        ownerAwakenerId: record.ownerAwakenerId,
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      `Wheel · ${record.rarity} · ${getRealmLabel(record.realm)}`,
    ),
  )
}

export interface BuildGlobalDatabaseReferenceLayerOptions {
  formulaContext?: PublicFormulaContext
  overlays?: AwakenerOverlayRecord[]
  derivedSkills?: DerivedSkillRecord[]
  awakenerSkills?: AwakenerSkillRecord[]
  posses?: Posse[]
  covenants?: Covenant[]
  wheels?: Wheel[]
  extraReferences?: {record: ArtifactDescriptionRecord; label: string}[]
}

export function buildGlobalDatabaseReferenceLayer({
  awakenerSkills = getAwakenerSkills(),
  covenants = getCovenants(),
  derivedSkills = getDerivedSkills(),
  extraReferences = [],
  formulaContext,
  overlays = getAwakenerOverlays(),
  posses = getPosses(),
  wheels = getWheels(),
}: BuildGlobalDatabaseReferenceLayerOptions = {}): ResolvedDatabaseReferenceLayer {
  const referenceInfoByName = new Map<string, DatabaseReferenceInfo>()
  const referenceInfoById = new Map<string, DatabaseReferenceInfo>()
  const overlayNameSet = buildOverlayNameSet(overlays)
  const referencedDerivedSkills = derivedSkills.filter(
    (entry) => !overlayNameSet.has(entry.displayName.toLowerCase()),
  )
  const referencedAwakenerSkills = awakenerSkills.filter(
    (entry) => !overlayNameSet.has(entry.displayName.toLowerCase()),
  )
  const extraReferenceInfos = extraReferences.map((entry) =>
    buildArtifactReferenceInfo(entry.record, entry.label, formulaContext),
  )
  const wheelInfos = buildWheelReferenceEntries(wheels)
  const posseInfos = buildPosseReferenceEntries(posses)
  const covenantInfos = buildCovenantReferenceEntries(covenants)

  addReferenceInfos(referenceInfoByName, referenceInfoById, [
    ...extraReferenceInfos,
    ...wheelInfos,
    ...posseInfos,
    ...covenantInfos,
    ...referencedDerivedSkills.map((record) =>
      buildDerivedSkillReferenceInfo(record, formulaContext),
    ),
    ...referencedAwakenerSkills.map((record) =>
      buildAwakenerSkillReferenceInfo(record, formulaContext),
    ),
  ])

  for (const overlay of overlays) {
    addDatabaseReferenceInfoToLookups(
      referenceInfoByName,
      referenceInfoById,
      buildDatabaseOverlayReferenceInfo(overlay, null, [], formulaContext),
      overlay.aliases,
    )
  }

  return {
    cardNames: new Set([
      ...extraReferenceInfos.map((info) => info.name),
      ...wheelInfos.map((info) => info.name),
      ...posseInfos.map((info) => info.name),
      ...covenantInfos.map((info) => info.name),
      ...referencedDerivedSkills.map((entry) => entry.displayName),
      ...referencedAwakenerSkills.map((entry) => entry.displayName),
    ]),
    accessibleOverlays: overlays,
    referenceInfoByName,
    referenceInfoById,
    overlayByName: buildDatabaseOverlayLookup(overlays),
  }
}

export async function hydrateGlobalDatabaseReferenceInfo(
  info: DatabaseReferenceInfo,
  formulaContext?: PublicFormulaContext,
): Promise<DatabaseReferenceInfo> {
  if (info.description || !['wheel', 'posse', 'covenant'].includes(info.kind)) {
    return info
  }

  if (info.kind === 'wheel') {
    const {getWheelFullV2ById, getWheelsFullV2} = await import('./wheels-full-v2')
    const record = getWheelFullV2ById(info.id, getWheelsFullV2())
    if (!record) {
      return info
    }
    return buildArtifactReferenceInfo(
      buildWheelDatabaseDescriptionRecord(record),
      info.label,
      formulaContext,
    )
  }

  if (info.kind === 'posse') {
    const {getPosseFullV2ById, getPossesFullV2} = await import('./posses-full-v2')
    const record = getPosseFullV2ById(info.id, getPossesFullV2())
    if (!record) {
      return info
    }
    return buildArtifactReferenceInfo(
      buildPosseDatabaseDescriptionRecord(record),
      info.label,
      formulaContext,
    )
  }

  const {getCovenantsFullV2} = await import('./covenants-full-v2')
  const record = getCovenantsFullV2().find((entry) => entry.id === info.id)
  const setEffect = record?.setEffects[0]
  if (!record || !setEffect) {
    return info
  }

  return buildArtifactReferenceInfo(
    buildCovenantDatabaseDescriptionRecord({
      id: record.id,
      name: record.name,
      descriptionTemplate: setEffect.descriptionTemplate,
      descriptionArgs: setEffect.descriptionArgs,
    }),
    info.label,
    formulaContext,
  )
}
