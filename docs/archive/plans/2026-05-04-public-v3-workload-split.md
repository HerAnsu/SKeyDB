# Public V3 DB Architecture Workload Split

> Archived: 2026-05-08. This workload split was superseded by the completed public-v3 migration/remediation work; it is historical context, not an active execution checklist.

> **Status:** Draft scope split after `docs/notes/2026-05-04-architecture-review.md`.
> This is not an implementation plan. It is the sequencing boundary for later plans.
> **Website update:** The TypeScript remainder plan moved to `docs/archive/plans/2026-05-05-public-v3-typescript-remainder.md`. Workload B in this document is source inventory, not the execution checklist.

**Goal:** Move DB/content compiler responsibilities into `MomenTB-Tools` first, then make the website consume generated `public-v3` projections through a repository layer.

**Core decision:** Treat the existing `docs/plans/2026-05-04-covenant-posse-db-deslop.md` as audit/reference material, not the next execution queue. `public-v2` is branch-local draft work and will not become a shipped public contract.

---

## Operating Rules

- Python tooling owns canonical IDs, route slugs, redirects, aliases, references, relationships, facets, search docs, asset manifests, builder catalogs, and collection catalogs.
- The website owns presentation, URL/search-param state, modal stack/runtime UI state, local user state, and rendering.
- Skip `public-v2` stabilization. This branch has not shipped, so there is no live `public-v2` compatibility obligation.
- Do not broadly refactor `DatabasePage.tsx` until `public-v3`, a website data repository, and a reusable detail host exist.
- Do not add new packages during the contract/index work unless a dependency solves one named ownership problem and replaces concrete complexity.
- Canonical data identity is public ID based. User-facing routes use generated human slugs and redirects. IDs are for data; slugs are for people.
- Public data contract versions and user persistence contract versions are separate. `public-v2` can die, but live user persistence must still migrate from the currently shipped contract to whatever ships next.

---

## Skipped P0 V2 Stabilization

Decision: **skip**.

The covenant/posse `public-v2` website slice has not shipped live. Since we are doing the restructure now, before release, `public-v2` is not a public compatibility boundary.

Do not spend implementation time on:

- lazy-loading covenant/posse `public-v2` aggregates
- covenant/posse `public-v2` schema hardening
- `public-v2` browse-state polish
- `public-v2` search/reference cleanup
- route/controller cleanup whose only purpose is to make the draft v2 slice nicer

Carry forward the audit findings as requirements for `public-v3` instead.

---

## Persistence Compatibility Boundary

This is separate from `public-v2`.

Even though `public-v2` will never be real, the website must preserve user persistence support from the currently shipped contract to the next shipped contract and onward.

Rules:

- Keep the existing live persistence contract fixtures and migration tests.
- Do not delete support for currently shipped user data.
- New builder/collection persistence should be keyed by public IDs, but migration must translate old live name/code/group formats into those IDs.
- If this branch contains an intermediate persistence contract that never shipped, decide in the website implementation plan whether to collapse it, mark it dev-only, or keep it as an internal migration hop. Do not treat it as a public compatibility requirement unless it reached users.
- `public-v3` data identity work should provide the alias/entity indexes needed for live persistence migration.
- Import/export codecs must remain backward compatible with every shipped public format, regardless of the data bundle version name.

---

## Workload A: Tooling Repo First

Repo: `C:\Users\dansa\CascadeProjects\MomenTB-Tools`

### A0: Public V3 Contract ADR

**Output:** one contract document in the tooling repo before implementation.

Define:

- `EntityKind`, `EntityRef`, public ID patterns, and stability rules.
- Human slug route registry, generated route index, and redirect behavior.
- Manifest shape.
- Catalog record shape.
- Detail record shape.
- Entity index shape.
- Route index shape.
- Asset index shape.
- Reference index shape.
- Relationship index shape.
- Facet index shape.
- Search document shape.
- Builder catalog shape.
- Collection catalog shape.
- Safety/private-leak rules.
- Partial rollout rules for scopes that are not migrated yet.

**Exit criteria:** website-side work can implement a repository against this contract without guessing.

### A1: Stable Identity And Route Registry

**Purpose:** make identity and routing boring before generating projections.

Deliver:

