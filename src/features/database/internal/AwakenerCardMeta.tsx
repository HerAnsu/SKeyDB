import {FaCaretRight} from 'react-icons/fa6'

import type {AwakenerCardMetaData} from './awakener-card-meta-model'

function ScalingMeta({meta}: {meta: Extract<AwakenerCardMetaData, {kind: 'scaling'}>}) {
  return (
    <span aria-label={meta.ariaLabel} className='database-card-meta database-card-meta--scaling'>
      <span aria-hidden='true' className='database-card-meta__label'>
        Substats
      </span>
      <span aria-hidden='true' className='database-card-meta__scaling-flow'>
        {meta.entries.map((entry, index) => (
          <span className='database-card-meta__scaling-entry' key={`${entry.role}-${entry.key}`}>
            {index > 0 ? <FaCaretRight aria-hidden className='database-card-meta__caret' /> : null}
            <span
              className='database-card-meta__icon-wrap'
              title={`${entry.roleLabel} scaling: ${entry.label}`}
            >
              {entry.icon ? (
                <img
                  alt=''
                  className='database-card-meta__icon'
                  draggable={false}
                  src={entry.icon}
                />
              ) : null}
            </span>
          </span>
        ))}
      </span>
    </span>
  )
}

function TextMeta({label}: {label: string}) {
  return (
    <span className='database-card-meta database-card-meta--text' title={label}>
      {label}
    </span>
  )
}

export function AwakenerCardMeta({meta}: {meta: AwakenerCardMetaData}) {
  if (meta.kind === 'scaling') {
    return <ScalingMeta meta={meta} />
  }
  return <TextMeta label={meta.label} />
}
