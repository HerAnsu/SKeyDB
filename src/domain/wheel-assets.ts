import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'

const wheelAssets = import.meta.glob<string>('../assets/wheels/*.webp', {
  eager: true,
  import: 'default',
})
const wheelMiniAssets = import.meta.glob<string>('../assets/wheels/Mini/*.webp', {
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
const wheelMiniAssetByAssetId = new Map(
  Object.entries(wheelMiniAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

export function getWheelAssetById(wheelId: string): string | undefined {
  const publicAssetId = resolvePublicEntityAsset(wheelId, 'icon')
  const assetId = publicAssetId
    ? (resolvePublicAsset(publicAssetId)?.assetId ?? `Weapon_Full_${wheelId}`)
    : `Weapon_Full_${wheelId}`
  return wheelAssetByAssetId.get(assetId)
}

export function getWheelMiniAssetById(wheelId: string): string | undefined {
  const publicAssetId = resolvePublicEntityAsset(wheelId, 'icon')
  const fullAssetId = publicAssetId
    ? (resolvePublicAsset(publicAssetId)?.assetId ?? `Weapon_Full_${wheelId}`)
    : `Weapon_Full_${wheelId}`
  const miniAssetId = fullAssetId.replace(/^Weapon_Full_/, 'Weapon_Mini_')
  return wheelMiniAssetByAssetId.get(miniAssetId)
}
