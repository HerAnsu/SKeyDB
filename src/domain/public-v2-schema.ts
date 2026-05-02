import {z} from 'zod'

export const publicV2Scopes = [
  'awakener-builds',
  'awakeners',
  'covenants',
  'derived-skills',
  'enlightens',
  'overlays',
  'posses',
  'relics',
  'skills',
  'talents',
  'wheels',
] as const

export type PublicV2Scope = (typeof publicV2Scopes)[number]

const forbiddenPublicRecordKeys = new Set([
  'audit',
  'codecIndex',
  'debug',
  'legacyId',
  'rawFormula',
  'slug',
  'source',
  'sourceAwakenerId',
  'sourceConfigId',
  'sourceFormulaVariables',
  'sourceId',
  'sourceSkillId',
  'sourceTables',
  'stateLayerBonus',
])

const canonicalIdPatterns: Partial<Record<PublicV2Scope, RegExp>> = {
  'awakener-builds': /^awakener-build-\d{4}$/,
  awakeners: /^awakener-\d{4}$/,
  covenants: /^covenant-\d{4}$/,
  posses: /^posse-\d{4}$/,
  relics: /^relic-\d{4}$/,
  wheels: /^wheel-\d{4}$/,
}

const awakenerIdSchema = z.string().regex(/^awakener-\d{4}$/)
const wheelIdSchema = z.string().regex(/^wheel-\d{4}$/)
const covenantIdSchema = z.string().regex(/^covenant-\d{4}$/)
const posseIdSchema = z.string().regex(/^posse-\d{4}$/)
const nonEmptyStringSchema = z.string().trim().min(1)

