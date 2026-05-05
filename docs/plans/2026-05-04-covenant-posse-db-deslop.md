# Covenant Posse DB Deslop Implementation Plan

> **Status:** Superseded for TypeScript execution by `docs/superpowers/plans/2026-05-05-public-v3-typescript-remainder.md`.
> Keep this document as audit/source material only. Its V2 stabilization steps are branch-local draft cleanup and should not be executed as the main queue.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every actionable covenant, posse, and broader database audit finding without doing throwaway cleanup that gets rewritten by a later extraction.

**Architecture:** First fix runtime correctness and data boundaries, because later page and modal refactors should consume typed, lazy, per-record loaders instead of aggregate shortcuts. Then rebuild the database route/browse layer once, so URL state, detail redirects, active search actions, duplicate open handlers, and loading fallbacks are removed together. Finally clean shared search utilities, simple-artifact modal scope, React effect/state management, and legacy public-v2/awakener domain drift in that order.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite dynamic imports, Zod, Zustand, Fuse.js, Vitest, Testing Library

---

**Status:** Draft

**Last updated:** 2026-05-04

**Related docs:**
- Audit source: `docs/notes/2026-05-04-covenant-posse-db-audit.md`
- Prior DB remediation plan: `docs/plans/2026-04-19-database-review-remediation.md`

## Review Notes

- Audit item #3 is correct about the unsafe `withNumericOwner` cast and the broader dual-ID problem, but the proposed implication for posse links is not correct as written. `SimpleArtifactDetailModal` passes `{id, name}` to `buildDatabaseAwakenerPath`, and that path builder uses the name. Do not convert posse `ownerAwakenerId` to a number. Fix the typed identity bridge instead.
- Audit item #24 is a real asset-integrity risk, but current covenant icon and full-art filenames currently share the same stems. Do not invent a separate covenant full-art data field unless the data actually gains one. Add explicit validation/tests so a future filename divergence fails loudly.
- React Router in this repo is v7, not v6, but the route-specificity/order point in item #21 remains a readability cleanup.
- Additional actionable gaps found while checking the audit: covenant search has no test file, `DatabasePage.test.tsx` does not cover posse/covenant routes, public-v2 schema validation for posse/covenant full records is too weak for their actual UI assumptions, and posse/covenant active filter chips are empty despite the shared browse layout supporting them.

## Finding Coverage

- Task 1 covers: #1, #2, #14, #15, #16, #23, #24, the correct part of #3, and part of L6.
- Task 2 covers: #4, #5, #10, and the browse-state half of #22.
- Task 3 covers: #6, #7, #8, #18, #21, E1, L9, the remaining `DatabasePage` duplication, and the missing posse/covenant route test gap.
- Task 4 covers: #11, #12, #13, L8, and covenant search test coverage.
- Task 5 covers: #9, #17, #19, #20, plus the simple-artifact part of #24.
- Task 6 covers: E2, E3, E4, E5, E6, E7, E9, E10.
- Task 7 covers: E8.
- Task 8 covers: L1, L2, L3, L4, L5, L6, L7, L10, L11.

## Task 1: Lazy Typed Artifact Full Records

**Why first:** Page and popover cleanup should target the final data boundary. If this is done later, route/modal work will keep calling aggregate helpers that should disappear.

**Files:**
- Modify: `src/domain/public-v2-schema.ts`
- Modify: `src/domain/public-v2-schema.test.ts`
- Modify: `src/domain/public-v2-detail-loaders.ts`
- Modify: `src/domain/public-v2-detail-loaders.test.ts`
- Modify: `src/domain/public-v2-runtime-boundary.test.ts`
- Modify: `src/domain/global-database-reference-layer.ts`
- Create: `src/domain/global-database-reference-layer.test.ts`
- Modify: `src/domain/posses-full-v2.ts`
- Modify: `src/domain/covenants-full-v2.ts`
- Modify: `src/domain/covenant-assets.ts`
- Create: `src/domain/covenant-assets.test.ts`

- [ ] **Step 1: Add failing tests for lazy artifact hydration**

Add `src/domain/global-database-reference-layer.test.ts` with coverage that hydrated covenant reference info includes both set effects and that posse/covenant hydration does not need full aggregate helpers:

```ts
import {describe, expect, it} from 'vitest'

import {
  buildCovenantDatabaseDescriptionRecord,
  hydrateGlobalDatabaseReferenceInfo,
} from './global-database-reference-layer'

describe('global-database-reference-layer artifact hydration', () => {
  it('hydrates all covenant set effects into one preview description', async () => {
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
    expect(info.description).toContain('Realm Mastery')
    expect(info.description).toContain('6 Set')
    expect(info.description).toContain('Gain 1 Arithmetica')
  })
})
```

- [ ] **Step 2: Add failing tests for stronger public-v2 posse/covenant shape parsing**

Extend `src/domain/public-v2-schema.test.ts` so the parser rejects missing actual required UI fields:

```ts
it('requires posse and covenant full records to include UI detail fields', () => {
  expect(() =>
    parsePublicV2Record('posses', {
      id: 'posse-0001',
      name: 'Posse',
      assetId: 'KeyToken_Skill_01',
    }),
  ).toThrow()

  expect(() =>
    parsePublicV2Record('covenants', {
      id: 'covenant-0001',
      name: 'Covenant',
      assetId: 'covenant-icon-001',
    }),
  ).toThrow()
})
```

- [ ] **Step 3: Add failing loader tests for typed posse/covenant adapters**

Extend `src/domain/public-v2-detail-loaders.test.ts`:

```ts
import {
  loadPublicV2AwakenerFullById,
  loadPublicV2CovenantFullById,
  loadPublicV2PosseFullById,
} from './public-v2-detail-loaders'

it('loads posse full records through the typed adapter without changing owner ids', async () => {
  await expect(loadPublicV2PosseFullById('posse-0001')).resolves.toMatchObject({
    id: 'posse-0001',
    name: 'Encounter in Pure White',
    realm: 'FADED_LEGACY',
    assetId: 'KeyToken_Skill_01',
    assetCrystalId: 'KeyToken_Crystal_01',
    assetBadgeId: 'KeyToken_Props_01',
    descriptionTemplate: expect.stringContaining('Discard your hand'),
    descriptionArgs: {},
  })
})

it('loads covenant full records through the typed adapter with all set effects', async () => {
  await expect(loadPublicV2CovenantFullById('covenant-0001')).resolves.toMatchObject({
    id: 'covenant-0001',
    name: 'Deus Ex Machina',
    assetId: 'covenant-icon-001',
    setEffects: [
      expect.objectContaining({set: 3}),
      expect.objectContaining({set: 6}),
    ],
  })
})
```

- [ ] **Step 4: Add failing runtime boundary test against aggregate imports**

Extend `src/domain/public-v2-runtime-boundary.test.ts`:

```ts
it('keeps posse and covenant full records on the lazy per-record loader path', () => {
  const forbiddenAggregateImports = [
    '@/data/public-v2/full/posses.json',
    '@/data/public-v2/full/covenants.json',
  ]

  const offenders = runtimeSourceFiles.flatMap((filePath) => {
    const normalizedPath = normalizePath(filePath)
    const source = readSource(filePath)
    return forbiddenAggregateImports.some((pattern) => source.includes(pattern))
      ? [normalizedPath]
      : []
  })

  expect(offenders).toEqual([])
})
```

- [ ] **Step 5: Strengthen public-v2 schema for posse/covenant records**

Update `createScopedRecordShape()` in `src/domain/public-v2-schema.ts` so `posses` and `covenants` validate the fields the UI actually consumes:

```ts
const posseRealmSchema = z.enum(['FADED_LEGACY', 'AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'OTHER'])

case 'covenants':
  return {
    name: nonEmptyStringSchema,
    assetId: nonEmptyStringSchema.regex(/^covenant-icon-\d{3}$/),
    lineupToken: nonEmptyStringSchema,
    setEffects: z.array(
      z.object({
        set: z.number().int().positive(),
        descriptionTemplate: z.string(),
        descriptionArgs: descriptionArgsSchema,
      }),
    ).min(1),
    lore: z.string().optional(),
  }
case 'posses':
  return {
    name: nonEmptyStringSchema,
    realm: posseRealmSchema,
    assetId: nonEmptyStringSchema,
    assetCrystalId: nonEmptyStringSchema.optional(),
    assetBadgeId: nonEmptyStringSchema.optional(),
    ownerAwakenerName: nonEmptyStringSchema.optional(),
    lineupToken: nonEmptyStringSchema,
    descriptionTemplate: z.string(),
    descriptionArgs: descriptionArgsSchema,
    lore: z.string().optional(),
  }
```

Mirror the same realm set in `src/domain/posses-full-v2.ts`:

```ts
export const POSSE_FULL_V2_REALMS = ['FADED_LEGACY', 'AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'OTHER'] as const
export type PosseFullV2Realm = (typeof POSSE_FULL_V2_REALMS)[number]
```

Then change `PosseFullV2Record.realm` from `string` to `PosseFullV2Realm`.

- [ ] **Step 6: Add typed posse/covenant adapters**

In `src/domain/public-v2-detail-loaders.ts`, add public record aliases and adapters:

```ts
type PublicV2PosseRecord = PublicV2Record<'posses'> & {
  assetBadgeId?: string
  assetCrystalId?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  realm: PosseFullV2Record['realm']
}

type PublicV2CovenantRecord = PublicV2Record<'covenants'> & {
  setEffects: CovenantFullV2Record['setEffects']
}

function adaptPublicV2PosseRecord(record: PublicV2PosseRecord): PosseFullV2Record {
  return {
    id: record.id,
    name: record.name,
    realm: record.realm,
    assetId: record.assetId,
    assetCrystalId: record.assetCrystalId,
    assetBadgeId: record.assetBadgeId,
    ownerAwakenerId: record.ownerAwakenerId,
    ownerAwakenerName: record.ownerAwakenerName,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    lore: record.lore,
  }
}

function adaptPublicV2CovenantRecord(record: PublicV2CovenantRecord): CovenantFullV2Record {
  return {
    id: record.id,
    name: record.name,
    assetId: record.assetId,
    setEffects: record.setEffects,
    lore: record.lore,
  }
}
```

Then replace the double-casts in `loadPublicV2PosseFullById()` and `loadPublicV2CovenantFullById()` with these adapters.

- [ ] **Step 7: Remove no-op aggregate caches**

In `src/domain/posses-full-v2.ts` and `src/domain/covenants-full-v2.ts`, remove the imports of `full/posses.json` and `full/covenants.json`, remove `getPossesFullV2()`, `getCovenantsFullV2()`, and their cache variables. Leave these modules as type/home modules plus pure helpers only if still used:

```ts
export function getPosseFullV2ById(
  posseId: string,
  records: PosseFullV2Record[],
): PosseFullV2Record | undefined {
  return records.find((record) => record.id === posseId)
}
```

Do not add `getCovenantFullV2ById()` unless there is still an aggregate caller after hydration is converted. Adding it just to delete it later would recreate the slop this plan is avoiding.

- [ ] **Step 8: Hydrate artifacts through per-record loaders**

In `src/domain/global-database-reference-layer.ts`, replace the wheel/posse/covenant aggregate dynamic imports with `public-v2-detail-loaders`. For covenants, introduce a helper that formats all set effects:

```ts
function buildCovenantSetEffectReferenceInfo(
  record: CovenantFullV2Record,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<CovenantDatabaseDescriptionRecord> | null {
  const setInfos = record.setEffects.map((setEffect) =>
    buildArtifactReferenceInfo(
      buildCovenantDatabaseDescriptionRecord({
        id: `${record.id}:${setEffect.set.toString()}`,
        name: `${record.name} ${setEffect.set.toString()} Set`,
        descriptionTemplate: setEffect.descriptionTemplate,
        descriptionArgs: setEffect.descriptionArgs,
      }),
      `Covenant · ${setEffect.set.toString()} Set`,
      formulaContext,
    ),
  )

  if (setInfos.length === 0) {
    return null
  }

  return {
    ...setInfos[0],
    id: record.id,
    name: record.name,
    label: 'Covenant',
    description: setInfos
      .map((info) => `${info.label.replace('Covenant · ', '')}: ${info.description}`)
      .join('\n\n'),
  }
}
```

- [ ] **Step 9: Add covenant asset integrity tests**

Create `src/domain/covenant-assets.test.ts`:

```ts
import {describe, expect, it} from 'vitest'

import {getCovenantAssetById, getCovenantFullArtAssetById} from './covenant-assets'
import {getCovenants} from './covenants'

describe('covenant-assets', () => {
  it('resolves icon and full-art assets for every covenant', () => {
    for (const covenant of getCovenants()) {
      expect(getCovenantAssetById(covenant.id), covenant.id).toBeTruthy()
      expect(getCovenantFullArtAssetById(covenant.id), covenant.id).toBeTruthy()
    }
  })
})
```

- [ ] **Step 10: Run focused tests**

Run:

```bash
npm run test -- --run src/domain/public-v2-schema.test.ts src/domain/public-v2-detail-loaders.test.ts src/domain/public-v2-runtime-boundary.test.ts src/domain/global-database-reference-layer.test.ts src/domain/covenant-assets.test.ts
```

Expected: PASS.

## Task 2: URL-Backed Simple Artifact Browse State

**Why second:** `DatabasePage` should consume one settled browse/search contract for all entities before the component is simplified.

**Files:**
- Create: `src/domain/simple-artifact-database-browse-state.ts`
- Create: `src/domain/simple-artifact-database-browse-state.test.ts`
- Create: `src/pages/database/useSimpleArtifactDatabaseBrowseState.ts`
- Modify: `src/pages/database/SimpleArtifactFilters.tsx`
- Modify: `src/pages/database/database-active-filter-chips.ts`

- [ ] **Step 1: Add failing domain tests for simple artifact browse params**

Create `src/domain/simple-artifact-database-browse-state.test.ts`:

```ts
import {describe, expect, it} from 'vitest'

import {
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
} from './simple-artifact-database-browse-state'

describe('simple artifact database browse state', () => {
  it('parses posse query and realm filter from URL params', () => {
    const state = parsePosseDatabaseBrowseState(new URLSearchParams('q=wish&realm=FADED_LEGACY'))
    expect(state).toEqual({query: 'wish', realmFilter: 'FADED_LEGACY'})
  })

  it('drops invalid posse realm filters', () => {
    const state = parsePosseDatabaseBrowseState(new URLSearchParams('realm=BAD'))
    expect(state).toEqual({query: '', realmFilter: 'ALL'})
  })

  it('writes posse defaults by deleting URL params', () => {
    const next = patchPosseDatabaseBrowseState(new URLSearchParams('q=wish&realm=OTHER'), {
      query: '',
      realmFilter: 'ALL',
    })
    expect(next.toString()).toBe('')
  })

  it('parses and writes covenant query state', () => {
    const params = new URLSearchParams('q=deus')
    expect(parseCovenantDatabaseBrowseState(params)).toEqual({query: 'deus'})
    expect(patchCovenantDatabaseBrowseState(params, {query: ''}).toString()).toBe('')
  })
})
```

