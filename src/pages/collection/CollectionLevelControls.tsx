import {CollectionLevelStepButton} from '@/pages/collection/CollectionLevelStepButton';
import {OwnershipLevelDisplay} from '@/pages/collection/OwnershipLevelDisplay';

export interface CollectionLevelControlsProps {
  readonly ownedLevel: number | null;
  readonly onIncrease: () => void;
  readonly onDecrease: () => void;
}

export function CollectionLevelControls({
  ownedLevel,
  onIncrease,
  onDecrease,
}: CollectionLevelControlsProps) {
  return (
    <div
      className={`collection-card-level-controls ${
        ownedLevel === null ? 'collection-card-level-controls-disabled' : ''
      }`}
    >
      <OwnershipLevelDisplay ownedLevel={ownedLevel} />
      <div className='collection-step-group'>
        <CollectionLevelStepButton
          ariaLabel='Increase enlighten level'
          direction='up'
          disabled={ownedLevel === null || ownedLevel >= 15}
          onStep={() => {
            onIncrease();
          }}
        />
        <CollectionLevelStepButton
          ariaLabel='Decrease enlighten level'
          direction='down'
          disabled={ownedLevel === null || ownedLevel <= 0}
          onStep={() => {
            onDecrease();
          }}
        />
      </div>
    </div>
  );
}
