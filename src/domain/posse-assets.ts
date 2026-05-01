import {POSSE_ID_V1_TO_V2} from './persistence-id-migration.v2'

const posseAssets = import.meta.glob<string>('../assets/posse/*.webp', {
  eager: true,
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.webp$/i, '').replace(/^\d{2}-/, '')
}

const posseAssetById = new Map(
  Object.entries(posseAssets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
)

const legacyPosseIdByPublicId: ReadonlyMap<string, string> = new Map(
  Object.entries(POSSE_ID_V1_TO_V2).map(([legacyId, publicId]) => [publicId, legacyId]),
)

export function getPosseAssetById(posseId: string): string | undefined {
  const assetId = legacyPosseIdByPublicId.get(posseId) ?? posseId
  return posseAssetById.get(assetId)
}
