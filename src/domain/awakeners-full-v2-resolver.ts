import {z} from 'zod'

import {getAwakenerOverlays} from './awakener-overlays'
import {
  ENLIGHTEN_SLOT_KEYS,
  type AwakenerEnlightenRecord,
  type AwakenerOverlayRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type CardKeyword,
  type DerivedSkillRecord,
  type DescriptionArg,
  type UpgradePatch,
} from './awakener-source-schema'
import {
  type AwakenerFullV2Record,
  type PublicV2RecordUpgrade,
  type PublicV2UpgradeableDerivedSkillRecord,
  type PublicV2UpgradeableOverlayRecord,
  type PublicV2UpgradeableSkillRecord,
} from './awakeners-full-v2'
import {isSoulforgeTalent, selectedEnlightenSlotSchema} from './awakeners-full-v2-contract'

export const awakenerFullV2ResolveOptionsSchema = z.object({
  soulforgeLevel: z.number().int().min(0).default(0),
  selectedEnlightenSlot: selectedEnlightenSlotSchema.default(null),
})

export type AwakenerFullV2ResolveOptions = z.infer<typeof awakenerFullV2ResolveOptionsSchema>

export interface ResolvedAwakenerFullV2Record {
  selection: AwakenerFullV2ResolveOptions
  activeTalentIds: string[]
  activeEnlightenIds: string[]
  record: AwakenerFullV2Record
  overlayOverridesById: Record<string, AwakenerOverlayRecord>
}

type PatchableCardRecord = AwakenerSkillRecord | DerivedSkillRecord
type PublicV2PatchTargetType = 'skill' | 'derived-skill' | 'overlay'
type PublicV2UpgradeableTarget =
  | PublicV2UpgradeableSkillRecord
  | PublicV2UpgradeableDerivedSkillRecord
  | PublicV2UpgradeableOverlayRecord

function cloneDescriptionArgs(
  descriptionArgs: Record<string, DescriptionArg>,
): Record<string, DescriptionArg> {
  return Object.fromEntries(
    Object.entries(descriptionArgs).map(([key, arg]) => [
      key,
      {
        ...arg,
        ...(arg.substatBonus ? {substatBonus: {...arg.substatBonus}} : {}),
      },
    ]),
  )
}

function cloneCardKeywords(keywords: CardKeyword[]): CardKeyword[] {
  return keywords.map((keyword) => ({...keyword}))
}

function cloneSkillRecord(record: AwakenerSkillRecord): AwakenerSkillRecord {
  return {
    ...record,
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
    cardKeywords: cloneCardKeywords(record.cardKeywords),
    variants: record.variants.map((variant) => ({
      ...variant,
      descriptionArgs: cloneDescriptionArgs(variant.descriptionArgs),
      cardKeywords: cloneCardKeywords(variant.cardKeywords),
    })),
  }
}

function cloneDerivedSkillRecord(record: DerivedSkillRecord): DerivedSkillRecord {
  return {
    ...record,
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
    childDerivedSkillIds: [...record.childDerivedSkillIds],
    cardKeywords: cloneCardKeywords(record.cardKeywords),
    variants: record.variants.map((variant) => ({
      ...variant,
      descriptionArgs: cloneDescriptionArgs(variant.descriptionArgs),
      cardKeywords: cloneCardKeywords(variant.cardKeywords),
    })),
  }
}

function cloneOverlayRecord(record: AwakenerOverlayRecord): AwakenerOverlayRecord {
  return {
    ...record,
    aliases: [...record.aliases],
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
  }
}

function mergeDescriptionArgs<T extends {descriptionArgs: Record<string, unknown>}>(
  record: T,
  nextArgs: Record<string, unknown> | undefined,
): T {
  if (!nextArgs) {
    return record
  }

  return {
    ...record,
    descriptionArgs: {
      ...record.descriptionArgs,
      ...nextArgs,
    },
  }
}

function mergeCardKeywords(
  baseKeywords: CardKeyword[],
  addCardKeywords: CardKeyword[] | undefined,
  removeCardKeywordIds: string[] | undefined,
): CardKeyword[] {
  const next = new Map(baseKeywords.map((keyword) => [keyword.id, {...keyword}]))

  for (const keywordId of removeCardKeywordIds ?? []) {
    next.delete(keywordId)
  }

  for (const keyword of addCardKeywords ?? []) {
    next.set(keyword.id, {...keyword})
  }

  return [...next.values()]
}

