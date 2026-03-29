import {FaXmark} from 'react-icons/fa6'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {computeStatValue, fmtNum} from '@/domain/scaling'

import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'

interface ScalingPopoverProps {
  values: number[]
  suffix: string
  stat: string | null
  stats: AwakenerFullStats | null
  currentLevel?: number
  onClose: () => void
}

export function ScalingPopover({
  values,
  suffix,
  stat,
  stats,
  currentLevel,
  onClose,
}: ScalingPopoverProps) {
  const getStatColor = (s: string | null) => {
    if (!s) return 'text-amber-200'
    const name = s.toUpperCase()
    if (name.includes('ATK')) return 'text-red-400'
    if (name.includes('CON')) return 'text-green-400'
    if (name.includes('DEF')) return 'text-blue-400'
    return 'text-amber-200'
  }

  return (
    <div
      className='w-max border border-slate-700/60 bg-slate-950/[.98] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.8)]'
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      style={{
        fontSize: 'calc(var(--desc-font-scale, 1) * 10px)',
      }}
    >
      <div className='mb-3 flex items-start justify-between gap-6'>
        <h3
          className={`${DATABASE_ENTRY_TITLE_CLASS} text-[1.15em] font-medium tracking-wide text-amber-200`}
        >
          {stat ? (
            <>
              <span className={getStatColor(stat)}>{stat}</span> Scaling
            </>
          ) : (
            'Lvl Scaling'
          )}
        </h3>
        <button
          className='-mt-0.5 -mr-1 text-slate-400 transition-colors hover:text-white'
          onClick={onClose}
        >
          <FaXmark size={15} />
        </button>
      </div>

      <div className='flex divide-x divide-slate-700/50 pt-1'>
        {[0, 1].map((col) => {
          const itemsPerCol = Math.ceil(values.length / 2)
          const colItems = values.slice(col * itemsPerCol, (col + 1) * itemsPerCol)

          return (
            <div className={`flex flex-col gap-y-2.5 ${col === 0 ? 'pr-4' : 'pl-4'}`} key={col}>
              {colItems.map((v, i) => {
                const globalIdx = col * itemsPerCol + i
                const computed = computeStatValue(v, suffix, stat, stats)
                const isCurrent = globalIdx + 1 === currentLevel

                return (
                  <div
                    className={`-mx-1.5 flex items-center justify-between gap-x-3 rounded px-1.5 transition-colors duration-200 ${
                      isCurrent ? 'bg-amber-400/8' : 'hover:bg-white/5'
                    }`}
                    key={globalIdx}
                  >
                    <span className='w-[2.5em] shrink-0 text-[0.85em] font-medium tracking-wide text-slate-400'>
                      Lv.{globalIdx + 1}
                    </span>

                    <div className='flex items-center justify-end gap-x-1.5'>
                      <span className='text-[1.1em] text-amber-100/85'>
                        {computed ?? fmtNum(v)}
                      </span>

                      {computed !== null && (
                        <>
                          <span className='text-[0.85em] font-bold text-slate-600'>|</span>
                          <span className='w-[2.8em] text-left text-[0.85em] font-medium text-slate-400'>
                            {fmtNum(v)}
                            {suffix}
                          </span>
                        </>
                      )}

                      {computed === null && suffix && (
                        <span className='text-[1.1em] font-bold text-amber-50'>{suffix}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
