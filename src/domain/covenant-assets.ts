import publicCovenantsLite from '@/data/public-v2/lite/covenants.json'

const covenantIconAssets = import.meta.glob<string>('../assets/covenants/Icon/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const covenantIconAssetByAssetId = new Map(
  Object.entries(covenantIconAssets).map(([assetPath, url]) => [
    basenameWithoutExt(assetPath),
    url,
  ]),
)

function iconFileStemFromPublicAssetId(publicAssetId: string): string {
  const suffix = /^covenant-icon-(\d{3})$/.exec(publicAssetId)?.[1]
  if (!suffix) {
    throw new Error(`Cannot resolve public covenant asset id "${publicAssetId}".`)
  }
  return `Icon_Trinket_${suffix}`
}

const covenantAssetIdById = new Map(
  publicCovenantsLite.records.map(
    (covenant) => [covenant.id, iconFileStemFromPublicAssetId(covenant.assetId)] as const,
  ),
)

export function getCovenantAssetById(covenantId: string): string | undefined {
  const assetId = covenantAssetIdById.get(covenantId)
  return assetId ? covenantIconAssetByAssetId.get(assetId) : undefined
}
