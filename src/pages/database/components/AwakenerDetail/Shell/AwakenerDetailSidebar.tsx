import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {hasAwakenerSubstatScaling} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullStats, AwakenerSubstatScaling} from '@/domain/awakeners-full'
import {getMainstatIcon, type MainstatKey} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {AwakenerLevelSlider} from '../../DatabaseMain'
import {AwakenerEnlightenStepper, SkillLevelSlider} from '../Controls'

const STAT_DISPLAY_ORDER = [
  'CON',
  'ATK',
  'DEF',
  'CritRate',
  'CritDamage',
  'RealmMastery',
  'AliemusRegen',
  'KeyflareRegen',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
] as const

const STAT_LABELS: Record<string, string> = {
  CON: 'CON',
  ATK: 'ATK',
  DEF: 'DEF',
  CritRate: 'Crit Rate',
  CritDamage: 'Crit DMG',
  AliemusRegen: 'Aliemus Regen',
  KeyflareRegen: 'Keyflare Regen',
  RealmMastery: 'Realm Mastery',
  SigilYield: 'Sigil Yield',
  DamageAmplification: 'DMG Amp',
  DeathResistance: 'Death Resist',
}

const STAT_TO_MAINSTAT_KEY: Record<string, MainstatKey> = {
  CON: 'CON',
  ATK: 'ATK',
  DEF: 'DEF',
  CritRate: 'CRIT_RATE',
  CritDamage: 'CRIT_DMG',
  RealmMastery: 'REALM_MASTERY',
  AliemusRegen: 'ALIEMUS_REGEN',
  KeyflareRegen: 'KEYFLARE_REGEN',
  SigilYield: 'SIGIL_YIELD',
  DamageAmplification: 'DMG_AMP',
  DeathResistance: 'DEATH_RESISTANCE',
}

const SIDEBAR_STAT_VALUE_CLASS = 'text-slate-200'
const SIDEBAR_SCALING_VALUE_CLASS =
  'db-dash-underline db-dash-underline-hover cursor-help text-slate-200 [--db-dash-strength:24%] [--db-dash-hover-strength:36%] hover:text-slate-100'

type AwakenerDetailSidebarProps = Readonly<{
  awakener: Awakener
  enlightenOffset: number
  level: number
  onDecreaseEnlighten: () => void
  onIncreaseEnlighten: () => void
  onLevelChange: (level: number) => void
  onSkillLevelChange: (level: number) => void
  skillLevel: number
  stats: AwakenerFullStats | null
  substatScaling: AwakenerSubstatScaling | null
  compact?: boolean
}>

export function AwakenerDetailSidebar({
  awakener,
  enlightenOffset,
  level,
  onDecreaseEnlighten,
  onIncreaseEnlighten,
  onLevelChange,
  onSkillLevelChange,
  skillLevel,
  stats,
  substatScaling,
  compact,
}: AwakenerDetailSidebarProps) {
  const displayName = formatAwakenerNameForUi(awakener.name)
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const hasSubstatScaling = hasAwakenerSubstatScaling(substatScaling)
  const shouldShowPortrait = compact !== true

  return (
    <div className='flex shrink-0 flex-col gap-3'>
      {shouldShowPortrait ? (
        <div className='aspect-[2/3] w-full overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900'>
          {cardAsset ? (
            <img
              alt={`${displayName} card`}
              className='h-full w-full object-cover object-top'
              draggable={false}
              src={cardAsset}
            />
          ) : (
            <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
          )}
        </div>
      ) : null}

      <div
        className={`border border-slate-600/30 bg-slate-900/30 ${
          compact ? 'px-3 py-3' : 'px-3.5 py-3'
        }`}
      >
        <div className={`mb-3 ${compact ? 'space-y-2.5' : 'space-y-3'}`}>
          <div className='flex items-center justify-between gap-3'>
            <h4 className='ui-title text-[11px] tracking-wide text-slate-400 uppercase'>
              Attributes
            </h4>
            {hasSubstatScaling ? (
              <AwakenerEnlightenStepper
                offset={enlightenOffset}
                onDecrease={onDecreaseEnlighten}
                onIncrease={onIncreaseEnlighten}
              />
            ) : null}
          </div>
          <div className={compact ? 'space-y-2.5' : 'space-y-2'}>
            <AwakenerLevelSlider level={level} onChange={onLevelChange} />
            <SkillLevelSlider level={skillLevel} onChange={onSkillLevelChange} />
          </div>
        </div>

        {stats ? (
          <div className={compact ? 'grid grid-cols-2 gap-x-4 gap-y-1' : 'space-y-1'}>
            {STAT_DISPLAY_ORDER.map((key) => {
              const value = stats[key]
              const scaledSubstat = substatScaling?.[key as keyof AwakenerSubstatScaling]
              const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
              const icon = getMainstatIcon(mainstatKey)
              const statTitle = scaledSubstat
                ? `Level scaling: +${scaledSubstat} per 10 levels to Lv. 60`
                : undefined
              return (
                <div className='flex items-center justify-between gap-3 text-[11px]' key={key}>
                  <span className='flex items-center gap-1.5 text-slate-500'>
                    {icon ? (
                      <img
                        alt=''
                        className='h-3.5 w-3.5 object-contain opacity-60'
                        draggable={false}
                        src={icon}
                      />
                    ) : null}
                    {STAT_LABELS[key]}
                  </span>
                  <span
                    className={
                      scaledSubstat ? SIDEBAR_SCALING_VALUE_CLASS : SIDEBAR_STAT_VALUE_CLASS
                    }
                    title={statTitle}
                  >
                    {value}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className='text-[11px] text-slate-500'>Loading...</p>
        )}
        {hasSubstatScaling ? (
          <p className='mt-2.5 text-[10px] leading-relaxed text-slate-500'>
            Secondary stat bonuses increase every 10 levels (1-60). Psyche Surge bonuses shown from
            E3+0 to E3+12.
          </p>
        ) : null}
      </div>
    </div>
  )
}
