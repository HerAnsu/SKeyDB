import publicWheelsLite from '@/data/public-v2/lite/wheels.json'

const wheelAssets = import.meta.glob<string>('../assets/wheels/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const wheelAssetByAssetId = new Map(
  Object.entries(wheelAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

const wheelAssetIdById = new Map(
  publicWheelsLite.records.map((wheel) => [wheel.id, wheel.assetId] as const),
)

export function getWheelAssetById(wheelId: string): string | undefined {
  const assetId = wheelAssetIdById.get(wheelId) ?? `Weapon_Full_${wheelId}`
  return wheelAssetByAssetId.get(assetId)
}
