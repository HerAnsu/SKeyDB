import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {FaBars, FaTag, FaXmark} from 'react-icons/fa6'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
  resolveAwakenerStatsForLevel,
} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import {getAwakenerFullById, loadAwakenersFull, type AwakenerFull} from '@/domain/awakeners-full'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getCardNamesFromFull} from '@/domain/rich-text'

import {MODAL_GRADIENT_VARIANTS, TABS, type TabId} from '../../constants'
import {
  FONT_SCALE_OPTIONS,
  FONT_SCALE_VALUES,
  readFontScale,
  writeFontScale,
  type FontScale,
} from '../../utils/font-scale'
import {buildModalBackground, getModalBackgroundVariantIndex} from '../../utils/modal-background'
import {AwakenerBuildsTab} from './AwakenerBuildsTab'
import {AwakenerDetailCards} from './AwakenerDetailCards'
import {AwakenerDetailOverview} from './AwakenerDetailOverview'
import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {AwakenerTeamsTab} from './AwakenerTeamsTab'

type AwakenerDetailModalProps = Readonly<{
  awakener: Awakener
  onClose: () => void
  initialTab?: TabId
  onTabChange?: (tab: TabId) => void
}>

export function AwakenerDetailModal({
  awakener,
  onClose,
  initialTab,
  onTabChange,
}: AwakenerDetailModalProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>('cards')
  const [fullData, setFullData] = useState<AwakenerFull | null>(null)
  const [awakenerLevel, setAwakenerLevel] = useState(60)
  const [psycheSurgeOffset, setPsycheSurgeOffset] = useState(0)
  const [skillLevel, setSkillLevel] = useState(1)
  const [fontScale, setFontScale] = useState<FontScale>(readFontScale)
  const [isScalingMenuOpen, setIsScalingMenuOpen] = useState(false)
  const [isTagsMenuOpen, setIsTagsMenuOpen] = useState(false)
  const scalingMenuRef = useRef<HTMLDivElement>(null)
  const tagsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scalingMenuRef.current && !scalingMenuRef.current.contains(event.target as Node)) {
        setIsScalingMenuOpen(false)
      }
      if (tagsMenuRef.current && !tagsMenuRef.current.contains(event.target as Node)) {
        setIsTagsMenuOpen(false)
      }
    }
    if (isScalingMenuOpen || isTagsMenuOpen) {
      globalThis.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      globalThis.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isScalingMenuOpen, isTagsMenuOpen])

  const backgroundVariant = useMemo(() => getModalBackgroundVariantIndex(awakener), [awakener])
  const handleFontScaleChange = useCallback((fs: FontScale) => {
    setFontScale(fs)
    writeFontScale(fs)
  }, [])
  const panelRef = useRef<HTMLDialogElement>(null)
  const cardNames = useMemo(() => {
    return fullData ? getCardNamesFromFull(fullData) : new Set<string>()
  }, [fullData])

  const resolvedStats = useMemo(() => {
    return fullData
      ? resolveAwakenerStatsForLevel(fullData, awakenerLevel, psycheSurgeOffset)
      : null
  }, [awakenerLevel, fullData, psycheSurgeOffset])

  const activeTab = initialTab ?? internalActiveTab

  const setActiveTab = useCallback(
    (nextTab: TabId) => {
      if (initialTab === undefined) {
        setInternalActiveTab(nextTab)
      }
      onTabChange?.(nextTab)
    },
    [initialTab, onTabChange],
  )

  const navigateToCards = useCallback(() => {
    setActiveTab('cards')
  }, [setActiveTab])

  const handleAwakenerLevelChange = useCallback((level: number) => {
    setAwakenerLevel(clampAwakenerDatabaseLevel(level))
  }, [])

  const handleIncreasePsycheSurge = useCallback(() => {
    setPsycheSurgeOffset((prev) => clampAwakenerDatabasePsycheSurgeOffset(prev + 1))
  }, [])

  const handleDecreasePsycheSurge = useCallback(() => {
    setPsycheSurgeOffset((prev) => clampAwakenerDatabasePsycheSurgeOffset(prev - 1))
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadAwakenersFull()
      .then((data) => {
        if (!cancelled) {
          setFullData(getAwakenerFullById(awakener.id, data) ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFullData(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [awakener.id])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    globalThis.addEventListener('keydown', handleEscape)
    return () => {
      globalThis.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--desc-font-scale',
      String(FONT_SCALE_VALUES[fontScale]),
    )
    return () => {
      document.documentElement.style.removeProperty('--desc-font-scale')
    }
  }, [fontScale])

  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmTint = getRealmTint(awakener.realm)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const portrait = getAwakenerPortraitAsset(awakener.name)
  const backgroundByVariant = useMemo(() => {
    return buildModalBackground(
      realmTint,
      MODAL_GRADIENT_VARIANTS[backgroundVariant] ?? MODAL_GRADIENT_VARIANTS[0],
    )
  }, [backgroundVariant, realmTint])
  const modalChromeStyle = useMemo(
    () =>
      ({
        '--modal-realm-tint': realmTint,
        '--modal-realm-border': `color-mix(in srgb, ${realmTint} 88%, #f6d28b)`,
        '--modal-realm-border-bottom': `color-mix(in srgb, ${realmTint} 42%, #1e293b)`,
        '--modal-realm-border-soft': `color-mix(in srgb, ${realmTint} 54%, rgba(148, 163, 184, 0.55))`,
        '--modal-realm-tab': `color-mix(in srgb, ${realmTint} 84%, #f8e3aa)`,
        background: backgroundByVariant,
        borderColor: `var(--modal-realm-border)`,
        borderImageSlice: 1,
        borderImageSource:
          'linear-gradient(180deg, var(--modal-realm-border) 0%, color-mix(in srgb, var(--modal-realm-border) 84%, var(--modal-realm-border-bottom)) 24%, color-mix(in srgb, var(--modal-realm-border) 56%, var(--modal-realm-border-bottom)) 62%, var(--modal-realm-border-bottom) 100%)',
        boxShadow: `
          0 22px 64px rgba(2, 6, 23, 0.78),
          0 0 0 1px color-mix(in srgb, ${realmTint} 34%, transparent),
          inset 0 1px 0 color-mix(in srgb, ${realmTint} 28%, rgba(255,255,255,0.06))
        `,
      }) as React.CSSProperties,
    [backgroundByVariant, realmTint],
  )

  return (
    <div className='fixed inset-0 z-900 flex items-center justify-center bg-slate-950/65 p-4 md:p-6 lg:p-10'>
      <button
        aria-label='Close detail overlay'
        className='absolute inset-0'
        onClick={onClose}
        type='button'
      />
      <dialog
        aria-label={`${displayName} details`}
        className='relative z-901 flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border bg-slate-950/97'
        open
        ref={panelRef}
        style={modalChromeStyle}
      >
        <div className='absolute top-3 right-3 z-20 flex items-center gap-4'>
          {awakener.tags.length > 0 && (
            <div className='relative flex items-center' ref={tagsMenuRef}>
              <button
                aria-label='Tags menu'
                className={`flex h-8 items-center gap-2.5 transition-all ${
                  isTagsMenuOpen ? 'text-amber-100' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => {
                  setIsTagsMenuOpen((prev) => !prev)
                }}
                type='button'
              >
                <span className='hidden text-[10px] font-bold tracking-widest uppercase lg:block'>
                  Tags
                </span>
                <FaTag className='h-4 w-4 shrink-0' />
              </button>

              {isTagsMenuOpen && (
                <div className='absolute top-full right-0 mt-2 w-48 origin-top-right border border-white/10 bg-slate-950/90 p-1 shadow-2xl backdrop-blur-md'>
                  <div className='flex flex-col gap-0.5'>
                    {awakener.tags.map((tag) => (
                      <button
                        className='w-full px-3 py-2 text-center text-[11px] font-medium text-slate-400 uppercase transition-colors hover:bg-white/5 hover:text-amber-100'
                        key={tag}
                        onClick={() => {
                          // Placeholder for future sorting/filtering
                          setIsTagsMenuOpen(false)
                        }}
                        type='button'
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='relative flex items-center' ref={scalingMenuRef}>
            <button
              aria-label='Interface settings'
              className={`flex h-8 items-center gap-2.5 transition-all ${
                isScalingMenuOpen ? 'text-amber-100' : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => {
                setIsScalingMenuOpen((prev) => !prev)
              }}
              type='button'
            >
              <span className='hidden text-[10px] font-bold tracking-widest uppercase lg:block'>
                Interface
              </span>
              <FaBars className='h-4 w-4 shrink-0' />
            </button>

            {isScalingMenuOpen && (
              <div className='absolute top-full right-0 mt-2 w-32 origin-top-right border border-white/10 bg-slate-950/90 p-1 shadow-2xl backdrop-blur-md'>
                <div className='flex flex-col gap-0.5'>
                  {FONT_SCALE_OPTIONS.map((fs) => (
                    <button
                      className={`flex w-full items-center justify-center px-3 py-2 text-center text-[11px] transition-colors ${
                        fontScale === fs.id
                          ? 'bg-amber-500/10 text-amber-100'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                      key={fs.id}
                      onClick={() => {
                        handleFontScaleChange(fs.id)
                        setIsScalingMenuOpen(false)
                      }}
                      type='button'
                    >
                      <span className='font-medium capitalize'>{fs.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            aria-label='Close detail'
            className='flex h-8 w-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100'
            onClick={onClose}
            type='button'
          >
            <FaXmark className='h-4 w-4' />
          </button>
        </div>

        <div className='flex min-h-0 flex-1'>
          <aside className='database-scrollbar hidden w-56 shrink-0 overflow-y-auto py-4 pr-2 pl-4 md:block lg:w-64'>
            <AwakenerDetailSidebar
              awakener={awakener}
              enlightenOffset={psycheSurgeOffset}
              level={awakenerLevel}
              onDecreaseEnlighten={handleDecreasePsycheSurge}
              onIncreaseEnlighten={handleIncreasePsycheSurge}
              onLevelChange={handleAwakenerLevelChange}
              onSkillLevelChange={setSkillLevel}
              skillLevel={skillLevel}
              stats={resolvedStats}
              substatScaling={fullData?.substatScaling ?? null}
            />
          </aside>

          <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
            <div className='shrink-0 px-3 pt-5 pb-0'>
              {awakener.unreleased ? (
                <div className='mb-3 border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
                  <p className='text-[11px] leading-relaxed text-amber-100/75'>
                    <strong className='font-semibold text-amber-200/90'>Pre-release data:</strong>{' '}
                    Values and content are based on pre-release information and may change before or
                    after release.
                  </p>
                </div>
              ) : null}

              <div className='flex flex-col lg:flex-row lg:items-end lg:justify-between'>
                <div className='flex min-w-0 flex-1 items-start gap-3'>
                  <div className='h-11 w-11 shrink-0 overflow-hidden border border-slate-500/40 bg-linear-to-b from-slate-800 to-slate-900 lg:hidden'>
                    {portrait ? (
                      <img
                        alt=''
                        className='h-full w-full object-cover object-top'
                        draggable={false}
                        src={portrait}
                      />
                    ) : (
                      <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
                    )}
                  </div>

                  <div className='min-w-0 flex-1 pb-2 lg:pb-2'>
                    <div className='flex items-center gap-2'>
                      <h3 className='ui-title text-[1.85rem] leading-none text-amber-200/90 md:text-[2.5rem] lg:text-[2.8rem]'>
                        {displayName}
                      </h3>
                    </div>
                    <p className='mt-1 flex items-center text-[11px] tracking-[0.07em] text-slate-300 md:text-[14px] lg:mt-1.5 lg:text-[13px]'>
                      {realmIcon ? (
                        <img
                          alt=''
                          className='mr-2 h-5 w-5 shrink-0 md:mr-1.5 md:h-6 md:w-6 lg:h-7 lg:w-7'
                          draggable={false}
                          src={realmIcon}
                        />
                      ) : null}
                      <span className='font-semibold uppercase' style={{color: realmTint}}>
                        {realmLabel}
                      </span>
                      <span className='mx-1.5 text-slate-600 md:mx-2'>·</span>
                      <span className='font-medium text-slate-200/90 uppercase'>
                        {awakener.type
                          ? awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()
                          : '—'}
                      </span>
                      <span className='mx-1.5 text-slate-600 md:mx-2'>·</span>
                      <span className='font-medium text-slate-200/80 uppercase'>
                        {awakener.faction}
                      </span>
                    </p>
                  </div>
                </div>

                <div className='relative mt-2 flex w-full justify-center lg:mt-0 lg:-mb-px lg:w-auto lg:justify-end'>
                  <nav className='flex w-full min-w-0 flex-row justify-center gap-0.5 lg:w-auto lg:flex-none'>
                    {TABS.map((tab) => (
                      <button
                        className={`flex-1 border-b-2 px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase transition-colors sm:px-3.5 sm:text-[11px] lg:px-6 lg:py-2.5 lg:text-[13px] ${
                          activeTab === tab.id
                            ? 'text-amber-100'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                        }}
                        style={
                          activeTab === tab.id ? {borderColor: 'var(--modal-realm-tab)'} : undefined
                        }
                        type='button'
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              <div
                className='mt-1 h-px w-full lg:mt-0'
                style={{
                  background:
                    'linear-gradient(90deg, rgba(100, 116, 139, 0.18) 0%, rgba(100, 116, 139, 0.1) 52%, transparent 100%)',
                }}
              />
            </div>

            <div className='database-scrollbar flex-1 overflow-y-auto px-3 pt-3 pr-3 pb-4 lg:pr-4'>
              <div className='mb-4 md:hidden'>
                <AwakenerDetailSidebar
                  awakener={awakener}
                  compact
                  enlightenOffset={psycheSurgeOffset}
                  level={awakenerLevel}
                  onDecreaseEnlighten={handleDecreasePsycheSurge}
                  onIncreaseEnlighten={handleIncreasePsycheSurge}
                  onLevelChange={handleAwakenerLevelChange}
                  onSkillLevelChange={setSkillLevel}
                  skillLevel={skillLevel}
                  stats={resolvedStats}
                  substatScaling={fullData?.substatScaling ?? null}
                />
              </div>

              <div className='database-tab-content w-full transition-all duration-200 ease-in-out'>
                {activeTab === 'copies' && (
                  <AwakenerDetailOverview
                    awakener={awakener}
                    cardNames={cardNames}
                    fullData={fullData}
                    onNavigateToCards={navigateToCards}
                    skillLevel={skillLevel}
                    fontScale={fontScale}
                    stats={resolvedStats}
                    mode='copies'
                  />
                )}
                {activeTab === 'talents' && (
                  <AwakenerDetailOverview
                    awakener={awakener}
                    cardNames={cardNames}
                    fullData={fullData}
                    onNavigateToCards={navigateToCards}
                    skillLevel={skillLevel}
                    fontScale={fontScale}
                    stats={resolvedStats}
                    mode='talents'
                  />
                )}
                {activeTab === 'cards' && (
                  <AwakenerDetailCards
                    awakener={awakener}
                    cardNames={cardNames}
                    fullData={fullData}
                    skillLevel={skillLevel}
                    stats={resolvedStats}
                  />
                )}
                {activeTab === 'builds' && <AwakenerBuildsTab awakenerId={awakener.id} />}
                {activeTab === 'teams' && <AwakenerTeamsTab />}
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