function applyArgSubstatBonuses(
  descriptionArgs: Record<string, DescriptionArg>,
  argSubstatBonuses: NonNullable<UpgradePatch['argSubstatBonuses']>,
): Record<string, DescriptionArg> {
  const nextArgs = cloneDescriptionArgs(descriptionArgs)

  for (const [argKey, substatBonus] of Object.entries(argSubstatBonuses)) {
    if (!Object.hasOwn(nextArgs, argKey)) {
      throw new Error(`Cannot apply substat bonus patch to missing arg "${argKey}".`)
    }
    const currentArg = nextArgs[argKey]

    nextArgs[argKey] = {
      ...currentArg,
      substatBonus: {...substatBonus},
    }
  }

  return nextArgs
}

function applyPatchToCardRecord<T extends PatchableCardRecord>(record: T, patch: UpgradePatch): T {
  let next: T = record

  if (patch.descriptionTemplate) {
    next = {
      ...next,
      descriptionTemplate: patch.descriptionTemplate,
    }
  }

  next = mergeDescriptionArgs(next, patch.descriptionArgs)

  if (patch.argSubstatBonuses) {
    next = {
      ...next,
      descriptionArgs: applyArgSubstatBonuses(next.descriptionArgs, patch.argSubstatBonuses),
    }
  }

  if (patch.addCardKeywords || patch.removeCardKeywordIds) {
    next = {
      ...next,
      cardKeywords: mergeCardKeywords(
        next.cardKeywords,
        patch.addCardKeywords,
        patch.removeCardKeywordIds,
      ),
    }
  }

  return next
}

function applyPatchToOverlayRecord(
  record: AwakenerOverlayRecord,
  patch: UpgradePatch,
): AwakenerOverlayRecord {
  if (patch.addCardKeywords || patch.removeCardKeywordIds) {
    throw new Error(`Overlay patch "${patch.targetId}" cannot modify card keywords.`)
  }

  let next = record

  if (patch.descriptionTemplate) {
    next = {
      ...next,
      descriptionTemplate: patch.descriptionTemplate,
    }
  }

  next = mergeDescriptionArgs(next, patch.descriptionArgs)

  if (patch.argSubstatBonuses) {
    return {
      ...next,
      descriptionArgs: applyArgSubstatBonuses(next.descriptionArgs, patch.argSubstatBonuses),
    }
  }

  return next
}

function buildCardsById(record: AwakenerFullV2Record): Map<string, PatchableCardRecord> {
  const byId = new Map<string, PatchableCardRecord>()

  byId.set(record.cards.C1.id, cloneSkillRecord(record.cards.C1))
  byId.set(record.cards.C2.id, cloneSkillRecord(record.cards.C2))
  byId.set(record.cards.C3.id, cloneSkillRecord(record.cards.C3))
  byId.set(record.cards.C4.id, cloneSkillRecord(record.cards.C4))
  byId.set(record.cards.C5.id, cloneSkillRecord(record.cards.C5))
  byId.set(record.cards.Exalt.id, cloneSkillRecord(record.cards.Exalt))

  if (record.cards.OverExalt) {
    byId.set(record.cards.OverExalt.id, cloneSkillRecord(record.cards.OverExalt))
  }

  for (const card of record.cards.promotedExtras) {
    byId.set(card.id, cloneDerivedSkillRecord(card))
  }

  for (const card of record.derivedSkills) {
    byId.set(card.id, cloneDerivedSkillRecord(card))
  }

  return byId
}

function buildAccessibleOverlaysById(
  record: AwakenerFullV2Record,
  overlays: AwakenerOverlayRecord[],
): Map<string, AwakenerOverlayRecord> {
  const byId = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlays) {
    if (overlay.ownerAwakenerId === undefined || overlay.ownerAwakenerId === record.id) {
      byId.set(overlay.id, overlay)
    }
  }
  for (const overlay of record.overlays ?? []) {
    byId.set(overlay.id, overlay)
  }

  return byId
}

function getActiveEnlightens(
  record: AwakenerFullV2Record,
  selectedEnlightenSlot: AwakenerFullV2ResolveOptions['selectedEnlightenSlot'],
): AwakenerEnlightenRecord[] {
  if (!selectedEnlightenSlot) {
    return []
  }

  const orderedSlots: AwakenerEnlightenRecord['slot'][] = []
  for (const slot of ENLIGHTEN_SLOT_KEYS) {
    orderedSlots.push(slot)
    if (slot === selectedEnlightenSlot) {
      break
    }
  }

  const active: AwakenerEnlightenRecord[] = []

  for (const slot of orderedSlots) {
    const entry =
      slot === 'AbsoluteAxiom' ? record.enlightens.AbsoluteAxiom : record.enlightens[slot]

    if (entry) {
      active.push(entry)
    }
  }

  return active
}

