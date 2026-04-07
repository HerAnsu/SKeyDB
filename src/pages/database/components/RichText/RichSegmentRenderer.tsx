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
  DATABASE_INLINE_TOKEN_BUTTON_STYLE,
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseRealmTint,
} from '../../utils/text-styles'

type RichSegmentRendererProps = Readonly<{
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
}>

type RichSkillSegmentProps = Readonly<{
  segment: SkillSegment
  onSkillClick?: (name: string, event: React.MouseEvent) => void
}>

type RichMechanicSegmentProps = Readonly<{
  segment: MechanicSegment
  onMechanicClick?: (tag: Tag, event: React.MouseEvent) => void
}>

type RichScalingSegmentProps = Readonly<{
  segment: ScalingSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: React.MouseEvent,
  ) => void
}>

const INDENT_MARKER = '\u2022'

export function RichSegmentRenderer(props: RichSegmentRendererProps) {
  const {segment} = props

  switch (segment.type) {
    case 'text':
      return <>{segment.value}</>
    case 'skill':
      return <RichSkillSegment onSkillClick={props.onSkillClick} segment={segment} />
    case 'stat':
      return <RichStatSegment segment={segment} />
    case 'mechanic':
      return <RichMechanicSegment onMechanicClick={props.onMechanicClick} segment={segment} />
    case 'realm': {
      const tint = getDatabaseRealmTint(segment.name)
      return (
        <span className='inline font-semibold whitespace-nowrap' style={{color: tint}}>
          {segment.name}
        </span>
      )
    }
    case 'scaling':
      return (
        <RichScalingSegment
          onScalingClick={props.onScalingClick}
          segment={segment}
          skillLevel={props.skillLevel}
          stats={props.stats}
          variant={props.variant}
        />
      )
    case 'newline':
      return <br />
    case 'paragraph':
      return <span className='block h-1' aria-hidden='true' />
    case 'line': {
      const lineClassName = segment.indented ? 'relative pl-5 leading-normal' : 'leading-normal'
      const keyCounts = new Map<string, number>()
      return (
        <div className={lineClassName}>
          {segment.indented ? (
            <span className='absolute top-[0.41em] left-1.5 text-[0.8em] text-slate-500/60 select-none'>
              {INDENT_MARKER}
            </span>
          ) : null}
          {segment.segments.map((childSegment) => (
            <RichSegmentRenderer
              key={nextSegmentKey(keyCounts, childSegment)}
              {...props}
              segment={childSegment}
            />
          ))}
        </div>
      )
    }
    case 'indent':
      return (
        <span className='relative top-[-0.1em] mr-1.5 ml-1 inline text-[0.8em] text-slate-500/60 select-none'>
          {INDENT_MARKER}
        </span>
      )
    default:
      return null
  }
}

function RichSkillSegment({segment, onSkillClick}: RichSkillSegmentProps) {
  if (onSkillClick === undefined) {
    return (
      <span className='inline font-bold whitespace-nowrap text-amber-200/90'>{segment.name}</span>
    )
  }

  return (
    <button
      className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap`}
      onClick={(event) => {
        onSkillClick(segment.name, event)
      }}
      style={DATABASE_INLINE_TOKEN_BUTTON_STYLE}
      type='button'
    >
      {segment.name}
    </button>
  )
}

function RichStatSegment({segment}: Readonly<{segment: StatSegment}>) {
  return (
    <span className={`${DATABASE_STAT_TOKEN_CLASS} inline font-bold whitespace-nowrap`}>
      {segment.name}
    </span>
  )
}

function RichMechanicSegment({segment, onMechanicClick}: RichMechanicSegmentProps) {
  const tag = resolveTag(segment.name)
  const hasIcon = tag?.iconId && getTagIcon(tag.iconId)
  const color = tag ? getTagColor(tag) : undefined

  if (!hasTagDescription(tag) || onMechanicClick === undefined) {
    return (
      <span
        className={`${DATABASE_UNIMPLEMENTED_TOKEN_CLASS} font-bold whitespace-nowrap`}
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

  return (
    <button
      className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap`}
      onClick={(event) => {
        onMechanicClick(tag, event)
      }}
      style={{...DATABASE_INLINE_TOKEN_BUTTON_STYLE, color: color ?? undefined}}
      type='button'
    >
      {hasIcon ? (
        <img
          alt=''
          className='mr-[2px] !inline-block h-[0.9em] w-auto shrink-0 align-[-0.1em]'
          src={getTagIcon(tag.iconId)}
        />
      ) : null}
      <span className='inline'>{segment.name}</span>
    </button>
  )
}

