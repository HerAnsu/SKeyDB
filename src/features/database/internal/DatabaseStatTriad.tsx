import type {CSSProperties} from 'react'

import {getAwakenerTextColor, type AwakenerTextColorName} from '@/domain/awakeners-text-colors'
import {getMainstatIcon} from '@/domain/mainstats'

export interface StatTriadValues {
  CON: number
  ATK: number
  DEF: number
}

const STAT_DISPLAY = [
  {key: 'CON', colorName: 'heal'},
  {key: 'ATK', colorName: 'damage'},
  {key: 'DEF', colorName: 'shield'},
] satisfies {key: keyof StatTriadValues; colorName: AwakenerTextColorName}[]

type StatIconStyle = CSSProperties & {
  '--stat-icon-color': string
  '--stat-icon-url': string
}

/**
 * Three-cell stat row used across database browse cards. Fixed geometry keeps
 * stat positions predictable while tabular numerals align values row-to-row.
 */
export function DatabaseStatTriad({stats}: {stats: StatTriadValues}) {
  return (
    <div
      aria-label={`Stats CON ${String(stats.CON)}, ATK ${String(stats.ATK)}, DEF ${String(stats.DEF)}`}
      className='database-stat-triad'
    >
      {STAT_DISPLAY.map(({key, colorName}) => {
        const icon = getMainstatIcon(key)
        const iconStyle: StatIconStyle | null = icon
          ? {
              '--stat-icon-color': getAwakenerTextColor(colorName),
              '--stat-icon-url': `url(${icon})`,
            }
          : null
        return (
          <span key={key} className='database-stat-triad__cell'>
            {icon ? (
              <span
                aria-hidden
                className='database-stat-triad__icon'
                style={iconStyle ?? undefined}
              />
            ) : null}
            <span>{stats[key]}</span>
          </span>
        )
      })}
    </div>
  )
}
