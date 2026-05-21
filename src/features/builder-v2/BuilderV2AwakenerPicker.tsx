import type {BuilderV2AwakenerOption} from './useBuilderV2Model'

interface BuilderV2AwakenerPickerProps {
  awakeners: BuilderV2AwakenerOption[]
  searchQuery: string
  onAssignAwakener: (awakenerId: string) => void
  onSearchChange: (nextQuery: string) => void
}

const pickerTabs = ['Awakeners', 'Wheels', 'Covenants', 'Posses']

export function BuilderV2AwakenerPicker({
  awakeners,
  searchQuery,
  onAssignAwakener,
  onSearchChange,
}: BuilderV2AwakenerPickerProps) {
  return (
    <aside className='builder-v2-panel builder-v2-armory' aria-label='Builder V2 armory'>
      <div className='builder-v2-section-header'>
        <div>
          <p className='builder-v2-label'>Armory</p>
          <h2 className='ui-title'>Picker</h2>
        </div>
      </div>

      <div className='builder-v2-picker-tabs' role='tablist' aria-label='Picker categories'>
        {pickerTabs.map((tab, index) => (
          <button
            aria-selected={index === 0}
            className={`builder-v2-tab ${index === 0 ? 'builder-v2-tab--active' : ''}`}
            disabled={index !== 0}
            key={tab}
            role='tab'
            type='button'
          >
            {tab}
          </button>
        ))}
      </div>

      <label className='builder-v2-search-label'>
        <span className='sr-only'>Search awakeners</span>
        <input
          className='builder-v2-search'
          onChange={(event) => {
            onSearchChange(event.target.value)
          }}
          placeholder='Search awakeners'
          type='search'
          value={searchQuery}
        />
      </label>

      <div className='builder-v2-picker-results' role='list'>
        {awakeners.map((awakener) => (
          <button
            className='builder-v2-picker-row'
            data-in-use={awakener.inUse}
            key={awakener.id}
            onClick={() => {
              onAssignAwakener(awakener.id)
            }}
            type='button'
          >
            <span className='builder-v2-picker-portrait'>
              {awakener.portraitSrc ? (
                <img
                  alt={`${awakener.displayName} portrait`}
                  draggable={false}
                  src={awakener.portraitSrc}
                />
              ) : (
                <span aria-hidden className='builder-v2-empty-mark'>
                  {awakener.displayName.slice(0, 1)}
                </span>
              )}
            </span>
            <span className='builder-v2-picker-copy'>
              <span className='builder-v2-picker-name ui-title'>{awakener.displayName}</span>
              <span className='builder-v2-picker-meta'>
                {awakener.realm}
                {awakener.inUse ? ' - In use' : ''}
              </span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
