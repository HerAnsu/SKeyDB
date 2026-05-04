import publicPossesFull from '@/data/public-v2/full/posses.json'

import type {DescriptionArg} from './awakener-source-schema'

export interface PosseFullV2Record {
  id: string
  name: string
  realm: string
  assetId: string
  assetCrystalId?: string
  assetBadgeId?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
  lore?: string
}

interface PublicPosseEnvelope {
  records: PosseFullV2Record[]
}

let possesFullV2Cache: PosseFullV2Record[] | null = null

export function getPossesFullV2(): PosseFullV2Record[] {
  if (possesFullV2Cache) {
    return possesFullV2Cache
  }

  possesFullV2Cache = (publicPossesFull as PublicPosseEnvelope).records
  return possesFullV2Cache
}

export function getPosseFullV2ById(
  posseId: string,
  records: PosseFullV2Record[],
): PosseFullV2Record | undefined {
  return records.find((record) => record.id === posseId)
}