- Public ID validator and tests.
- Stable route registry for canonical slugs and aliases.
- Human-readable canonical route generation.
- Redirect route generation.
- Collision handling report that fails unsafe ambiguity.
- Tests proving IDs are not names, slugs, numeric IDs, asset IDs, or lineup tokens.

**Important:** route canonical paths should use human slugs, backed by generated ID resolution. The top pushback section of the oracle review supersedes the earlier ID-in-route suggestion.

### A2: Public V3 Bundle Manifest And Writer

**Purpose:** create the static bundle skeleton.

Deliver:

```text
outputs/public-v3/
  manifest.json
  catalogs/
  records/
  indexes/
  metadata/
```

Manifest includes:

- schema version
- game data/build version
- generated timestamp/build id
- scope counts
- emitted file paths
- hashes where practical
- index paths

**Exit criteria:** empty or minimal bundle can be generated and validated.

### A3: First Scope Projections: Covenants And Posses

**Purpose:** prove the contract on the two smallest DB scopes that triggered the audit.

Deliver:

- `catalogs/covenants.json`
- `catalogs/posses.json`
- `records/covenants/{id}.json`
- `records/posses/{id}.json`
- typed/detail-safe descriptions
- explicit realm/facet values
- explicit owner references where applicable
- explicit asset references by asset ID/key

**Exit criteria:** every catalog record has a matching detail record and validates against the v3 contract.

### A4: Core Indexes

**Purpose:** move frontend compiler work into generated indexes.

Deliver:

```text
indexes/entities.json
indexes/routes.json
indexes/assets.json
indexes/references.json
indexes/relationships.json
indexes/facets.json
```

For the first pass, indexes may fully support covenants/posses and include summaries for existing stable scopes where cheap.

**Exit criteria:** website code can resolve `{kind, id}` to label, route, icon, facets, references, and relationships without importing scope aggregates.

### A5: Search Documents

**Purpose:** keep Fuse/local ranking in the website while moving searchable facts to tooling.

Deliver:

```text
indexes/search-covenants.json
indexes/search-posses.json
```

Later scopes follow the same contract.

**Exit criteria:** website search no longer invents covenant/posse searchable aliases/tags from raw records.

### A6: Builder And Collection Catalogs

**Purpose:** prepare future builder/collection migration without doing website state work yet.

Deliver:

```text
indexes/builder-catalog.json
indexes/collection-catalog.json
```

Include IDs and lineage/grouping facts the website needs, but not user-owned state.

**Exit criteria:** website can later migrate builder and collection state by public IDs.

### A7: Export Gates And Website Sync

**Purpose:** prevent v3 contract drift and private/source leakage.

Add tests for:

- public ID uniqueness and stability
- route slug uniqueness and redirect resolution
- every relationship target exists
- every asset manifest entry resolves or has explicit missing status
- every catalog record has detail
- indexes point only at existing public entities
- references are exact or explicitly ambiguous
- manifest counts/hashes match emitted files
- no forbidden private/source keys appear in public output

Add export/check command for syncing to:

`C:\Users\dansa\CascadeProjects\MomenTB\src\data\public-v3`

**Tooling handoff criteria:** `public-v3` covenants/posses plus core indexes can be exported and checked into/used by the website repo.

---

## Workload B: Website Repo Second

Repo: `C:\Users\dansa\CascadeProjects\MomenTB`

Start this only after Workload A has a usable `public-v3` bundle.

### B0: Public Data Access Boundary

Create:

```text
src/data-access/public-data/
  contract.ts
  schemas.ts
  ids.ts
  manifest.ts
  cache.ts
  loaders.ts
  repository.ts
  routeResolver.ts
  searchRepository.ts
  referenceRepository.ts
  assetRepository.ts
```

Rules:

- generated JSON imports live here only
- feature code calls repository functions
- repository validates manifest/catalog/detail/index data
- promise caches are enough for static JSON
- no TanStack Query unless actual backend/server state appears

### B1: Persistence Compatibility Inventory

Before changing builder or collection storage, inventory shipped persistence contracts and tests:

- `src/domain/persistence-contract.v1.json`
- any shipped import/export code formats
- localStorage keys currently live in production
- current migration tests

Then decide which branch-only persistence versions are internal/dev-only.

**Exit criteria:** the website plan knows exactly which user data formats must remain supported and which draft-only formats can be ignored or collapsed.

### B2: Import Boundary Tests

Add architectural tests that fail if feature code imports generated JSON directly.

