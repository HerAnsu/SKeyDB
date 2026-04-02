import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {FaXmark} from 'react-icons/fa6'

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

import {AwakenerBuildsTab} from './AwakenerBuildsTab'
import {AwakenerDetailCards} from './AwakenerDetailCards'
import {AwakenerDetailOverview} from './AwakenerDetailOverview'
import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {AwakenerTeamsTab} from './AwakenerTeamsTab'
import {
  FONT_SCALE_OPTIONS,
  FONT_SCALE_VALUES,
  readFontScale,
  writeFontScale,
  type FontScale,
} from './font-scale'

type AwakenerDetailModalProps = Readonly<{
  awakener: Awakener
  onClose: () => void
  initialTab?: TabId
  onTabChange?: (tab: TabId) => void
}>

const TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'cards', label: 'Cards'},
  {id: 'builds', label: 'Builds'},
  {id: 'teams', label: 'Teams'},
] as const

type TabId = (typeof TABS)[number]['id']
interface ModalGlowStop {
  position: string
  shape: 'circle' | 'ellipse'
  strength: number
  fade: number
  size?: string
}

interface ModalGradientVariant {
  angle: number
  baseStrength: number
  vignetteStrength: number
  edgeGlowStrength: number
  glows: ModalGlowStop[]
}

const MODAL_GRADIENT_VARIANTS: ModalGradientVariant[] = [
  {
    angle: 185,
    baseStrength: 5,
    vignetteStrength: 7,
    edgeGlowStrength: 7,
    glows: [
      {position: '12% 14%', shape: 'circle', strength: 7, fade: 58, size: '68% 68%'},
      {position: '84% 12%', shape: 'circle', strength: 5, fade: 52, size: '62% 62%'},
      {position: '56% 100%', shape: 'ellipse', strength: 5, fade: 66, size: '92% 42%'},
      {position: '38% 46%', shape: 'ellipse', strength: 3, fade: 54, size: '56% 34%'},
    ],
  },
  {
    angle: 158,
    baseStrength: 5,
    vignetteStrength: 7,
    edgeGlowStrength: 8,
    glows: [
      {position: '18% 12%', shape: 'ellipse', strength: 8, fade: 60, size: '78% 48%'},
      {position: '88% 18%', shape: 'circle', strength: 6, fade: 52, size: '58% 58%'},
      {position: '46% 76%', shape: 'ellipse', strength: 5, fade: 62, size: '82% 44%'},
      {position: '72% 54%', shape: 'circle', strength: 3, fade: 48, size: '42% 42%'},
    ],
  },
  {
    angle: 176,
    baseStrength: 5,
    vignetteStrength: 8,
    edgeGlowStrength: 8,
    glows: [
      {position: 'top left', shape: 'ellipse', strength: 7, fade: 62, size: '74% 44%'},
      {position: '74% 10%', shape: 'ellipse', strength: 6, fade: 52, size: '60% 34%'},
      {position: '54% 100%', shape: 'ellipse', strength: 6, fade: 66, size: '88% 40%'},
      {position: '18% 72%', shape: 'circle', strength: 3, fade: 50, size: '40% 40%'},
    ],
  },
]

function getModalBackgroundVariantIndex(awakener: Awakener): number {
  const seed = `${String(awakener.id)}:${awakener.name}`
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash % MODAL_GRADIENT_VARIANTS.length
}

function buildModalBackground(realmTint: string, variant: ModalGradientVariant): string {
  const glowLayers = variant.glows.map(
    (glow) =>
      `radial-gradient(${glow.size ?? 'auto'} at ${glow.position}, color-mix(in srgb, ${realmTint} ${String(
        glow.strength,
      )}%, transparent) 0%, transparent ${String(glow.fade)}%)`,
  )

  const edgeLayer = `radial-gradient(
    180% 140% at 50% -12%,
    color-mix(in srgb, ${realmTint} ${String(variant.edgeGlowStrength)}%, transparent) 0%,
    transparent 62%
  )`

  const vignetteLayer = `radial-gradient(
    140% 140% at 50% 50%,
    transparent 64%,
    color-mix(in srgb, #020617 ${String(variant.vignetteStrength)}%, transparent) 100%
  )`

  const baseLayer = `linear-gradient(
    ${String(variant.angle)}deg,
    color-mix(in srgb, ${realmTint} ${String(variant.baseStrength)}%, rgba(2, 6, 23, 0.982)) 0%,
    rgba(2, 6, 23, 0.975) 34%,
    rgba(2, 6, 23, 0.99) 100%
  )`

  return [edgeLayer, ...glowLayers, vignetteLayer, baseLayer].join(', ')
}