function getActiveTalentEntries(
  record: AwakenerFullV2Record,
  soulforgeLevel: number,
): AwakenerTalentRecord[] {
  const active: AwakenerTalentRecord[] = []

  for (const talent of [
    record.talents.T1,
    record.talents.T2,
    record.talents.T3,
    record.talents.T4,
  ]) {
    if (talent) {
      if (isSoulforgeTalent(talent) && soulforgeLevel <= 0) {
        continue
      }
      active.push(talent)
    }
  }

  for (const talent of record.talents.extraTalents) {
    if (isSoulforgeTalent(talent) && soulforgeLevel <= 0) {
      continue
    }
    active.push(talent)
  }

  return active
}

function cloneTalentRecord(record: AwakenerTalentRecord): AwakenerTalentRecord {
  return {
    ...record,
    descriptionArgs: cloneDescriptionArgs(record.descriptionArgs),
  }
}

function cloneOptionalTalentRecord(
  record: AwakenerTalentRecord | undefined,
): AwakenerTalentRecord | undefined {
  return record ? cloneTalentRecord(record) : undefined
}

function resolveTalents(
  record: AwakenerFullV2Record,
  _soulforgeLevel: number,
): AwakenerFullV2Record['talents'] {
  return {
    T1: cloneOptionalTalentRecord(record.talents.T1),
    T2: cloneOptionalTalentRecord(record.talents.T2),
    T3: cloneOptionalTalentRecord(record.talents.T3),
    T4: cloneOptionalTalentRecord(record.talents.T4),
    extraTalents: record.talents.extraTalents.map((entry) => cloneTalentRecord(entry)),
  }
}

function rebuildRecordFromMaps(
  record: AwakenerFullV2Record,
  cardsById: Map<string, PatchableCardRecord>,
  resolvedTalents: AwakenerFullV2Record['talents'],
): AwakenerFullV2Record {
  const requireCardRecord = (id: string): PatchableCardRecord => {
    const next = cardsById.get(id)
    if (!next) {
      throw new Error(`Resolved compiled record is missing patched card "${id}".`)
    }
    return next
  }

  return {
    ...record,
    cards: {
      C1: requireCardRecord(record.cards.C1.id) as AwakenerSkillRecord,
      C2: requireCardRecord(record.cards.C2.id) as AwakenerSkillRecord,
      C3: requireCardRecord(record.cards.C3.id) as AwakenerSkillRecord,
      C4: requireCardRecord(record.cards.C4.id) as AwakenerSkillRecord,
      C5: requireCardRecord(record.cards.C5.id) as AwakenerSkillRecord,
      Exalt: requireCardRecord(record.cards.Exalt.id) as AwakenerSkillRecord,
      OverExalt: record.cards.OverExalt
        ? (requireCardRecord(record.cards.OverExalt.id) as AwakenerSkillRecord)
        : undefined,
      promotedExtras: record.cards.promotedExtras.map(
        (entry) => requireCardRecord(entry.id) as DerivedSkillRecord,
      ),
    },
    talents: resolvedTalents,
    derivedSkills: record.derivedSkills.map(
      (entry) => requireCardRecord(entry.id) as DerivedSkillRecord,
    ),
  }
}

function cloneUpgradePatch(patch: UpgradePatch): UpgradePatch {
  return {
    ...patch,
    ...(patch.descriptionArgs
      ? {descriptionArgs: cloneDescriptionArgs(patch.descriptionArgs)}
      : {}),
    ...(patch.argSubstatBonuses ? {argSubstatBonuses: {...patch.argSubstatBonuses}} : {}),
    ...(patch.addCardKeywords
      ? {addCardKeywords: patch.addCardKeywords.map((keyword) => ({...keyword}))}
      : {}),
    ...(patch.removeCardKeywordIds ? {removeCardKeywordIds: [...patch.removeCardKeywordIds]} : {}),
  }
}

function toResolverUpgradePatch(
  target: PublicV2UpgradeableTarget,
  targetType: PublicV2PatchTargetType,
  upgrade: PublicV2RecordUpgrade,
): UpgradePatch | null {
  if (upgrade.operation === 'link_only') {
    return null
  }

  const patch = upgrade.patch ?? {}
  if (upgrade.operation === 'override_card_keywords') {
    return {
      targetId: target.id,
      targetType,
      operation: 'card_keywords',
      addCardKeywords: patch.cardKeywords as CardKeyword[] | undefined,
    }
  }

  return {
    targetId: target.id,
    targetType,
    operation: upgrade.operation,
    ...patch,
    ...(Array.isArray(patch.cardKeywords) ? {addCardKeywords: patch.cardKeywords} : {}),
  } as UpgradePatch
}

function collectUpgradePatchesForUpgraders(
  targets: PublicV2UpgradeableTarget[],
  targetType: PublicV2PatchTargetType,
  activeUpgraderIds: Set<string>,
): UpgradePatch[] {
  const patches: UpgradePatch[] = []
  for (const target of targets) {
    for (const upgrade of target.upgrades ?? []) {
      if (!activeUpgraderIds.has(upgrade.upgraderId)) {
        continue
      }
      const patch = toResolverUpgradePatch(target, targetType, upgrade)
      if (patch) {
        patches.push(cloneUpgradePatch(patch))
      }
    }
  }
  return patches
}

