export function getOrCreateMapValue<TKey, TValue>(
  cache: Map<TKey, TValue>,
  key: TKey,
  createValue: () => TValue,
): TValue {
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }

  const value = createValue()
  cache.set(key, value)
  return value
}
