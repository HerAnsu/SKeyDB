import gameplayMathMetadataJson from '@/data/public-v3/metadata/gameplay-math.json'

let gameplayMathMetadataCache: Record<string, unknown> | undefined

export function getPublicGameplayMathMetadata(): Record<string, unknown> {
  gameplayMathMetadataCache ??= gameplayMathMetadataJson as Record<string, unknown>
  return gameplayMathMetadataCache
}
