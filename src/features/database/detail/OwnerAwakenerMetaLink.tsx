import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {
  DATABASE_DETAIL_META_LINK_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
} from '../internal/database-detail-typography'

interface OwnerAwakenerMetaLinkProps {
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
}

export function OwnerAwakenerMetaLink({
  ownerAwakenerId,
  ownerAwakenerName,
  onSelectAwakener,
}: OwnerAwakenerMetaLinkProps) {
  if (!ownerAwakenerId || !ownerAwakenerName) {
    return null
  }

  return (
    <>
      <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
      <button
        className={DATABASE_DETAIL_META_LINK_CLASS}
        onClick={() => {
          onSelectAwakener?.({id: ownerAwakenerId, name: ownerAwakenerName}, 'overview')
        }}
        type='button'
      >
        {formatAwakenerNameForUi(ownerAwakenerName)}
      </button>
    </>
  )
}
