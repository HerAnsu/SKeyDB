import publicCovenantsLite from '@/data/public-v2/lite/covenants.json'

const covenantAssets = import.meta.glob<string>('../assets/covenants/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const covenantAssetByAssetId = new Map(
  Object.entries(covenantAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

function toLegacyAssetId(publicAssetId: string): string {
  const suffix = /^covenant-icon-(\d{3})$/.exec(publicAssetId)?.[1]
  return suffix ? `Icon_Trinket_${suffix}` : publicAssetId
}

const covenantAssetIdById = new Map(
  publicCovenantsLite.records.map(
    (covenant) => [covenant.id, toLegacyAssetId(covenant.assetId)] as const,
  ),
)

export function getCovenantAssetById(covenantId: string): string | undefined {
  const assetId = covenantAssetIdById.get(covenantId) ?? `Icon_Trinket_${covenantId}`
  return covenantAssetByAssetId.get(assetId)
}
