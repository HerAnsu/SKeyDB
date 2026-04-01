import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {
  MechanicSegment,
  RichSegment,
  ScalingSegment,
  SkillSegment,
  StatSegment,
} from '@/domain/rich-text'
import {computeStatRange, computeStatValue, fmtNum, formatScalingRange} from '@/domain/scaling'
import {getTagIcon, resolveTag, type Tag} from '@/domain/tags'

import {
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseRealmTint,
} from './text-styles'

interface RichSegmentRendererProps {
  segment: RichSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
  onSkillClick?: (name: string, event: React.MouseEvent) => void
  onMechanicClick?: (tag: Tag, event: React.MouseEvent) => void
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: React.MouseEvent,
  ) => void
}

export function RichSegmentRenderer(props: RichSegmentRendererProps) {
  const {segment} = props

  switch (segment.type) {
    case 'text':
      return <>{segment.value}</>

    case 'skill':
      return <RichSkillSegment {...props} segment={segment} />

    case 'stat':
      return <RichStatSegment segment={segment} />

    case 'mechanic':
      return <RichMechanicSegment {...props} segment={segment} />

    case 'realm': {
      const tint = getDatabaseRealmTint(segment.name)
      return (
        <span className='inline font-semibold whitespace-nowrap' style={{color: tint}}>
          {segment.name}
        </span>
      )
    }
    case 'scaling':
      return <RichScalingSegment {...props} segment={segment} />

    case 'newline':
      return <br />

    case 'paragraph':
      return <span className='block h-1' aria-hidden='true' />

    case 'line':
      return (
        <div className={`${segment.indented ? 'relative pl-5' : ''} leading-normal`}>
          {segment.indented && (
            <span className='absolute top-0 left-1 text-[1.2em] text-slate-500/60 select-none'>
              ·
            </span>
          )}
          {segment.segments.map((s, idx) => (
            <RichSegmentRenderer key={idx} {...props} segment={s} />
          ))}
        </div>
      )

    case 'indent':
      return (
        <span className='mr-1.5 ml-1 inline text-[1.2em] text-slate-500/60 select-none'>·</span>
      )

    default:
      return null
  }
}

interface RichSkillSegmentProps {
  segment: SkillSegment
  onSkillClick?: (name: string, event: React.MouseEvent) => void
}

function RichSkillSegment({segment, onSkillClick}: RichSkillSegmentProps) {
  if (onSkillClick) {
    return (
      <span
        className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} inline font-semibold whitespace-nowrap`}
        onClick={(event) => {
          onSkillClick(segment.name, event)
        }}
        role='button'
        tabIndex={0}
      >
        {segment.name}
      </span>
    )
  }
  return (
    <span className='inline font-semibold whitespace-nowrap text-amber-100/85'>{segment.name}</span>
  )
}

function RichStatSegment({segment}: {segment: StatSegment}) {
  return (
    <span className={`${DATABASE_STAT_TOKEN_CLASS} inline font-semibold whitespace-nowrap`}>
      {segment.name}
    </span>
  )
}

interface RichMechanicSegmentProps {
  segment: MechanicSegment
  onMechanicClick?: (tag: Tag, event: React.MouseEvent) => void
}

function RichMechanicSegment({segment, onMechanicClick}: RichMechanicSegmentProps) {
  const tag = resolveTag(segment.name)
  const hasIcon = tag?.iconId && getTagIcon(tag.iconId)

  if (tag?.description && onMechanicClick) {
    const color = getTagColor(tag)
    return (
      <span
        className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} inline font-semibold whitespace-nowrap`}
        onClick={(event) => {
          onMechanicClick(tag, event)
        }}
        role='button'
        style={{color: color ?? undefined}}
        tabIndex={0}
      >
        {hasIcon ? (
          <img
            alt=''
            className='mr-[2px] !inline-block h-[0.9em] w-auto shrink-0 align-[-0.1em]'
            src={getTagIcon(tag.iconId)}
          />
        ) : null}
        <span className='inline'>{segment.name}</span>
      </span>
    )
  }

  const color = tag ? getTagColor(tag) : undefined

  return (
    <span
      className={`${DATABASE_UNIMPLEMENTED_TOKEN_CLASS} inline font-semibold whitespace-nowrap`}
      style={{color}}
      title='Details coming soon'
    >
      {hasIcon ? (
        <img
          alt=''
          className='mr-[2px] !inline-block h-[0.9em] w-auto shrink-0 align-[-0.12em]'
          src={getTagIcon(tag.iconId)}
        />
      ) : null}
      <span className='inline'>{segment.name}</span>
    </span>
  )
}

function getTagColor(tag: Tag): string | undefined {
  return tag.tint
}

interface RichScalingSegmentProps {
  segment: ScalingSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
}

interface RichScalingSegmentWrapperProps extends RichScalingSegmentProps {
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: React.MouseEvent,
  ) => void
}

function RichScalingSegment({
  segment,
  skillLevel,
  stats,
  variant,
  onScalingClick,
}: RichScalingSegmentWrapperProps) {
  const {values, suffix, stat} = segment
  const isInteractive = !!onScalingClick

  if (variant === 'popover') {
    const display = formatScalingRange(values, suffix)
    const computed = computeStatRange(values, suffix, stat, stats)

    return (
      <span
        className={`${DATABASE_POPOVER_SCALING_TOKEN_CLASS} inline font-semibold whitespace-nowrap text-amber-100`}
      >
        {computed ?? (
          <>
            {display}
            {stat ? ` ${stat}` : ''}
          </>
        )}
      </span>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, values.length - 1))
  const value = values[idx]
  const displayValue = fmtNum(value)
  const computedValue = computeStatValue(value, suffix, stat, stats)
  const hoverText = buildScalingHover(values, suffix, stat, stats)

  const content = <>{computedValue ?? `${displayValue}${suffix}`}</>

  if (isInteractive) {
    return (
      <span
        className={`${DATABASE_SCALING_TOKEN_CLASS} m-0 inline cursor-help p-0 font-semibold whitespace-nowrap`}
        onClick={(e) => {
          onScalingClick(values, suffix, stat, e)
        }}
        role='button'
        tabIndex={0}
        title={hoverText}
      >
        {content}
        {stat && computedValue === null ? ` ${stat}` : ''}
      </span>
    )
  }

  return (
    <span
      className={`${DATABASE_SCALING_TOKEN_CLASS} inline font-semibold whitespace-nowrap`}
      title={hoverText}
    >
      {content}
      {stat && computedValue === null ? ` ${stat}` : ''}
    </span>
  )
}

function buildScalingHover(
  values: number[],
  suffix: string,
  stat: string | null,
  stats: AwakenerFullStats | null,
): string {
  if (values.length <= 1) return ''
  return values
    .map((v, i) => {
      const computed = computeStatValue(v, suffix, stat, stats)
      const base = `${String(v)}${suffix}`
      return `Lv${String(i + 1)}: ${base}${computed !== null ? ` = ${String(computed)}` : ''}`
    })
    .join('\n')
}