- [ ] **Step 2: Implement the domain browse-state module**

Create `src/domain/simple-artifact-database-browse-state.ts`:

```ts
import {
  normalizeBrowseQuery,
  parseEnumSearchParam,
  patchSearchParams,
  setSearchParam,
} from '@/domain/browse-state-search-params'

export const POSSE_DATABASE_REALM_FILTER_IDS = [
  'ALL',
  'FADED_LEGACY',
  'AEQUOR',
  'CARO',
  'CHAOS',
  'ULTRA',
  'OTHER',
] as const
export type PosseRealmFilter = (typeof POSSE_DATABASE_REALM_FILTER_IDS)[number]

export interface PosseDatabaseBrowseState {
  query: string
  realmFilter: PosseRealmFilter
}

export interface CovenantDatabaseBrowseState {
  query: string
}

export const POSSE_DATABASE_BROWSE_DEFAULTS: PosseDatabaseBrowseState = {
  query: '',
  realmFilter: 'ALL',
}

export const COVENANT_DATABASE_BROWSE_DEFAULTS: CovenantDatabaseBrowseState = {
  query: '',
}

export function parsePosseDatabaseBrowseState(
  searchParams: URLSearchParams,
): PosseDatabaseBrowseState {
  return {
    query: normalizeBrowseQuery(searchParams.get('q')),
    realmFilter: parseEnumSearchParam(
      searchParams.get('realm'),
      POSSE_DATABASE_REALM_FILTER_IDS,
      POSSE_DATABASE_BROWSE_DEFAULTS.realmFilter,
    ),
  }
}

export function patchPosseDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<PosseDatabaseBrowseState>,
): URLSearchParams {
  return patchSearchParams(searchParams, patch, parsePosseDatabaseBrowseState, (next, state) => {
    setSearchParam(next, 'q', normalizeBrowseQuery(state.query))
    setSearchParam(
      next,
      'realm',
      state.realmFilter === POSSE_DATABASE_BROWSE_DEFAULTS.realmFilter
        ? undefined
        : state.realmFilter,
    )
  })
}

export function parseCovenantDatabaseBrowseState(
  searchParams: URLSearchParams,
): CovenantDatabaseBrowseState {
  return {query: normalizeBrowseQuery(searchParams.get('q'))}
}

export function patchCovenantDatabaseBrowseState(
  searchParams: URLSearchParams,
  patch: Partial<CovenantDatabaseBrowseState>,
): URLSearchParams {
  return patchSearchParams(searchParams, patch, parseCovenantDatabaseBrowseState, (next, state) => {
    setSearchParam(next, 'q', normalizeBrowseQuery(state.query))
  })
}
```

- [ ] **Step 3: Create URL-backed hooks for posses and covenants**

Create `src/pages/database/useSimpleArtifactDatabaseBrowseState.ts`:

```ts
import {useCallback} from 'react'

import {
  COVENANT_DATABASE_BROWSE_DEFAULTS,
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
  POSSE_DATABASE_BROWSE_DEFAULTS,
  type PosseRealmFilter,
} from '@/domain/simple-artifact-database-browse-state'

import {useBrowseQueryActions} from './useBrowseQueryActions'
import {useUrlBackedBrowseState} from './useDatabaseBrowseState'

export function usePosseDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState({
    parseState: parsePosseDatabaseBrowseState,
    patchState: patchPosseDatabaseBrowseState,
  })
  const {query, realmFilter} = browseState
  const queryActions = useBrowseQueryActions(query, commitBrowseState)

  const setRealmFilter = useCallback(
    (next: PosseRealmFilter) => {
      commitBrowseState({realmFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const resetFilters = useCallback(() => {
    commitBrowseState(POSSE_DATABASE_BROWSE_DEFAULTS, 'push')
  }, [commitBrowseState])

  return {query, realmFilter, setRealmFilter, resetFilters, ...queryActions}
}

export function useCovenantDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState({
    parseState: parseCovenantDatabaseBrowseState,
    patchState: patchCovenantDatabaseBrowseState,
  })
  const {query} = browseState
  const queryActions = useBrowseQueryActions(query, commitBrowseState)

  const resetFilters = useCallback(() => {
    commitBrowseState(COVENANT_DATABASE_BROWSE_DEFAULTS, 'push')
  }, [commitBrowseState])

  return {query, resetFilters, ...queryActions}
}
```

- [ ] **Step 4: Move `PosseRealmFilter` imports to the domain**

In `src/pages/database/SimpleArtifactFilters.tsx`, import `PosseRealmFilter` from the new domain module and remove the local exported type.

- [ ] **Step 5: Add active filter chip builders**

In `src/pages/database/database-active-filter-chips.ts`, add builders for posses and covenants:

```ts
interface PosseActiveFilterState {
  query: string
  realmFilter: PosseRealmFilter
}

interface PosseActiveFilterActions {
  clearQuery: () => void
  setRealmFilter: (filter: PosseRealmFilter) => void
}

export function buildPosseActiveFilterChips(
  state: PosseActiveFilterState,
  actions: PosseActiveFilterActions,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = []
  const trimmedQuery = state.query.trim()
  if (trimmedQuery.length > 0) {
    chips.push({key: 'query', label: `Search: "${trimmedQuery}"`, onClear: actions.clearQuery})
  }
  if (state.realmFilter !== 'ALL') {
    chips.push({
      key: 'realm',
      label: state.realmFilter === 'FADED_LEGACY' ? 'Faded Legacy' : getRealmLabel(state.realmFilter),
      onClear: () => actions.setRealmFilter('ALL'),
    })
  }
  return chips
}

export function buildCovenantActiveFilterChips(
  state: {query: string},
  actions: {clearQuery: () => void},
): ActiveFilterChip[] {
  const trimmedQuery = state.query.trim()
  return trimmedQuery.length > 0
    ? [{key: 'query', label: `Search: "${trimmedQuery}"`, onClear: actions.clearQuery}]
    : []
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test -- --run src/domain/simple-artifact-database-browse-state.test.ts
```

Expected: PASS.

## Task 3: Single Database Route And Page Controller Pass

**Why third:** This is the one planned rewrite of `DatabasePage.tsx`. It should consume Task 2's browse state and remove routing, redirect, search, open-detail, loading, and route-order duplication in one pass.

**Files:**
- Modify: `src/pages/DatabasePage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/domain/database-paths.ts`
- Modify: `src/domain/database-paths.test.ts`
- Create: `src/pages/database/DatabaseDetailLoadingFallback.tsx`
- Create: `src/pages/database/useDatabaseRouteState.ts`
- Modify: `src/pages/DatabasePage.test.tsx`

- [ ] **Step 1: Add route helper tests for posse/covenant paths and active route boundaries**

Extend `src/domain/database-paths.test.ts`:

```ts
import {
  buildDatabaseCovenantPath,
  buildDatabasePossePath,
  findCovenantByDatabaseSlug,
  findPosseByDatabaseSlug,
  toDatabaseCovenantSlug,
  toDatabasePosseSlug,
} from './database-paths'

it('builds and resolves posse database paths', () => {
  expect(toDatabasePosseSlug('Voices in Your Head')).toBe('voices-in-your-head')
  expect(buildDatabasePossePath({name: 'Voices in Your Head'})).toBe(
    '/database/posses/voices-in-your-head',
  )
  expect(
    findPosseByDatabaseSlug(
      [{id: 'posse-0002', index: 2, name: 'Voices in Your Head', realm: 'FADED_LEGACY', isFadedLegacy: true, lineupToken: 'h'}],
      'voices-in-your-head',
    )?.id,
  ).toBe('posse-0002')
})

it('builds and resolves covenant database paths', () => {
  expect(toDatabaseCovenantSlug('Deus Ex Machina')).toBe('deus-ex-machina')
  expect(buildDatabaseCovenantPath({name: 'Deus Ex Machina'})).toBe(
    '/database/covenants/deus-ex-machina',
  )
  expect(
    findCovenantByDatabaseSlug(
      [{id: 'covenant-0001', assetId: 'covenant-icon-001', name: 'Deus Ex Machina', lineupToken: 'k'}],
      'deus-ex-machina',
    )?.id,
  ).toBe('covenant-0001')
})
```

