# Covenant & Posse DB Implementation Audit

**Date:** 2026-05-04  
**Scope:** Commit `b3d131c` — "Add posse and covenant database views"  
**Compared against:** Awakeners DB, Wheels DB, shared domain layer

---

## Summary

The new posse and covenant sections are broadly functional and structurally sound
in their domain definitions. However, the commit introduces several anti-patterns,
inconsistencies vs. existing entity implementations, and a handful of latent bugs.
Issues are ordered by severity.

---

## P0 — Correctness / Potential Bugs

### 1. `getCovenantsFullV2()` is a no-op manual cache over a static import

**File:** `src/domain/covenants-full-v2.ts:23-32`

```ts
let covenantsFullV2Cache: CovenantFullV2Record[] | null = null

export function getCovenantsFullV2(): CovenantFullV2Record[] {
  if (covenantsFullV2Cache) { return covenantsFullV2Cache }
  covenantsFullV2Cache = (publicCovenantsFull as PublicCovenantEnvelope).records
  return covenantsFullV2Cache
}
```

`publicCovenantsFull` is a static eager import — it is already a module-level
singleton. The `covenantsFullV2Cache` variable is permanently populated after the
first call but never re-derived. The cast `as PublicCovenantEnvelope` discards
type safety at the only boundary where correctness could be checked. More
importantly: `getCovenantsFullV2()` loads **the full flat `covenants.json`
bundle** eagerly via `import ... from '@/data/public-v2/full/covenants.json'`.
This defeats lazy loading. Compare with wheels: `getWheelsFullV2()` also eager-
loads `wheels.json`, but covenants additionally expose this data in the
`hydrateGlobalDatabaseReferenceInfo` popover path which was specifically designed
to do per-record lazy dynamic imports. The bundler will include all covenant full
data in the initial chunk regardless of whether the user ever opens the covenants
tab or a covenant popover.

Contrast: `posses-full-v2.ts` does the identical anti-pattern, and wheels-full-v2
also eager-imports the aggregate — but wheels exist as per-record JSON files under
`wheels-records/` while posses and covenants now live under `posses-records/` and
`covenants-records/` respectively. The per-record loaders in
`public-v2-detail-loaders.ts` call `loadPublicV2FullRecord('posses', id)` and
`loadPublicV2FullRecord('covenants', id)` which correctly use the per-record split
— but `getCovenantsFullV2()` and `getPossesFullV2()` additionally load the whole
flat aggregates, creating a double-loading path.

### 2. `hydrateGlobalDatabaseReferenceInfo` only previews the **first** covenant set effect

**File:** `src/domain/global-database-reference-layer.ts:343-358`

```ts
const record = getCovenantsFullV2().find((entry) => entry.id === info.id)
const setEffect = record?.setEffects[0]  // always index 0
```

Covenants have multiple set effects (2-set, 4-set, etc.). The popover hydration
always picks `setEffects[0]`, showing only the first bonus. The detail modal and
`buildCovenantPopoverEntry` correctly iterate all effects. This inconsistency means
the inline popover (triggered from skill text or the reference trail) will only
ever show the 2-set effect, silently dropping the rest.

### 3. `withNumericOwner` casts `ownerAwakenerId` to `number` via string template

**File:** `src/domain/public-v2-detail-loaders.ts:161-166`

```ts
function withNumericOwner<T extends {ownerAwakenerId?: string}>(record: T): T {
  return {
    ...record,
    ownerAwakenerId: record.ownerAwakenerId
      ? numericAwakenerId(record.ownerAwakenerId)  // returns number
      : undefined,
  } as T  // silences the type error
}
```

`numericAwakenerId` returns `number`, but `T['ownerAwakenerId']` is typed as
`string | undefined`. The `as T` cast suppresses what would otherwise be a type
error. This function applies to awakeners, wheels, and overlays, but **not** to
the new posse/covenant loaders. The new loaders pass the raw `PosseFullV2Record`
and `CovenantFullV2Record` directly without adaptation, which keeps
`ownerAwakenerId` as a `string` (e.g. `"awakener-0012"`). Downstream consumers
that expected numeric IDs for awakener lookups may silently get wrong results.
The `PosseMeta` component in `SimpleArtifactDetailModal` calls
`onSelectAwakener?.({id: fullDataV2.ownerAwakenerId ?? '', ...})` — if awakener
lookup expects a numeric ID this will fail silently.

---

## P1 — Architecture / Global DB Scope Violations

### 4. Posse and covenant browse state is fully inline in `DatabasePage`

**File:** `src/pages/DatabasePage.tsx:170-182`

```ts
const [posseQuery, setPosseQuery] = useState('')
const [posseRealmFilter, setPosseRealmFilter] = useState<PosseRealmFilter>('ALL')
const [covenantQuery, setCovenantQuery] = useState('')
```

Awakeners and wheels have dedicated `useDatabaseBrowseState` /
`useWheelsDatabaseBrowseState` hooks that back their state in the URL via
`useSearchParams`. Posses and covenants use raw `useState`, meaning:

- Filters are lost on navigation (back button clears them)
- No URL sharing / deep-linking of filtered views
- No `resetFilters` anti-regression path matching the awakener/wheel pattern

This is a deliberate architectural asymmetry — presumably a shortcut — but it
creates visible user-facing inconsistency and will drift further as more entities
are added.

### 5. Global search capture uses 4-way `if/else` with raw state setter

**File:** `src/pages/DatabasePage.tsx:197-233`

The `useGlobalSearchCapture` callback block for `onAppendCharacter`,
`onRemoveCharacter`, and `onClearSearch` branches on `activeEntity` with a
cascading `if/else if/else` block three times. Awakeners and wheels delegate to
their browse state hooks (which encapsulate the URL logic), but posses and
covenants call `setPosseQuery`/`setCovenantQuery` raw. Every new entity type
requires modifying this block in three places. This should be an abstracted
`activeSearchActions` object resolved from `activeEntity`.