const jsonSchema: z.ZodType = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
)
const numericAwakenerIdSchema = z.number().int().positive()
const descriptionArgsSchema = z.record(nonEmptyStringSchema, jsonSchema)
const cardKeywordsSchema = z.array(z.object({id: nonEmptyStringSchema}).catchall(jsonSchema))
const publicSlugIdSchema = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}\\.[a-z0-9][a-z0-9.-]*$`))
const publicContentRefIdSchema = z.union([
  publicSlugIdSchema('derived'),
  publicSlugIdSchema('skill'),
  publicSlugIdSchema('talent'),
])
export const publicUpgradeSchema = z
  .object({
    id: publicSlugIdSchema('upgrade'),
    upgraderId: z.union([publicSlugIdSchema('enlighten'), publicSlugIdSchema('talent')]),
    upgraderType: z.enum(['enlighten', 'talent']),
    upgraderSlot: z.enum(['E1', 'E2', 'E3', 'OverExalt', 'AbsoluteAxiom']).optional(),
    ownerAwakenerId: awakenerIdSchema.optional(),
    operation: z.enum([
      'link_only',
      'mixed',
      'override_args',
      'override_card_keywords',
      'replace_description',
    ]),
    patch: z.record(nonEmptyStringSchema, jsonSchema).optional(),
  })
  .catchall(jsonSchema)

function scanForbiddenPublicKeys(
  value: unknown,
  context: z.RefinementCtx,
  path: (string | number)[] = [],
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      scanForbiddenPublicKeys(item, context, [...path, index])
    })
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childPath = [...path, key]

    if (forbiddenPublicRecordKeys.has(key)) {
      context.addIssue({
        code: 'custom',
        message: `Public V2 record contains forbidden private key: ${key}`,
        path: childPath,
      })
    }

    scanForbiddenPublicKeys(childValue, context, childPath)
  }
}

function createScopedRecordShape(scope: PublicV2Scope): z.ZodRawShape {
  switch (scope) {
    case 'awakener-builds':
      return {
        awakenerId: awakenerIdSchema,
        primaryBuildId: nonEmptyStringSchema,
      }
    case 'awakeners':
      return {
        numericId: numericAwakenerIdSchema,
        name: nonEmptyStringSchema,
        realm: nonEmptyStringSchema,
        rarity: nonEmptyStringSchema,
        type: nonEmptyStringSchema,
        baseStatsLv1: z
          .object({
            CON: z.number(),
            ATK: z.number(),
            DEF: z.number(),
          })
          .optional(),
      }
    case 'covenants':
      return {
        name: nonEmptyStringSchema,
        assetId: nonEmptyStringSchema,
        setEffects: z.array(jsonSchema).optional(),
      }
    case 'derived-skills':
      return {
        id: publicSlugIdSchema('derived'),
        displayName: nonEmptyStringSchema,
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
        cardKeywords: cardKeywordsSchema.optional(),
        ownerAwakenerId: awakenerIdSchema.optional(),
        derivedFromId: publicContentRefIdSchema.nullable().optional(),
        rootSkillId: publicContentRefIdSchema.nullable().optional(),
        childDerivedSkillIds: z.array(publicSlugIdSchema('derived')).optional(),
        upgrades: z.array(publicUpgradeSchema).optional(),
      }
    case 'enlightens':
      return {
        id: publicSlugIdSchema('enlighten'),
        ownerAwakenerId: awakenerIdSchema,
        slot: z.enum(['E1', 'E2', 'E3', 'OverExalt', 'AbsoluteAxiom']),
        displayName: nonEmptyStringSchema,
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
      }
    case 'overlays':
      return {
        id: publicSlugIdSchema('overlay'),
        displayName: nonEmptyStringSchema,
        overlayType: nonEmptyStringSchema,
        aliases: z.array(nonEmptyStringSchema),
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
        ownerAwakenerId: awakenerIdSchema.optional(),
        childOverlayIds: z.array(publicSlugIdSchema('overlay')).optional(),
        upgrades: z.array(publicUpgradeSchema).optional(),
      }
    case 'posses':
      return {
        name: nonEmptyStringSchema,
        assetId: nonEmptyStringSchema,
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
      }
    case 'relics':
      return {
        kind: nonEmptyStringSchema.optional(),
        relicType: nonEmptyStringSchema.optional(),
        name: nonEmptyStringSchema,
        ownerAwakenerId: awakenerIdSchema.optional(),
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
      }
    case 'skills':
      return {
        id: publicSlugIdSchema('skill'),
        ownerAwakenerId: awakenerIdSchema,
        slot: nonEmptyStringSchema,
        kind: nonEmptyStringSchema,
        displayName: nonEmptyStringSchema,
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
        cardKeywords: cardKeywordsSchema.optional(),
        upgrades: z.array(publicUpgradeSchema).optional(),
      }
    case 'talents':
      return {
        id: publicSlugIdSchema('talent'),
        ownerAwakenerId: awakenerIdSchema,
        displayName: nonEmptyStringSchema,
        family: nonEmptyStringSchema,
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
      }
    case 'wheels':
      return {
        name: nonEmptyStringSchema,
        assetId: nonEmptyStringSchema,
        rarity: nonEmptyStringSchema,
        realm: nonEmptyStringSchema,
        mainstatKey: nonEmptyStringSchema,
        descriptionTemplate: z.string().optional(),
        descriptionArgs: descriptionArgsSchema.optional(),
        ownerAwakenerId: awakenerIdSchema.optional(),
      }
  }
}

function createRecordSchema(scope: PublicV2Scope) {
  const idPattern = canonicalIdPatterns[scope]

  return z
    .object({
      id: idPattern ? z.string().regex(idPattern) : z.string().min(1),
      ...createScopedRecordShape(scope),
      awakenerId: awakenerIdSchema.optional(),
      ownerAwakenerId: awakenerIdSchema.optional(),
      recommendedCovenantIds: z.array(covenantIdSchema).optional(),
      recommendedPosseIds: z.array(posseIdSchema).optional(),
      recommendedWheelIds: z.array(wheelIdSchema).optional(),
      builds: z
        .array(
          z
            .object({
              recommendedCovenantIds: z.array(covenantIdSchema).optional(),
              recommendedPosseIds: z.array(posseIdSchema).optional(),
              recommendedWheels: z
                .array(
                  z
                    .object({
                      wheelIds: z.array(wheelIdSchema),
                    })
                    .catchall(jsonSchema),
                )
                .optional(),
            })
            .catchall(jsonSchema),
        )
        .optional(),
    })
    .catchall(jsonSchema)
    .superRefine((record, context) => {
      scanForbiddenPublicKeys(record, context)
      if (
        scope === 'awakener-builds' &&
        typeof record.awakenerId === 'string' &&
        /^awakener-build-\d{4}$/.test(record.id)
      ) {
        const buildSuffix = /^awakener-build-(\d{4})$/.exec(record.id)?.[1]
        const awakenerSuffix = /^awakener-(\d{4})$/.exec(record.awakenerId)?.[1]
        if (buildSuffix && awakenerSuffix && buildSuffix !== awakenerSuffix) {
          context.addIssue({
            code: 'custom',
            message: 'Awakener build id must align numerically with awakenerId',
            path: ['id'],
          })
        }
      }
    })
}

export const publicV2RecordSchemas = Object.fromEntries(
  publicV2Scopes.map((scope) => [scope, createRecordSchema(scope)]),
) as Record<PublicV2Scope, ReturnType<typeof createRecordSchema>>

export type PublicV2Record<TScope extends PublicV2Scope = PublicV2Scope> = z.infer<
  (typeof publicV2RecordSchemas)[TScope]
>

export type PublicV2UpgradeEntry = z.infer<typeof publicUpgradeSchema>

export interface PublicV2Envelope<TScope extends PublicV2Scope = PublicV2Scope> {
  schemaVersion: number
  scope: TScope
  generatedAt?: string
  recordCount: number
  records: PublicV2Record<TScope>[]
  metadata?: Record<string, unknown>
}

export const publicV2EnvelopeSchemas = Object.fromEntries(
  publicV2Scopes.map((scope) => [
    scope,
    z
      .object({
        schemaVersion: z.number().int().positive(),
        scope: z.literal(scope),
        generatedAt: z.string().optional(),
        recordCount: z.number().int().nonnegative(),
        records: z.array(publicV2RecordSchemas[scope]),
        metadata: z.record(z.string(), jsonSchema).optional(),
      })
      .strict()
      .refine((envelope) => envelope.recordCount === envelope.records.length, {
        message: 'recordCount must match records.length',
        path: ['recordCount'],
      }),
  ]),
) as unknown as Record<PublicV2Scope, z.ZodType<PublicV2Envelope>>

export function parsePublicV2Envelope<TScope extends PublicV2Scope>(
  scope: TScope,
  value: unknown,
): PublicV2Envelope<TScope> {
  return publicV2EnvelopeSchemas[scope].parse(value) as PublicV2Envelope<TScope>
}

export function parsePublicV2Record<TScope extends PublicV2Scope>(
  scope: TScope,
  value: unknown,
): PublicV2Record<TScope> {
  return publicV2RecordSchemas[scope].parse(value)
}

const relationshipTargets = {
  awakenerId: 'awakeners',
  ownerAwakenerId: 'awakeners',
  recommendedCovenantIds: 'covenants',
  recommendedPosseIds: 'posses',
  recommendedWheelIds: 'wheels',
} as const satisfies Record<string, PublicV2Scope>

type RelationshipTargetKey = keyof typeof relationshipTargets

function collectRelationshipIds(record: PublicV2Record, key: RelationshipTargetKey): string[] {
  const value = record[key]
  const values: string[] = []

  if (typeof value === 'string') {
    values.push(value)
  } else if (Array.isArray(value)) {
    values.push(...value.filter((item): item is string => typeof item === 'string'))
  }

  if (Array.isArray(record.builds)) {
    for (const build of record.builds) {
      const buildValue = build[key]

      if (Array.isArray(buildValue)) {
        values.push(...buildValue.filter((item): item is string => typeof item === 'string'))
      }

      if (key === 'recommendedWheelIds' && Array.isArray(build.recommendedWheels)) {
        for (const wheelGroup of build.recommendedWheels) {
          values.push(...wheelGroup.wheelIds)
        }
      }
    }
  }

  return values
}

function collectStringArrayRelationship(record: PublicV2Record, key: string): string[] {
  const value = record[key]
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function getUpgradeUpgraderTargetScope(upgraderId: string): PublicV2Scope | null {
  if (upgraderId.startsWith('enlighten.')) {
    return 'enlightens'
  }
  if (upgraderId.startsWith('talent.')) {
    return 'talents'
  }
  return null
}

function collectUpgradeUpgraderRelationships(
  record: PublicV2Record,
): {id: string; index: number; targetScope: PublicV2Scope | null}[] {
  const upgrades = record.upgrades
  if (!Array.isArray(upgrades)) {
    return []
  }

  return upgrades.flatMap((upgrade, index) => {
    if (!upgrade || typeof upgrade !== 'object' || Array.isArray(upgrade)) {
      return []
    }

    const upgraderId = (upgrade as Record<string, unknown>).upgraderId
    if (typeof upgraderId !== 'string' || !upgraderId) {
      return []
    }

    return [{id: upgraderId, index, targetScope: getUpgradeUpgraderTargetScope(upgraderId)}]
  })
}

export function validatePublicV2Relationships(envelopes: PublicV2Envelope[]): void {
  const idsByScope = new Map<PublicV2Scope, Set<string>>()

  for (const envelope of envelopes) {
    idsByScope.set(envelope.scope, new Set(envelope.records.map((record) => record.id)))
  }

  const issues: string[] = []

  for (const envelope of envelopes) {
    for (const record of envelope.records) {
      for (const [key, targetScope] of Object.entries(relationshipTargets) as [
        RelationshipTargetKey,
        PublicV2Scope,
      ][]) {
        const targetIds = idsByScope.get(targetScope)

        if (!targetIds) {
          continue
        }

        for (const id of collectRelationshipIds(record, key)) {
          if (!targetIds.has(id)) {
            issues.push(
              `${envelope.scope}/${record.id} ${key} references missing ${targetScope}/${id}`,
            )
          }
        }
      }

      if (envelope.scope === 'derived-skills') {
        const targetIds = idsByScope.get('derived-skills')
        if (targetIds) {
          for (const id of collectStringArrayRelationship(record, 'childDerivedSkillIds')) {
            if (!targetIds.has(id)) {
              issues.push(
                `${envelope.scope}/${record.id} childDerivedSkillIds references missing derived-skills/${id}`,
              )
            }
          }
        }
      }

      for (const upgrade of collectUpgradeUpgraderRelationships(record)) {
        if (!upgrade.targetScope) {
          issues.push(
            `${envelope.scope}/${record.id} upgrades.${String(upgrade.index)}.upgraderId has unknown public V2 upgrader id: ${upgrade.id}`,
          )
          continue
        }

        const targetIds = idsByScope.get(upgrade.targetScope)
        if (targetIds && !targetIds.has(upgrade.id)) {
          issues.push(
            `${envelope.scope}/${record.id} upgrades.${String(upgrade.index)}.upgraderId references missing ${upgrade.targetScope}/${upgrade.id}`,
          )
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Public V2 relationship validation failed:\n${issues.join('\n')}`)
  }
}
