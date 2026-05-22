import type {BuilderV2SlotView} from './useBuilderV2Model'

interface BuilderV2TeamSlotsProps {
  slots: BuilderV2SlotView[]
  onClearCovenant: (slotId: string) => void
  onClearWheel: (slotId: string, wheelIndex: 0 | 1) => void
  onRemoveAwakener: (slotId: string) => void
  onSelectCovenantSlot: (slotId: string) => void
  onSelectSlot: (slotId: string) => void
  onSelectWheelSlot: (slotId: string, wheelIndex: 0 | 1) => void
}

export function BuilderV2TeamSlots({
  onClearCovenant,
  onClearWheel,
  slots,
  onRemoveAwakener,
  onSelectCovenantSlot,
  onSelectSlot,
  onSelectWheelSlot,
}: BuilderV2TeamSlotsProps) {
  return (
    <div className='builder-v2-slot-grid' aria-label='Builder V2 active team slots'>
      {slots.map((slot) => (
        <article
          className={`builder-v2-slot-card ${slot.isSelected ? 'builder-v2-slot-card--active' : ''}`}
          data-slot-id={slot.slotId}
          key={slot.slotId}
        >
          <button
            aria-label={`Select ${slot.slotLabel}`}
            aria-pressed={slot.isSelected}
            className='builder-v2-slot-button'
            onClick={() => {
              onSelectSlot(slot.slotId)
            }}
            type='button'
          >
            <span className='builder-v2-label'>{slot.slotLabel}</span>
            <span className='builder-v2-art-well'>
              {slot.awakener?.portraitSrc ? (
                <img
                  alt={`${slot.awakener.displayName} portrait`}
                  draggable={false}
                  src={slot.awakener.portraitSrc}
                />
              ) : slot.awakener ? (
                <span aria-hidden className='builder-v2-empty-mark'>
                  {slot.awakener.displayName.slice(0, 1)}
                </span>
              ) : (
                <span aria-hidden className='builder-v2-empty-mark'>
                  +
                </span>
              )}
            </span>
            <span className='builder-v2-slot-name ui-title'>
              {slot.awakener?.displayName ?? 'Empty Slot'}
            </span>
            <span className='builder-v2-slot-meta'>
              {slot.awakener
                ? `Lv. ${String(slot.awakener.level)} - ${slot.awakener.realm}`
                : 'Select an awakener'}
            </span>
          </button>

          <div className='builder-v2-equipment-strip' aria-label={`${slot.slotLabel} loadout`}>
            {slot.wheelSlots.map((wheelSlot) => (
              <div
                className={`builder-v2-equipment-slot ${wheelSlot.isSelected ? 'builder-v2-equipment-slot--active' : ''}`}
                key={`${slot.slotId}-wheel-${String(wheelSlot.wheelIndex)}`}
              >
                <button
                  aria-label={`Select ${wheelSlot.label}`}
                  aria-pressed={wheelSlot.isSelected}
                  className='builder-v2-equipment-target'
                  onClick={() => {
                    onSelectWheelSlot(slot.slotId, wheelSlot.wheelIndex)
                  }}
                  type='button'
                >
                  <span className='builder-v2-label'>W{String(wheelSlot.wheelIndex + 1)}</span>
                  <span className='builder-v2-equipment-value'>
                    {wheelSlot.wheelName ?? '+'}
                  </span>
                </button>
                {wheelSlot.wheelId ? (
                  <button
                    aria-label={`Clear ${wheelSlot.label}`}
                    className='builder-v2-equipment-clear'
                    onClick={() => {
                      onClearWheel(slot.slotId, wheelSlot.wheelIndex)
                    }}
                    type='button'
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            ))}
            <div
              className={`builder-v2-equipment-slot ${slot.isCovenantSelected ? 'builder-v2-equipment-slot--active' : ''}`}
            >
              <button
                aria-label={`Select ${slot.slotLabel} Covenant`}
                aria-pressed={slot.isCovenantSelected}
                className='builder-v2-equipment-target'
                onClick={() => {
                  onSelectCovenantSlot(slot.slotId)
                }}
                type='button'
              >
                <span className='builder-v2-label'>Covenant</span>
                <span className='builder-v2-equipment-value'>{slot.covenantName ?? '+'}</span>
              </button>
              {slot.covenantId ? (
                <button
                  aria-label={`Clear ${slot.slotLabel} Covenant`}
                  className='builder-v2-equipment-clear'
                  onClick={() => {
                    onClearCovenant(slot.slotId)
                  }}
                  type='button'
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {slot.awakener ? (
            <button
              className='builder-v2-remove-button'
              onClick={() => {
                onRemoveAwakener(slot.slotId)
              }}
              type='button'
            >
              Remove {slot.awakener.displayName}
            </button>
          ) : null}
        </article>
      ))}
    </div>
  )
}