export function AwakenerDetailModal({
  awakener,
  onClose,
  initialTab,
  onTabChange,
}: AwakenerDetailModalProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>('overview')
  const [fullData, setFullData] = useState<AwakenerFull | null>(null)
  const [awakenerLevel, setAwakenerLevel] = useState(60)
  const [psycheSurgeOffset, setPsycheSurgeOffset] = useState(0)
  const [skillLevel, setSkillLevel] = useState(1)
  const [fontScale, setFontScale] = useState<FontScale>(readFontScale)
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
    <div className='fixed inset-0 z-[900] flex items-center justify-center bg-slate-950/65 p-4 md:p-6 lg:p-10'>
      <button
        aria-label='Close detail overlay'
        className='absolute inset-0'
        onClick={onClose}
        type='button'
      />
      <dialog
        aria-label={`${displayName} details`}
        className='relative z-[901] flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden border bg-slate-950/[.97]'
        open
        ref={panelRef}
        style={modalChromeStyle}
      >
        <button
          aria-label='Close detail'
          className='absolute top-3 right-3 z-10 text-slate-400 transition-colors hover:text-amber-100'
          onClick={onClose}
          type='button'
        >
          <FaXmark className='h-4 w-4' />
        </button>

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
              <div className='flex flex-col gap-2 pr-6 md:relative'>
                <div className='flex min-w-0 items-start gap-3 self-start'>
                  <div className='h-11 w-11 shrink-0 overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900 md:hidden'>
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
                  {realmIcon ? (
                    <img
                      alt=''
                      className='hidden h-12 w-12 shrink-0 md:block'
                      draggable={false}
                      src={realmIcon}
                    />
                  ) : null}
                  <div className='min-w-0 self-start pt-0'>
                    <h3 className='ui-title text-[1.75rem] leading-none text-amber-100 md:text-[2.1rem]'>
                      {displayName}
                    </h3>
                    <p className='mt-1.5 text-[12px] tracking-[0.07em] text-slate-300 md:pr-[29.5rem] md:text-[13px]'>
                      <span className='font-semibold uppercase' style={{color: realmTint}}>
                        {realmLabel}
                      </span>
                      <span className='mx-2 text-slate-600'>·</span>
                      <span className='font-medium text-slate-200/90 uppercase'>
                        {awakener.type
                          ? awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()
                          : '—'}
                      </span>
                      <span className='mx-2 text-slate-600'>·</span>
                      <span className='font-medium text-slate-200/80 uppercase'>
                        {awakener.faction}
                      </span>
                    </p>
                  </div>
                </div>
                {awakener.tags.length > 0 ? (
                  <div className='min-w-0 md:absolute md:right-6 md:bottom-0 md:w-[28rem]'>
                    <div className='database-tag-scroll flex flex-wrap content-start justify-center gap-1.5 overflow-x-hidden overflow-y-auto pr-1 md:h-[3.25rem] md:max-h-[3.25rem] md:justify-center'>
                      {awakener.tags.map((tag) => (
                        <span
                          className='border border-slate-600/35 bg-slate-800/42 px-1.5 py-0.5 text-[10px] tracking-[0.04em] text-slate-300/82 uppercase'
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className='mt-1'>
                <div className='flex items-center justify-between'>
                  <nav className='flex min-w-0 flex-wrap gap-0.5'>
                    {TABS.map((tab) => (
                      <button
                        className={`px-3.5 py-2 text-[11px] tracking-wide uppercase transition-colors ${
                          activeTab === tab.id
                            ? 'border-b-2 text-amber-100'
                            : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
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
                  <div className='hidden items-center gap-0.5 pr-1 md:flex'>
                    {FONT_SCALE_OPTIONS.map((fs) => (
                      <button
                        className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                          fontScale === fs.id
                            ? 'bg-slate-700/50 text-amber-100'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        key={fs.id}
                        onClick={() => {
                          handleFontScaleChange(fs.id)
                        }}
                        title={`Font size: ${fs.id}`}
                        type='button'
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className='mt-1 flex items-center gap-0.5 pr-1 md:hidden'>
                  {FONT_SCALE_OPTIONS.map((fs) => (
                    <button
                      className={`px-1.5 py-0.5 text-[10px] transition-colors ${
                        fontScale === fs.id
                          ? 'bg-slate-700/50 text-amber-100'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      key={fs.id}
                      onClick={() => {
                        handleFontScaleChange(fs.id)
                      }}
                      title={`Font size: ${fs.id}`}
                      type='button'
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className='mt-0 h-px w-full'
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

              <div className='database-tab-content w-full'>
                {activeTab === 'overview' && (
                  <AwakenerDetailOverview
                    awakener={awakener}
                    cardNames={cardNames}
                    fullData={fullData}
                    onNavigateToCards={navigateToCards}
                    skillLevel={skillLevel}
                    fontScale={fontScale}
                    stats={resolvedStats}
                  />
                )}
                {activeTab === 'cards' && (
                  <AwakenerDetailCards
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
