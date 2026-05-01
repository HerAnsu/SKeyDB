import {z} from 'zod'

import publicCovenantsLite from '@/data/public-v2/lite/covenants.json'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicCovenantsLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('covenants'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^covenant-\d{4}$/),
        assetId: nonEmptyStringSchema.regex(/^covenant-icon-\d{3}$/),
        name: nonEmptyStringSchema,
      }),
    ),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

export interface Covenant {
  id: string
  assetId: string
  name: string
}

function toLegacyCovenantAssetId(publicAssetId: string): string {
  const suffix = /^covenant-icon-(\d{3})$/.exec(publicAssetId)?.[1]
  if (!suffix) {
    throw new Error(`Cannot map public covenant asset id "${publicAssetId}" to legacy asset id.`)
  }
  return `Icon_Trinket_${suffix}`
}

const parsedCovenants = publicCovenantsLiteSchema.parse(publicCovenantsLite).records.map(
  (covenant): Covenant => ({
    id: covenant.id,
    assetId: toLegacyCovenantAssetId(covenant.assetId),
    name: covenant.name,
  }),
)

export function getCovenants(): Covenant[] {
  return parsedCovenants
}
