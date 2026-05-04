import publicCovenantsFull from '@/data/public-v2/full/covenants.json'

import type {DescriptionArg} from './awakener-source-schema'

export interface CovenantSetEffectRecord {
  set: number
  descriptionTemplate: string
  descriptionArgs: Record<string, DescriptionArg>
}

export interface CovenantFullV2Record {
  id: string
  name: string
  assetId: string
  setEffects: CovenantSetEffectRecord[]
  lore?: string
}

interface PublicCovenantEnvelope {
  records: CovenantFullV2Record[]
}

let covenantsFullV2Cache: CovenantFullV2Record[] | null = null

export function getCovenantsFullV2(): CovenantFullV2Record[] {
  if (covenantsFullV2Cache) {
    return covenantsFullV2Cache
  }

  covenantsFullV2Cache = (publicCovenantsFull as PublicCovenantEnvelope).records
  return covenantsFullV2Cache
}
