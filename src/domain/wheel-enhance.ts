const MAX_WHEEL_ENHANCE_LEVEL = 15

export function clampWheelEnhanceLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 0
  }

  return Math.min(MAX_WHEEL_ENHANCE_LEVEL, Math.max(0, Math.floor(level)))
}

export function resolveWheelDescriptionRank(enhanceLevel: number): number {
  const normalizedLevel = clampWheelEnhanceLevel(enhanceLevel)

  if (normalizedLevel === 0) {
    return 1
  }
  if (normalizedLevel === 1) {
    return 2
  }
  if (normalizedLevel === 2) {
    return 3
  }

  return 4
}

export function getWheelEnhanceDiamondCount(enhanceLevel: number): number {
  return Math.min(3, clampWheelEnhanceLevel(enhanceLevel))
}

export function getWheelEnhancePlusLevel(enhanceLevel: number): number {
  return Math.max(0, clampWheelEnhanceLevel(enhanceLevel) - 3)
}
