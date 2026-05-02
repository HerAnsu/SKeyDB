import publicPossesLite from '@/data/public-v2/lite/posses.json'

const posseIconAssets = import.meta.glob<string>('../assets/posse/Icon/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '')
}

const posseIconAssetByNumericId = new Map(
  Object.entries(posseIconAssets).flatMap(([assetPath, url]) => {
    const suffix = /^KeyToken_Skill_(\d{2})$/.exec(basenameWithoutExt(assetPath))?.[1]
    return suffix ? [[suffix, url] as const] : []
  }),
)
const posseIconNumericIdByPublicId = new Map(
  publicPossesLite.records.flatMap((posse) => {
    const suffix = /^posse-icon-(\d{2})$/.exec(posse.assetId)?.[1]
    return suffix ? [[posse.id, suffix] as const] : []
  }),
)

export function getPosseAssetById(posseId: string): string | undefined {
  const iconNumericId = posseIconNumericIdByPublicId.get(posseId)
  if (!iconNumericId) {
    return undefined
  }
  return posseIconAssetByNumericId.get(iconNumericId)
}