- [ ] **Step 2: Create a route-state hook using router params/matches**

Create `src/pages/database/useDatabaseRouteState.ts`. It should use `useLocation`, `useMatch`, and `useParams`, not a hand-rolled string-split parser:

```ts
import {useLocation, useMatch, useParams} from 'react-router-dom'

import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {resolveDatabaseAwakenerTab} from '@/domain/database-paths'

export function useDatabaseRouteState() {
  const location = useLocation()
  const params = useParams()
  const covenantMatch = useMatch('/database/covenants/*')
  const posseMatch = useMatch('/database/posses/*')
  const wheelMatch = useMatch('/database/wheels/*')
  const activeEntity: DatabaseEntityId = covenantMatch
    ? 'covenants'
    : posseMatch
      ? 'posses'
      : wheelMatch
        ? 'wheels'
        : 'awakeners'

  return {
    activeEntity,
    browsePath: buildDatabaseEntityBrowsePath(activeEntity),
    location,
    awakenerSlug: params.awakenerSlug,
    wheelSlug: params.wheelSlug,
    posseSlug: params.posseSlug,
    covenantSlug: params.covenantSlug,
    tabSlug: params.tabSlug,
    selectedTab: resolveDatabaseAwakenerTab(params.tabSlug) ?? 'overview',
    resolvedTabSlug: resolveDatabaseAwakenerTab(params.tabSlug),
  }
}
```

- [ ] **Step 3: Add a shared loading fallback**

Create `src/pages/database/DatabaseDetailLoadingFallback.tsx`:

```tsx
interface DatabaseDetailLoadingFallbackProps {
  entityLabel: string
}

export function DatabaseDetailLoadingFallback({entityLabel}: DatabaseDetailLoadingFallbackProps) {
  return <div className='px-2 py-3 text-sm text-slate-300'>Loading {entityLabel} details...</div>
}
```

- [ ] **Step 4: Replace `DatabasePage` inline simple artifact state**

In `src/pages/DatabasePage.tsx`, remove the `useState` calls for `posseQuery`, `posseRealmFilter`, and `covenantQuery`. Use:

```ts
const posseBrowseState = usePosseDatabaseBrowseState()
const covenantBrowseState = useCovenantDatabaseBrowseState()
```

Derive:

```ts
const filteredPosses = useMemo(() => {
  const searched = searchPosses(databasePosses, posseBrowseState.query)
  return posseBrowseState.realmFilter === 'ALL'
    ? searched
    : searched.filter((posse) => posse.realm === posseBrowseState.realmFilter)
}, [posseBrowseState.query, posseBrowseState.realmFilter])

const filteredCovenants = useMemo(
  () => searchCovenants(databaseCovenants, covenantBrowseState.query),
  [covenantBrowseState.query],
)
```

- [ ] **Step 5: Replace repeated global search branches with active actions**

Add an active action map:

```ts
const searchActionsByEntity = {
  awakeners: awakenerBrowseState,
  wheels: wheelBrowseState,
  posses: posseBrowseState,
  covenants: covenantBrowseState,
}
const activeSearchActions = searchActionsByEntity[routeState.activeEntity]
```

Use it in `useGlobalSearchCapture()`:

```ts
useGlobalSearchCapture({
  enabled: !selectedAwakener && !selectedWheel && !selectedPosse && !selectedCovenant,
  searchInputRef,
  onAppendCharacter: activeSearchActions.appendSearchCharacter,
  onRemoveCharacter: activeSearchActions.removeSearchCharacter,
  onClearSearch: activeSearchActions.clearQuery,
})
```

- [ ] **Step 6: Replace redirect effects with render-time `<Navigate>`**

Import `Navigate` in `DatabasePage.tsx`. Remove the four top-level detail redirect `useEffect` blocks. Add one render-time invalid-route resolution before returning the main section:

```tsx
const missingDetailPath =
  awakenerSlug && !selectedAwakener
    ? buildDatabaseEntityBrowsePath('awakeners')
    : wheelSlug && !selectedWheel
      ? buildDatabaseWheelBrowsePath()
      : posseSlug && !selectedPosse
        ? buildDatabasePosseBrowsePath()
        : covenantSlug && !selectedCovenant
          ? buildDatabaseCovenantBrowsePath()
          : null

if (missingDetailPath) {
  return <Navigate replace to={{pathname: missingDetailPath, search: location.search}} />
}
```

Keep the existing detail-route data-load missing-record redirects inside `useDatabaseDetailRouteRecord` for async data misses.

- [ ] **Step 7: Replace four `openXxxDetail` functions with one typed helper**

Inside `DatabasePage.tsx`, add:

```ts
function openEntityDetail<TItem extends {id: string; name: string}>(
  items: readonly TItem[],
  itemId: string,
  buildPath: (item: TItem) => string,
) {
  const item = items.find((entry) => entry.id === itemId)
  if (!item) {
    return
  }
  void navigate({pathname: buildPath(item), search: location.search})
}
```

Then define callbacks inline at callsites or as concise wrappers:

```ts
const openPosseDetail = (posseId: string) =>
  openEntityDetail(databasePosses, posseId, buildDatabasePossePath)
```

- [ ] **Step 8: Use the shared loading fallback everywhere**

Replace all eight duplicate fallback divs with:

```tsx
<DatabaseDetailLoadingFallback entityLabel='awakener' />
```

Use labels `awakener`, `wheel`, `posse`, and `covenant`.

- [ ] **Step 9: Apply active chips and reset handlers**

Wire the Task 2 active chip builders:

```tsx
activeFilterChips={posseActiveFilterChips}
onResetFilters={posseBrowseState.resetFilters}
```

and:

```tsx
activeFilterChips={covenantActiveFilterChips}
onResetFilters={covenantBrowseState.resetFilters}
```

- [ ] **Step 10: Normalize route order in `App.tsx`**

Put browse routes before detail routes consistently:

```tsx
<Route element={<DatabasePage />} path='/database' />
<Route element={<DatabasePage />} path='/database/wheels' />
<Route element={<DatabasePage />} path='/database/wheels/:wheelSlug' />
<Route element={<DatabasePage />} path='/database/posses' />
<Route element={<DatabasePage />} path='/database/posses/:posseSlug' />
<Route element={<DatabasePage />} path='/database/covenants' />
<Route element={<DatabasePage />} path='/database/covenants/:covenantSlug' />
<Route element={<DatabasePage />} path='/database/awk/:awakenerSlug' />
<Route element={<DatabasePage />} path='/database/awk/:awakenerSlug/:tabSlug' />
```

- [ ] **Step 11: Add DatabasePage regression tests for route redirects and history**

Extend the `src/pages/DatabasePage.test.tsx` route harness with mock data and loader mocks for `../domain/posses`, `../domain/covenants`, and `../domain/public-v2-detail-loaders`. Add these route entries to the in-test router:

```tsx
<Route element={<DatabasePage />} path='/database/posses' />
<Route element={<DatabasePage />} path='/database/posses/:posseSlug' />
<Route element={<DatabasePage />} path='/database/covenants' />
<Route element={<DatabasePage />} path='/database/covenants/:covenantSlug' />
```

