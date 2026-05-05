import {lazy, Suspense, useEffect, useMemo, useRef} from 'react'

import {useLocation, useNavigate} from 'react-router-dom'

import emojiWke from '@/assets/emoji/Emoji_WKE_S_06.webp'
import {getAwakeners, type Awakener} from '@/domain/awakeners'
import {getCovenants, type Covenant} from '@/domain/covenants'
import {searchCovenants} from '@/domain/covenants-search'
import {DATABASE_SORT_OPTIONS, type DatabaseSortKey} from '@/domain/database-browse-state'
import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantBrowsePath,
  buildDatabaseCovenantPath,
  buildDatabasePosseBrowsePath,
  buildDatabasePossePath,
  buildDatabaseWheelBrowsePath,
  buildDatabaseWheelPath,
  findAwakenerByDatabaseSlug,
  findCovenantByDatabaseSlug,
  findPosseByDatabaseSlug,
  findWheelByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import {getPosses, type Posse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {
  loadPublicV2AwakenerFullById,
  loadPublicV2CovenantFullById,
  loadPublicV2PosseFullById,
  loadPublicV2WheelFullById,
} from '@/domain/public-v2-detail-loaders'
import {getWheels, type Wheel} from '@/domain/wheels'
import {
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'

import {
  buildAwakenerActiveFilterChips,
  buildCovenantActiveFilterChips,
  buildPosseActiveFilterChips,
  buildWheelActiveFilterChips,
} from './database/database-active-filter-chips'
import {DatabaseBrowseLayout} from './database/DatabaseBrowseLayout'
import {DatabaseFilters} from './database/DatabaseFilters'
import {DatabaseGrid} from './database/DatabaseGrid'
import {EntityViewControls} from './database/EntityViewControls'
import {SimpleArtifactDetailModal} from './database/SimpleArtifactDetailModal'
import {CovenantDatabaseFilters, PosseDatabaseFilters} from './database/SimpleArtifactFilters'
import {CovenantGrid, PosseGrid} from './database/SimpleArtifactGrid'
import {useDatabaseBrowseState} from './database/useDatabaseBrowseState'
import {useDatabaseDetailRouteRecord} from './database/useDatabaseDetailRouteRecord'
import {useDatabaseViewModel} from './database/useDatabaseViewModel'
import {
  useCovenantDatabaseBrowseState,
  usePosseDatabaseBrowseState,
} from './database/useSimpleArtifactDatabaseBrowseState'
import {useWheelsDatabaseBrowseState} from './database/useWheelsDatabaseBrowseState'
import {useWheelsDatabaseViewModel} from './database/useWheelsDatabaseViewModel'
import {WheelDatabaseFilters} from './database/WheelDatabaseFilters'
import {WheelGrid} from './database/WheelGrid'
import {useGlobalSearchCapture} from './useGlobalSearchCapture'

const AwakenerDetailModal = lazy(() =>
  import('./database/AwakenerDetailModal').then((module) => ({
    default: module.AwakenerDetailModal,
  })),
)
const WheelDetailModal = lazy(() =>
  import('./database/WheelDetailModal').then((module) => ({
    default: module.WheelDetailModal,
  })),
)
const databaseAwakeners = getAwakeners()
const databaseWheels = getWheels()
const databasePosses = getPosses()
const databaseCovenants = getCovenants()

function getDatabaseSortLabel(sortKey: DatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'ATK') {
    return 'ATK'
  }
  if (sortKey === 'DEF') {
    return 'DEF'
  }
  if (sortKey === 'CON') {
    return 'CON'
  }
  return 'Alphabetical'
}

function getDatabaseSortDirectionLabel(
  sortKey: DatabaseSortKey,
  direction: 'ASC' | 'DESC',
): string {
  if (sortKey === 'ALPHABETICAL') {
    return direction === 'ASC' ? 'A -> Z' : 'Z -> A'
  }
  return direction === 'ASC' ? 'Low -> High' : 'High -> Low'
}

function getWheelSortLabel(sortKey: WheelsDatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'MAINSTAT') {
    return 'Main stat'
  }
  return 'Alphabetical'
}

function getWheelSortDirectionLabel(
  sortKey: WheelsDatabaseSortKey,
  direction: 'ASC' | 'DESC',
): string {
  if (sortKey === 'RARITY') {
    return direction === 'ASC' ? 'Low -> High' : 'High -> Low'
  }
  return direction === 'ASC' ? 'A -> Z' : 'Z -> A'
}

