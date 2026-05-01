import {z} from 'zod'

import possesCompatLite from '@/data/posses-lite.json'
import publicPossesLite from '@/data/public-v2/lite/posses.json'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicPossesLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('posses'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^posse-\d{4}$/),
        name: nonEmptyStringSchema,
        realm: nonEmptyStringSchema,
      }),
    ),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

const compatPossesSchema = z.array(
  z.object({
    id: nonEmptyStringSchema,
    awakenerName: nonEmptyStringSchema.optional(),
  }),
)

export interface Posse {
  id: string
  index: number
  name: string
  realm: string
  isFadedLegacy: boolean
  awakenerName?: string
}

const compatPosseByPublicId = new Map(
  compatPossesSchema
    .parse(possesCompatLite)
    .map(
      (posse) =>
        [`posse-${String(getPosseIndexFromLegacyId(posse.id)).padStart(4, '0')}`, posse] as [
          string,
          typeof posse,
        ],
    ),
)

function getPosseIndexFromLegacyId(legacyId: string): number {
  const legacyPosse = (possesCompatLite as {id: string; index?: number}[]).find(
    (posse) => posse.id === legacyId,
  )
  if (!legacyPosse?.index) {
    throw new Error(`Missing compatibility index for legacy posse "${legacyId}".`)
  }
  return legacyPosse.index
}

function getPosseIndex(publicId: string): number {
  const suffix = /^posse-(\d{4})$/.exec(publicId)?.[1]
  if (!suffix) {
    throw new Error(`Cannot derive index from public posse id "${publicId}".`)
  }
  return Number(suffix)
}

const parsedPosses = publicPossesLiteSchema.parse(publicPossesLite).records.map(
  (posse): Posse => ({
    id: posse.id,
    index: getPosseIndex(posse.id),
    name: posse.name,
    realm: posse.realm,
    isFadedLegacy: posse.realm === 'FADED_LEGACY',
    awakenerName: compatPosseByPublicId.get(posse.id)?.awakenerName,
  }),
)

export function getPosses(): Posse[] {
  return parsedPosses
}
