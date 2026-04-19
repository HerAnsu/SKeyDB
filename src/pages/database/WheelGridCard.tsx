import {getRealmTint} from '@/domain/factions'
import {getMainstatIcon} from '@/domain/mainstats'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface WheelGridCardProps {
  wheel: Wheel
  index: number
  onSelect: (wheelId: string) => void
}

export function WheelGridCard({wheel, index, onSelect}: WheelGridCardProps) {
  const asset = getWheelAssetById(wheel.id)
  const realmTint = getRealmTint(wheel.realm)
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const prioritizeImage = index < PRIORITIZED_GRID_IMAGE_COUNT

  return (
    <article className='collection-item-card group/card p-1'>
      <div
        className='relative aspect-[5/9] overflow-hidden p-[1px] transition-[transform,box-shadow] duration-300'
        style={
          {
            '--realm-color': realmTint,
            background: `linear-gradient(to bottom, var(--realm-color), #475569)`,
          } as React.CSSProperties
        }
      >
        <div className='relative h-full w-full overflow-hidden bg-slate-900 transition-colors duration-300'>
          <button
            aria-label={`View details for ${wheel.name}`}
            className='absolute inset-0 z-30 cursor-pointer transition-[background-color,box-shadow] duration-300 group-hover/card:bg-white/5 group-hover/card:shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none focus-visible:ring-inset'
            onClick={() => {
              onSelect(wheel.id)
            }}
            type='button'
          />

          {asset ? (
            <img
              alt={wheel.name}
              className='h-full w-full object-cover'
              decoding='async'
              draggable={false}
              fetchPriority={prioritizeImage ? 'high' : 'low'}
              loading={prioritizeImage ? 'eager' : 'lazy'}
              src={asset}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-500'>
              No Image
            </div>
          )}

          <div className='pointer-events-none absolute top-0 right-0 left-0 z-20 bg-gradient-to-b from-black/90 via-black/55 to-transparent p-2'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-1.5'>
                {mainstatIcon ? (
                  <span className='inline-flex h-6 w-6 items-center justify-center border border-slate-200/25 bg-black/35'>
                    <img
                      alt=''
                      className='h-3.5 w-3.5 object-contain opacity-85'
                      draggable={false}
                      src={mainstatIcon}
                    />
                  </span>
                ) : null}
                <span className='border border-slate-300/25 bg-black/35 px-1.5 py-0.5 text-[10px] tracking-wide text-slate-200'>
                  {wheel.rarity}
                </span>
              </div>
            </div>
          </div>

          <div className='pointer-events-none absolute right-0 bottom-0 left-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 pt-8 pb-2'>
            <p className='font-["Droid_Serif"] text-[15px] leading-[1.05] font-bold tracking-wide text-amber-100/90'>
              {wheel.name}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
