import icon001 from '@/assets/icons/UI_Battle_White_Buff_001.png'
import icon002 from '@/assets/icons/UI_Battle_White_Buff_002.png'
import icon003 from '@/assets/icons/UI_Battle_White_Buff_003.png'
import icon004 from '@/assets/icons/UI_Battle_White_Buff_004.png'
import icon005 from '@/assets/icons/UI_Battle_White_Buff_005.png'
import icon006 from '@/assets/icons/UI_Battle_White_Buff_006.png'
import icon007 from '@/assets/icons/UI_Battle_White_Buff_007.png'
import icon008 from '@/assets/icons/UI_Battle_White_Buff_008.png'
import icon009 from '@/assets/icons/UI_Battle_White_Buff_009.png'
import icon010 from '@/assets/icons/UI_Battle_White_Buff_010.png'
import icon011 from '@/assets/icons/UI_Battle_White_Buff_011.png'

import {getMainstatByKey, type MainstatKey} from './mainstats-catalog'

export {
  MAINSTAT_KEYS,
  WHEEL_MAINSTAT_KEYS,
  getMainstatByKey,
  getMainstats,
  getWheelFilterMainstats,
  normalizeMainstatLabel,
  type Mainstat,
  type MainstatKey,
  type WheelMainstatKey,
} from './mainstats-catalog'

const MAINSTAT_ICON_BY_ID: Record<string, string> = {
  '001': icon001,
  '002': icon002,
  '003': icon003,
  '004': icon004,
  '005': icon005,
  '006': icon006,
  '007': icon007,
  '008': icon008,
  '009': icon009,
  '010': icon010,
  '011': icon011,
}

export function getMainstatIcon(key: MainstatKey): string | undefined {
  const mainstat = getMainstatByKey(key)
  return mainstat ? MAINSTAT_ICON_BY_ID[mainstat.iconId] : undefined
}

export {MAINSTAT_ICON_BY_ID}
