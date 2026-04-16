import {getAwakenerOverlays} from './awakener-overlays'
import {getAwakenersFullV2} from './awakeners-full-v2'
import {type AwakenerLiteV2Record} from './awakeners-lite-v2'
import {compileAwakenersLiteV2} from './awakeners-lite-v2-compiler'

export function compileCanonicalAwakenersLiteV2(): AwakenerLiteV2Record[] {
  return compileAwakenersLiteV2({
    fullRecords: getAwakenersFullV2(),
    overlayRecords: getAwakenerOverlays(),
  })
}
