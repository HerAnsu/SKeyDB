import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'
import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  getDescriptionArgKeysInTemplateOrder,
  resolveDescriptionArgs,
  resolveDescriptionTemplate,
  type DescriptionArgProgressionContext,
  type DescriptionArgResolveContext,
  type ResolvedDescriptionArg,
} from './description-args'

export type DescribedRecord =
  | AwakenerSkillRecord
  | AwakenerTalentRecord
  | AwakenerEnlightenRecord
  | DerivedSkillRecord
  | AwakenerOverlayRecord

export interface ResolvedDescribedRecordArgEntry {
  key: string
  resolved: ResolvedDescriptionArg
  progression: string
  hover: string
}

export interface ResolvedDescribedRecord<TRecord extends DescribedRecord> {
  record: TRecord
  description: string
  resolvedArgs: Record<string, ResolvedDescriptionArg>
  orderedArgEntries: ResolvedDescribedRecordArgEntry[]
}

function buildOrderedArgEntries(
  record: DescribedRecord,
  resolvedArgs: Record<string, ResolvedDescriptionArg>,
  progressionContext: DescriptionArgProgressionContext,
): ResolvedDescribedRecordArgEntry[] {
  const orderedKeys = getDescriptionArgKeysInTemplateOrder(
    record.descriptionTemplate,
    record.descriptionArgs,
  )

  const entries: ResolvedDescribedRecordArgEntry[] = []

  for (const key of orderedKeys) {
    const resolved = resolvedArgs[key]
    const arg = record.descriptionArgs[key]
    entries.push({
      key,
      resolved,
      progression: formatDescriptionArgProgression(arg, progressionContext),
      hover: buildDescriptionArgHover(arg, progressionContext),
    })
  }

  return entries
}

export function resolveDescribedRecord<TRecord extends DescribedRecord>(
  record: TRecord,
  resolveContext: DescriptionArgResolveContext = {},
  progressionContext: DescriptionArgProgressionContext = {},
): ResolvedDescribedRecord<TRecord> {
  const resolvedArgs = resolveDescriptionArgs(record.descriptionArgs, resolveContext)
  const description = resolveDescriptionTemplate(
    record.descriptionTemplate,
    record.descriptionArgs,
    resolveContext,
  )

  return {
    record,
    description,
    resolvedArgs,
    orderedArgEntries: buildOrderedArgEntries(record, resolvedArgs, progressionContext),
  }
}