### 6. Four parallel `useEffect` redirect guards, each independently encoding the browse path

**File:** `src/pages/DatabasePage.tsx:235-281`

```ts
useEffect(() => { if (awakenerSlug && !selectedAwakener) { ... } }, ...)
useEffect(() => { if (wheelSlug && !selectedWheel) { ... } }, ...)
useEffect(() => { if (posseSlug && !selectedPosse) { ... } }, ...)
useEffect(() => { if (covenantSlug && !selectedCovenant) { ... } }, ...)
```

These are structurally identical. A single `useEffect` with a unified "selected
entity" resolution would eliminate this duplication. As entities grow, each new
type requires a new copy-pasted block.

### 7. Four parallel `openXxxDetail` functions with identical structure

**File:** `src/pages/DatabasePage.tsx:283-325`

```ts
function openAwakenerDetail(awakenerId: string) { ... }
function openWheelDetail(wheelId: string) { ... }
function openPosseDetail(posseId: string) { ... }
function openCovenantDetail(covenantId: string) { ... }
```

All four functions do a `.find` on the relevant data array and call
`navigate({pathname: buildXxxPath(item), search: location.search})`. This pattern
could be a single generic function or at least co-located. Passing `onSelectXxx`
callbacks explicitly down to sub-route components means this will keep growing
with each new entity type.

### 8. Route parsing is a hand-rolled `parseDatabaseRoute` instead of using React Router params

**File:** `src/pages/DatabasePage.tsx:138-163`

```ts
function parseDatabaseRoute(pathname: string): {...} {
  const parts = pathname.split('/').filter(Boolean)
  ...
}
```

React Router already provides `useParams()` with the named `:wheelSlug`,
`:posseSlug`, `:covenantSlug` parameters for each route. The manual string-split
parser duplicates the route-parameter extraction that the router already does, and
silently ignores the segment order constraints. This is a pre-existing issue but
the new commit adds two more entity types to the parser, growing the problem.

### 9. `simple-artifact-database-reference-layer.ts` is a misleadingly-named re-export shim

**File:** `src/domain/simple-artifact-database-reference-layer.ts`

```ts
export {
  buildCovenantDatabaseDescriptionRecord,
  buildGlobalDatabaseReferenceLayer as buildSimpleArtifactReferenceLayer,
  buildPosseDatabaseDescriptionRecord,
} from './global-database-reference-layer'
```

`buildGlobalDatabaseReferenceLayer` is re-exported as
`buildSimpleArtifactReferenceLayer` via this shim, making the callsite in
`SimpleArtifactDetailModal` appear to use a scoped "simple artifact" layer, but
actually builds the full global reference layer (with all skills, overlays,
derived skills, wheels, posses, covenants). This is an abstraction leak: the
"simple" artifact modal is using a heavy global layer builder when it only needs
the posse/covenant-scoped descriptions. The name actively misleads reviewers about
the cost and scope of the call.

---

## P2 — Duplication / Inconsistency vs. Existing Implementations

### 10. `PosseRealmFilter` type is private to `SimpleArtifactFilters.tsx` rather than domain-owned

**File:** `src/pages/database/SimpleArtifactFilters.tsx:6-13`

```ts
export type PosseRealmFilter =
  | 'ALL'
  | 'FADED_LEGACY'
  | 'AEQUOR'
  | 'CARO'
  | 'CHAOS'
  | 'ULTRA'
  | 'OTHER'
```

This duplicates realm values that already exist as domain knowledge (see `realms.ts`).
The `DatabaseFilters`/`WheelDatabaseFilters` components similarly define realm filter
IDs, but those are backed by `domain/database-browse-state.ts` types. The posse realm
filter type lives in a UI component file, not in the domain, making it inaccessible
to the browse-state layer when one is eventually added. Compare with `RealmFilterId`
in `database-browse-state.ts`.

### 11. `covenants-search.ts` duplicates `toPriority` and the two-phase search pattern

**File:** `src/domain/covenants-search.ts:103-108`

The `toPriority` helper is copy-pasted identically across:
- `covenants-search.ts`
- `posses-search.ts`
- `wheels-search.ts`

All three files also share the same `WeakMap` cache pattern, the same two-phase
(direct match + fuzzy merge) structure, and the same Fuse instantiation options
block. There is a clear `search-utils.ts` home for `toPriority` that already holds
`getBestSearchFieldMatch`, `getNormalizedSearchValues`, and `normalizeForSearch`.
`toPriority` belongs there.

### 12. `covenants-search.ts` indexes `covenant.assetId` as supplemental search field

**File:** `src/domain/covenants-search.ts:62`

```ts
normalizedSupplemental: getNormalizedSearchValues([covenant.assetId]),
```

`assetId` values look like `"covenant-icon-001"` — internal identifiers that
users will never type. Supplemental search inclusion of raw asset IDs creates
garbage fuzzy hits. Compare with posse/wheel supplemental fields (realm label,
awakener name, mainstat) which are actual user-visible values. This also means
the Fuse `normalizedSupplemental` key with weight `0.05` will match partial
internal token strings.

### 13. `searchCovenants` does not apply the secondary sort-by-name tiebreaker

**File:** `src/domain/covenants-search.ts:32-37`

```ts
.sort((left, right) => left.priority - right.priority)
```

`searchPosses` and `searchWheels` both include a secondary
`.localeCompare(name, ...)` tiebreaker when priorities are equal.
`searchCovenants` omits this, producing non-deterministic ordering among same-
priority results (dependent on JS engine sort stability, which is guaranteed in
V8 but should be explicit).

### 14. `PosseFullV2Record` and `CovenantFullV2Record` do not go through an adaptation step

**Files:** `src/domain/public-v2-detail-loaders.ts:404-440`