function getSkillUpgradeTargets(record: AwakenerFullV2Record): PublicV2UpgradeableSkillRecord[] {
  return [
    record.cards.C1,
    record.cards.C2,
    record.cards.C3,
    record.cards.C4,
    record.cards.C5,
    record.cards.Exalt,
    ...(record.cards.OverExalt ? [record.cards.OverExalt] : []),
  ]
}

function getDerivedUpgradeTargets(
  record: AwakenerFullV2Record,
): PublicV2UpgradeableDerivedSkillRecord[] {
  return [...record.cards.promotedExtras, ...record.derivedSkills]
}

function collectRecordUpgradePatches(
  record: AwakenerFullV2Record,
  accessibleOverlaysById: Map<string, AwakenerOverlayRecord>,
  activeUpgraderIds: Set<string>,
): UpgradePatch[] {
  return [
    ...collectUpgradePatchesForUpgraders(
      getSkillUpgradeTargets(record),
      'skill',
      activeUpgraderIds,
    ),
    ...collectUpgradePatchesForUpgraders(
      getDerivedUpgradeTargets(record),
      'derived-skill',
      activeUpgraderIds,
    ),
    ...collectUpgradePatchesForUpgraders(
      [...accessibleOverlaysById.values()] as PublicV2UpgradeableOverlayRecord[],
      'overlay',
      activeUpgraderIds,
    ),
  ]
}

export function resolveAwakenerFullV2Record(
  record: AwakenerFullV2Record,
  options: Partial<AwakenerFullV2ResolveOptions> = {},
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
): ResolvedAwakenerFullV2Record {
  const selection = awakenerFullV2ResolveOptionsSchema.parse(options)
  const cardsById = buildCardsById(record)
  const accessibleOverlaysById = buildAccessibleOverlaysById(record, overlays)
  const overlayOverridesById = new Map<string, AwakenerOverlayRecord>()
  const activeTalents = getActiveTalentEntries(record, selection.soulforgeLevel)
  const activeEnlightens = getActiveEnlightens(record, selection.selectedEnlightenSlot)

  for (const patch of collectRecordUpgradePatches(
    record,
    accessibleOverlaysById,
    new Set(activeTalents.map((entry) => entry.id)),
  )) {
    if (patch.targetType === 'overlay') {
      const currentOverlay =
        overlayOverridesById.get(patch.targetId) ?? accessibleOverlaysById.get(patch.targetId)
      if (!currentOverlay) {
        throw new Error(
          `Missing overlay "${patch.targetId}" for awakener ${String(record.id)} while applying public V2 talent upgrade.`,
        )
      }
      overlayOverridesById.set(
        patch.targetId,
        applyPatchToOverlayRecord(cloneOverlayRecord(currentOverlay), patch),
      )
      continue
    }

    const currentCard = cardsById.get(patch.targetId)
    if (!currentCard) {
      throw new Error(
        `Missing ${patch.targetType} "${patch.targetId}" for awakener ${String(record.id)} while applying public V2 talent upgrade.`,
      )
    }
    cardsById.set(patch.targetId, applyPatchToCardRecord(currentCard, patch))
  }

  for (const patch of collectRecordUpgradePatches(
    record,
    accessibleOverlaysById,
    new Set(activeEnlightens.map((entry) => entry.id)),
  )) {
    if (patch.targetType === 'overlay') {
      const currentOverlay =
        overlayOverridesById.get(patch.targetId) ?? accessibleOverlaysById.get(patch.targetId)
      if (!currentOverlay) {
        throw new Error(
          `Missing overlay "${patch.targetId}" for awakener ${String(record.id)} while applying public V2 enlighten upgrade.`,
        )
      }
      overlayOverridesById.set(
        patch.targetId,
        applyPatchToOverlayRecord(cloneOverlayRecord(currentOverlay), patch),
      )
      continue
    }

    const currentCard = cardsById.get(patch.targetId)
    if (!currentCard) {
      throw new Error(
        `Missing ${patch.targetType} "${patch.targetId}" for awakener ${String(record.id)} while applying public V2 enlighten upgrade.`,
      )
    }
    cardsById.set(patch.targetId, applyPatchToCardRecord(currentCard, patch))
  }

  const resolvedTalents = resolveTalents(record, selection.soulforgeLevel)

  return {
    selection,
    activeTalentIds: activeTalents.map((entry) => entry.id),
    activeEnlightenIds: activeEnlightens.map((entry) => entry.id),
    record: rebuildRecordFromMaps(record, cardsById, resolvedTalents),
    overlayOverridesById: Object.fromEntries(overlayOverridesById),
  }
}
