import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'

const posseIconAssets = import.meta.glob<string>('../assets/posse/Icon/*.webp', {
  eager: true,
  import: 'default',
})
const posseBadgeAssets = import.meta.glob<string>('../assets/posse/Badge/*.webp', {
  eager: true,
  import: 'default',
})
const posseFullArtAssets = import.meta.glob<string>('../assets/posse/FullArt/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const posseIconAssetByAssetId = new Map(
  Object.entries(posseIconAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)
const posseBadgeAssetByAssetId = new Map(
  Object.entries(posseBadgeAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)
const posseFullArtAssetByAssetId = new Map(
  Object.entries(posseFullArtAssets).map(([assetPath, url]) => [
    basenameWithoutExt(assetPath),
    url,
  ]),
)

function getPublicAssetFileStem(posseId: string, slot: string): string | undefined {
  const assetIndexId = resolvePublicEntityAsset(posseId, slot)
  return assetIndexId ? resolvePublicAsset(assetIndexId)?.assetId : undefined
}

export function getPosseAssetById(posseId: string): string | undefined {
  const assetId = getPublicAssetFileStem(posseId, 'icon')
  if (!assetId) {
    return undefined
  }
  return posseIconAssetByAssetId.get(assetId)
}

export function getPosseBadgeAssetById(posseId: string): string | undefined {
  const assetId = getPublicAssetFileStem(posseId, 'badge')
  if (!assetId) {
    return undefined
  }
  return posseBadgeAssetByAssetId.get(assetId)
}

export function getPosseFullArtAssetById(posseId: string): string | undefined {
  const assetId = getPublicAssetFileStem(posseId, 'crystal')
  if (!assetId) {
    return undefined
  }
  return posseFullArtAssetByAssetId.get(assetId)
}
