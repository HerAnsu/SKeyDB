import {afterEach, beforeEach} from 'vitest'

import '../builder/builder-page.integration-mocks'

const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'

beforeEach(() => {
  window.localStorage.removeItem(BUILDER_ALLOW_DUPES_KEY)
})

afterEach(() => {
  window.localStorage.removeItem(BUILDER_ALLOW_DUPES_KEY)
})
