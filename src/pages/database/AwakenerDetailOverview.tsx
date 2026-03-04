import { getAwakenerPortraitAsset } from '../../domain/awakener-assets'
import { getRealmTint } from '../../domain/factions'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import type { Awakener } from '../../domain/awakeners'
import type { AwakenerFull } from '../../domain/awakeners-full'

type AwakenerDetailOverviewProps = {
  awakener: Awakener
  fullData: AwakenerFull | null
}

const STAT_DISPLAY_ORDER = [
  'CON',
  'ATK',
  'DEF',
  'CritRate',
  'CritDamage',
  'AliemusRegen',
  'KeyflareRegen',
  'RealmMastery',
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

export function AwakenerDetailOverview({ awakener, fullData }: AwakenerDetailOverviewProps) {
  const portrait = getAwakenerPortraitAsset(awakener.name)
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmTint = getRealmTint(awakener.realm)

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-full sm:w-40 shrink-0">
        <div className="aspect-square overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900">
          {portrait ? (
            <img
              alt={`${displayName} portrait`}
              className="h-full w-full object-cover object-top"
              src={portrait}
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]" />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <h3 className="ui-title text-lg text-amber-100">{displayName}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span style={{ color: realmTint }}>{awakener.realm}</span>
            <span className="text-slate-500">·</span>
            <span>{awakener.type ?? '—'}</span>
            <span className="text-slate-500">·</span>
            <span>{awakener.faction}</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-200/80">{awakener.rarity ?? '—'}</span>
          </div>
        </div>

        {fullData ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {STAT_DISPLAY_ORDER.map((key) => {
              const value = fullData.stats[key]
              return (
                <div className="flex justify-between border-b border-slate-700/40 py-0.5" key={key}>
                  <span className="text-slate-400">{STAT_LABELS[key]}</span>
                  <span className="text-slate-200">{value}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Loading stats...</p>
        )}

        {awakener.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {awakener.tags.map((tag) => (
              <span
                className="border border-slate-600/40 bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-300"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
