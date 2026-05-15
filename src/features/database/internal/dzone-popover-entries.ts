import type {RelicDatabaseDescriptionRecord} from '@/domain/description-records'
import type {DzoneMonsterAlertStats, DzoneResolvedMonster} from '@/domain/dzone'
import {loadRelicRecordById, type PublicRelicRecord} from '@/domain/relics'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

type DatabaseDescriptionSection = NonNullable<
  KeyedDatabaseReferenceEntry['descriptionSections']
>[number]

function buildRelicDescriptionRecord(record: PublicRelicRecord): RelicDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'relic',
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

function getMonsterDescriptionText(monster: DzoneResolvedMonster): string | undefined {
  return monster.descriptionTemplate.trim() ? monster.descriptionTemplate : undefined
}

function formatDzoneMonsterHp(hp: number): string {
  return hp > 100000 ? `${Math.floor(hp / 1000).toString()}k` : hp.toString()
}

function buildDzoneMonsterAlertMetaText(stats: DzoneMonsterAlertStats): string {
  return buildDzoneMonsterAlertMetaSegments(stats)
    .map((segment) => segment.text)
    .join('')
}

function buildDzoneMonsterAlertMetaSegments(stats: DzoneMonsterAlertStats) {
  const segments = [
    {text: 'Level '},
    {text: stats.level.toString(), tone: 'value' as const},
    {text: ' · HP '},
    {text: formatDzoneMonsterHp(stats.hp), tone: 'value' as const},
  ]

  if (stats.hpBars && stats.hpBars > 1) {
    segments.push({text: ' · '}, {text: `${stats.hpBars.toString()} HP bars`})
  }

  return segments
}

export function buildDzoneMonsterPopoverEntry({
  monster,
  thumbnailSrc,
}: {
  monster: DzoneResolvedMonster
  thumbnailSrc?: string
}): KeyedDatabaseReferenceEntry {
  const descriptionText = getMonsterDescriptionText(monster)

  return {
    key: `dzone-monster:${monster.id}`,
    name: monster.name,
    label: monster.alertStats ? buildDzoneMonsterAlertMetaText(monster.alertStats) : '',
    labelSegments: monster.alertStats
      ? buildDzoneMonsterAlertMetaSegments(monster.alertStats)
      : undefined,
    description: '',
    thumbnail: thumbnailSrc ? {src: thumbnailSrc, alt: monster.name} : undefined,
    descriptionSections: [
      descriptionText
        ? {label: 'Description', description: descriptionText, tone: 'lore' as const}
        : null,
      ...monster.characteristics.map((characteristic) => ({
        label: characteristic.name,
        description: characteristic.descriptionTemplate,
      })),
    ].filter((section): section is DatabaseDescriptionSection => Boolean(section)),
  }
}

export function buildDzoneRelicPopoverEntry({
  record,
  thumbnailSrc,
}: {
  record: PublicRelicRecord
  thumbnailSrc?: string
}): KeyedDatabaseReferenceEntry {
  const descriptionRecord = buildRelicDescriptionRecord(record)
  const descriptionSections = record.lore
    ? [
        {
          label: 'Effect',
          description: record.descriptionTemplate,
          record: descriptionRecord,
        },
        {
          label: 'Lore',
          description: record.lore,
          tone: 'lore' as const,
        },
      ]
    : undefined

  return {
    key: `dzone-relic:${record.id}`,
    name: record.name,
    label: '',
    description: record.descriptionTemplate,
    record: descriptionRecord,
    thumbnail: thumbnailSrc ? {src: thumbnailSrc, alt: record.name} : undefined,
    descriptionSections,
  }
}

export async function loadDzoneRelicPopoverEntry({
  relicId,
  thumbnailSrc,
}: {
  relicId: string
  thumbnailSrc?: string
}): Promise<KeyedDatabaseReferenceEntry | undefined> {
  const record = await loadRelicRecordById(relicId)
  return record ? buildDzoneRelicPopoverEntry({record, thumbnailSrc}) : undefined
}
