import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay';

export interface OwnershipLevelDisplayProps {
  readonly ownedLevel: number | null;
}

export function OwnershipLevelDisplay({
  ownedLevel,
}: OwnershipLevelDisplayProps) {
  return <DupeLevelDisplay level={ownedLevel} />;
}
