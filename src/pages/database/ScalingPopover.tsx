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

  const isMultiColumn = values.length > 3

  return (
    <div
      className='w-max border border-slate-700/60 bg-slate-950/[.98] p-[0.6em] shadow-[0_12px_32px_rgba(0,0,0,0.8)]'
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
      <div className='mb-[0.5em] flex items-start justify-between gap-[1em]'>
        <h3
          className={`${DATABASE_ENTRY_TITLE_CLASS} text-[1.05em] font-semibold tracking-tight text-amber-200`}
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
          className='-mt-[0.1em] -mr-[0.1em] text-slate-400 transition-colors hover:text-white'
          onClick={onClose}
        >
          <FaXmark size='1.1em' />
        </button>
      </div>

      <div className={`flex tabular-nums ${isMultiColumn ? 'divide-x divide-slate-700/50' : ''}`}>
        {(isMultiColumn ? [0, 1] : [0]).map((col) => {
          const itemsPerCol = isMultiColumn ? Math.ceil(values.length / 2) : values.length
          const colItems = values.slice(col * itemsPerCol, (col + 1) * itemsPerCol)

          if (colItems.length === 0) return null

          return (
            <div
              className={`flex flex-col gap-y-[0.1em] ${
                isMultiColumn ? (col === 0 ? 'pr-[0.8em]' : 'pl-[0.8em]') : ''
              }`}
              key={col}
            >
              {colItems.map((v, i) => {
                const globalIdx = col * itemsPerCol + i
                const computed = computeStatValue(v, suffix, stat, stats)
                const isCurrent = globalIdx + 1 === currentLevel

                return (
                  <div
                    className={`-mx-[0.3em] flex items-center gap-x-[0.8em] rounded-[0.3em] px-[0.3em] py-[0.1em] transition-colors duration-200 ${
                      isCurrent ? 'bg-amber-400/10' : 'hover:bg-white/5'
                    }`}
                    key={globalIdx}
                  >
                    <span className='w-[2em] shrink-0 text-[0.8em] font-medium tracking-tighter text-slate-500'>
                      Lv.{globalIdx + 1}
                    </span>

                    <div className='flex flex-1 items-center justify-end gap-x-[0.4em]'>
                      {computed !== null ? (
                        <div className='flex items-center gap-x-[0.4em]'>
                          <span className='min-w-[1.8em] text-right text-[1.05em] font-bold text-amber-100'>
                            {computed}
                          </span>
                          <span className='text-[0.8em] font-bold text-slate-700'>|</span>
                          <span className='min-w-[2.8em] text-left text-[0.8em] font-medium text-slate-500'>
                            {fmtNum(v)}
                            {suffix}
                          </span>
                        </div>
                      ) : (
                        <span className='min-w-[2.8em] text-right text-[1em] font-semibold text-amber-100/90'>
                          {fmtNum(v)}
                          {suffix}
                        </span>
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
