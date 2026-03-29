import type {MouseEvent} from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {RichSegment, ScalingSegment} from '@/domain/rich-text'
import {
  buildScalingHover,
  computeStatRange,
  computeStatValue,
  fmtNum,
  formatScalingRange,
} from '@/domain/scaling'
import {getTagColor, getTagIcon, resolveTag, type Tag} from '@/domain/tags'

import {renderTextWithBreaks} from './font-scale'
import {
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_STAT_TOKEN_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseRealmTint,
} from './text-styles'

type RichSegmentRendererVariant = 'inline' | 'popover'

interface RichSegmentRendererProps {
  segment: RichSegment
  variant: RichSegmentRendererVariant
  skillLevel: number
  stats: AwakenerFullStats | null
  onSkillClick?: (name: string, event: MouseEvent<HTMLButtonElement>) => void
  onMechanicClick?: (tag: Tag, event: MouseEvent<HTMLButtonElement>) => void
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: MouseEvent<HTMLButtonElement>,
  ) => void
}

interface RichScalingSegmentProps {
  segment: ScalingSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: RichSegmentRendererVariant
}

export function RichSegmentRenderer({
  segment,
  variant,
  skillLevel,
  stats,
  onSkillClick,
  onMechanicClick,
  onScalingClick,
}: RichSegmentRendererProps) {
  switch (segment.type) {
    case 'text':
      return <>{renderTextWithBreaks(segment.value)}</>

    case 'skill':
      if (!onSkillClick) {
        return <span>{segment.name}</span>
      }
      return (
        <button
          className={DATABASE_INTERACTIVE_TOKEN_CLASS}
          onClick={(event) => {
            onSkillClick(segment.name, event)
          }}
          style={{fontSize: 'inherit'}}
          type='button'
        >
          {segment.name}
        </button>
      )

    case 'stat':
      return (
        <span
          className={
            variant === 'popover' ? DATABASE_POPOVER_STAT_TOKEN_CLASS : DATABASE_STAT_TOKEN_CLASS
          }
        >
          {segment.name}
        </span>
      )

    case 'mechanic': {
      const tag = resolveTag(segment.name)
      if (tag?.description && onMechanicClick) {
        const color = getTagColor(tag)
        return (
          <button
            className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} m-0 inline-flex items-baseline gap-0.5 p-0`}
            onClick={(event) => {
              onMechanicClick(tag, event)
            }}
            style={{fontSize: 'inherit', color, background: 'transparent'}}
            type='button'
          >
            {tag.iconId && getTagIcon(tag.iconId) ? (
              <img
                alt=''
                className='h-[0.9em] w-[0.9em] self-center opacity-90'
                src={getTagIcon(tag.iconId)}
              />
            ) : null}
            <span>{segment.name}</span>
          </button>
        )
      }
      const color = tag ? getTagColor(tag) : undefined
      const hasIcon = tag?.iconId && getTagIcon(tag.iconId)

      return (
        <span
          className={`${DATABASE_UNIMPLEMENTED_TOKEN_CLASS} ${
            hasIcon ? 'inline-flex items-baseline gap-0.5' : 'inline'
          }`}
          style={{color}}
          title='Details coming soon'
        >
          {hasIcon ? (
            <img
              alt=''
              className='h-[0.85em] w-[0.85em] self-center opacity-80'
              src={getTagIcon(tag.iconId)}
            />
          ) : null}
          <span>{segment.name}</span>
        </span>
      )
    }

    case 'realm':
      return <span style={{color: getDatabaseRealmTint(segment.name)}}>{segment.name}</span>

    case 'scaling':
      return (
        <RichScalingSegment
          onScalingClick={onScalingClick}
          segment={segment}
          skillLevel={skillLevel}
          stats={stats}
          variant={variant}
        />
      )
  }
}

interface RichScalingSegmentWrapperProps extends RichScalingSegmentProps {
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: MouseEvent<HTMLButtonElement>,
  ) => void
}

function RichScalingSegment({
  segment,
  skillLevel,
  stats,
  variant,
  onScalingClick,
}: RichScalingSegmentWrapperProps) {
  if (variant === 'popover') {
    const {values, suffix, stat} = segment
    const display = formatScalingRange(values, suffix)
    const computed = computeStatRange(values, suffix, stat, stats)
    if (computed) {
      return (
        <span>
          <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>{computed}</span>
          <span className='text-slate-500'>
            {' '}
            ({display}
            {stat ? ` ${stat}` : ''})
          </span>
        </span>
      )
    }
    return (
      <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>
        {display}
        {stat ? (
          <>
            {' '}
            <span className={DATABASE_POPOVER_STAT_TOKEN_CLASS}>{stat}</span>
          </>
        ) : null}
      </span>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, segment.values.length - 1))
  const value = segment.values[idx]
  const displayValue = fmtNum(value)
  const computed = computeStatValue(value, segment.suffix, segment.stat, stats)

  if (onScalingClick) {
    return (
      <button
        className={`${DATABASE_SCALING_TOKEN_CLASS} m-0 inline-block p-0 align-baseline`}
        onClick={(event) => {
          onScalingClick(segment.values, segment.suffix, segment.stat, event)
        }}
        style={{
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontWeight: 'inherit',
          background: 'transparent',
          lineHeight: '1.2',
        }}
        type='button'
      >
        {computed !== null ? (
          <span>{computed}</span>
        ) : (
          <span>
            {displayValue}
            {segment.suffix}
          </span>
        )}
      </button>
    )
  }

  const hoverText = buildScalingHover(segment.values, segment.suffix, segment.stat, stats)

  if (computed !== null) {
    return (
      <span className={DATABASE_SCALING_TOKEN_CLASS} title={hoverText}>
        <span>{computed}</span>
        <span className='ml-1 text-slate-500'>
          ({displayValue}
          {segment.suffix}
          {segment.stat ? ` ${segment.stat}` : ''})
        </span>
      </span>
    )
  }

  return (
    <span className={DATABASE_SCALING_TOKEN_CLASS} title={hoverText}>
      {displayValue}
      {segment.suffix}
    </span>
  )
}
