import {Suspense, useMemo, useRef, useState} from 'react'

import {FaGear, FaXmark} from 'react-icons/fa6'

import {loadCollectionOwnership} from '@/domain/collection-ownership'
import {getCovenantAssetById, getCovenantFullArtAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'
import type {CovenantFullV2Record} from '@/domain/covenants-full-v2'
import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import {getPosseAssetById, getPosseFullArtAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'
import type {PosseFullV2Record} from '@/domain/posses-full-v2'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildPosseDatabaseDescriptionRecord,
  buildSimpleArtifactReferenceLayer,
} from '@/domain/simple-artifact-database-reference-layer'
import {getBrowserLocalStorage} from '@/domain/storage'

import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
  DATABASE_DETAIL_META_LINK_CLASS,
  DATABASE_DETAIL_META_PRIMARY_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import {DatabasePopoverContext} from './database-popover-context'
import {DatabaseArtViewerOverlay} from './DatabaseArtViewerOverlay'
import {DatabaseDetailSettingsPanel} from './DatabaseDetailSettingsPanel'
import {DatabasePopoverRoot} from './DatabasePopoverRoot'
import {getDescriptionFontScaleStyle} from './font-scale'
import {RichDescription} from './RichDescription'
import {useDatabaseDetailChrome} from './useDatabaseDetailChrome'
import {useDatabaseDetailModalLifecycle} from './useDatabaseDetailModalLifecycle'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'
import {WheelLoreText} from './WheelLoreText'

interface PosseDetailModalProps {
  kind: 'posse'
  item: Posse
  fullDataV2: PosseFullV2Record
  onClose: () => void
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
}

interface CovenantDetailModalProps {
  kind: 'covenant'
  item: Covenant
  fullDataV2: CovenantFullV2Record
  onClose: () => void
  onSelectAwakener?: never
}

type SimpleArtifactDetailModalProps = PosseDetailModalProps | CovenantDetailModalProps
const noop = () => {
  return undefined
}

export function SimpleArtifactDetailModal(props: SimpleArtifactDetailModalProps) {
  return <SimpleArtifactDetailModalInner {...props} key={props.item.id} />
}

function SimpleArtifactDetailModalInner({
  fullDataV2,
  item,
  kind,
  onClose,
  onSelectAwakener,
}: SimpleArtifactDetailModalProps) {
  const [isArtViewerOpen, setIsArtViewerOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const {preferences, updateSharedPreferences} = useDatabaseDetailPreferences()
  const [collectionOwnership] = useState(() => loadCollectionOwnership(getBrowserLocalStorage()))
  const formulaContext = useMemo(
    () =>
      buildPublicFormulaContext({
        accountLevel: preferences.shared.accountLevel,
        collectionOwnership,
      }),
    [collectionOwnership, preferences.shared.accountLevel],
  )
  const descriptions = useMemo(() => {
    if (kind === 'posse') {
      const record = buildPosseDatabaseDescriptionRecord(fullDataV2)
      return [{heading: 'Description', record, label: 'Posse'}]
    }

    return fullDataV2.setEffects.map((effect) => {
      const record = buildCovenantDatabaseDescriptionRecord({
        id: `${fullDataV2.id}:${effect.set.toString()}`,
        name: `${fullDataV2.name} ${effect.set.toString()} Set`,
        descriptionTemplate: effect.descriptionTemplate,
        descriptionArgs: effect.descriptionArgs,
      })
      return {heading: `${effect.set.toString()} Set`, record, label: 'Covenant'}
    })
  }, [fullDataV2, kind])
  const referenceLayer = useMemo(
    () =>
      buildSimpleArtifactReferenceLayer({
        extraReferences: descriptions.map((entry) => ({record: entry.record, label: entry.label})),
        formulaContext,
      }),
    [descriptions, formulaContext],
  )
  const popoverController = useDatabasePopoverController({
    formulaContext,
    referenceLayer,
    showTagIcons: preferences.shared.showTagIcons,
  })
  const chrome = useDatabaseDetailChrome({
    clickOutsideClosesPopovers: preferences.shared.clickOutsideClosesPopovers,
    closeAllPopovers: popoverController.closeAllPopovers,
    closeSearch: undefined,
    hasOpenPopovers: popoverController.hasOpenPopovers,
    isSearchOpen: false,
    onClose,
  })
  const {
    handleOverlayClick,
    handlePanelKeyDown,
    isSettingsOpen,
    panelRef,
    setIsSettingsOpen,
    settingsRef,
  } = chrome
  const artAsset =
    kind === 'posse' ? getPosseFullArtAssetById(item.id) : getCovenantFullArtAssetById(item.id)
  const headerIconAsset =
    kind === 'posse' ? getPosseAssetById(item.id) : getCovenantAssetById(item.id)
  const fullArtAlt = `${item.name} full art`

  useDatabaseDetailModalLifecycle({
    clearSearch: noop,
    closeAllPopovers: popoverController.closeAllPopovers,
    closeSearch: noop,
    dismissSettings: () => {
      setIsSettingsOpen(false)
    },
    hasOpenPopovers: popoverController.hasOpenPopovers,
    isSettingsOpen,
    onClose,
    searchInputRef,
    searchQuery: '',
  })

  return (
    <div
      className='fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/78 p-4 md:p-6'
      onClick={handleOverlayClick}
    >
      <div
        aria-label={`${item.name} details`}
        aria-modal='true'
        className='relative z-[901] flex max-h-[calc(100dvh-3rem)] min-h-[340px] w-full max-w-5xl overflow-hidden border border-amber-200/55 bg-slate-950/[.985] shadow-[0_24px_70px_rgba(2,6,23,0.8)]'
        data-detail-modal-shell=''
        onKeyDown={handlePanelKeyDown}
        ref={panelRef}
        role='dialog'
        style={getDescriptionFontScaleStyle(preferences.shared.fontScale)}
      >
        <div className='absolute top-3 right-3 z-10 flex items-center gap-1.5' ref={settingsRef}>
          <button
            aria-expanded={isSettingsOpen}
            aria-label='Open detail settings'
            className='inline-flex h-8 w-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100'
            data-detail-settings-trigger=''
            onClick={() => {
              setIsSettingsOpen((previous) => !previous)
            }}
            type='button'
          >
            <FaGear className='h-3.5 w-3.5' />
          </button>
          <button
            aria-label={`Close ${kind} detail`}
            className='inline-flex h-8 w-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100'
            onClick={onClose}
            type='button'
          >
            <FaXmark className='h-4 w-4' />
          </button>
          {isSettingsOpen ? (
            <DatabaseDetailSettingsPanel
              onUpdateSharedPreferences={updateSharedPreferences}
              sharedPreferences={preferences.shared}
            />
          ) : null}
        </div>

        <DatabasePopoverContext.Provider value={popoverController.contextValue}>
          <aside className='hidden w-[21rem] shrink-0 overflow-hidden bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.99))] md:block'>
            {artAsset ? (
              <button
                aria-label={`View full art for ${item.name}`}
                className='relative h-full w-full overflow-hidden'
                onClick={() => {
                  setIsArtViewerOpen(true)
                }}
                type='button'
              >
                <img
                  alt=''
                  className={`h-full w-full ${kind === 'posse' ? 'object-cover' : 'object-contain p-2'}`}
                  draggable={false}
                  src={artAsset}
                />
                {kind === 'posse' ? (
                  <div
                    aria-hidden
                    className='pointer-events-none absolute inset-y-0 right-0 left-0 bg-[linear-gradient(90deg,#020617_0%,transparent_16%,transparent_84%,#020617_100%)]'
                  />
                ) : null}
              </button>
            ) : null}
          </aside>

          <div className='flex min-h-0 min-w-0 flex-1 flex-col px-4 py-4 pr-12 sm:px-5 sm:py-5 md:px-6 md:py-5'>
            <div className='shrink-0 border-b border-slate-800/75 pb-5'>
              <div className='flex items-center gap-4'>
                {headerIconAsset ? (
                  <button
                    aria-label={`View full art for ${item.name}`}
                    className='h-16 w-16 shrink-0 overflow-visible'
                    onClick={() => {
                      setIsArtViewerOpen(true)
                    }}
                    type='button'
                  >
                    <img
                      alt=''
                      className={`h-full w-full object-contain ${kind === 'covenant' ? 'scale-150' : ''}`}
                      draggable={false}
                      src={headerIconAsset}
                    />
                  </button>
                ) : null}
                <div className='min-w-0'>
                  <h3 className={DATABASE_DETAIL_HEADER_TITLE_CLASS}>{item.name}</h3>
                  {kind === 'posse' ? (
                    <PosseMeta
                      fullDataV2={fullDataV2}
                      onSelectAwakener={onSelectAwakener}
                      posse={item}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className='database-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-6 pl-2'>
              {descriptions.map((entry) => (
                <section className='mt-5' key={entry.record.id}>
                  <h4
                    className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
                    style={getDatabaseDetailSectionHeadingStyle()}
                  >
                    {entry.heading}
                  </h4>
                  <p
                    className={`mt-3 max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
                    style={getDatabaseDetailBodyStyle()}
                  >
                    <RichDescription
                      formulaContext={formulaContext}
                      record={entry.record}
                      referenceLayer={referenceLayer}
                      showTagIcons={preferences.shared.showTagIcons}
                    />
                  </p>
                </section>
              ))}

              {fullDataV2.lore ? (
                <section className='mt-5 border-t border-slate-800/80 pt-4'>
                  <h4
                    className={DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS}
                    style={getDatabaseDetailSectionHeadingStyle()}
                  >
                    Lore
                  </h4>
                  <WheelLoreText defaultExpanded lore={fullDataV2.lore} previewLineCount={999} />
                </section>
              ) : null}
            </div>
            <Suspense fallback={null}>
              <DatabasePopoverRoot
                {...popoverController.popoverRootProps}
                fontScale={preferences.shared.fontScale}
                showTagIcons={preferences.shared.showTagIcons}
              />
            </Suspense>
          </div>
        </DatabasePopoverContext.Provider>

        {isArtViewerOpen && artAsset ? (
          <DatabaseArtViewerOverlay
            alt={fullArtAlt}
            onClose={() => {
              setIsArtViewerOpen(false)
            }}
            src={artAsset}
          />
        ) : null}
      </div>
    </div>
  )
}

function PosseMeta({
  fullDataV2,
  onSelectAwakener,
  posse,
}: {
  fullDataV2: PosseFullV2Record
  posse: Posse
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
}) {
  const realmAccent = getRealmAccent(posse.realm)
  const realmLabel = posse.isFadedLegacy ? 'Faded Legacy' : getRealmLabel(posse.realm)

  return (
    <p className={`${DATABASE_DETAIL_META_ROW_CLASS} ${DATABASE_DETAIL_HEADER_META_CLASS}`}>
      <span className={DATABASE_DETAIL_META_PRIMARY_CLASS} style={{color: realmAccent}}>
        {realmLabel}
      </span>
      {fullDataV2.ownerAwakenerId && fullDataV2.ownerAwakenerName ? (
        <>
          <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
          <button
            className={DATABASE_DETAIL_META_LINK_CLASS}
            onClick={() => {
              onSelectAwakener?.(
                {id: fullDataV2.ownerAwakenerId ?? '', name: fullDataV2.ownerAwakenerName ?? ''},
                'overview',
              )
            }}
            type='button'
          >
            {fullDataV2.ownerAwakenerName}
          </button>
        </>
      ) : null}
    </p>
  )
}
