import {describe, expect, it, vi} from 'vitest'

import {parseDatabaseRichDescription} from './database-rich-text'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildPosseDatabaseDescriptionRecord,
  hydrateGlobalDatabaseReferenceInfo,
} from './global-database-reference-layer'
import * as publicDetailRecordAdapters from './public-detail-record-adapters'
import type {RichSegment} from './rich-text'
import {buildWheelDatabaseDescriptionRecord} from './wheels-database-reference-layer'

function getSegmentText(segment: RichSegment): string {
  switch (segment.type) {
    case 'text':
      return segment.value
    case 'descriptionArg':
      return `[${segment.argKey}]`
    case 'argPlural':
      return `{plural:${segment.argKey}}`
    case 'scaling':
      return segment.values.join('~')
    default:
      return 'name' in segment ? segment.name : ''
  }
}

describe('hydrateGlobalDatabaseReferenceInfo', () => {
  it('hydrates wheel descriptions through per-record detail loading', async () => {
    const loadPublicWheelDetailById = vi.spyOn(
      publicDetailRecordAdapters,
      'loadPublicWheelDetailById',
    )
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'wheel',
      id: 'wheel-0001',
      name: 'Dark Star',
      label: 'Wheel · SSR · Caro',
      record: buildWheelDatabaseDescriptionRecord({
        id: 'wheel-0001',
        name: 'Dark Star',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })

    expect(loadPublicWheelDetailById).toHaveBeenCalledWith('wheel-0001')
    expect(info.description).not.toBe('')
    expect(info.kind).toBe('wheel')
  })

  it('hydrates posse descriptions through per-record detail loading', async () => {
    const loadPublicPosseDetailById = vi.spyOn(
      publicDetailRecordAdapters,
      'loadPublicPosseDetailById',
    )
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'posse',
      id: 'posse-0001',
      name: 'Flora',
      label: 'Posse · Aequor',
      record: buildPosseDatabaseDescriptionRecord({
        id: 'posse-0001',
        name: 'Flora',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })

    expect(loadPublicPosseDetailById).toHaveBeenCalledWith('posse-0001')
    expect(info.description).not.toBe('')
    expect(info.kind).toBe('posse')
  })

  it('hydrates every covenant set effect into reference descriptions', async () => {
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'covenant',
      id: 'covenant-0001',
      name: 'Deus Ex Machina',
      label: 'Covenant',
      record: buildCovenantDatabaseDescriptionRecord({
        id: 'covenant-0001',
        name: 'Deus Ex Machina',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })

    expect(info.description).toContain('3 Set')
    expect(info.description).toContain('Realm Mastery +12')
    expect(info.description).toContain('6 Set')
    expect(info.description).toContain('Gain 1 Arithmetica')
  })

  it('keeps hydrated covenant set effects when parsed for rich-text rendering', async () => {
    const info = await hydrateGlobalDatabaseReferenceInfo({
      kind: 'covenant',
      id: 'covenant-0001',
      name: 'Deus Ex Machina',
      label: 'Covenant',
      record: buildCovenantDatabaseDescriptionRecord({
        id: 'covenant-0001',
        name: 'Deus Ex Machina',
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      description: '',
      keywordFooterText: undefined,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    })
    const renderedText = parseDatabaseRichDescription({
      text: info.description,
      record: info.record,
    })
      .map(getSegmentText)
      .join('')

    expect(renderedText).toContain('3 Set')
    expect(renderedText).toContain('6 Set')
    expect(renderedText).toContain('Gain 1 Arithmetica')
  })
})