function getTagColor(tag: Tag): string | undefined {
  return tag.tint
}

function hasTagDescription(tag: Tag | null): tag is Tag {
  return typeof tag?.description === 'string' && tag.description.trim().length > 0
}

function RichScalingSegment({
  segment,
  skillLevel,
  stats,
  variant,
  onScalingClick,
}: RichScalingSegmentProps) {
  const {values, suffix, stat} = segment
  const isInteractive = onScalingClick !== undefined

  if (variant === 'popover') {
    const display = formatScalingRange(values, suffix)
    const computed = computeStatRange(values, suffix, stat, stats)
    const popoverContent = computed ?? (
      <>
        {display}
        {stat ? ` ${stat}` : ''}
      </>
    )

    if (!isInteractive) {
      return (
        <span
          className={`${DATABASE_POPOVER_SCALING_TOKEN_CLASS} inline font-bold whitespace-nowrap text-amber-200/90`}
        >
          {popoverContent}
        </span>
      )
    }

    return (
      <button
        className={`${DATABASE_SCALING_TOKEN_CLASS} cursor-help appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap text-amber-200/90`}
        onClick={(event) => {
          onScalingClick(values, suffix, stat, event)
        }}
        style={DATABASE_INLINE_TOKEN_BUTTON_STYLE}
        title={buildScalingHover(values, suffix, stat, stats)}
        type='button'
      >
        {popoverContent}
      </button>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, values.length - 1))
  const value = values[idx]
  const displayValue = fmtNum(value)
  const computedValue = computeStatValue(value, suffix, stat, stats)
  const hoverText = buildScalingHover(values, suffix, stat, stats)
  const fallbackValue = `${displayValue}${suffix}`
  const content = computedValue ?? fallbackValue
  const statSuffix = stat && computedValue === null ? ` ${stat}` : ''

  if (!isInteractive) {
    return (
      <span
        className={`${DATABASE_SCALING_TOKEN_CLASS} font-bold whitespace-nowrap`}
        title={hoverText}
      >
        {content}
        {statSuffix}
      </span>
    )
  }

  return (
    <button
      className={`${DATABASE_SCALING_TOKEN_CLASS} m-0 cursor-help appearance-none border-0 bg-transparent p-0 font-bold whitespace-nowrap`}
      onClick={(event) => {
        onScalingClick(values, suffix, stat, event)
      }}
      style={DATABASE_INLINE_TOKEN_BUTTON_STYLE}
      title={hoverText}
      type='button'
    >
      {content}
      {statSuffix}
    </button>
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
    .map((value, index) => {
      const computed = computeStatValue(value, suffix, stat, stats)
      const base = `${String(value)}${suffix}`
      const resolvedValue = computed === null ? '' : ` = ${String(computed)}`
      return `Lv${String(index + 1)}: ${base}${resolvedValue}`
    })
    .join('\n')
}

function nextSegmentKey(keyCounts: Map<string, number>, segment: RichSegment): string {
  const baseKey = segmentKeyBase(segment)
  const occurrence = keyCounts.get(baseKey) ?? 0
  keyCounts.set(baseKey, occurrence + 1)
  return `${baseKey}:${String(occurrence)}`
}

function segmentKeyBase(segment: RichSegment): string {
  switch (segment.type) {
    case 'text':
      return `text:${segment.value}`
    case 'skill':
      return `skill:${segment.name}`
    case 'stat':
      return `stat:${segment.name}`
    case 'mechanic':
      return `mechanic:${segment.name}`
    case 'realm':
      return `realm:${segment.name}`
    case 'scaling':
      return `scaling:${segment.stat ?? 'none'}:${segment.suffix}:${segment.values.join(',')}`
    case 'newline':
      return 'newline'
    case 'paragraph':
      return 'paragraph'
    case 'indent':
      return 'indent'
    case 'line':
      return `line:${segment.indented ? 'indented' : 'plain'}:${segment.segments.map(segmentKeyBase).join('|')}`
    default:
      return 'unknown'
  }
}
