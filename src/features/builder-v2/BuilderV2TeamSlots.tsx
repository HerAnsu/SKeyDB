import type {BuilderV2SlotView} from './useBuilderV2Model'

interface BuilderV2TeamSlotsProps {
  slots: BuilderV2SlotView[]
  onRemoveAwakener: (slotId: string) => void
  onSelectSlot: (slotId: string) => void
}

export function BuilderV2TeamSlots({
  slots,
  onRemoveAwakener,
  onSelectSlot,
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
            {slot.wheels.map((wheelId, index) => (
              <span
                className='builder-v2-equipment-slot'
                key={`${slot.slotId}-wheel-${String(index)}`}
              >
                <span className='builder-v2-label'>W{String(index + 1)}</span>
                <span>{wheelId ? 'Set' : '+'}</span>
              </span>
            ))}
            <span className='builder-v2-equipment-slot'>
              <span className='builder-v2-label'>Covenant</span>
              <span>{slot.covenantId ? 'Set' : '+'}</span>
            </span>
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
