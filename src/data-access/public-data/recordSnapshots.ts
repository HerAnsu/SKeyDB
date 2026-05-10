import type {PublicRecord} from './contract'
import {loadPublicRecord} from './recordRepository'
import {assertPublicScopeCapability, type SnapshotPublicDataScope} from './scopeRegistry'

export function getPublicRecordSnapshot(
  scope: SnapshotPublicDataScope,
  id: string,
): Promise<PublicRecord | undefined> {
  assertPublicScopeCapability(scope, 'snapshot')
  return loadPublicRecord(scope, id)
}
