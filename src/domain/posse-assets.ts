import publicPossesLite from '@/data/public-v2/lite/posses.json'

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

const posseIconAssetIdByPublicId = new Map(
  publicPossesLite.records.flatMap((posse) => {
    return posse.assetId ? [[posse.id, posse.assetId] as const] : []
  }),
)
const posseBadgeAssetIdByPublicId = new Map(
  publicPossesLite.records.flatMap((posse) => {
    return posse.assetBadgeId ? [[posse.id, posse.assetBadgeId] as const] : []
  }),
)
const posseFullArtAssetIdByPublicId = new Map(
  publicPossesLite.records.flatMap((posse) => {
    return posse.assetCrystalId ? [[posse.id, posse.assetCrystalId] as const] : []
  }),
)

export function getPosseAssetById(posseId: string): string | undefined {
  const assetId = posseIconAssetIdByPublicId.get(posseId)
  if (!assetId) {
    return undefined
  }
  return posseIconAssetByAssetId.get(assetId)
}

export function getPosseBadgeAssetById(posseId: string): string | undefined {
  const assetId = posseBadgeAssetIdByPublicId.get(posseId)
  if (!assetId) {
    return undefined
  }
  return posseBadgeAssetByAssetId.get(assetId)
}

export function getPosseFullArtAssetById(posseId: string): string | undefined {
  const assetId = posseFullArtAssetIdByPublicId.get(posseId)
  if (!assetId) {
    return undefined
  }
  return posseFullArtAssetByAssetId.get(assetId)
}
