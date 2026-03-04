import { useEffect, useState } from 'react'
import { FaXmark } from 'react-icons/fa6'
import type { Awakener } from '../../domain/awakeners'
import { loadAwakenersFull, getAwakenerFullById, type AwakenerFull } from '../../domain/awakeners-full'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { AwakenerDetailOverview } from './AwakenerDetailOverview'
import { AwakenerDetailCards } from './AwakenerDetailCards'
import { AwakenerDetailExalts } from './AwakenerDetailExalts'
import { AwakenerDetailTalents } from './AwakenerDetailTalents'
import { AwakenerDetailEnlightens } from './AwakenerDetailEnlightens'

type AwakenerDetailModalProps = {
  awakener: Awakener
  onClose: () => void
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'cards', label: 'Cards' },
  { id: 'exalts', label: 'Exalts' },
  { id: 'talents', label: 'Talents' },
  { id: 'enlightens', label: 'Enlightens' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AwakenerDetailModal({ awakener, onClose }: AwakenerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [fullData, setFullData] = useState<AwakenerFull | null>(null)
  const [loadedId, setLoadedId] = useState<number | null>(null)

  if (loadedId !== awakener.id) {
    setLoadedId(awakener.id)
    setActiveTab('overview')
    setFullData(null)
  }

  useEffect(() => {
    let cancelled = false
    void loadAwakenersFull().then((data) => {
      if (!cancelled) {
        setFullData(getAwakenerFullById(awakener.id, data) ?? null)
      }
    })
    return () => { cancelled = true }
  }, [awakener.id])

  const displayName = formatAwakenerNameForUi(awakener.name)

  return (
    <div className="fixed inset-0 z-[900] flex items-start justify-center overflow-y-auto bg-slate-950/60 px-4 pt-12 pb-8">
      <div
        aria-label={`${displayName} details`}
        aria-modal="true"
        className="relative z-[901] w-full max-w-2xl border border-amber-200/55 bg-slate-950/[.97] shadow-[0_18px_50px_rgba(2,6,23,0.72)]"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
          <h3 className="ui-title text-lg text-amber-100">{displayName}</h3>
          <button
            aria-label="Close detail"
            className="text-slate-400 hover:text-amber-100"
            onClick={onClose}
            type="button"
          >
            <FaXmark className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex border-b border-slate-700/50">
          {TABS.map((tab) => (
            <button
              className={`px-4 py-2 text-[11px] uppercase tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-amber-200/70 text-amber-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4">
          {activeTab === 'overview' && (
            <AwakenerDetailOverview awakener={awakener} fullData={fullData} />
          )}
          {activeTab === 'cards' && (
            <AwakenerDetailCards fullData={fullData} />
          )}
          {activeTab === 'exalts' && (
            <AwakenerDetailExalts fullData={fullData} />
          )}
          {activeTab === 'talents' && (
            <AwakenerDetailTalents fullData={fullData} />
          )}
          {activeTab === 'enlightens' && (
            <AwakenerDetailEnlightens fullData={fullData} />
          )}
        </div>
      </div>
    </div>
  )
}
