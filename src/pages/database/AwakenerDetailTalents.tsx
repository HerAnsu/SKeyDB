import type { AwakenerFull } from '../../domain/awakeners-full'

type AwakenerDetailTalentsProps = {
  fullData: AwakenerFull | null
}

const TALENT_ORDER = ['T1', 'T2', 'T3'] as const

export function AwakenerDetailTalents({ fullData }: AwakenerDetailTalentsProps) {
  if (!fullData) {
    return <p className="py-4 text-xs text-slate-400">Loading talent data...</p>
  }

  return (
    <div className="space-y-3">
      {TALENT_ORDER.map((key) => {
        const talent = fullData.talents[key]
        if (!talent) return null

        return (
          <div
            className="border border-slate-600/40 bg-slate-900/40 p-3"
            key={key}
          >
            <div className="flex items-baseline justify-between">
              <h4 className="ui-title text-sm text-amber-100">{talent.name}</h4>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{key}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              {talent.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