Then add regression tests:

```ts
it('initializes posse browse filters from query params', async () => {
  await renderDatabasePage('/database/posses?q=wish&realm=FADED_LEGACY')
  expect(screen.getByLabelText('Search posses')).toHaveValue('wish')
  expect(screen.getByRole('button', {name: 'Faded Legacy'})).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByTestId('location-search')).toHaveTextContent('?q=wish&realm=FADED_LEGACY')
})

it('writes covenant search to URL params', async () => {
  await renderDatabasePage('/database/covenants')
  fireEvent.change(screen.getByLabelText('Search covenants'), {target: {value: 'deus'}})
  expect(screen.getByTestId('location-search')).toHaveTextContent('?q=deus')
})

it('falls back to the posse browse route when a posse slug is unknown', async () => {
  await renderDatabasePage('/database/posses/missing')
  await waitFor(() =>
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/posses'),
  )
})

it('falls back to the covenant browse route when a covenant slug is unknown', async () => {
  await renderDatabasePage('/database/covenants/missing')
  await waitFor(() =>
    expect(screen.getByTestId('location-path')).toHaveTextContent('/database/covenants'),
  )
})

it('keeps posse live search typing as replace-style history updates', async () => {
  await renderDatabasePage(['/database/posses', '/database/posses'], 1)
  fireEvent.change(screen.getByLabelText('Search posses'), {target: {value: 'wish'}})
  expect(screen.getByTestId('location-search')).toHaveTextContent('?q=wish')
  await act(async () => {
    fireEvent.click(screen.getByRole('button', {name: 'Go back in history'}))
  })
  await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent(''))
})
```

- [ ] **Step 12: Run focused tests**

Run:

```bash
npm run test -- --run src/domain/database-paths.test.ts src/domain/simple-artifact-database-browse-state.test.ts src/pages/DatabasePage.test.tsx
```

Expected: PASS.

## Task 4: Shared Search Utilities And Covenant Search Correctness

**Why fourth:** Search behavior is now consumed through the same URL-backed browse path for all entities. It is safe to centralize repeated helpers and fix covenant ranking.

**Files:**
- Modify: `src/domain/search-utils.ts`
- Modify: `src/domain/search-utils.test.ts`
- Modify: `src/domain/awakeners-search.ts`
- Modify: `src/domain/wheels-search.ts`
- Modify: `src/domain/posses-search.ts`
- Modify: `src/domain/covenants-search.ts`
- Create: `src/domain/covenants-search.test.ts`

- [ ] **Step 1: Add search utility tests**

Extend `src/domain/search-utils.test.ts`:

```ts
import {mergeDirectAndFuzzyMatches, toPriority} from './search-utils'

describe('toPriority', () => {
  it('maps a match kind to a configured priority and treats 99 as disabled', () => {
    expect(toPriority({kind: 'exact'}, {exact: 0, prefix: 1, wordPrefix: 2, contains: 99})).toBe(0)
    expect(toPriority({kind: 'contains'}, {exact: 0, prefix: 1, wordPrefix: 2, contains: 99})).toBeNull()
    expect(toPriority(null, {exact: 0, prefix: 1, wordPrefix: 2, contains: 3})).toBeNull()
  })
})

describe('mergeDirectAndFuzzyMatches', () => {
  it('keeps direct ordering and appends fuzzy-only results', () => {
    const direct = [{id: 'a'}, {id: 'b'}]
    const fuzzy = [{id: 'b'}, {id: 'c'}]
    expect(mergeDirectAndFuzzyMatches(direct, fuzzy, (item) => item.id)).toEqual([
      {id: 'a'},
      {id: 'b'},
      {id: 'c'},
    ])
  })
})
```

- [ ] **Step 2: Add covenant search regression tests**

Create `src/domain/covenants-search.test.ts`:

```ts
import {describe, expect, it} from 'vitest'

import type {Covenant} from './covenants'
import {searchCovenants} from './covenants-search'

function covenant(id: string, name: string, assetId = 'covenant-icon-001'): Covenant {
  return {id, name, assetId, lineupToken: 'a'}
}

describe('searchCovenants', () => {
  it('does not fuzzy-match internal asset ids', () => {
    expect(searchCovenants([covenant('covenant-0001', 'Deus Ex Machina')], 'trinket')).toEqual([])
  })

  it('uses name as the tiebreaker for equal-priority direct matches', () => {
    const results = searchCovenants(
      [
        covenant('covenant-0002', 'Zephyr Rite'),
        covenant('covenant-0001', 'April Tribute'),
      ],
      'covenant',
    )
    expect(results.map((entry) => entry.name)).toEqual(['April Tribute', 'Zephyr Rite'])
  })
})
```

- [ ] **Step 3: Export shared utility helpers**

In `src/domain/search-utils.ts`, add:

```ts
export type SearchPriorityMap = Record<SearchFieldMatchKind, number>

export function toPriority(
  match: {kind: SearchFieldMatchKind} | null,
  priorities: SearchPriorityMap,
): number | null {
  if (!match) {
    return null
  }
  const priority = priorities[match.kind]
  return priority >= 99 ? null : priority
}

export function comparePriorityMatchesByName<TRecord>(
  getName: (record: TRecord) => string,
): (left: {record: TRecord; priority: number}, right: {record: TRecord; priority: number}) => number {
  return (left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority
    }
    return getName(left.record).localeCompare(getName(right.record), undefined, {
      sensitivity: 'base',
    })
  }
}

export function mergeDirectAndFuzzyMatches<TItem>(
  directMatches: readonly TItem[],
  fuzzyMatches: readonly TItem[],
  getId: (item: TItem) => string,
): TItem[] {
  if (directMatches.length === 0) {
    return [...fuzzyMatches]
  }
  const directIds = new Set(directMatches.map(getId))
  return [...directMatches, ...fuzzyMatches.filter((item) => !directIds.has(getId(item)))]
}
```

- [ ] **Step 4: Replace local `toPriority` helpers**

Update all four search modules to import `toPriority`. Remove local definitions from:

- `src/domain/awakeners-search.ts`
- `src/domain/wheels-search.ts`
- `src/domain/posses-search.ts`
- `src/domain/covenants-search.ts`

Use `comparePriorityMatchesByName` and `mergeDirectAndFuzzyMatches` where the local shape fits. Keep entity-specific Fuse options and relevance filters in each module; those are not identical and should not be over-abstracted.

- [ ] **Step 5: Fix covenant supplemental fields and sort**

In `src/domain/covenants-search.ts`:

```ts
normalizedSupplemental: [],
```

Change direct sort to:

```ts
.sort(comparePriorityMatchesByName((record) => record.covenant.name))
```

Use `mergeDirectAndFuzzyMatches(directMatches, fuzzyMatches, (covenant) => covenant.id)` for merge.

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test -- --run src/domain/search-utils.test.ts src/domain/awakeners-search.test.ts src/domain/wheels-search.test.ts src/domain/posses-search.test.ts src/domain/covenants-search.test.ts
```

Expected: PASS.

## Task 5: Simple Artifact Modal And Reference Scope

**Why fifth:** The data and search layers are stable now. This task removes misleading simple-artifact abstractions and small modal/grid inconsistencies without touching `DatabasePage` again.

**Files:**
- Modify: `src/domain/simple-artifact-database-reference-layer.ts`
- Create: `src/domain/simple-artifact-database-reference-layer.test.ts`
- Modify: `src/pages/database/SimpleArtifactDetailModal.tsx`
- Modify: `src/pages/database/SimpleArtifactGrid.tsx`
- Modify: `src/pages/database/SimpleArtifactGridCard.tsx`
- Modify: `src/pages/DatabasePage.tsx`

- [ ] **Step 1: Add scoped reference-layer tests**

Create `src/domain/simple-artifact-database-reference-layer.test.ts`:

```ts
import {describe, expect, it} from 'vitest'