```ts
const recordPromise = loadPublicV2FullRecord('posses', posseId).then((record) =>
  record ? (record as unknown as PosseFullV2Record) : undefined,
)
```

Wheels use `adaptPublicV2WheelRecord` to fill defaults, normalise enums, and
compute derived fields (`mainstatSeriesKey`, `aliases`, `searchTags`). Awakeners
use `adaptPublicV2AwakenerRecord`. Posses and covenants use `as unknown as Type`
double-cast with no adaptation layer. If the JSON schema diverges from the
TypeScript interface (e.g. a field gains a default), the mismatch will be silently
swallowed. Any future normalisation requirement (defaults, enum validation) has no
place to live without adding an adapter.

### 15. `getCovenantsFullV2` has no equivalent to `getCovenantFullV2ById`

**File:** `src/domain/covenants-full-v2.ts`

`posses-full-v2.ts` exports `getPosseFullV2ById(id, records)`.
`wheels-full-v2.ts` exports `getWheelFullV2ById(id, records)`.
`covenants-full-v2.ts` exports only `getCovenantsFullV2()`. The
`hydrateGlobalDatabaseReferenceInfo` in `global-database-reference-layer.ts`
therefore inlines its own `.find()` call instead of using a named accessor. The
missing `getCovenantFullV2ById` is a consistency gap and the inline find call in
the hydrate function is harder to understand and test in isolation.

### 16. `posses-full-v2.ts` imports `posses.json` **and** per-record files are also present

Both `src/data/public-v2/full/posses.json` (flat aggregate, all 50 records) and
`src/data/public-v2/full/posses-records/*.json` (per-record split) exist. The
flat aggregate is eagerly imported in `posses-full-v2.ts`, bundling all 50 posse
full records into the initial chunk. The per-record split is used by
`loadPublicV2PosseFullById` for lazy detail loading. This is the same split-
loading design used for wheels (`wheels.json` + `wheels-records/`), but wheels
full data is only used lazily — the eager `getWheelsFullV2()` is consumed by the
popover hydration path, not by the initial page render. For posses and covenants,
`getCovenantsFullV2()` / `getPossesFullV2()` are currently only called inside
`hydrateGlobalDatabaseReferenceInfo` (async, lazy import path), so the eager
module-level import in those files is currently unnecessary but will land in the
initial bundle if the module is ever imported directly.

---

## P3 — Minor Issues / Nitpicks

### 17. `DatabaseCovenantDetailRoute` does not accept `onSelectAwakener`

**File:** `src/pages/DatabasePage.tsx:758-786`

`DatabasePosseDetailRoute` passes `onSelectAwakener` down to
`SimpleArtifactDetailModal`, enabling navigation to an awakener from a posse's
owner link. `DatabaseCovenantDetailRoute` does not, and
`SimpleArtifactDetailModal`'s `CovenantDetailModalProps` types `onSelectAwakener`
as `never`. Covenants may gain owner/awakener links in the future — the `never`
type will require a more invasive change than if it were typed as
`never | undefined`. The asymmetry is intentional but undocumented.

### 18. Duplicate loading fallback strings are copy-pasted

**File:** `src/pages/DatabasePage.tsx:531,549,565,579`

```tsx
<div className='px-2 py-3 text-sm text-slate-300'>Loading awakener details...</div>
<div className='px-2 py-3 text-sm text-slate-300'>Loading wheel details...</div>
<div className='px-2 py-3 text-sm text-slate-300'>Loading posse details...</div>
<div className='px-2 py-3 text-sm text-slate-300'>Loading covenant details...</div>
```

And the same strings appear again inside each `DatabaseXxxDetailRoute` `if
(isLoading)` guard. The same `className` string and structure is repeated 8 times.
A named `DatabaseDetailLoadingFallback` or shared constant would reduce noise.

### 19. `SimpleArtifactDetailModal` has a `noop` defined at module scope

**File:** `src/pages/database/SimpleArtifactDetailModal.tsx:64-66`

```ts
const noop = () => {
  return undefined
}
```

This `noop` function is passed as `clearSearch`/`closeSearch` to
`useDatabaseDetailModalLifecycle`. `() => undefined` is cleaner and avoids an
exported-looking module-level constant for what is a pass-through default.

### 20. `CovenantGrid` passes no `realm` to `SimpleArtifactGridCard`

**File:** `src/pages/database/SimpleArtifactGrid.tsx:45-53`

```tsx
<SimpleArtifactGridCard
  id={covenant.id}
  imageSrc={getCovenantAssetById(covenant.id)}
  index={index}
  key={covenant.id}
  name={covenant.name}
  onSelect={onSelectCovenant}
  // no `realm` prop
/>
```

`SimpleArtifactGridCard` defaults `realm` to `'NEUTRAL'` when omitted, which
renders the neutral amber accent for all covenant cards. `Covenant` has no `realm`
field (by design — covenants are not realm-bound), so this is arguably correct,
but the card renders with `DEFAULT_REALM_ACCENT` (amber gold) regardless of
whether that is the intended visual. There is no comment or explicit design
acknowledgment. `PosseGrid` correctly passes `realm`.

### 21. Route ordering in `App.tsx` — detail before browse for wheels, reversed for posse/covenant

**File:** `src/App.tsx:53-59`

```tsx
<Route element={<DatabasePage />} path='/database/wheels/:wheelSlug' />
<Route element={<DatabasePage />} path='/database/wheels' />
<Route element={<DatabasePage />} path='/database/posses/:posseSlug' />
<Route element={<DatabasePage />} path='/database/posses' />
```

Wheels: detail route listed before browse. Posses/covenants: same order. This is
consistent within the new additions but inconsistent with awakeners which follow
the original `/database/wheels` ordering. React Router v6 uses specificity not
order, so this has no runtime impact, but inconsistency adds confusion when
reading route configuration.

### 22. `getActiveDatabaseEntity` uses `pathname.startsWith` on computed paths

