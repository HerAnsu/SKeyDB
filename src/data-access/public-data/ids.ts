import type {EntityKind} from './contract'

const PUBLIC_ID_PATTERNS: Partial<Record<EntityKind, RegExp>> = {
  awakener: /^awakener-\d{4}$/,
  awakenerBuild: /^awakener-build-\d{4}$/,
  covenant: /^covenant-\d{4}$/,
  posse: /^posse-\d{4}$/,
  relic: /^relic-\d{4}$/,
  wheel: /^wheel-\d{4}$/,
}

export function isPublicEntityId(kind: EntityKind, id: string): boolean {
  const pattern = PUBLIC_ID_PATTERNS[kind]
  return pattern ? pattern.test(id) : id.trim().length > 0
}
