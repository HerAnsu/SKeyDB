import type { AwakenerFull } from '../../domain/awakeners-full'

type AwakenerDetailCardsProps = {
  fullData: AwakenerFull | null
}

const CARD_ORDER = ['C1', 'C2', 'C3', 'C4', 'C5'] as const

export function AwakenerDetailCards({ fullData }: AwakenerDetailCardsProps) {
  if (!fullData) {
    return <p className="py-4 text-xs text-slate-400">Loading card data...</p>
  }

  return (
    <div className="space-y-3">
      {CARD_ORDER.map((key) => {
        const card = fullData.cards[key]
        if (!card) return null

        return (
          <div
            className="border border-slate-600/40 bg-slate-900/40 p-3"
            key={key}
          >
            <div className="flex items-baseline justify-between">
              <h4 className="ui-title text-sm text-amber-100">{card.name}</h4>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                {key} · Cost {card.cost}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              {card.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
