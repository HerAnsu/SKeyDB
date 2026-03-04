import type { AwakenerFull } from '../../domain/awakeners-full'

type AwakenerDetailExaltsProps = {
  fullData: AwakenerFull | null
}

export function AwakenerDetailExalts({ fullData }: AwakenerDetailExaltsProps) {
  if (!fullData) {
    return <p className="py-4 text-xs text-slate-400">Loading exalt data...</p>
  }

  const { exalt, over_exalt } = fullData.exalts

  return (
    <div className="space-y-3">
      <div className="border border-slate-600/40 bg-slate-900/40 p-3">
        <div className="flex items-baseline justify-between">
          <h4 className="ui-title text-sm text-amber-100">{exalt.name}</h4>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Exalt</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {exalt.description}
        </p>
      </div>

      <div className="border border-amber-200/20 bg-slate-900/40 p-3">
        <div className="flex items-baseline justify-between">
          <h4 className="ui-title text-sm text-amber-200/90">{over_exalt.name}</h4>
          <span className="text-[10px] uppercase tracking-wider text-amber-200/60">Over Exalt</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {over_exalt.description}
        </p>
      </div>
    </div>
  )
}
