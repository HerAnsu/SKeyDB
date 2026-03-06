import {
  OwnedAssetBoxExport,
  type OwnedAssetBoxEntry,
} from '@/pages/collection/OwnedAssetBoxExport';

export interface OwnedWheelBoxEntry {
  readonly id: string;
  readonly name: string;
  readonly rarity: 'SSR' | 'SR' | 'R';
  readonly realm: string;
  readonly index: number;
  readonly level: number;
  readonly wheelAsset: string | null;
}

export interface OwnedWheelBoxExportProps {
  readonly entries: readonly OwnedWheelBoxEntry[];
  readonly onStatusMessage: (message: string) => void;
}

const wheelRarityOptions = [
  {value: 'SSR', label: 'SSR'},
  {value: 'SR', label: 'SR'},
  {value: 'R', label: 'R'},
] as const;

const defaultIncludedRarities: Record<
  (typeof wheelRarityOptions)[number]['value'],
  boolean
> = {
  SSR: true,
  SR: false,
  R: false,
};

export function OwnedWheelBoxExport({
  entries,
  onStatusMessage,
}: OwnedWheelBoxExportProps) {
  const normalizedEntries: readonly OwnedAssetBoxEntry<
    (typeof wheelRarityOptions)[number]['value']
  >[] = entries.map((entry) => ({
    id: entry.id,
    label: entry.name,
    level: entry.level,
    asset: entry.wheelAsset,
    rarity: entry.rarity,
    realm: entry.realm,
    sortIndex: entry.index,
  }));

  return (
    <OwnedAssetBoxExport
      assetAltNoun='wheel'
      buttonLabel='Export wheels as PNG (owned only)'
      cardAspectClassName='aspect-[75/113]'
      defaultIncludedRarities={defaultIncludedRarities}
      entries={normalizedEntries}
      filenamePrefix='skeydb-wheel-box'
      imageClassName='h-full w-full object-cover object-center scale-[1.2]'
      modalTitle='Export Owned Wheel Box'
      nameToggleLabel='Wheel Names'
      onStatusMessage={onStatusMessage}
      placeholderClassName='sigil-placeholder-wheel'
      rarityOptions={wheelRarityOptions}
      sortBehavior='WHEEL_DEFAULT'
      sortOptions={[]}
      storageKeyPrefix='skeydb.ownedWheelBoxExport'
    />
  );
}
