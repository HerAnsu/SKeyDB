import {describe, expect, it} from 'vitest'

import {timelineBanners, timelineEvents} from './timeline-data'

describe('timeline data loading', () => {
  it('loads split event featured entries and opt-out detail links', () => {
    const splitEvent = timelineEvents.find(
      (event) => event.id === 'event-story-rerun-great-conquering',
    )
    const preorder = timelineEvents.find((event) => event.id === 'event-preorder-arachne')

    expect(splitEvent?.featured?.map((unit) => unit.name)).toEqual(['Agrippa', 'Uvhash'])
    expect(preorder?.featured?.[0]).toMatchObject({name: 'Arachne', detailLink: false})
  })

  it('loads anniversary and collab placeholder surfaces', () => {
    const halfAnniversary = timelineEvents.find(
      (event) => event.id === 'event-campaign-half-anniversary',
    )
    const collabEvent = timelineEvents.find((event) => event.id === 'event-collab-saya-no-uta')
    const collabBanner = timelineBanners.find((banner) => banner.id === 'banner-saya-no-uta-collab')

    expect(halfAnniversary).toMatchObject({
      category: 'campaign',
      endDate: '2026-06-27T01:00:00.000Z',
      startDate: '2026-05-18T01:00:00.000Z',
    })
    expect(collabEvent).toMatchObject({
      category: 'collab',
      startDate: '2026-05-30T01:00:00.000Z',
      title: 'Saya no Uta Collaboration',
    })
    expect(collabBanner).toMatchObject({
      customArt: expect.stringContaining('saya-collab-prelim'),
      preliminary: true,
      startDate: '2026-05-30T01:00:00.000Z',
      tags: ['limited', 'collab', 'preliminary'],
      title: 'Saya no Uta Collab',
      type: 'limited',
    })
    expect(collabBanner?.featured).toBeUndefined()
    expect(halfAnniversary?.customArt).toContain('2-5-anniversary')
    expect(halfAnniversary?.preliminary).toBe(true)
    expect(halfAnniversary?.description).toContain('Ethereal Core')
    expect(halfAnniversary?.description).toContain('pending confirmation')
    expect(collabEvent?.customArt).toContain('saya-collab')
    expect(collabEvent?.preliminary).toBe(true)
    expect(collabEvent?.description).toContain('*"This is... where a new world begins."*')
    expect(collabEvent?.description).toContain('Gameplay stages')
    expect(collabBanner?.description).toContain('likely featuring Saya')
  })
})
