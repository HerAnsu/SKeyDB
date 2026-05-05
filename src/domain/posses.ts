import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicV3PosseCatalogRecordSchema = z
  .object({
    id: z.string().regex(/^posse-\d{4}$/),
    name: nonEmptyStringSchema,
    realm: nonEmptyStringSchema,
    lineupToken: nonEmptyStringSchema,
  })
  .loose()

export interface Posse {
  id: string
  index: number
  name: string
  realm: string
  isFadedLegacy: boolean
  lineupToken: string
}

function getPosseIndex(publicId: string): number {
  const suffix = /^posse-(\d{4})$/.exec(publicId)?.[1]
  if (!suffix) {
    throw new Error(`Cannot derive index from public posse id "${publicId}".`)
  }
  return Number(suffix)
}

const parsedPosses = getPublicCatalogRecords('posses')
  .map((record) => publicV3PosseCatalogRecordSchema.parse(record))
  .map(
    (posse): Posse => ({
      id: posse.id,
      index: getPosseIndex(posse.id),
      name: posse.name,
      realm: posse.realm,
      isFadedLegacy: posse.realm === 'FADED_LEGACY',
      lineupToken: posse.lineupToken,
    }),
  )

export function getPosses(): Posse[] {
  return parsedPosses
}
