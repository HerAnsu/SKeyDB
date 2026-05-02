import publicPossesLite from '@/data/public-v2/lite/posses.json'

const posseIconAssets = import.meta.glob<string>('../assets/posse/Icon/*.webp', {
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

const posseIconAssetIdByPublicId = new Map(
  publicPossesLite.records.flatMap((posse) => {
    return posse.assetId ? [[posse.id, posse.assetId] as const] : []
  }),
)

export function getPosseAssetById(posseId: string): string | undefined {
  const assetId = posseIconAssetIdByPublicId.get(posseId)
  if (!assetId) {
    return undefined
  }
  return posseIconAssetByAssetId.get(assetId)
}
