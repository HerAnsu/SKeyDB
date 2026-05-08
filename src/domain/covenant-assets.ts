import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'

const covenantIconAssets = import.meta.glob<string>('../assets/covenants/Icon/*.webp', {
  eager: true,
  import: 'default',
})
const covenantFullArtAssets = import.meta.glob<string>('../assets/covenants/FullArt/*.webp', {
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
const covenantFullArtAssetByAssetId = new Map(
  Object.entries(covenantFullArtAssets).map(([assetPath, url]) => [
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

function getCovenantAssetFileStem(covenantId: string): string | undefined {
  const assetIndexId = resolvePublicEntityAsset(covenantId, 'icon')
  if (!assetIndexId) {
    return undefined
  }

  const publicAssetId = resolvePublicAsset(assetIndexId)?.assetId
  return publicAssetId ? iconFileStemFromPublicAssetId(publicAssetId) : undefined
}

export function getCovenantAssetById(covenantId: string): string | undefined {
  const assetId = getCovenantAssetFileStem(covenantId)
  return assetId ? covenantIconAssetByAssetId.get(assetId) : undefined
}

export function getCovenantFullArtAssetById(covenantId: string): string | undefined {
  const assetId = getCovenantAssetFileStem(covenantId)
  return assetId ? covenantFullArtAssetByAssetId.get(assetId) : undefined
}