**File:** `src/pages/DatabasePage.tsx:125-136`

```ts
if (pathname.startsWith(buildDatabaseCovenantBrowsePath())) {
  return 'covenants'
}
```

`buildDatabaseCovenantBrowsePath()` returns `'/database/covenants'`. If a future
entity were named `covenantsv2`, `'/database/covenantsv2/foo'.startsWith('/database/covenants')`
would incorrectly return `'covenants'`. Using `pathname.startsWith(path + '/')` or
checking for exact prefix boundaries would be safer.

### 23. `PosseFullV2Record.realm` is typed as `string`, not a union

**File:** `src/domain/posses-full-v2.ts:8`

```ts
realm: string
```

`WheelFullV2Record.realm` is typed as
`'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL' | 'OTHER'`. The posse realm
in the lite schema is also validated as a non-empty string but with no enum
constraint in the full record interface. `Posse` (from `posses.ts`) carries realm
as `string`, which is consistent, but the full record interface should at minimum
match what the loader data actually provides. The inconsistency between
`WheelFullV2Record` and `PosseFullV2Record` makes it harder to write type-safe
generic artifact utilities.

### 24. `getCovenantFullArtAssetById` uses the same `assetId` path as the icon

**File:** `src/domain/covenant-assets.ts:49-52`

```ts
export function getCovenantFullArtAssetById(covenantId: string): string | undefined {
  const assetId = covenantAssetIdById.get(covenantId)  // icon assetId
  return assetId ? covenantFullArtAssetByAssetId.get(assetId) : undefined
}
```

`covenantAssetIdById` maps IDs to icon file stems (e.g. `"Icon_Trinket_001"`).
The full-art lookup then uses this same icon stem against `covenantFullArtAssets`.
If the full-art files are named differently from the icon files (which is common —
art assets often follow separate naming conventions), this lookup will silently
return `undefined`. The posse asset module correctly separates `assetId`,
`assetCrystalId`, and `assetBadgeId` with distinct lookup maps. Covenants have
only one asset map, which means the full-art path shares the icon naming derivation
with no independent validation.

---

## Broader DB Domain Smells (Pre-existing, Not Commit-specific)

These issues exist independently of the covenant/posse additions. They are legacy
or drift smells left behind during the migration to the public-v2 data format.

---

### L1. `Awakener.id` is a dual-identity type: `string` in the DB layer, `number` in the source schema layer

**Files:** `src/domain/awakeners.ts:63-77`, `src/domain/awakeners-lite-v2.ts:13`, `src/domain/awakener-roster.ts:44`

`Awakener.id` is typed as `string` (e.g. `"awakener-0012"`) and is the primary key
used in the new public-v2 DB layer. Meanwhile `AwakenerRosterRecord.id`,
`AwakenerLiteV2Record.id`, and `AwakenerFullV2Record.id` are all `number` — the old
`numericId` (`12`) promoted to primary key in the source schema layer. The two
parallel identity systems coexist throughout the codebase:

- `getAwakenerFullV2ById(awakenerId: number, ...)` — numeric
- `findAwakenerByDatabaseSlug(awakeners, slug)` on `Awakener` — string
- `Awakener.numericId?: number` — optional bridge field
- `awakener-record-ids.ts` exists specifically to convert between the two
- `buildAccessibleDatabaseOverlays` in `database-reference-layer.ts` handles both
  forms in a single coercion block
- `withNumericOwner` in `public-v2-detail-loaders.ts` silently downcasts string
  IDs back to numbers for awakener lookups

