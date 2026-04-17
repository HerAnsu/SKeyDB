import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {computeStatValue, fmtNum} from '@/domain/scaling'

import type {PopoverHeaderModel} from '../core/popover-header-model'
import {PopoverContent, PopoverShell} from '../core/PopoverShell'

type ScalingPopoverProps = Readonly<{
  values: number[]
  suffix: string
  stat: string | null
  stats: AwakenerFullStats | null
  currentLevel?: number
  levelLabelPrefix?: string
  levelStart?: number
  onClose: () => void
  depth?: number
  totalDepth?: number
  onBack?: () => void
}>

export function ScalingPopover({
  values,
  suffix,
  stat,
  stats,
  currentLevel,
  levelLabelPrefix = 'Lv.',
  levelStart = 1,
  onClose,
  depth,
  totalDepth,
  onBack,
}: ScalingPopoverProps) {
  const usesCustomLevelLabels = levelLabelPrefix !== 'Lv.' || levelStart !== 1
  const getStatColor = (statName: string | null) => {
    if (statName === null) return 'text-amber-200'
    const upperName = statName.toUpperCase()
    if (upperName.includes('ATK')) return 'text-red-400'
    if (upperName.includes('CON')) return 'text-green-400'
    if (upperName.includes('DEF')) return 'text-blue-400'
    return 'text-amber-200'
  }

  const isMultiColumn = values.length > 3
  const columns = isMultiColumn ? [0, 1] : [0]
  const header: PopoverHeaderModel = stat
    ? {
        accent: 'Scaling',
        accentClassName: 'font-semibold tracking-tight text-amber-200',
        accentStyle: {
          fontSize: 'calc(var(--desc-font-scale, 1) * 12px)',
        },
        title: <span className={getStatColor(stat)}>{stat}</span>,
        titleClassName: 'font-semibold tracking-tight',
        titleStyle: {
          fontSize: 'calc(var(--desc-font-scale, 1) * 12px)',
        },
      }
    : {
        title: 'Lvl Scaling',
        titleClassName: 'font-semibold tracking-tight text-amber-200',
        titleStyle: {
          fontSize: 'calc(var(--desc-font-scale, 1) * 12px)',
        },
      }

  const depthIndicator =
    totalDepth && totalDepth > 1 ? `Step ${String(depth)} of ${String(totalDepth)}` : undefined

  return (
    <PopoverShell depthIndicator={depthIndicator} header={header} onBack={onBack} onClose={onClose}>
      <PopoverContent>
        <div
          className={`flex tabular-nums ${
            isMultiColumn
              ? usesCustomLevelLabels
                ? 'gap-x-[0.9em]'
                : 'divide-x divide-slate-700/50'
              : ''
          }`}
        >
          {columns.map((col) => {
            const itemsPerCol = isMultiColumn ? Math.ceil(values.length / 2) : values.length
            const colItems = values.slice(col * itemsPerCol, (col + 1) * itemsPerCol)

            if (colItems.length === 0) return null

            const columnClassName = usesCustomLevelLabels
              ? 'flex min-w-0 flex-1 flex-col gap-y-[0.15em]'
              : !isMultiColumn
                ? 'flex min-w-0 flex-col gap-y-[0.1em]'
                : col === 0
                  ? 'flex min-w-0 flex-1 flex-col gap-y-[0.1em] pr-[0.8em]'
                  : 'flex min-w-0 flex-1 flex-col gap-y-[0.1em] pl-[0.8em]'

            return (
              <div className={columnClassName} key={`column-${String(col)}`}>
                {colItems.map((value, index) => {
                  const globalIdx = col * itemsPerCol + index
                  const computed = computeStatValue(value, suffix, stat, stats)
                  const displayLevel = globalIdx + levelStart
                  const isCurrent = displayLevel === currentLevel
                  const rowClassName = usesCustomLevelLabels
                    ? isCurrent
                      ? 'grid grid-cols-[3.1em_minmax(0,1fr)] items-center gap-x-[0.7em] rounded-[0.3em] bg-amber-400/10 px-[0.45em] py-[0.22em] transition-colors duration-200'
                      : 'grid grid-cols-[3.1em_minmax(0,1fr)] items-center gap-x-[0.7em] rounded-[0.3em] px-[0.45em] py-[0.22em] transition-colors duration-200 hover:bg-white/5'
                    : isCurrent
                      ? '-mx-[0.3em] flex items-center gap-x-[0.8em] rounded-[0.3em] bg-amber-400/10 px-[0.3em] py-[0.1em] transition-colors duration-200'
                      : '-mx-[0.3em] flex items-center gap-x-[0.8em] rounded-[0.3em] px-[0.3em] py-[0.1em] transition-colors duration-200 hover:bg-white/5'

                  return (
                    <div className={rowClassName} key={`level-${String(globalIdx + 1)}`}>
                      <span
                        className={
                          usesCustomLevelLabels
                            ? 'text-[0.8em] font-medium tracking-tight text-slate-500'
                            : 'w-[2em] shrink-0 text-[0.8em] font-medium tracking-tighter text-slate-500'
                        }
                      >
                        {levelLabelPrefix}
                        {displayLevel}
                      </span>

                      <div className='flex items-center justify-end gap-x-[0.45em]'>
                        {computed === null ? (
                          <span className='inline-block min-w-[3.2em] text-right font-bold text-amber-100'>
                            {fmtNum(value)}
                            {suffix}
                          </span>
                        ) : (
                          <>
                            <span className='inline-block min-w-[2em] text-right font-bold text-amber-100'>
                              {computed}
                            </span>
                            <span className='text-[0.8em] font-bold text-slate-700'>|</span>
                            <span className='inline-block min-w-[3em] text-left text-[0.85em] font-medium text-slate-500'>
                              {fmtNum(value)}
                              {suffix}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </PopoverShell>
  )
}