Allowed import zones:

- `src/data-access/public-data/**`
- tests/fixtures
- tooling/export verification helpers if any

### B3: Covenant Browse/Detail Migration

Migrate covenants first.

Use:

- `public-v3` catalog
- generated search docs
- generated facets
- generated asset index
- generated route resolver
- generated detail record

Do not rewrite all `DatabasePage.tsx` yet. Use an adapter/controller layer that proves the repository boundary.

### B4: Posse Browse/Detail Migration

Repeat the covenant path for posses.

This should reuse the same repository and browse/detail contracts. Any posse-specific code that looks like a general browse concern should move into the shared v3 browse controller, not a new posse-only helper.

### B5: DB Detail Modal Host And Store

Create:

```text
src/stores/dbDetailStore.ts
src/features/database/detail/DbDetailModalHost.tsx
src/features/database/detail/dbDetailRegistry.tsx
src/features/database/detail/DbDetailShell.tsx
```

Use Zustand only for the cross-surface modal stack and runtime UI state.

Behavior:

- database route-bound detail opens through the same host
- builder/collection opens detail in place without page jump
- reference clicks push onto modal stack by `EntityRef`
- explicit "open database page" navigates to canonical route

### B6: Route Resolver Integration

Use generated route index for:

- canonical human slug resolution
- old slug redirects
- direct ID/debug fallback only if intentionally supported

Do not derive slugs in React.

### B7: Builder Identity Migration

After detail host and entity index exist, migrate builder saved state from names to public IDs.

Use generated alias/entity index for migration.

Do not globalize the current name-based builder state unchanged.

Migration must support the currently shipped builder persistence/import format, not just branch-local draft state.

### B8: Collection Ownership Store

Move local collection state to a focused Zustand store keyed by public IDs.

Use generated collection catalog for valid collectables and grouping.

Store user deltas only.

Migration must preserve currently shipped collection ownership/localStorage/import-export data.

### B9: Wheels And Awakeners

Migrate larger scopes after covenants/posses prove the path.

Wheels next, awakeners last.

Reason: awakeners pull in the densest detail model, relationships, skills, talents, overlays, derived skills, scaling, and builder/collection coupling.

### B10: Delete Legacy V2 Adapters

Delete only after each scope is migrated:

- `*-full-v2` aggregate helpers
- frontend-built route slug helpers
- frontend-built global reference stubs
- unsafe numeric owner conversions
- duplicate lite/full adapters that v3 replaces
- v2 search-field construction for migrated scopes

Do not delete shipped persistence migration support in this step.

### B11: Final Database Page Cleanup

Only now split the database page into nested routes/layout plus entity registry.

Target:

```text
features/database/
  routes.tsx
  DatabaseLayout.tsx
  browse/
  detail/
```

This avoids rewriting `DatabasePage.tsx` once for v2 and again for v3.

---

## Old Deslop Plan Mapping

| Old task | New disposition |
| --- | --- |
| Task 1: Lazy Typed Artifact Full Records | Skip as v2-only stabilization. Carry schema/loading requirements into public-v3 tooling work. |
| Task 2: URL-Backed Simple Artifact Browse State | Reframe under Workload B after generated facets/search exist. |
| Task 3: Single Database Route And Page Controller Pass | Defer until B11. |
| Task 4: Shared Search Utilities And Covenant Search Correctness | Move structural search work to A5. No v2-only cleanup unless it affects already-shipped behavior. |
| Task 5: Simple Artifact Modal And Reference Scope | Replace with B5 detail host/registry. |
| Task 6: Shared Detail State Store And Effect Cleanup | Keep only the `dbDetailStore` concept, plus later ownership/builder/preference stores when their migrations land. |
| Task 7: Overlay Icon Loading Resource | Reframe under A4/B0 asset manifest and resolver. |
| Task 8: Legacy Public-V2 And Awakener Domain Cleanup | Do after v3 scope migration, not before. |

---

## Suggested Immediate Next Artifact

Write the `public-v3` contract ADR in the tooling repo.

That ADR should be approved before any Python or website implementation plan is written.

After that, create two separate implementation plans:

1. `MomenTB-Tools`: generate `public-v3` contract, covenants/posses, and indexes.
2. `MomenTB`: consume `public-v3` through a repository and migrate covenants/posses.

Do not combine those into one mega-plan.