function getActiveDatabaseEntity(pathname: string): DatabaseEntityId {
  if (pathname.startsWith(buildDatabaseCovenantBrowsePath())) {
    return 'covenants'
  }
  if (pathname.startsWith(buildDatabasePosseBrowsePath())) {
    return 'posses'
  }
  if (pathname.startsWith(buildDatabaseWheelBrowsePath())) {
    return 'wheels'
  }
  return 'awakeners'
}

function parseDatabaseRoute(pathname: string): {
  awakenerSlug?: string
  covenantSlug?: string
  posseSlug?: string
  tabSlug?: string
  wheelSlug?: string
} {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'database') {
    return {}
  }

  if (parts[1] === 'wheels') {
    return {wheelSlug: parts[2]}
  }
  if (parts[1] === 'posses') {
    return {posseSlug: parts[2]}
  }
  if (parts[1] === 'covenants') {
    return {covenantSlug: parts[2]}
  }
  if (parts[1] === 'awakeners' || parts[1] === 'awk') {
    return {awakenerSlug: parts[2], tabSlug: parts[3]}
  }
  return {}
}

export function DatabasePage() {
  const awakenerBrowseState = useDatabaseBrowseState()
  const awakenerViewModel = useDatabaseViewModel(databaseAwakeners, awakenerBrowseState)
  const wheelBrowseState = useWheelsDatabaseBrowseState()
  const wheelViewModel = useWheelsDatabaseViewModel(databaseWheels, wheelBrowseState)
  const posseBrowseState = usePosseDatabaseBrowseState()
  const covenantBrowseState = useCovenantDatabaseBrowseState()
  const filteredPosses = useMemo(() => {
    const searched = searchPosses(databasePosses, posseBrowseState.query)
    return posseBrowseState.realmFilter === 'ALL'
      ? searched
      : searched.filter((posse) => posse.realm === posseBrowseState.realmFilter)
  }, [posseBrowseState.query, posseBrowseState.realmFilter])
  const filteredCovenants = useMemo(
    () => searchCovenants(databaseCovenants, covenantBrowseState.query),
    [covenantBrowseState.query],
  )
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const {awakenerSlug, covenantSlug, posseSlug, tabSlug, wheelSlug} = parseDatabaseRoute(
    location.pathname,
  )
  const selectedAwakener = findAwakenerByDatabaseSlug(databaseAwakeners, awakenerSlug)
  const selectedWheel = findWheelByDatabaseSlug(databaseWheels, wheelSlug)
  const selectedPosse = findPosseByDatabaseSlug(databasePosses, posseSlug)
  const selectedCovenant = findCovenantByDatabaseSlug(databaseCovenants, covenantSlug)
  const selectedTab = resolveDatabaseAwakenerTab(tabSlug) ?? 'overview'
  const activeEntity = getActiveDatabaseEntity(location.pathname)
  const activeSearch = sanitizeDatabaseEntitySearch(activeEntity, location.search)
  const browsePath = buildDatabaseEntityBrowsePath(activeEntity)

  useEffect(() => {
    if (location.search === activeSearch) {
      return
    }

    void navigate(
      {
        pathname: location.pathname,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, location.pathname, location.search, navigate])

  useGlobalSearchCapture({
    enabled: !selectedAwakener && !selectedWheel && !selectedPosse && !selectedCovenant,
    searchInputRef,
    onAppendCharacter: (character) => {
      if (activeEntity === 'wheels') {
        wheelBrowseState.appendSearchCharacter(character)
      } else if (activeEntity === 'posses') {
        posseBrowseState.appendSearchCharacter(character)
      } else if (activeEntity === 'covenants') {
        covenantBrowseState.appendSearchCharacter(character)
      } else {
        awakenerBrowseState.appendSearchCharacter(character)
      }
    },
    onRemoveCharacter: () => {
      if (activeEntity === 'wheels') {
        wheelBrowseState.removeSearchCharacter()
      } else if (activeEntity === 'posses') {
        posseBrowseState.removeSearchCharacter()
      } else if (activeEntity === 'covenants') {
        covenantBrowseState.removeSearchCharacter()
      } else {
        awakenerBrowseState.removeSearchCharacter()
      }
    },
    onClearSearch: () => {
      if (activeEntity === 'wheels') {
        wheelBrowseState.clearQuery()
      } else if (activeEntity === 'posses') {
        posseBrowseState.clearQuery()
      } else if (activeEntity === 'covenants') {
        covenantBrowseState.clearQuery()
      } else {
        awakenerBrowseState.clearQuery()
      }
    },
  })

  useEffect(() => {
    if (awakenerSlug && !selectedAwakener) {
      void navigate(
        {
          pathname: buildDatabaseEntityBrowsePath('awakeners'),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, awakenerSlug, navigate, selectedAwakener])

  useEffect(() => {
    if (!awakenerSlug || !selectedAwakener) {
      return
    }
    const canonicalPath = buildDatabaseAwakenerPath(selectedAwakener, selectedTab)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, awakenerSlug, location.pathname, navigate, selectedAwakener, selectedTab])

  useEffect(() => {
    if (wheelSlug && !selectedWheel) {
      void navigate(
        {
          pathname: buildDatabaseWheelBrowsePath(),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, navigate, selectedWheel, wheelSlug])

  useEffect(() => {
    if (!wheelSlug || !selectedWheel) {
      return
    }
    const canonicalPath = buildDatabaseWheelPath(selectedWheel)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, location.pathname, navigate, selectedWheel, wheelSlug])

  useEffect(() => {
    if (posseSlug && !selectedPosse) {
      void navigate(
        {
          pathname: buildDatabasePosseBrowsePath(),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, navigate, posseSlug, selectedPosse])

  useEffect(() => {
    if (!posseSlug || !selectedPosse) {
      return
    }
    const canonicalPath = buildDatabasePossePath(selectedPosse)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, location.pathname, navigate, posseSlug, selectedPosse])

  useEffect(() => {
    if (covenantSlug && !selectedCovenant) {
      void navigate(
        {
          pathname: buildDatabaseCovenantBrowsePath(),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, covenantSlug, navigate, selectedCovenant])

  useEffect(() => {
    if (!covenantSlug || !selectedCovenant) {
      return
    }
    const canonicalPath = buildDatabaseCovenantPath(selectedCovenant)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, covenantSlug, location.pathname, navigate, selectedCovenant])

  function openAwakenerDetail(awakenerId: string) {
    const awakener = databaseAwakeners.find((entry) => entry.id === awakenerId)
    if (!awakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(awakener),
      search: activeSearch,
    })
  }

  function openWheelDetail(wheelId: string) {
    const wheel = databaseWheels.find((entry) => entry.id === wheelId)
    if (!wheel) {
      return
    }
    void navigate({
      pathname: buildDatabaseWheelPath(wheel),
      search: activeSearch,
    })
  }

  function openPosseDetail(posseId: string) {
    const posse = databasePosses.find((entry) => entry.id === posseId)
    if (!posse) {
      return
    }
    void navigate({
      pathname: buildDatabasePossePath(posse),
      search: activeSearch,
    })
  }

  function openCovenantDetail(covenantId: string) {
    const covenant = databaseCovenants.find((entry) => entry.id === covenantId)
    if (!covenant) {
      return
    }
    void navigate({
      pathname: buildDatabaseCovenantPath(covenant),
      search: activeSearch,
    })
  }

  function closeDetail() {
    void navigate({pathname: browsePath, search: activeSearch})
  }

  function handleDetailTabChange(nextTab: DatabaseAwakenerTab) {
    if (!selectedAwakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(selectedAwakener, nextTab),
      search: activeSearch,
    })
  }

  function handleModalAwakenerSelect(
    nextAwakener: Pick<Awakener, 'id' | 'name'>,
    nextTab: DatabaseAwakenerTab = 'overview',
  ) {
    void navigate({
      pathname: buildDatabaseAwakenerPath(nextAwakener, nextTab),
      search: sanitizeDatabaseEntitySearch('awakeners', activeSearch),
    })
  }

  function handleModalWheelSelect(nextWheel: Pick<Wheel, 'name'>) {
    void navigate({
      pathname: buildDatabaseWheelPath(nextWheel),
      search: sanitizeDatabaseEntitySearch('wheels', activeSearch),
    })
  }

  function handleModalCovenantSelect(nextCovenant: Pick<Covenant, 'name'>) {
    void navigate({
      pathname: buildDatabaseCovenantPath(nextCovenant),
      search: sanitizeDatabaseEntitySearch('covenants', activeSearch),
    })
  }

  const awakenerActiveFilterChips = buildAwakenerActiveFilterChips(awakenerBrowseState, {
    clearQuery: awakenerBrowseState.clearQuery,
    setRealmFilter: awakenerBrowseState.setRealmFilter,
    setRarityFilter: awakenerBrowseState.setRarityFilter,
    setTypeFilter: awakenerBrowseState.setTypeFilter,
  })
  const wheelActiveFilterChips = buildWheelActiveFilterChips(wheelBrowseState, {
    clearQuery: wheelBrowseState.clearQuery,
    setRealmFilter: wheelBrowseState.setRealmFilter,
    setRarityFilter: wheelBrowseState.setRarityFilter,
    setMainstatFilter: wheelBrowseState.setMainstatFilter,
  })
  const posseActiveFilterChips = buildPosseActiveFilterChips(posseBrowseState, {
    clearQuery: posseBrowseState.clearQuery,
    setRealmFilter: posseBrowseState.setRealmFilter,
  })
  const covenantActiveFilterChips = buildCovenantActiveFilterChips(covenantBrowseState, {
    clearQuery: covenantBrowseState.clearQuery,
  })

  return (
    <section className='space-y-2.5 sm:space-y-3'>
      <div className='flex items-start gap-2.5 rounded-sm border border-amber-400/20 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(69,26,3,0.12))] px-2.5 py-2 sm:items-center sm:gap-3 sm:px-3 sm:py-2.5'>
        <img
          alt=''
          aria-hidden
          className='h-9 w-9 shrink-0 -scale-x-100 object-contain sm:h-12 sm:w-12'
          src={emojiWke}
        />
        <p className='text-xs leading-normal text-amber-100/75'>
          <strong className='font-semibold text-amber-200/90'>Database beta:</strong> Search,
          filters, and detail views are live. We&apos;re still filling in data and polishing the UI,
          so some entries and interactions may shift.
        </p>
      </div>

      {activeEntity === 'posses' ? (
        <DatabaseBrowseLayout
          activeEntity={activeEntity}
          activeFilterChips={posseActiveFilterChips}
          filteredCount={filteredPosses.length}
          filters={
            <PosseDatabaseFilters
              onQueryChange={posseBrowseState.setQuery}
              onRealmFilterChange={posseBrowseState.setRealmFilter}
              query={posseBrowseState.query}
              realmFilter={posseBrowseState.realmFilter}
              searchInputRef={searchInputRef}
            />
          }
          onResetFilters={posseBrowseState.resetFilters}
          results={<PosseGrid onSelectPosse={openPosseDetail} posses={filteredPosses} />}
          search={activeSearch}
          title='Posses'
          totalCount={databasePosses.length}
          unitNoun='posses'
          viewControls={null}
        />
      ) : activeEntity === 'covenants' ? (
        <DatabaseBrowseLayout
          activeEntity={activeEntity}
          activeFilterChips={covenantActiveFilterChips}
          filteredCount={filteredCovenants.length}
          filters={
            <CovenantDatabaseFilters
              onQueryChange={covenantBrowseState.setQuery}
              query={covenantBrowseState.query}
              searchInputRef={searchInputRef}
            />
          }
          onResetFilters={covenantBrowseState.resetFilters}
          results={
            <CovenantGrid covenants={filteredCovenants} onSelectCovenant={openCovenantDetail} />
          }
          search={activeSearch}
          title='Covenants'
          totalCount={databaseCovenants.length}
          unitNoun='covenants'
          viewControls={null}
        />
      ) : activeEntity === 'wheels' ? (
        <DatabaseBrowseLayout
          activeEntity={activeEntity}
          activeFilterChips={wheelActiveFilterChips}
          filteredCount={wheelViewModel.wheels.length}
          filters={
            <WheelDatabaseFilters
              mainstatFilter={wheelBrowseState.mainstatFilter}
              onMainstatFilterChange={wheelBrowseState.setMainstatFilter}
              onQueryChange={wheelBrowseState.setQuery}
              onRarityFilterChange={wheelBrowseState.setRarityFilter}
              onRealmFilterChange={wheelBrowseState.setRealmFilter}
              query={wheelBrowseState.query}
              rarityFilter={wheelBrowseState.rarityFilter}
              realmFilter={wheelBrowseState.realmFilter}
              searchInputRef={searchInputRef}
            />
          }
          onResetFilters={wheelBrowseState.resetFilters}
          results={<WheelGrid onSelectWheel={openWheelDetail} wheels={wheelViewModel.wheels} />}
          search={activeSearch}
          title='Wheels'
          totalCount={wheelViewModel.totalCount}
          unitNoun='wheels'
          viewControls={
            <EntityViewControls
              getSortDirectionLabel={getWheelSortDirectionLabel}
              getSortLabel={getWheelSortLabel}
              onSortDirectionToggle={wheelBrowseState.toggleSortDirection}
              onSortKeyChange={wheelBrowseState.setSortKey}
              sortDirection={wheelBrowseState.sortDirection}
              sortDirectionAriaLabel='Toggle wheel sort direction'
              sortKey={wheelBrowseState.sortKey}
              sortOptions={WHEELS_DATABASE_SORT_OPTIONS}
              sortSelectAriaLabel='Wheel database sort key'
            />
          }
        />
      ) : (
        <DatabaseBrowseLayout
          activeEntity={activeEntity}
          activeFilterChips={awakenerActiveFilterChips}
          filteredCount={awakenerViewModel.awakeners.length}
          filters={
            <DatabaseFilters
              onQueryChange={awakenerBrowseState.setQuery}
              onRarityFilterChange={awakenerBrowseState.setRarityFilter}
              onRealmFilterChange={awakenerBrowseState.setRealmFilter}
              onTypeFilterChange={awakenerBrowseState.setTypeFilter}
              query={awakenerBrowseState.query}
              rarityFilter={awakenerBrowseState.rarityFilter}
              realmFilter={awakenerBrowseState.realmFilter}
              searchInputRef={searchInputRef}
              typeFilter={awakenerBrowseState.typeFilter}
            />
          }
          onResetFilters={awakenerBrowseState.resetFilters}
          results={
            <DatabaseGrid
              awakeners={awakenerViewModel.awakeners}
              onSelectAwakener={openAwakenerDetail}
            />
          }
          search={activeSearch}
          title='Awakeners'
          totalCount={awakenerViewModel.totalCount}
          unitNoun='awakeners'
          viewControls={
            <EntityViewControls
              getSortDirectionLabel={getDatabaseSortDirectionLabel}
              getSortLabel={getDatabaseSortLabel}
              groupByRealm={awakenerBrowseState.groupByRealm}
              onGroupByRealmChange={awakenerBrowseState.setGroupByRealm}
              onSortDirectionToggle={awakenerBrowseState.toggleSortDirection}
              onSortKeyChange={awakenerBrowseState.setSortKey}
              sortDirection={awakenerBrowseState.sortDirection}
              sortDirectionAriaLabel='Toggle database sort direction'
              sortKey={awakenerBrowseState.sortKey}
              sortOptions={DATABASE_SORT_OPTIONS}
              sortSelectAriaLabel='Database sort key'
            />
          }
        />
      )}

      {selectedAwakener ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading awakener details...</div>
          }
        >
          <DatabaseAwakenerDetailRoute
            activeTab={selectedTab}
            awakener={selectedAwakener}
            awakeners={databaseAwakeners}
            onClose={closeDetail}
            onSelectAwakener={handleModalAwakenerSelect}
            onSelectCovenant={handleModalCovenantSelect}
            onSelectWheel={handleModalWheelSelect}
            onTabChange={handleDetailTabChange}
            tabSlug={tabSlug}
          />
        </Suspense>
      ) : null}

      {selectedWheel ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading wheel details...</div>
          }
        >
          <DatabaseWheelDetailRoute
            onClose={closeDetail}
            onSelectAwakener={handleModalAwakenerSelect}
            onSelectWheel={handleModalWheelSelect}
            wheel={selectedWheel}
            wheels={databaseWheels}
          />
        </Suspense>
      ) : null}

      {selectedPosse ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading posse details...</div>
          }
        >
          <DatabasePosseDetailRoute
            onClose={closeDetail}
            onSelectAwakener={handleModalAwakenerSelect}
            posse={selectedPosse}
          />
        </Suspense>
      ) : null}

      {selectedCovenant ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading covenant details...</div>
          }
        >
          <DatabaseCovenantDetailRoute covenant={selectedCovenant} onClose={closeDetail} />
        </Suspense>
      ) : null}
    </section>
  )
}

interface DatabaseAwakenerDetailRouteProps {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel: (wheel: Pick<Wheel, 'name'>) => void
  onSelectCovenant: (covenant: Pick<Covenant, 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
  tabSlug?: string
}

function DatabaseAwakenerDetailRoute({
  activeTab,
  awakener,
  awakeners,
  onClose,
  onSelectAwakener,
  onSelectWheel,
  onSelectCovenant,
  onTabChange,
  tabSlug,
}: DatabaseAwakenerDetailRouteProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const resolvedTabSlug = resolveDatabaseAwakenerTab(tabSlug)
  const {isLoading, record: fullDataV2} = useDatabaseDetailRouteRecord({
    id: awakener.id,
    loadRecord: loadPublicV2AwakenerFullById,
    missingPathname: buildDatabaseEntityBrowsePath('awakeners'),
  })

  useEffect(() => {
    if (!fullDataV2 || !tabSlug || !resolvedTabSlug) {
      return
    }

    const canonicalPath = buildDatabaseAwakenerPath(awakener, resolvedTabSlug)
    if (location.pathname === canonicalPath) {
      return
    }

    void navigate(
      {
        pathname: canonicalPath,
        search: location.search,
      },
      {replace: true},
    )
  }, [awakener, fullDataV2, location.pathname, location.search, navigate, resolvedTabSlug, tabSlug])

  useEffect(() => {
    if (!fullDataV2 || !tabSlug || resolvedTabSlug) {
      return
    }

    void navigate(
      {
        pathname: buildDatabaseAwakenerPath(awakener),
        search: location.search,
      },
      {replace: true},
    )
  }, [awakener, fullDataV2, location.search, navigate, resolvedTabSlug, tabSlug])

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>Loading awakener details...</div>
  }

  if (!fullDataV2) {
    return null
  }

  return (
    <AwakenerDetailModal
      activeTab={activeTab}
      awakener={awakener}
      awakeners={awakeners}
      fullDataV2={fullDataV2}
      key={awakener.id}
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
      onSelectCovenant={onSelectCovenant}
      onSelectWheel={onSelectWheel}
      onTabChange={onTabChange}
    />
  )
}

interface DatabaseWheelDetailRouteProps {
  wheel: Wheel
  wheels: Wheel[]
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

function DatabaseWheelDetailRoute({
  wheel,
  wheels,
  onClose,
  onSelectAwakener,
  onSelectWheel,
}: DatabaseWheelDetailRouteProps) {
  const {isLoading, record: fullDataV2} = useDatabaseDetailRouteRecord({
    id: wheel.id,
    loadRecord: loadPublicV2WheelFullById,
    missingPathname: buildDatabaseWheelBrowsePath(),
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>Loading wheel details...</div>
  }

  if (!fullDataV2) {
    return null
  }

  return (
    <WheelDetailModal
      fullDataV2={fullDataV2}
      key={wheel.id}
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
      onSelectWheel={onSelectWheel}
      wheel={wheel}
      wheels={wheels}
    />
  )
}

interface DatabasePosseDetailRouteProps {
  posse: Posse
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
}

function DatabasePosseDetailRoute({
  onClose,
  onSelectAwakener,
  posse,
}: DatabasePosseDetailRouteProps) {
  const {isLoading, record: fullDataV2} = useDatabaseDetailRouteRecord({
    id: posse.id,
    loadRecord: loadPublicV2PosseFullById,
    missingPathname: buildDatabasePosseBrowsePath(),
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>Loading posse details...</div>
  }

  if (!fullDataV2) {
    return null
  }

  return (
    <SimpleArtifactDetailModal
      fullDataV2={fullDataV2}
      item={posse}
      kind='posse'
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
    />
  )
}

interface DatabaseCovenantDetailRouteProps {
  covenant: Covenant
  onClose: () => void
}

function DatabaseCovenantDetailRoute({covenant, onClose}: DatabaseCovenantDetailRouteProps) {
  const {isLoading, record: fullDataV2} = useDatabaseDetailRouteRecord({
    id: covenant.id,
    loadRecord: loadPublicV2CovenantFullById,
    missingPathname: buildDatabaseCovenantBrowsePath(),
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>Loading covenant details...</div>
  }

  if (!fullDataV2) {
    return null
  }

  return (
    <SimpleArtifactDetailModal
      fullDataV2={fullDataV2}
      item={covenant}
      kind='covenant'
      onClose={onClose}
    />
  )
}
