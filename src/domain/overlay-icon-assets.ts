const overlayIconAssets = import.meta.glob<string>('../assets/icons/*.{png,webp}', {
  import: 'default',
})

function basenameWithoutExt(assetPath: string): string {
  const filename = assetPath.split('/').at(-1) ?? assetPath
  return filename.replace(/\.(png|webp)$/i, '')
}

function indexAssetMap<T>(assets: Record<string, T>): Map<string, T> {
  return new Map(
    Object.entries(assets).map(([assetPath, url]) => [basenameWithoutExt(assetPath), url]),
  )
}

const overlayIconAssetLoaderById = indexAssetMap(overlayIconAssets)
const overlayIconAssetById = new Map<string, string>()
const overlayIconAssetPromiseById = new Map<string, Promise<string | undefined>>()

export function peekOverlayIconAsset(iconId: string | null | undefined): string | undefined {
  if (!iconId) {
    return undefined
  }
  return overlayIconAssetById.get(iconId)
}

export function loadOverlayIconAsset(
  iconId: string | null | undefined,
): Promise<string | undefined> {
  if (!iconId) {
    return Promise.resolve(undefined)
  }

  const cached = overlayIconAssetById.get(iconId)
  if (cached) {
    return Promise.resolve(cached)
  }

  const pending = overlayIconAssetPromiseById.get(iconId)
  if (pending) {
    return pending
  }

  const loader = overlayIconAssetLoaderById.get(iconId)
  if (!loader) {
    return Promise.resolve(undefined)
  }

  const next = loader().then((url) => {
    if (url) {
      overlayIconAssetById.set(iconId, url)
    }
    overlayIconAssetPromiseById.delete(iconId)
    return url
  })

  overlayIconAssetPromiseById.set(iconId, next)
  return next
}
