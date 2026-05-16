export const DESCRIPTION_ARG_KEY_PATTERN = String.raw`(?:StateArg|DescArg|Arg)\d+|[A-Za-z][A-Za-z0-9_]*`

const DESCRIPTION_ARG_TOKEN_PATTERN_SOURCE = String.raw`\[(?:(?<channel>[A-Za-z]+|\{[^}\]]+\}):)?(?<argKey>${DESCRIPTION_ARG_KEY_PATTERN})\]`
const PLURAL_MACRO_PATTERN_SOURCE = String.raw`\{plural:(?<argToken>${DESCRIPTION_ARG_TOKEN_PATTERN_SOURCE})\|(?<singular>[^|{}]+)\|(?<plural>[^{}]+)\}`
const ORDINAL_MACRO_PATTERN_SOURCE = String.raw`\{ordinal:(?<value>[^{}]+)\}`

const DESCRIPTION_ARG_TOKEN_EXTRACT_PATTERN = createDescriptionArgTokenPattern()

export interface DescriptionArgTokenParts {
  argKey: string
  channel: string | null
}

export function createDescriptionArgTokenPattern(flags = ''): RegExp {
  return new RegExp(DESCRIPTION_ARG_TOKEN_PATTERN_SOURCE, flags)
}

export function createPluralMacroPattern(flags = ''): RegExp {
  return new RegExp(PLURAL_MACRO_PATTERN_SOURCE, flags)
}

export function createOrdinalMacroPattern(flags = ''): RegExp {
  return new RegExp(ORDINAL_MACRO_PATTERN_SOURCE, flags)
}

export function normalizeDescriptionArgChannel(channel: string | undefined): string | null {
  if (!channel) {
    return null
  }

  return channel.startsWith('{') && channel.endsWith('}') ? channel.slice(1, -1).trim() : channel
}

export function extractDescriptionArgToken(token: string): DescriptionArgTokenParts | null {
  const match = DESCRIPTION_ARG_TOKEN_EXTRACT_PATTERN.exec(token)
  if (match?.index !== 0 || match[0] !== token) {
    return null
  }

  const argKey = match.groups?.argKey
  if (!argKey) {
    return null
  }

  return {
    argKey,
    channel: normalizeDescriptionArgChannel(match.groups?.channel),
  }
}