import {buildSimpleArtifactReferenceLayer} from './simple-artifact-database-reference-layer'

describe('simple-artifact-database-reference-layer', () => {
  it('builds a scoped layer without loading global skills or artifacts by default', () => {
    const layer = buildSimpleArtifactReferenceLayer({
      extraReferences: [],
    })

    expect(layer.cardNames.size).toBe(0)
    expect(layer.referenceInfoByName.size).toBe(layer.overlayByName.size)
  })
})
```

- [ ] **Step 2: Replace the misleading re-export shim with a real scoped function**

In `src/domain/simple-artifact-database-reference-layer.ts`, stop aliasing `buildGlobalDatabaseReferenceLayer`. Keep the record builders re-exported, but define a scoped builder:

```ts
import {getAwakenerOverlays} from './awakener-overlays'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildGlobalDatabaseReferenceLayer,
  buildPosseDatabaseDescriptionRecord,
  type BuildGlobalDatabaseReferenceLayerOptions,
} from './global-database-reference-layer'

type BuildSimpleArtifactReferenceLayerOptions = Pick<
  BuildGlobalDatabaseReferenceLayerOptions,
  'extraReferences' | 'formulaContext' | 'overlays'
>

export {buildCovenantDatabaseDescriptionRecord, buildPosseDatabaseDescriptionRecord}

export function buildSimpleArtifactReferenceLayer(
  options: BuildSimpleArtifactReferenceLayerOptions = {},
) {
  return buildGlobalDatabaseReferenceLayer({
    extraReferences: options.extraReferences ?? [],
    formulaContext: options.formulaContext,
    awakenerSkills: [],
    derivedSkills: [],
    wheels: [],
    posses: [],
    covenants: [],
    overlays: options.overlays ?? getAwakenerOverlays(),
  })
}
```

- [ ] **Step 3: Remove module-scope `noop`**

In `src/pages/database/SimpleArtifactDetailModal.tsx`, delete:

```ts
const noop = () => {
  return undefined
}
```

Use a local stable callback:

```ts
const noSearchAction = useCallback(() => undefined, [])
```

Pass `noSearchAction` for `clearSearch` and `closeSearch`.

- [ ] **Step 4: Make covenant owner navigation intentionally absent**

Change `CovenantDetailModalProps` from:

```ts
onSelectAwakener?: never
```

to:

```ts
onSelectAwakener?: undefined
```

Keep `DatabaseCovenantDetailRoute` without `onSelectAwakener` because covenant data has no owner. This records the intentional asymmetry without a hostile type.

- [ ] **Step 5: Make covenant card accent explicit**

In `src/pages/database/SimpleArtifactGrid.tsx`, pass an explicit non-realm accent input:

```tsx
<SimpleArtifactGridCard
  accent='neutral'
  id={covenant.id}
  imageSrc={getCovenantAssetById(covenant.id)}
  index={index}
  key={covenant.id}
  name={covenant.name}
  onSelect={onSelectCovenant}
/>
```

Update `SimpleArtifactGridCard` to accept either `realm` or `accent='neutral'` so callers do not rely on an omitted prop for design intent.

- [ ] **Step 6: Verify covenant full-art behavior remains locked**

Do not change `getCovenantFullArtAssetById()` unless Task 1's asset test found real missing assets. If it remains same-stem, add a short local comment:

```ts
// Covenant full-art files currently share icon stems; the asset test locks this assumption.
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm run test -- --run src/domain/simple-artifact-database-reference-layer.test.ts src/domain/covenant-assets.test.ts src/pages/DatabasePage.test.tsx
```

Expected: PASS.

## Task 6: Shared Detail State Store And Effect Cleanup

**Why sixth:** Preferences, ownership, resize, escape handling, and search suppression span all detail modals. Handle them after modal scope is settled so the store API does not encode the old simple-artifact leak.

**Files:**
- Create: `src/pages/database/database-detail-runtime-store.ts`
- Modify: `src/pages/database/useDatabaseDetailPreferences.ts`
- Modify: `src/pages/database/useDatabaseDetailPreferences.test.tsx`
- Modify: `src/pages/database/useAwakenerDetailDatabaseState.ts`
- Modify: `src/pages/database/useWheelDetailModalState.ts`
- Modify: `src/pages/database/SimpleArtifactDetailModal.tsx`
- Modify: `src/pages/database/useDetailEntitySearch.ts`
- Modify: `src/pages/database/useDetailEntitySearch.test.tsx`
- Modify: `src/pages/database/useDatabaseDetailChrome.ts`
- Modify: `src/pages/database/useAwakenerDetailChrome.ts`
- Modify: `src/pages/database/useDatabaseDetailModalLifecycle.ts`
- Create: `src/pages/database/useWindowWidth.ts`

- [ ] **Step 1: Create the runtime store**

Create `src/pages/database/database-detail-runtime-store.ts`:

```ts
import {useStore} from 'zustand'
import {createStore} from 'zustand/vanilla'

import {loadCollectionOwnership, type CollectionOwnershipState} from '@/domain/collection-ownership'
import {
  mergeDatabaseDetailPreferences,
  readDatabaseDetailPreferences,
  writeDatabaseDetailPreferences,
  type DatabaseDetailPreferences,
  type DatabaseDetailPreferencesPatch,
} from '@/domain/database-detail-preferences'
import {getBrowserLocalStorage} from '@/domain/storage'

interface DatabaseDetailRuntimeState {
  collectionOwnership: CollectionOwnershipState
  preferences: DatabaseDetailPreferences
  searchCaptureSuppressionDepth: number
  updatePreferences: (patch: DatabaseDetailPreferencesPatch) => void
  refreshCollectionOwnership: () => void
  suppressSearchCapture: () => () => void
}

export const databaseDetailRuntimeStore = createStore<DatabaseDetailRuntimeState>((set, get) => ({
  collectionOwnership: loadCollectionOwnership(getBrowserLocalStorage()),
  preferences: readDatabaseDetailPreferences(),
  searchCaptureSuppressionDepth: 0,
  updatePreferences: (patch) => {
    set((state) => {
      const preferences = mergeDatabaseDetailPreferences(state.preferences, patch)
      writeDatabaseDetailPreferences(patch)
      return {preferences}
    })
  },
  refreshCollectionOwnership: () => {
    set({collectionOwnership: loadCollectionOwnership(getBrowserLocalStorage())})
  },
  suppressSearchCapture: () => {
    set((state) => ({searchCaptureSuppressionDepth: state.searchCaptureSuppressionDepth + 1}))
    return () => {
      set((state) => ({
        searchCaptureSuppressionDepth: Math.max(0, state.searchCaptureSuppressionDepth - 1),
      }))
    }
  },
}))

