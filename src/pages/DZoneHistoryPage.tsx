import {useState} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'
import {Link} from 'react-router-dom'

import {
  getCurrentDzoneSeasonSummary,
  getDzoneSeasonById,
  getDzoneSeasonSummaries,
  getLatestDzoneSeason,
  getLatestDzoneSeasonSummary,
} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {getDzoneSeasonSummaryDisplayName} from '@/domain/dzone-season-realm'
import {getTimelineCountdownDisplay, getTimelineStatus} from '@/domain/timeline'
import {DatabasePopoverContext} from '@/features/database/internal/database-popover-context'
import {DatabasePopoverRoot} from '@/features/database/internal/DatabasePopoverRoot'

import {formatDzoneSeasonDateRange} from './d-zone/d-zone-date-format'
import {
  buildDZoneHistoryYearGroups,
  getDZoneHistoryNormalizedSearchTerm,
  getDZoneHistorySeasonYear,
  getDZoneHistoryVisibleSeasons,
} from './d-zone/d-zone-history-view-model'
import {getDzoneRealmBadgeAsset} from './d-zone/d-zone-realm-assets'
import {DZoneHistoryBrowser} from './d-zone/DZoneHistoryBrowser'
import {DZoneSeasonInspector} from './d-zone/DZoneSeasonInspector'
import {useDZoneDatabasePopovers} from './d-zone/useDZoneDatabasePopovers'
import {useTimelineNow} from './timeline/useTimelineNow'

import './d-zone/d-zone.css'

export function DZoneHistoryPage() {
  const now = useTimelineNow()
  const summaries = getDzoneSeasonSummaries()
  const defaultSummary = getCurrentDzoneSeasonSummary(now) ?? getLatestDzoneSeasonSummary()
  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSummary.id)
  const [searchTerm, setSearchTerm] = useState('')
  const [browserOpen, setBrowserOpen] = useState(false)
  const [browserOpener, setBrowserOpener] = useState<HTMLElement | null>(null)
  const [expandedYears, setExpandedYears] = useState<Set<string>>(
    () => new Set([getDZoneHistorySeasonYear(defaultSummary)]),
  )
  const dzonePopovers = useDZoneDatabasePopovers()

  const selectedSummary =
    summaries.find((season) => season.id === selectedSeasonId) ?? getLatestDzoneSeasonSummary()
  const selectedSeason = getDzoneSeasonById(selectedSummary.id) ?? getLatestDzoneSeason()
  const selectedRealmName = selectedSummary.realm
    ? getDzoneSeasonSummaryDisplayName(selectedSummary)
    : null
  const selectedRealmBadgeSrc = selectedSummary.realm
    ? getDzoneRealmBadgeAsset(selectedSummary.realm)
    : undefined
  const selectedDateRange = formatDzoneSeasonDateRange(selectedSeason)
  const status = getTimelineStatus(selectedSeason.start, selectedSeason.end, now)
  const countdownDisplay =
    status === 'active'
      ? (getTimelineCountdownDisplay(selectedSeason.start, selectedSeason.end, now)?.text ?? '')
      : ''
  const normalizedSearchTerm = getDZoneHistoryNormalizedSearchTerm(searchTerm)
  const visibleSeasons = getDZoneHistoryVisibleSeasons(summaries, searchTerm)
  const yearGroups = buildDZoneHistoryYearGroups(visibleSeasons)

  function toggleYear(year: string) {
    setExpandedYears((currentYears) => {
      const nextYears = new Set(currentYears)
      if (nextYears.has(year)) {
        nextYears.delete(year)
      } else {
        nextYears.add(year)
      }
      return nextYears
    })
  }

  return (
    <DatabasePopoverContext.Provider value={dzonePopovers.contextValue}>
      <section
        className={`d-zone-page d-zone-history-page -mt-4 md:-mt-5 ${
          browserOpen ? 'd-zone-history-page--browser-open' : ''
        }`}
      >
        <div className='d-zone-history-page-heading' aria-labelledby='d-zone-history-page-title'>
          <div className='d-zone-history-page-heading-copy'>
            <h1 className='d-zone-history-title ui-title' id='d-zone-history-page-title'>
              D-Zone Archive
            </h1>
            <p>Browse past seasons, their stage lineups and relics.</p>
          </div>
          <Link className='d-zone-history-cta d-zone-history-back-link' to='/d-zone'>
            <FaChevronLeft aria-hidden />
            Back to D-Zone
          </Link>
        </div>

        <button
          aria-controls='d-zone-history-browser'
          aria-expanded={browserOpen}
          aria-label='Open season browser drawer'
          className='d-zone-history-browser-trigger'
          onClick={(event) => {
            setBrowserOpener(event.currentTarget)
            setBrowserOpen(true)
          }}
          type='button'
        >
          <span className='d-zone-history-browser-trigger-copy'>
            <span className='d-zone-history-browser-trigger-title'>Season Browser</span>
          </span>
          <span className='d-zone-history-browser-trigger-action'>
            Open Drawer
            <FaChevronRight aria-hidden />
          </span>
        </button>

        <div className='d-zone-history-shell'>
          <DZoneHistoryBrowser
            browserOpen={browserOpen}
            expandedYears={expandedYears}
            forceExpandedYears={normalizedSearchTerm.length > 0}
            groups={yearGroups}
            openerElement={browserOpener}
            search={searchTerm}
            selectedSeasonId={selectedSummary.id}
            onBackdropClose={() => {
              setBrowserOpen(false)
            }}
            onClose={() => {
              setBrowserOpen(false)
            }}
            onSearchChange={setSearchTerm}
            onSelectSeason={(seasonId) => {
              setSelectedSeasonId(seasonId)
              setBrowserOpen(false)
            }}
            onToggleYear={toggleYear}
          />

          <DZoneSeasonInspector
            countdownDisplay={countdownDisplay}
            dateRange={selectedDateRange}
            getMonsterAsset={(monster) => getDzoneMonsterPreviewAsset(monster.assetName)}
            onMonsterOpen={dzonePopovers.openMonsterPopover}
            onRelicOpen={(relic, event) => {
              void dzonePopovers.openRelicPopover(relic, event)
            }}
            realm={selectedSummary.realm}
            season={selectedSeason}
            showHeader
            realmBadgeSrc={selectedRealmBadgeSrc}
            realmName={selectedRealmName}
            title={`Season ${selectedSeason.period.toString()}`}
            waveHeadingLevel={3}
          />
        </div>
      </section>

      <DatabasePopoverRoot
        {...dzonePopovers.popoverRootProps}
        closeOnOutsideClick={dzonePopovers.closeOnOutsideClick}
      />
    </DatabasePopoverContext.Provider>
  )
}
