import type { AwakenerFull } from '../../domain/awakeners-full'

type AwakenerDetailEnlightensProps = {
  fullData: AwakenerFull | null
}

const ENLIGHTEN_ORDER = ['E1', 'E2', 'E3'] as const

export function AwakenerDetailEnlightens({ fullData }: AwakenerDetailEnlightensProps) {
  if (!fullData) {
    return <p className="py-4 text-xs text-slate-400">Loading enlighten data...</p>
  }

  return (
    <div className="space-y-3">
      {ENLIGHTEN_ORDER.map((key) => {
        const enlighten = fullData.enlightens[key]
        if (!enlighten) return null

        return (
          <div
            className="border border-slate-600/40 bg-slate-900/40 p-3"
            key={key}
          >
            <div className="flex items-baseline justify-between">
              <h4 className="ui-title text-sm text-amber-100">{enlighten.name}</h4>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{key}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              {enlighten.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
