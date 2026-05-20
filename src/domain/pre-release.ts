import {getAwakenerById, type Awakener} from './awakeners'

function parseReleaseDate(releaseDate: string | undefined): Date | null {
  if (!releaseDate) {
    return null
  }

  const timestamp = Date.parse(`${releaseDate}T00:00:00`)
  return Number.isNaN(timestamp) ? null : new Date(timestamp)
}

export function isPreReleaseAwakener(awakener: Pick<Awakener, 'releaseDate'>): boolean {
  const releaseDate = parseReleaseDate(awakener.releaseDate)
  return releaseDate ? releaseDate.getTime() > Date.now() : false
}

export function isPreReleaseAwakenerId(awakenerId: string | undefined): boolean {
  return awakenerId ? isPreReleaseAwakener(getAwakenerById(awakenerId) ?? {}) : false
}
