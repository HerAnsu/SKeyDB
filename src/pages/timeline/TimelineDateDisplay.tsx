import {Fragment} from 'react'

interface TimelineDateDisplayProps {
  className?: string
  text: string
  title?: string
}

export function TimelineDateDisplay({className = '', text, title}: TimelineDateDisplayProps) {
  const parts = text.split(' · ')

  if (parts.length < 2) {
    return (
      <span className={className} title={title}>
        {text}
      </span>
    )
  }

  return (
    <span
      aria-label={text}
      className={`timeline-date-display timeline-date-display--responsive ${className}`}
      title={title}
    >
      <span aria-hidden className='timeline-date-display__visual'>
        {parts.map((part, index) => (
          <Fragment key={`${part}-${index.toString()}`}>
            {index > 0 ? <span className='timeline-date-display__separator'> · </span> : null}
            <span className='timeline-date-display__part'>{part}</span>
          </Fragment>
        ))}
      </span>
    </span>
  )
}