export function useDatabaseDetailRuntimeStore<T>(
  selector: (state: DatabaseDetailRuntimeState) => T,
): T {
  return useStore(databaseDetailRuntimeStore, selector)
}
```

- [ ] **Step 2: Refactor `useDatabaseDetailPreferences` onto the store**

Keep the public hook API stable:

```ts
export function useDatabaseDetailPreferences() {
  const preferences = useDatabaseDetailRuntimeStore((state) => state.preferences)
  const updatePreferences = useDatabaseDetailRuntimeStore((state) => state.updatePreferences)
  ...
}
```

Update existing tests to assert two rendered hook consumers update together.

- [ ] **Step 3: Replace per-modal collection ownership reads**

In `useAwakenerDetailDatabaseState`, `useWheelDetailModalState`, and `SimpleArtifactDetailModal`, replace:

```ts
const [collectionOwnership] = useState(() => loadCollectionOwnership(getBrowserLocalStorage()))
```

with:

```ts
const collectionOwnership = useDatabaseDetailRuntimeStore((state) => state.collectionOwnership)
```

- [ ] **Step 4: Remove reset-on-record effect**

In `src/pages/database/useAwakenerDetailDatabaseState.ts`, remove `previousRecordIdRef` and its `useEffect`. The `key={awakener.id}` on `AwakenerDetailModal` already remounts the hook. Run existing `DatabasePage` modal-switch tests after this step.

- [ ] **Step 5: Move search suppression into the store**

In `src/pages/database/useDetailEntitySearch.ts`, remove module-level `searchCaptureSuppressionDepth`, `searchCaptureSuppressionListeners`, and custom `useSyncExternalStore` plumbing. Use the store:

```ts
export function useSuppressDetailEntitySearchCapture() {
  const suppressSearchCapture = useDatabaseDetailRuntimeStore((state) => state.suppressSearchCapture)
  useEffect(() => suppressSearchCapture(), [suppressSearchCapture])
}
```

Inside `useDetailEntitySearch`, read:

```ts
const isSearchCaptureSuppressed = useDatabaseDetailRuntimeStore(
  (state) => state.searchCaptureSuppressionDepth > 0,
)
```

- [ ] **Step 6: Stop listener churn in `useDetailEntitySearch`**

Keep latest search query in a ref assigned during render:

```ts
const searchQueryRef = useRef(searchQuery)
searchQueryRef.current = searchQuery
```

Use it in the keydown handler:

```ts
currentSearchValue: searchInputRef.current?.value ?? searchQueryRef.current,
```

Remove `searchQuery` from the keydown effect dependency list.

- [ ] **Step 7: Stabilize Escape handling**

In `useDatabaseDetailModalLifecycle.ts`, store latest values in a ref during render:

```ts
const latestStateRef = useRef({
  clearSearch,
  closeAllPopovers,
  closeSearch,
  dismissSettings,
  hasOpenPopovers,
  isSettingsOpen,
  onClose,
  searchQuery,
})
latestStateRef.current = {
  clearSearch,
  closeAllPopovers,
  closeSearch,
  dismissSettings,
  hasOpenPopovers,
  isSettingsOpen,
  onClose,
  searchQuery,
}
```

Use a mount-only keydown effect that reads `latestStateRef.current`. Keep `searchInputRef` in the closure only because the ref object is stable.

- [ ] **Step 8: Add shared window width hook**

Create `src/pages/database/useWindowWidth.ts`:

```ts
import {useEffect, useState} from 'react'

function getWindowWidth() {
  return typeof window === 'undefined' ? 1024 : window.innerWidth
}

export function useWindowWidth() {
  const [width, setWidth] = useState(getWindowWidth)

  useEffect(() => {
    function handleResize() {
      setWidth(getWindowWidth())
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return width
}
```

Use this in `useDatabaseDetailChrome` to derive `isMobileHeader`. Use it in `useAwakenerDetailChrome` to trigger a tag-overflow measurement rather than registering another window listener.

- [ ] **Step 9: Mark mount-only focus intent**

In `useDatabaseDetailChrome`, change the focus restore effect dependency from `[searchInputRef]` to `[]` and add a concise comment:

```ts
// Capture and restore focus for this modal mount; callers pass a stable ref.
useEffect(() => {
  ...
}, [])
```

- [ ] **Step 10: Run focused tests**

Run:

```bash
npm run test -- --run src/pages/database/useDatabaseDetailPreferences.test.tsx src/pages/database/useDetailEntitySearch.test.tsx src/pages/DatabasePage.test.tsx
```

Expected: PASS.

## Task 7: Overlay Icon Loading Resource

**Why seventh:** This is isolated render-performance cleanup. It should happen after the shared runtime store so it does not introduce another modal-local cache.

**Files:**
- Modify: `src/pages/database/RichSegmentRenderer.tsx`
- Modify: `src/pages/database/RichSegmentRenderer.test.tsx`
- Modify: `src/domain/overlay-icon-assets.ts` or current overlay icon asset module

- [ ] **Step 1: Add a regression test for cached icon rendering**

In `src/pages/database/RichSegmentRenderer.test.tsx`, add coverage that a cached overlay icon renders immediately without text-only fallback. Use the existing test setup/mocks in that file.

- [ ] **Step 2: Expose a promise resource from the overlay icon asset module**

Add a helper next to `loadOverlayIconAsset`:

```ts
const overlayIconPromiseCache = new Map<string, Promise<string | undefined>>()

export function preloadOverlayIconAsset(iconId: string): Promise<string | undefined> {
  const cachedUrl = peekOverlayIconAsset(iconId)
  if (cachedUrl !== undefined) {
    return Promise.resolve(cachedUrl)
  }
  const cachedPromise = overlayIconPromiseCache.get(iconId)
  if (cachedPromise) {
    return cachedPromise
  }
  const promise = loadOverlayIconAsset(iconId)
  overlayIconPromiseCache.set(iconId, promise)
  return promise
}
```

- [ ] **Step 3: Use the promise cache in `RichSegmentRenderer`**

Replace the ad hoc effect body with a call to `preloadOverlayIconAsset(iconId)`. Keep the cancellation guard. Do not move to React `use(promise)` unless the surrounding modal adds a Suspense boundary for icon loading in the same task.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run test -- --run src/pages/database/RichSegmentRenderer.test.tsx
```

Expected: PASS.

## Task 8: Legacy Public-V2 And Awakener Domain Cleanup

**Why eighth:** These are broader DB smells and should not block the covenant/posse correctness work. This task consolidates legacy adapters after the new artifact path is already typed and lazy.

**Files:**
- Create: `src/domain/awakener-identity.ts`
- Create: `src/domain/awakener-identity.test.ts`
- Create: `src/domain/awakener-public-utils.ts`
- Create: `src/domain/awakener-public-utils.test.ts`
- Modify: `src/domain/awakeners.ts`
- Modify: `src/domain/awakeners-lite-v2.ts`
- Modify: `src/domain/awakener-roster.ts`
- Modify: `src/domain/awakener-kits.ts`
- Modify: `src/domain/public-v2-detail-loaders.ts`
- Modify: `src/domain/database-reference-layer.ts`
- Modify: `src/domain/wheels.ts`
- Modify: `src/domain/wheels-full-v2.ts`
- Modify: `src/domain/public-v2-runtime-boundary.test.ts`

- [ ] **Step 1: Add identity bridge tests**

Create `src/domain/awakener-identity.test.ts`:

```ts
import {describe, expect, it} from 'vitest'

import {
  numericAwakenerIdFromPublicId,
  publicAwakenerIdFromNumericId,
} from './awakener-identity'

describe('awakener-identity', () => {
  it('converts between public and numeric awakener ids explicitly', () => {
    expect(numericAwakenerIdFromPublicId('awakener-0012')).toBe(12)
    expect(publicAwakenerIdFromNumericId(12)).toBe('awakener-0012')
  })

  it('rejects invalid ids without returning fake zero ids', () => {
    expect(numericAwakenerIdFromPublicId('bad')).toBeUndefined()
    expect(publicAwakenerIdFromNumericId(0)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Implement identity bridge**

Create `src/domain/awakener-identity.ts`:

```ts
export type PublicAwakenerId = `awakener-${string}`
export type NumericAwakenerId = number

export function numericAwakenerIdFromPublicId(
  publicAwakenerId: string | undefined,
): NumericAwakenerId | undefined {
  if (!publicAwakenerId) {
    return undefined
  }
  const suffix = /^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1]
  return suffix ? Number(suffix) : undefined
}

export function publicAwakenerIdFromNumericId(
  numericAwakenerId: number | undefined,
): PublicAwakenerId | undefined {
  if (!Number.isInteger(numericAwakenerId) || !numericAwakenerId || numericAwakenerId <= 0) {
    return undefined
  }
  return `awakener-${numericAwakenerId.toString().padStart(4, '0')}` as PublicAwakenerId
}
```

Use this module in `public-v2-detail-loaders.ts`, `database-reference-layer.ts`, `awakener-overlays.ts`, and `derived-skills.ts` when converting owner IDs. Replace fake `0` fallbacks with `undefined`.

- [ ] **Step 3: Add shared awakener public utility tests**

Create `src/domain/awakener-public-utils.test.ts`:

```ts
import {describe, expect, it} from 'vitest'

import {
  getPublicAwakenerBaseStatsById,
  resolveCanonicalAwakenerName,
} from './awakener-public-utils'

describe('awakener-public-utils', () => {
  it('resolves canonical names consistently', () => {
    expect(
      resolveCanonicalAwakenerName({
        name: 'HELLO',
        aliases: ['g-test', 'usable alias'],
        assets: {portraitKey: 'murphy-fauxborn'},
      }),
    ).toBe('usable alias')
  })

  it('loads public base stats from the shared full-awakener map', () => {
    expect(getPublicAwakenerBaseStatsById('awakener-0001')).toMatchObject({
      CON: expect.any(Number),
      ATK: expect.any(Number),
      DEF: expect.any(Number),
    })
  })
})
```

- [ ] **Step 4: Implement shared awakener public utilities**

Create `src/domain/awakener-public-utils.ts` with:

```ts
import {z} from 'zod'

import publicAwakenersFull from '@/data/public-v2/full/awakeners.json'

import {parsePublicV2Envelope} from './public-v2-schema'

export const liteStatsSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})

