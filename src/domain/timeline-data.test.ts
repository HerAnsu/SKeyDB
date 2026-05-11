import {describe, expect, it} from 'vitest'

import {timelineEvents} from './timeline-data'

describe('timeline data loading', () => {
  it('loads split event featured entries and opt-out detail links', () => {
    const splitEvent = timelineEvents.find(
      (event) => event.id === 'event-story-rerun-great-conquering',
    )
    const preorder = timelineEvents.find((event) => event.id === 'event-preorder-arachne')

    expect(splitEvent?.featured?.map((unit) => unit.name)).toEqual(['Agrippa', 'Uvhash'])
    expect(preorder?.featured?.[0]).toMatchObject({name: 'Arachne', detailLink: false})
  })
})
