import {z} from 'zod'

import {ENTITY_KINDS, PUBLIC_DATA_SCOPES} from './contract'

const nonEmptyStringSchema = z.string().trim().min(1)

export const publicDataScopeSchema = z.enum(PUBLIC_DATA_SCOPES)
export const entityKindSchema = z.enum(ENTITY_KINDS)

export const entityRefSchema = z
  .object({
    kind: entityKindSchema,
    id: nonEmptyStringSchema,
  })
  .strict()

export const publicRouteInfoSchema = z
  .object({
    slug: nonEmptyStringSchema,
    canonicalPath: nonEmptyStringSchema,
  })
  .strict()

const assetMapSchema = z.record(nonEmptyStringSchema, nonEmptyStringSchema)

export const publicCatalogRecordSchema = z
  .object({
    kind: entityKindSchema,
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    route: publicRouteInfoSchema,
    assets: assetMapSchema.optional(),
  })
  .loose()

export const publicCatalogSchema = z
  .object({
    schemaVersion: z.literal(3),
    scope: publicDataScopeSchema,
    kind: entityKindSchema,
    recordCount: z.number().int().nonnegative(),
    records: z.array(publicCatalogRecordSchema),
  })
  .strict()
  .refine((catalog) => catalog.recordCount === catalog.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

export const publicRecordSchema = z
  .object({
    schemaVersion: z.literal(3),
    kind: entityKindSchema,
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    route: publicRouteInfoSchema.optional(),
    assets: assetMapSchema.optional(),
  })
  .loose()

const manifestScopeSchema = z
  .object({
    kind: entityKindSchema,
    catalog: nonEmptyStringSchema,
    recordPattern: nonEmptyStringSchema,
    count: z.number().int().nonnegative(),
  })
  .strict()

export const publicManifestSchema = z
  .object({
    schemaVersion: z.literal(3),
    gameDataVersion: nonEmptyStringSchema,
    generatedAt: nonEmptyStringSchema,
    buildId: nonEmptyStringSchema,
    scopes: z.record(publicDataScopeSchema, manifestScopeSchema),
    indexes: z.record(nonEmptyStringSchema, nonEmptyStringSchema),
    metadata: z.record(nonEmptyStringSchema, nonEmptyStringSchema).optional(),
    files: z
      .record(
        nonEmptyStringSchema,
        z
          .object({
            bytes: z.number().int().nonnegative(),
            sha256: nonEmptyStringSchema,
          })
          .strict(),
      )
      .optional(),
  })
  .loose()

export const publicEntitySummarySchema = z
  .object({
    kind: entityKindSchema,
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    route: publicRouteInfoSchema.optional(),
    assets: assetMapSchema.optional(),
  })
  .loose()

export const publicEntitiesIndexSchema = z
  .object({
    schemaVersion: z.literal(3),
    byId: z.record(nonEmptyStringSchema, publicEntitySummarySchema),
    scopes: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
  })
  .strict()

export const publicRouteIndexEntrySchema = entityRefSchema
  .extend({
    canonicalSlug: nonEmptyStringSchema,
    canonicalPath: nonEmptyStringSchema,
  })
  .strict()

export const publicRoutesIndexSchema = z
  .object({
    schemaVersion: z.literal(3),
    routes: z.record(
      nonEmptyStringSchema,
      z.record(nonEmptyStringSchema, publicRouteIndexEntrySchema),
    ),
    redirects: z.record(
      nonEmptyStringSchema,
      z.record(nonEmptyStringSchema, publicRouteIndexEntrySchema),
    ),
  })
  .strict()

export const publicAssetRecordSchema = z
  .object({
    id: nonEmptyStringSchema,
    slot: nonEmptyStringSchema,
    kind: entityKindSchema,
    ownerId: nonEmptyStringSchema,
    assetId: nonEmptyStringSchema.optional(),
    availability: z
      .object({
        status: nonEmptyStringSchema,
        path: nonEmptyStringSchema.optional(),
        candidates: z.array(nonEmptyStringSchema).optional(),
      })
      .loose(),
  })
  .loose()

export const publicAssetsIndexSchema = z
  .object({
    schemaVersion: z.literal(3),
    assets: z.record(nonEmptyStringSchema, publicAssetRecordSchema),
    entities: z.record(nonEmptyStringSchema, z.record(nonEmptyStringSchema, nonEmptyStringSchema)),
  })
  .strict()

export const publicReferencesIndexSchema = z
  .object({
    schemaVersion: z.literal(3),
    tokens: z.record(nonEmptyStringSchema, z.array(entityRefSchema)),
    ambiguous: z.record(nonEmptyStringSchema, z.array(entityRefSchema)),
  })
  .strict()

export const publicRelationshipsIndexSchema = z
  .object({
    schemaVersion: z.literal(3),
    forward: z.record(
      nonEmptyStringSchema,
      z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
    ),
    reverse: z.record(
      nonEmptyStringSchema,
      z.record(
        nonEmptyStringSchema,
        z.union([nonEmptyStringSchema, z.array(nonEmptyStringSchema)]),
      ),
    ),
  })
  .strict()

export const publicSearchDocumentSchema = entityRefSchema
  .extend({
    name: nonEmptyStringSchema,
    aliases: z.array(nonEmptyStringSchema),
    tokens: z.array(nonEmptyStringSchema),
    fields: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
    facets: z.record(nonEmptyStringSchema, z.unknown()).optional(),
  })
  .strict()

export const publicSearchIndexSchema = z
  .object({
    schemaVersion: z.literal(3),
    scope: publicDataScopeSchema,
    records: z.array(publicSearchDocumentSchema),
  })
  .strict()

export const publicBuilderCatalogSchema = z
  .object({
    schemaVersion: z.literal(3),
    options: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
    lineupTokens: z.record(nonEmptyStringSchema, nonEmptyStringSchema),
    groups: z.record(nonEmptyStringSchema, z.unknown()),
  })
  .strict()

export const publicCollectionCatalogSchema = z
  .object({
    schemaVersion: z.literal(3),
    collectables: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
    content: z.record(nonEmptyStringSchema, z.unknown()),
    groups: z.record(nonEmptyStringSchema, z.unknown()),
  })
  .strict()
