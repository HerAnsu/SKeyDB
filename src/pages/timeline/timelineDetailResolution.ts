import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {getAwakeners} from '@/domain/awakeners'
import {buildDatabaseAwakenerPath, buildDatabaseWheelPath} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit} from '@/domain/timeline'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheels} from '@/domain/wheels'

export interface TimelineFeaturedAsset {
  url: string | undefined
  label: string
  linkTo: string | undefined
  realmId: string | undefined
  isWheel: boolean
  detailRef: EntityRef | undefined
}

export function findTimelineAwakener(name: string) {
  const needle = name.toLowerCase()
  return getAwakeners().find((awakener) => awakener.name.toLowerCase() === needle)
}

export function findTimelineWheel(name: string) {
  const needle = name.toLowerCase()
  return getWheels().find((wheel) => wheel.name.toLowerCase() === needle)
}

export function findTimelineSignatureWheel(awakenerName: string) {
  const needle = awakenerName.toLowerCase()
  return getWheels().find(
    (wheel) => wheel.awakener.toLowerCase() === needle && wheel.rarity === 'SSR',
  )
}

export function resolveTimelineFeaturedAsset(unit: BannerFeaturedUnit): TimelineFeaturedAsset {
  const allowDetailLink = unit.detailLink !== false

  if (unit.kind === 'placeholder') {
    return {
      url: undefined,
      label: unit.name,
      linkTo: undefined,
      realmId: undefined,
      isWheel: false,
      detailRef: undefined,
    }
  }

  const wheel =
    unit.kind === 'wheel'
      ? findTimelineWheel(unit.name)
      : unit.kind === 'wheel-auto'
        ? findTimelineSignatureWheel(unit.name)
        : undefined
  const awakener = unit.kind === 'awakener' ? findTimelineAwakener(unit.name) : undefined
  const isWheel = unit.kind === 'wheel' || unit.kind === 'wheel-auto'
  const label = unit.kind === 'wheel-auto' ? (wheel?.name ?? unit.name) : unit.name

  if (unit.customArt) {
    return {
      url: unit.customArt,
      label,
      linkTo: allowDetailLink
        ? wheel
          ? buildDatabaseWheelPath(wheel)
          : awakener
            ? buildDatabaseAwakenerPath(awakener)
            : undefined
        : undefined,
      realmId: unit.realmId ?? (isWheel ? wheel?.realm : awakener?.realm),
      isWheel,
      detailRef: allowDetailLink
        ? wheel
          ? {kind: 'wheel', id: wheel.id}
          : awakener
            ? {kind: 'awakener', id: awakener.id}
            : undefined
        : undefined,
    }
  }

  if (isWheel) {
    return {
      url: wheel ? getWheelAssetById(wheel.id) : undefined,
      label,
      linkTo: allowDetailLink && wheel ? buildDatabaseWheelPath(wheel) : undefined,
      realmId: unit.realmId ?? wheel?.realm,
      isWheel: true,
      detailRef: allowDetailLink && wheel ? {kind: 'wheel', id: wheel.id} : undefined,
    }
  }

  return {
    url: getAwakenerCardAsset(unit.name),
    label: unit.name,
    linkTo: allowDetailLink && awakener ? buildDatabaseAwakenerPath(awakener) : undefined,
    realmId: unit.realmId ?? awakener?.realm,
    isWheel: false,
    detailRef: allowDetailLink && awakener ? {kind: 'awakener', id: awakener.id} : undefined,
  }
}
