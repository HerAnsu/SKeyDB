export const AWAKENER_TEXT_COLOR_BY_NAME = {
  shield: '#76AAC6',
  damage: '#BB636D',
  heal: '#71AA86',
  aliemus: '#B6AD65',
  affliction: '#AF6AAF',
  misc: '#C38662',
  light: '#FEFEFD',
} as const

export const AWAKENER_TEXT_COLOR_NAMES = Object.keys(AWAKENER_TEXT_COLOR_BY_NAME) as [
  keyof typeof AWAKENER_TEXT_COLOR_BY_NAME,
  ...(keyof typeof AWAKENER_TEXT_COLOR_BY_NAME)[],
]

export type AwakenerTextColorName = keyof typeof AWAKENER_TEXT_COLOR_BY_NAME

export const DEFAULT_AWAKENER_OVERLAY_TEXT_COLOR: AwakenerTextColorName = 'misc'

const INTERACTIVE_HOVER_BRIGHTEN_FACTOR = 0.26
const INTERACTIVE_UNDERLINE_DARKEN_FACTOR = 0.35

export const DESCRIPTION_ARG_TEXT_COLOR_BY_CHANNEL: Partial<Record<string, AwakenerTextColorName>> =
  {
    Block: 'shield',
    Damage: 'damage',
    Energy: 'aliemus',
    Heal: 'heal',
  }

export function getAwakenerTextColor(name: AwakenerTextColorName): string {
  return AWAKENER_TEXT_COLOR_BY_NAME[name]
}

function clampRgbChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function brightenInteractiveTint(
  hex: string,
  factor = INTERACTIVE_HOVER_BRIGHTEN_FACTOR,
): string {
  const normalized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex
  }

  const channel = (index: number) => Number.parseInt(normalized.slice(index, index + 2), 16)
  const brighten = (value: number) => clampRgbChannel(value + (255 - value) * factor)

  return `#${[brighten(channel(0)), brighten(channel(2)), brighten(channel(4))]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

export function darkenInteractiveTint(
  hex: string,
  factor = INTERACTIVE_UNDERLINE_DARKEN_FACTOR,
): string {
  const normalized = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hex
  }

  const channel = (index: number) => Number.parseInt(normalized.slice(index, index + 2), 16)
  const darken = (value: number) => clampRgbChannel(value * (1 - factor))

  return `#${[darken(channel(0)), darken(channel(2)), darken(channel(4))]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`
}

export function getAwakenerTextHoverColor(name: AwakenerTextColorName): string {
  return brightenInteractiveTint(getAwakenerTextColor(name))
}

export function getAwakenerTextUnderlineColor(name: AwakenerTextColorName): string {
  return darkenInteractiveTint(getAwakenerTextColor(name))
}
