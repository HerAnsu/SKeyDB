import wheelMainstatScalingSourceJson from '../data/wheels/wheel-mainstat-scaling.json' with {type: 'json'}
import {
  WHEEL_MAINSTAT_KEYS,
  wheelMainstatScalingSourceSchema,
  type WheelMainstatScalingSeries,
  type WheelMainstatScalingSource,
} from './wheel-source-schema.ts'

const parsedWheelMainstatScaling = wheelMainstatScalingSourceSchema.parse(
  wheelMainstatScalingSourceJson,
)
const wheelMainstatSeriesByKey = new Map(
  parsedWheelMainstatScaling.series.map((series) => [series.seriesKey, series]),
)

export type WheelMainstatSeriesRarity = WheelMainstatScalingSeries['rarity']
export type WheelMainstatKey = (typeof WHEEL_MAINSTAT_KEYS)[number]

interface ParsedWheelMainstatScalar {
  numericValue: number
  suffix: string
}

function parseWheelMainstatScalar(value: string): ParsedWheelMainstatScalar {
  const trimmed = value.trim()
  const match = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid wheel mainstat scalar "${value}".`)
  }

  return {
    numericValue: Number(match[1]),
    suffix: match[2],
  }
}

function formatWheelMainstatValue(value: number, suffix: string): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
  return `${formatted}${suffix}`
}

export function getWheelMainstatScaling(): WheelMainstatScalingSource {
  return parsedWheelMainstatScaling
}

export function getWheelMainstatSeries(seriesKey: string): WheelMainstatScalingSeries | undefined {
  return wheelMainstatSeriesByKey.get(seriesKey)
}

export function buildWheelMainstatSeriesKey(
  rarity: WheelMainstatSeriesRarity,
  mainstatKey: WheelMainstatKey,
): string {
  return `${rarity}:${mainstatKey}`
}

export function resolveWheelMainstatValue(
  seriesOrKey: string | WheelMainstatScalingSeries,
  enhanceLevel: number,
): string {
  const series = typeof seriesOrKey === 'string' ? getWheelMainstatSeries(seriesOrKey) : seriesOrKey
  if (!series) {
    throw new Error(
      `Unknown wheel mainstat scaling series "${
        typeof seriesOrKey === 'string' ? seriesOrKey : seriesOrKey.seriesKey
      }".`,
    )
  }

  const baseValue = parseWheelMainstatScalar(series.baseValue)
  const perLevel = parseWheelMainstatScalar(series.perLevel)
  if (baseValue.suffix !== perLevel.suffix) {
    throw new Error(`Mismatched wheel mainstat suffixes for "${series.seriesKey}".`)
  }

  const normalizedLevel = Math.max(0, Math.floor(enhanceLevel))
  const growthSteps = Math.max(0, normalizedLevel - parsedWheelMainstatScaling.growthStartLevel + 1)

  return formatWheelMainstatValue(
    baseValue.numericValue + perLevel.numericValue * growthSteps,
    baseValue.suffix,
  )
}
