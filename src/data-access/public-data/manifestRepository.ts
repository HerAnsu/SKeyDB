import manifestJson from '@/data/public-v3/manifest.json'

import type {PublicManifest} from './contract'
import {publicManifestSchema} from './schemas'

let manifestCache: PublicManifest | undefined

export function getPublicManifest(): PublicManifest {
  manifestCache ??= publicManifestSchema.parse(manifestJson)
  return manifestCache
}