This dual identity is the root cause of issues like the `ownerAwakenerId` adapter
gap (audit item #3) and the collection ownership bug noted in project history. There
is no canonical "source of truth" type that works across both layers without an
explicit bridge. Every new feature touching awakeners must independently re-discover
which ID flavour is in scope.

---

### L2. `awakeners.ts` imports `public-v2/full/awakeners.json` at the top level — just for base stats

**File:** `src/domain/awakeners.ts:3`

```ts
import publicAwakenersFull from '@/data/public-v2/full/awakeners.json'
```

This is the full awakeners aggregate JSON (contains all per-awakener full records).
It is imported eagerly at module level only to extract `baseStatsLv1` for the lite
`Awakener` interface via `getPublicStats()`. The same full JSON is *also* eagerly
imported by `awakeners-lite-v2.ts` and `awakener-roster.ts` for the same purpose.
That's three separate eager module-level imports of the same large JSON file across
three different entry points. They all parse/index their own copy of the same data
at startup. There is no shared singleton for `fullAwakenerById`.

---

### L3. `resolveCanonicalAwakenerName` is copy-pasted across two files with identical logic

**Files:** `src/domain/awakeners.ts:109-123`, `src/domain/awakeners-lite-v2.ts:62-72`

The function bodies are identical (aliases → portraitKey → lowercase name fallback),
but defined privately in each module. It belongs in a shared awakener utility module.

---

### L4. `liteStatsSchema` (CON/ATK/DEF) is defined twice

**Files:** `src/domain/awakeners.ts:6-10`, `src/domain/awakeners-lite-v2.ts:6-10`

Identical three-field Zod schema, copy-pasted. Should be shared — either from
`awakener-source-schema.ts` or a dedicated schema module.

---

### L5. `awakener-kits.ts` re-reads the full `skills.json`, `talents.json`, and `enlightens.json` inside a per-record loop

**File:** `src/domain/awakener-kits.ts:41-44`

```ts
function adaptPublicAwakenerToKit(record: ...): AwakenerKitRecord {
  const skills   = (publicSkillsFull   as unknown as PublicOwnedEnvelope).records
  const talents  = (publicTalentsFull  as unknown as PublicOwnedEnvelope).records
  const enlightens = (publicEnlightensFull as unknown as PublicOwnedEnvelope).records
  ...
}
```

`adaptPublicAwakenerToKit` is called once per awakener in `.map(adaptPublicAwakenerToKit)`.
Each call re-dereferences the three module-level imports and re-casts them — they
evaluate to the same object every time, so there's no real cost, but the structure
reads as if they are local lookups. More seriously: each call runs three `.filter()`
passes over the full records arrays to find owned entries. With ~100 awakeners ×
3 datasets this is O(n²) at parse time. The adapter should receive pre-filtered
records or pre-built owner index maps as arguments.

---

### L6. `as unknown as` escape-hatch pattern is endemic across domain loaders

The following files all use `as unknown as <Type>` to suppress type errors when
reading imported JSON:

- `awakener-kits.ts` — ×3
- `awakener-roster.ts` — ×1
- `awakener-skills.ts`, `awakener-talents.ts`, `awakener-enlightens.ts`, `awakener-overlays.ts` — ×1 each
- `derived-skills.ts` — ×1
- `posses-full-v2.ts`, `covenants-full-v2.ts` — ×1 each (single-cast `as Type`)
- `public-v2-detail-loaders.ts` — ×2 for adapted records

The `public-v2-schema.ts` runtime parser exists precisely to validate and type
these imports safely. However, the individual domain loaders bypass it in favour
of `as unknown as` casts, meaning no schema validation occurs at the boundary.
Zod schemas exist in `awakener-source-schema.ts` for the output types, and the
`parse()` call at the end of each cache function validates the *adapted* record —
but not the raw JSON input. A runtime format error in the JSON would only surface
as a confusing downstream validation error in the schema parse, not at the import
boundary.

---

### L7. `awakeners-lite-v2.ts` and `awakeners.ts` represent the same domain entity with different ID types and no shared interface

`Awakener` (from `awakeners.ts`) and `AwakenerLiteV2Record` (from
`awakeners-lite-v2.ts`) model the same concept — a lightweight awakener for UI
listing — but with incompatible `id` fields (`string` vs `number`). Both are in
active use in different parts of the codebase. `getAwakenersLiteV2()` is used by
tests and the level-scaling system; `getAwakeners()` is used by the DB page,
builder, and search. There is no explicit migration path or deprecation marker
distinguishing which is the "current" representation. The split will continue to
attract bugs as features cross from one zone to the other.

---

### L8. `toPriority` is duplicated across **four** search modules

Confirmed in: `awakeners-search.ts`, `wheels-search.ts`, `posses-search.ts`,
`covenants-search.ts`. All four have byte-for-byte identical signatures and bodies.
`search-utils.ts` already centralises the other search primitives. `toPriority`
has a clear home there and would eliminate all four copies.

---

### L9. `DatabasePage.tsx` is a 787-line god component with four entity branches

**File:** `src/pages/DatabasePage.tsx`

This is the DB equivalent of the `BuilderPage` problem. The file manages:
- Route parsing for 4 entity types
- Browse state for 4 entity types (2 URL-backed, 2 raw `useState`)
- Filter derivation for 4 entity types
- Navigation handlers for 4 entity types
- 4 detail route sub-components rendered inline
- The `useGlobalSearchCapture` integration

Each new entity type adds another branch to every existing fan-out. There are no
sub-route components owning their own entity browse state — everything funnels
through `DatabasePage`. At 4 entities it is already difficult to follow; the
pattern will not scale to a 5th or 6th entity type without significant refactoring.
The URL-backed browse state pattern established for awakeners/wheels should be
applied to all entities, which would also allow each entity's browse logic to
move into its own view-model hook.

---

### L10. `awakeners.ts` uses `.loose()` schema validation for the full JSON, hiding unknown fields

**File:** `src/domain/awakeners.ts:55`

```ts
const publicAwakenersFullSchema = z.object({...}).loose()
```

`.loose()` is Zod's equivalent of ignoring extra keys on the input. The full
awakener JSON goes through a `.loose()` schema that only validates the fields
`awakeners.ts` cares about, silently ignoring everything else. If a field is
renamed or restructured in the source data, the schema passes with no error and
the data simply becomes `undefined` downstream. Compare with the lite schema for
awakeners, posses, covenants, and wheels which all use `.strict()` and a
`recordCount` cross-check. The full-JSON schema has weaker validation because it
was written to tolerate an evolving format, but the `.loose()` annotation is
easy to miss and the asymmetry is not documented.

---

### L11. Wheel `realm` silently normalises `'OTHER'` to `'NEUTRAL'` in the lite adapter with no comment

**File:** `src/domain/wheels.ts:63`

```ts
realm: wheel.realm === 'OTHER' ? 'NEUTRAL' : wheel.realm,
```

This silent normalisation means `WheelRealm` (the `Wheel` interface's realm type)
does not include `'OTHER'`, but `WheelFullV2Record.realm` does. Code that crosses
between the lite and full representations may hit `'OTHER'` unexpectedly in the
full record, since the normalisation only happens in the lite adapter. There is no
corresponding normalisation in `wheels-full-v2.ts`, and `WheelFullV2Record` keeps
`'OTHER'` in its union. Posses don't apply an equivalent normalisation — the posse
`isFadedLegacy` flag is stored alongside `realm: 'FADED_LEGACY'` and treated
separately downstream, but the lite `Posse.realm` keeps the raw value. The
inconsistency creates a different mental model for realm handling per entity type.

---

## Summary Table

| # | Severity | Area | Description |
|---|----------|------|-------------|
| 1 | P0 | Bundle | Eager import of full covenants/posses defeats lazy hydration |
| 2 | P0 | Correctness | Popover hydration only shows first set effect |
| 3 | P0 | Type safety | `ownerAwakenerId` not adapted to numeric ID for posse links |
| 4 | P1 | Architecture | Posse/covenant browse state not URL-backed |
| 5 | P1 | Architecture | Global search capture is 3× duplicated if/else |
| 6 | P1 | Architecture | 4 parallel redirect useEffect blocks |
| 7 | P1 | Architecture | 4 parallel `openXxxDetail` functions |
| 8 | P1 | Architecture | Hand-rolled route parser duplicating React Router params |
| 9 | P1 | Architecture | `simple-artifact-database-reference-layer` is a misleading shim |
| 10 | P2 | Consistency | `PosseRealmFilter` lives in a UI file, not domain |
| 11 | P2 | Duplication | `toPriority` copy-pasted across 4 search modules |
| 12 | P2 | Correctness | Covenant supplemental field indexes raw asset IDs |
| 13 | P2 | Consistency | `searchCovenants` missing locale-compare tiebreaker |
| 14 | P2 | Type safety | Posse/covenant loaders use double-cast, no adapter |
| 15 | P2 | Consistency | `getCovenantFullV2ById` missing, unlike posses/wheels |
| 16 | P2 | Bundle | Flat aggregate imported alongside per-record files |
| 17 | P3 | Design | `DatabaseCovenantDetailRoute` lacks `onSelectAwakener` |
| 18 | P3 | Duplication | Loading strings copy-pasted 8 times |
| 19 | P3 | Style | `noop` as module-level constant |
| 20 | P3 | UX | `CovenantGrid` passes no realm accent to cards |
| 21 | P3 | Style | Route ordering inconsistency in `App.tsx` |
| 22 | P3 | Robustness | `startsWith` entity detection without boundary check |
| 23 | P3 | Type safety | `PosseFullV2Record.realm` untyped vs wheel union |
| 24 | P3 | Correctness | Full-art asset lookup shares icon stem, may silently miss |
| L1 | Legacy | Architecture | Dual awakener ID system (`string` vs `number`) with no canonical bridge type |
| L2 | Legacy | Bundle | `full/awakeners.json` eagerly imported 3× independently just for base stats |
| L3 | Legacy | Duplication | `resolveCanonicalAwakenerName` copy-pasted in two modules |
| L4 | Legacy | Duplication | `liteStatsSchema` defined identically in two modules |
| L5 | Legacy | Performance | `awakener-kits.ts` runs O(n²) filter passes inside a per-record `.map()` |
| L6 | Legacy | Type safety | `as unknown as` cast pattern endemic — raw JSON inputs never schema-validated |
| L7 | Legacy | Architecture | `Awakener` and `AwakenerLiteV2Record` are parallel representations with no deprecation boundary |
| L8 | Legacy | Duplication | `toPriority` copied to awakeners-search (first noted as 4 files under P2#11 — awakeners is the 4th) |
| L9 | Legacy | Architecture | `DatabasePage.tsx` is a 787-line god component, will not scale beyond 4 entities |
| L10 | Legacy | Type safety | Full awakener JSON schema uses `.loose()` — unknown field changes silently ignored |
| L11 | Legacy | Consistency | Wheel realm `'OTHER'→'NEUTRAL'` silent normalisation absent from full record interface |

---

## Supplementary Audit: `useEffect` Anti-patterns and State Management

**Reference:** [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect),
*Why we banned React's useEffect* (Alvin Sng, 2026-03-17)

**Scope:** All `useEffect` usages across `src/pages/database/`, `src/pages/DatabasePage.tsx`,
and their parent hook/component trees. Zustand and Immer are available in the bundle
but unused in the DB scope.

---

### E1. `DatabasePage.tsx` — 4 redirect `useEffect` blocks are derived-state effects (Rule 1 violation)

**File:** `src/pages/DatabasePage.tsx:235-281`

```ts
useEffect(() => {
  if (awakenerSlug && !selectedAwakener) {
    void navigate({pathname: ..., search: location.search}, {replace: true})
  }
}, [awakenerSlug, location.search, navigate, selectedAwakener])
// × 4 for awakeners, wheels, posses, covenants
```

All four blocks answer the same question: *"does the URL slug resolve to a known
entity?"*. The answer is purely derived from `location.pathname` and the in-memory
entity lists — no async work, no external system, no subscription. This is
Rule 1 (*derive state, don't sync it*).

The correct primitive is a redirect rendered during render, not an effect:

```ts
const selectedAwakener = findAwakenerByDatabaseSlug(databaseAwakeners, awakenerSlug)

if (awakenerSlug && !selectedAwakener) {
  return <Navigate to={...} replace />
}
```

React Router's `<Navigate>` component is designed exactly for this. The current
approach introduces a render → effect → navigate cycle that fires a render cycle
*after* the bad URL has already been painted (even if briefly). With `<Navigate>`
it is synchronous and never renders the bad state at all.

---

### E2. `useAwakenerDetailDatabaseState` — `useEffect` to reset selection when record changes (Rule 5 violation)

**File:** `src/pages/database/useAwakenerDetailDatabaseState.ts:43-50`

```ts
useEffect(() => {
  if (previousRecordIdRef.current === fullDataV2.id) {
    return
  }
  previousRecordIdRef.current = fullDataV2.id
  setSelection(defaultSelection)
}, [defaultSelection, fullDataV2.id])
```

This is textbook Rule 5: *reset with key, not dependency choreography*. The effect
exists solely to reset `selection` when `fullDataV2.id` changes — a component
lifecycle boundary. The `AwakenerDetailModalInner` already has `key={awakener.id}`
set on its wrapper, so the full subtree remounts when the awakener changes.
`useAwakenerDetailDatabaseState` is called inside that subtree. Because the component
remounts on ID change, `selection` already resets from initial state — the
`useEffect` and `previousRecordIdRef` are redundant. If remounting isn't sufficient,
the correct fix is to move the `key` one level closer to this hook's consumer, not
to layer effect-based reset choreography on top.

---

### E3. `useDatabaseDetailPreferences` — write-on-change pattern without `useEffect` is already correct, but state is duplicated per modal instance

**File:** `src/pages/database/useDatabaseDetailPreferences.ts`

The preferences hook correctly avoids `useEffect` for persistence — it writes
synchronously inside the `setState` updater. This is the right pattern.

However, the hook is instantiated fresh per detail modal (`useAwakenerDetailDatabaseState`,
`SimpleArtifactDetailModal`). Each instance reads from `localStorage` in its
`useState` initialiser and writes back on each change. There is no shared
subscription across simultaneously-mounted modals, and more importantly, there is
no mechanism for two concurrently mounted modals to see each other's preference
updates. For example, if an Awakener and a Covenant popover were both open,
changing `accountLevel` in one would not propagate to the other.

The right primitive here is a **Zustand store** (already in the bundle):

```ts
// database-detail-preferences-store.ts
const useDatabaseDetailPreferencesStore = create<...>((set) => ({
  preferences: readDatabaseDetailPreferences(),
  updatePreferences: (patch) => set((state) => {
    const next = mergeDatabaseDetailPreferences(state.preferences, patch)
    writeDatabaseDetailPreferences(patch)
    return {preferences: next}
  }),
}))
```

All modal instances subscribe to the same store. Updates propagate immediately
to all consumers. No `useEffect`, no duplication, no stale-read race on open.

---

### E4. `useDetailEntitySearch` — `useEffect` for keyboard capture with `searchQuery` in deps causes listener churn (Rule 3 violation)

**File:** `src/pages/database/useDetailEntitySearch.ts:109-145`

```ts
useEffect(() => {
  function handleGlobalSearchCapture(event: KeyboardEvent) {
    ...
    const action = getSearchCaptureAction({
      currentSearchValue: searchInputRef.current?.value ?? searchQuery,
      ...
    })
    ...
  }
  window.addEventListener('keydown', handleGlobalSearchCapture)
  return () => window.removeEventListener('keydown', handleGlobalSearchCapture)
}, [focusSearchInput, isSearchCaptureSuppressed, searchQuery])
```

`searchQuery` is in the dependency array because the handler uses it as a fallback.
But `searchInputRef.current?.value` is the *primary* path — the `searchQuery`
fallback is only relevant if the ref is null. The result is that the `keydown`
listener is removed and re-added on every keystroke as `searchQuery` changes.

The fix is to use a ref for the fallback value (Rule 3 — event handlers don't need
state in closure):

```ts
const searchQueryRef = useRef(searchQuery)
useEffect(() => { searchQueryRef.current = searchQuery }, [searchQuery])  // or use useLatestRef

useEffect(() => {
  function handleGlobalSearchCapture(event: KeyboardEvent) {
    const action = getSearchCaptureAction({
      currentSearchValue: searchInputRef.current?.value ?? searchQueryRef.current,
      ...
    })
  }
  window.addEventListener('keydown', handleGlobalSearchCapture)
  return () => window.removeEventListener('keydown', handleGlobalSearchCapture)
}, [focusSearchInput, isSearchCaptureSuppressed])  // query removed from deps
```

Note: This is one of the "ref syncing" `useEffect`s that the article calls out as
smelly in isolation, but it is the correct tradeoff when the *other* effect's dep
list would otherwise churn on every character.

---

### E5. `useDatabaseDetailChrome` — `searchInputRef` in deps of focus-management effect causes re-run on every render

**File:** `src/pages/database/useDatabaseDetailChrome.ts:50-59`

```ts
useEffect(() => {
  previouslyFocusedElementRef.current = document.activeElement ...
  searchInputRef?.current?.focus()
  return () => { previouslyFocusedElementRef.current?.focus() }
}, [searchInputRef])
```

`searchInputRef` is a `RefObject` — its identity is stable across renders, so this
looks safe. But the dependency on the *ref object* rather than `[]` is
misleading. If `searchInputRef` is created inline in the parent (not with
`useRef`), the dep would be a new object each render and the effect would re-fire.
The intent is *mount-only* external sync (focus management) — Rule 4
(`useMountEffect`). The dep array should be `[]` with an explicit comment, and
the initial focus call should use the ref directly since it cannot change. As-is,
the intent is obscured by the generic dep.

---

### E6. `useDatabaseDetailModalLifecycle` — Escape key handler re-registers on every state change

**File:** `src/pages/database/useDatabaseDetailModalLifecycle.ts:26-78`

The Escape key effect has 7 items in its dependency array:
`clearSearch`, `closeAllPopovers`, `closeSearch`, `dismissSettings`,
`hasOpenPopovers`, `isSettingsOpen`, `onClose`, `searchInputRef`, `searchQuery`.

Most of these are callbacks wrapped in `useCallback` upstream, so stability
depends on upstream memoisation being correct. But `hasOpenPopovers` and
`isSettingsOpen` are booleans derived from state — every time a popover opens
or closes, the Escape handler tears down and re-registers. This is invisible in
practice but structurally fragile.

The better pattern: use refs for all values read inside the handler, and make
the dep array `[]` (mount-only subscription). The handler reads from refs,
not from the closure:

```ts
const stateRef = useRef({hasOpenPopovers, isSettingsOpen, searchQuery, ...})
// sync ref each render (no effect needed — this is synchronous render work)
stateRef.current = {hasOpenPopovers, isSettingsOpen, searchQuery, ...}

useEffect(() => {
  function handleEscape(event: KeyboardEvent) {
    const s = stateRef.current
    // use s.hasOpenPopovers etc.
  }
  window.addEventListener('keydown', handleEscape)
  return () => window.removeEventListener('keydown', handleEscape)
}, [])  // stable
```

This is the same pattern React's own docs recommend for event listeners that read
frequently-changing state.

---

### E7. `useDatabaseDetailChrome` — `resize` listener and `isMobileHeader` state is duplicated with `useAwakenerDetailChrome`

**Files:** `useDatabaseDetailChrome.ts:61-71`, `useAwakenerDetailChrome.ts:54-69`

`useDatabaseDetailChrome` tracks `isMobileHeader` via a `resize` listener. 
`useAwakenerDetailChrome` tracks `canExpandTags` via *another* `resize` listener on
the same window. When a user resizes the viewport, both listeners fire and trigger
separate `setState` calls. Two separate `window.resize` subscriptions owned by two
different hooks in the same modal.

Both could share a single `useWindowWidth()` hook (or a Zustand UI state slice)
that debounces the resize event once and returns the current width. Consumers derive
their boolean flags from it. Zero effect duplication, single event listener.

---

### E8. `RichSegmentRenderer` overlay icon — async load inside render-critical component with state (Rule 2 partial violation)

**File:** `src/pages/database/RichSegmentRenderer.tsx:307-324`

```ts
useEffect(() => {
  void loadOverlayIconAsset(iconId).then((nextIconUrl) => {
    if (!cancelled) setLoadedIcon({iconId, url: nextIconUrl})
  })
}, [cachedIconUrl, iconId])
```

This is a legitimate async-load effect, and it correctly handles cancellation.
The issue is structural: `loadOverlayIconAsset` has its own module-level cache
(`peekOverlayIconAsset` / `cachedIconUrl`), so the effect should almost never
fire for already-seen icons. However there is no loading state signalled to the
parent — the component silently renders the text-only fallback while the icon
loads, with no skeleton or aria status. More importantly, `RichSegmentRenderer`
is called inside description rendering loops; if many unique icons appear in one
description, many concurrent `useEffect` fetches fire in the same frame. A proper
`use(promise)` with Suspense (React 19, already in the bundle) or a shared
preload step in the detail modal's loading phase would be cleaner.

---

### E9. `useSuppressDetailEntitySearchCapture` — module-level mutable counter is a shared singleton anti-pattern

**File:** `src/pages/database/useDetailEntitySearch.ts:19-48`

```ts
let searchCaptureSuppressionDepth = 0
const searchCaptureSuppressionListeners = new Set<() => void>()
```

The suppression counter and listener set are module-level singletons. React
component trees are per-instance; module-level state is global and persists across
test runs, HMR reloads, and concurrent renders. The `useSuppressDetailEntitySearchCapture`
hook mutates this global counter in a `useEffect` cleanup pair, which is correct
for a single render tree — but if the DB scope is ever server-rendered,
concurrently rendered, or tested in parallel, the counter will be wrong.

`useSyncExternalStore` is already used correctly to subscribe to this counter —
the subscription mechanism is right. But the *store* itself should be a proper
external store (Zustand, a `createStore()` call, or at minimum a closure-scoped
module factory), not a raw module variable. This is exactly the use case Zustand's
`createStore` (non-hook form) is designed for.

---

### E10. State management architecture: the DB scope has no shared state layer

**Compared with the Builder scope (Zustand store planned/in progress)**

The DB scope currently uses:
- `useSearchParams` for browse state (awakeners, wheels — correct)
- `useState` for browse state (posses, covenants — URL not backed, noted in P1#4)
- `localStorage`-read `useState` in each modal instance for preferences
- Module-level variables for suppression counters
- Props and callbacks for all cross-modal/cross-entity communication

The result is that "shared" state like `accountLevel`, `collectionOwnership`, and
`searchCaptureSuppression` is either read-once-on-mount (ownership) or duplicated
per modal instance (preferences). There is no reactive layer connecting them.

A minimal Zustand store for the DB scope would own:
1. **`dbDetailPreferences`** — replaces per-instance `useDatabaseDetailPreferences` (E3)
2. **`searchCaptureSuppression`** — replaces module-level counter (E9)
3. **`collectionOwnership`** — currently loaded separately in each modal; a single
   shared read with reactive updates when the user changes collection state
4. Optionally: **posse/covenant browse state** — replaces raw `useState` (P1#4),
   kept in the store rather than URL params if URL backing is not desired

This is not proposing a full Zustand rewrite of the DB scope. The awakener/wheel
browse state should stay URL-backed (it's correct and enables sharing links). But
the *modal-internal* shared state is a natural fit for a lightweight store, and the
three points above would eliminate multiple `useEffect` smells and the duplication
described in E3 and E9.

---

### Summary of `useEffect` findings

| # | Severity | File | Pattern | Recommended Fix |
|---|----------|------|---------|-----------------|
| E1 | High | `DatabasePage.tsx` | Derived-state redirect effects (Rule 1) | Replace with `<Navigate>` in render |
| E2 | Medium | `useAwakenerDetailDatabaseState.ts` | Reset-on-ID-change effect (Rule 5) | Remove — `key` prop already handles remount |
| E3 | Medium | `useDatabaseDetailPreferences.ts` | Per-instance localStorage state, no cross-modal sync | Zustand store for shared DB preferences |
| E4 | Medium | `useDetailEntitySearch.ts` | Listener re-registers on every keystroke | Move `searchQuery` to ref, remove from deps |
| E5 | Low | `useDatabaseDetailChrome.ts` | Mount-only effect with misleading dep (Rule 4) | Use `[]` with comment |
| E6 | Low | `useDatabaseDetailModalLifecycle.ts` | Escape handler re-registers on every boolean state change | Ref-based handler with `[]` dep |
| E7 | Low | `useDatabaseDetailChrome` + `useAwakenerDetailChrome` | Duplicate `resize` listeners | Shared `useWindowWidth` hook or Zustand UI slice |
| E8 | Low | `RichSegmentRenderer.tsx` | Concurrent per-icon fetch effects in render loops | `use(promise)` + Suspense or preload on modal open |
| E9 | Medium | `useDetailEntitySearch.ts` | Module-level mutable singleton for suppression counter | `zustand/vanilla` `createStore` |
| E10 | High (Architecture) | DB scope (global) | No shared state layer — per-instance modal state, no reactivity | Minimal Zustand store for preferences, ownership, suppression |
