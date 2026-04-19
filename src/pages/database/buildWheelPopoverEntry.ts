import type {DatabaseReferenceInfo} from '@/domain/awakeners-database-view'
import type {WheelDatabaseDescriptionRecord} from '@/domain/description-records'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

export function buildWheelPopoverEntry(
  info: DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>,
): KeyedDatabaseReferenceEntry {
  return {
    key: `wheel:${info.id}`,
    name: info.name,
    label: info.label,
    description: info.description,
    keywordFooterText: info.keywordFooterText,
    record: info.record,
    descriptionRank: info.descriptionRank,
    descriptionMaxRank: info.descriptionMaxRank,
    influenceBadges: info.influenceBadges,
  }
}
