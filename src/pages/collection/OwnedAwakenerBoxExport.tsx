import {
  OwnedAssetBoxExport,
  type OwnedAssetBoxEntry,
} from '@/pages/collection/OwnedAssetBoxExport';

export interface OwnedAwakenerBoxEntry {
  readonly name: string;
  readonly displayName: string;
  readonly realm: string;
  readonly rarity?: string;
  readonly index: number;
  readonly level: number;
  readonly awakenerLevel: number;
  readonly cardAsset: string | null;
}

export interface OwnedAwakenerBoxExportProps {
  readonly entries: readonly OwnedAwakenerBoxEntry[];
  readonly onStatusMessage: (message: string) => void;
}

export function OwnedAwakenerBoxExport({
  entries,
  onStatusMessage,
}: OwnedAwakenerBoxExportProps) {
  const normalizedEntries: readonly OwnedAssetBoxEntry[] = entries.map(
    (entry) => ({
      id: entry.name,
      label: entry.displayName,
      realm: entry.realm,
      rarity: entry.rarity,
      sortIndex: entry.index,
      level: entry.level,
      cardLevel: entry.awakenerLevel,
      asset: entry.cardAsset,
    }),
  );

  return (
    <OwnedAssetBoxExport
      assetAltNoun='card'
      buttonLabel='Export box as PNG (owned only)'
      cardAspectClassName='aspect-[2/3]'
      entries={normalizedEntries}
      filenamePrefix='skeydb-box'
      imageClassName='h-full w-full object-cover object-top scale-110'
      modalTitle='Export Owned Box'
      nameToggleLabel='Character Names'
      onStatusMessage={onStatusMessage}
      placeholderClassName='sigil-placeholder-card'
      sortOptions={['LEVEL', 'RARITY', 'ENLIGHTEN', 'ALPHABETICAL']}
      storageKeyPrefix='skeydb.ownedBoxExport'
    />
  );
}