export function resolveCanonicalAwakenerName(awakener: {
  name: string
  aliases?: string[]
  assets?: {portraitKey?: string}
}): string {
  const alias = awakener.aliases?.find((entry) => !entry.trim().startsWith('g-'))?.trim()
  if (alias) {
    return alias
  }
  const portraitKey = awakener.assets?.portraitKey?.trim()
  if (portraitKey) {
    return portraitKey.replace(/-/g, ': ')
  }
  return awakener.name.trim().toLowerCase()
}

const publicFullAwakenerById = new Map(
  parsePublicV2Envelope('awakeners', publicAwakenersFull).records.map((record) => [
    record.id,
    record,
  ]),
)

export function getPublicAwakenerBaseStatsById(publicId: string) {
  const stats = publicFullAwakenerById.get(publicId)?.baseStatsLv1
  if (!stats) {
    throw new Error(`Missing public V2 stats for awakener "${publicId}".`)
  }
  return liteStatsSchema.parse(stats)
}
```

- [ ] **Step 5: Replace duplicate canonical-name and stats schemas**

Use `resolveCanonicalAwakenerName`, `liteStatsSchema`, and `getPublicAwakenerBaseStatsById` in:

- `src/domain/awakeners.ts`
- `src/domain/awakeners-lite-v2.ts`
- `src/domain/awakener-roster.ts`

Remove local duplicate `resolveCanonicalAwakenerName` and `liteStatsSchema` definitions.

- [ ] **Step 6: Refactor `awakener-kits.ts` owner lookups**

Move the three full record arrays and owner indexes outside `adaptPublicAwakenerToKit()`:

```ts
function indexByOwner<T extends {ownerAwakenerId?: string}>(records: readonly T[]) {
  const byOwner = new Map<string, T[]>()
  for (const record of records) {
    if (!record.ownerAwakenerId) {
      continue
    }
    byOwner.set(record.ownerAwakenerId, [...(byOwner.get(record.ownerAwakenerId) ?? []), record])
  }
  return byOwner
}
```

Pass indexed records into the adapter so each awakener does O(1) owner lookup instead of three full `.filter()` passes.

- [ ] **Step 7: Tighten runtime boundary around raw JSON casts**

Extend `src/domain/public-v2-runtime-boundary.test.ts` with a domain-only offender scan for `as unknown as`:

```ts
it('keeps raw public V2 JSON casts out of domain loaders', () => {
  const allowedCastFiles = new Set(['src/domain/public-v2-schema.ts'])
  const offenders = runtimeSourceFiles.flatMap((filePath) => {
    const normalizedPath = normalizePath(filePath)
    if (!normalizedPath.startsWith('src/domain/') || allowedCastFiles.has(normalizedPath)) {
      return []
    }
    return readSource(filePath).includes('as unknown as') ? [normalizedPath] : []
  })

  expect(offenders).toEqual([])
})
```

Then replace domain loader casts with `parsePublicV2Envelope`, `parsePublicV2Record`, or explicit local adapter input types.

- [ ] **Step 8: Document and type the two awakener lite representations**

Add comments at the interfaces:

```ts
// UI/database-facing awakener identity. Uses public V2 string ids.
export interface Awakener { ... }
```

and:

```ts
// Source-schema lite record retained for scaling/tests. Uses numeric ids by design.
export interface AwakenerLiteV2Record { ... }
```

Add a small adapter or conversion helper only if a callsite crosses between the two. Do not rename both representations in this task.

- [ ] **Step 9: Make wheel realm normalization explicit**

In `src/domain/wheels.ts`, replace the inline normalization with a named helper:

```ts
export function normalizeWheelLiteRealm(realm: string): Wheel['realm'] {
  return realm === 'OTHER' ? 'NEUTRAL' : (realm as Wheel['realm'])
}
```

In `src/domain/wheels-full-v2.ts`, add a comment that full records preserve raw public realm values, including `OTHER`, because the detail layer may need source fidelity. Add tests if none exist for `OTHER` behavior.

- [ ] **Step 10: Run focused legacy tests**

Run:

```bash
npm run test -- --run src/domain/awakener-identity.test.ts src/domain/awakener-public-utils.test.ts src/domain/public-v2-runtime-boundary.test.ts src/domain/public-v2-detail-loaders.test.ts src/domain/collection-ownership.test.ts src/domain/wheels.test.ts
```

Expected: PASS.

## Final Verification

- [ ] Run all focused suites from Tasks 1-8.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test:bounded`.
- [ ] Run `npm run build`.
- [ ] Manually smoke the database routes in the browser:
  - `/database`
  - `/database/wheels`
  - `/database/posses?q=wish&realm=FADED_LEGACY`
  - `/database/covenants?q=deus`
  - `/database/posses/voices-in-your-head`
  - `/database/covenants/deus-ex-machina`
- [ ] Confirm covenant popovers show all set effects, not just the first set effect.
- [ ] Confirm opening and closing any detail modal preserves the current query string.
- [ ] Confirm typing into browse search updates URL via replace-style history.
- [ ] Confirm discrete filter changes push history entries.

## Execution Notes

- Do not add aggregate full-data helpers for posses/covenants. The final target is per-record loading.
- Do not force posse `ownerAwakenerId` into the numeric awakener ID world. Use the identity bridge only where legacy awakener skill/overlay types require numeric IDs.
- Do not extract one giant generic search engine. Extract `toPriority`, priority sorting, and direct/fuzzy merge helpers; leave entity-specific indexing and Fuse options local.
- Do not convert the entire DB scope to Zustand. The store is for shared detail runtime state: preferences, collection ownership, and search capture suppression.
- Keep unrelated visual redesign out of scope.
