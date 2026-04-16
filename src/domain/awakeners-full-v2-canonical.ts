import {getAwakenerEnlightens} from './awakener-enlightens'
import {getAwakenerKits} from './awakener-kits'
import {getAwakenerRoster} from './awakener-roster'
import {getAwakenerSkills} from './awakener-skills'
import {getAwakenerTalents} from './awakener-talents'
import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {compileAwakenersFullV2} from './awakeners-full-v2-compiler'
import {getDerivedSkills} from './derived-skills'

export function compileCanonicalAwakenersFullV2(): AwakenerFullV2Record[] {
  return compileAwakenersFullV2({
    roster: getAwakenerRoster(),
    kits: getAwakenerKits(),
    skills: getAwakenerSkills(),
    talents: getAwakenerTalents(),
    enlightens: getAwakenerEnlightens(),
    derivedSkills: getDerivedSkills(),
  })
}
