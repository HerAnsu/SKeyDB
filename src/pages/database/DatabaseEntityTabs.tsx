import {NavLink} from 'react-router-dom'

import {buildDatabaseEntityBrowsePath} from '@/domain/database-entity-paths'

interface DatabaseEntityTabsProps {
  activeEntity: 'awakeners' | 'wheels'
  search: string
}

export function DatabaseEntityTabs({activeEntity, search}: DatabaseEntityTabsProps) {
  return (
    <nav aria-label='Database entities' className='flex items-center gap-1.5'>
      <NavLink
        className={buildTabClassName(activeEntity === 'awakeners')}
        to={{pathname: buildDatabaseEntityBrowsePath('awakeners'), search}}
      >
        Awakeners
      </NavLink>
      <NavLink
        className={buildTabClassName(activeEntity === 'wheels')}
        to={{pathname: buildDatabaseEntityBrowsePath('wheels'), search}}
      >
        Wheels
      </NavLink>
    </nav>
  )
}

function buildTabClassName(active: boolean) {
  return `border px-3 py-1.5 text-[11px] tracking-wide uppercase transition-colors ${
    active
      ? 'border-amber-200/70 bg-slate-900/60 text-amber-100'
      : 'border-slate-500/40 text-slate-300 hover:border-amber-200/50 hover:bg-slate-900/45 hover:text-slate-100'
  }`
}
