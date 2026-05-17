import {Fragment} from 'react'

import type {BannerEntry} from '@/domain/timeline'
import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {getBannerDisplayTags, getBannerTagColor, getBannerTagLabel} from './bannerTagDisplay'

interface BannerMetadataListProps {
  banner: BannerEntry
  className: string
  endedSeparatorClass: string
  endedTextClass: string
  fallbackClass: string
  isEnded: boolean
  limit?: number
  priceMode: TimelinePriceDisplayMode
  renderWhenEmpty?: boolean
  separatorClass: string
}

export function BannerMetadataList({
  banner,
  className,
  endedSeparatorClass,
  endedTextClass,
  fallbackClass,
  isEnded,
  limit,
  priceMode,
  renderWhenEmpty = false,
  separatorClass,
}: BannerMetadataListProps) {
  const items = getBannerMetadataItems(banner, priceMode, limit)

  if (items.length === 0 && !renderWhenEmpty) return null

  return (
    <div className={className}>
      {items.map((tag, index) => (
        <Fragment key={`${tag}-${index.toString()}`}>
          {index > 0 ? (
            <span aria-hidden className={isEnded ? endedSeparatorClass : separatorClass}>
              &middot;
            </span>
          ) : null}
          <span className={isEnded ? endedTextClass : getBannerTagColor(tag, fallbackClass)}>
            {getBannerTagLabel(tag)}
          </span>
        </Fragment>
      ))}
    </div>
  )
}

function getBannerMetadataItems(
  banner: BannerEntry,
  priceMode: TimelinePriceDisplayMode,
  limit: number | undefined,
) {
  const displayPricing = formatTimelinePrice(banner.pricing, priceMode)
  const items = [
    ...getBannerDisplayTags(banner),
    ...(banner.customTags ?? []),
    displayPricing,
  ].filter((tag): tag is string => Boolean(tag))

  return typeof limit === 'number' ? items.slice(0, limit) : items
}
