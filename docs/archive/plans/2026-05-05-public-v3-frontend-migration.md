# Public V3 Frontend Migration Implementation Plan

> Archived: 2026-05-08. This internal agent plan was superseded by the completed public-v3 migration/remediation work; it is historical context, not an active execution checklist.

> **Status:** Superseded by `docs/archive/plans/2026-05-05-public-v3-typescript-remainder.md`.
> This document captured the first V3 data-consumption pass. Use the remainder plan for the actual remaining TypeScript architecture work.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move frontend public data consumption from branch-local `public-v2` adapters to generated `public-v3` repository APIs while preserving shipped V1 builder, collection, import/export, and standard-code persistence.

**Architecture:** Generated JSON imports are confined to `src/data-access/public-data`; existing domain modules become compatibility wrappers over that repository so UI behavior can migrate without a flag-day component rewrite. Route slugs, search tokens, assets, entity indexes, builder catalogs, and collection catalogs come from V3 data; local user state remains frontend-owned and keeps V1 migration support.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite JSON imports/globs, Zod, Zustand, Fuse.js, Vitest, Testing Library

---

## Task 1: Public Data Repository Boundary

**Files:**
- Create: `src/data-access/public-data/contract.ts`
- Create: `src/data-access/public-data/schemas.ts`
- Create: `src/data-access/public-data/cache.ts`
- Create: `src/data-access/public-data/loaders.ts`
- Create: `src/data-access/public-data/repository.ts`
- Create: `src/data-access/public-data/routeResolver.ts`
- Create: `src/data-access/public-data/searchRepository.ts`
- Create: `src/data-access/public-data/referenceRepository.ts`
- Create: `src/data-access/public-data/assetRepository.ts`
- Create: `src/data-access/public-data/repository.test.ts`
- Modify: `src/domain/public-v2-runtime-boundary.test.ts`

- [ ] **Step 1: Add failing repository contract tests.**
  Test manifest validation, catalog/detail loading, route redirect/canonical resolution, search docs, references, assets, builder catalog, and collection catalog from V3 fixtures.

- [ ] **Step 2: Add failing architecture boundary tests.**
  Assert runtime `src/**/*.ts(x)` imports no `src/data/public-v3/**` JSON outside `src/data-access/public-data/**` and tests.

- [ ] **Step 3: Implement repository modules.**
  Use static catalog/index imports, `import.meta.glob` for per-record loaders, promise caches for detail records, and Zod schemas at the repository boundary.

- [ ] **Step 4: Run focused tests.**
  Run `npm run test -- --run src/data-access/public-data/repository.test.ts src/domain/public-v2-runtime-boundary.test.ts`.

## Task 2: V3-Backed Domain Compatibility

**Files:**
- Modify: `src/domain/awakeners.ts`
- Modify: `src/domain/wheels.ts`
- Modify: `src/domain/posses.ts`
- Modify: `src/domain/covenants.ts`
- Modify: `src/domain/*-search.ts`
- Modify: `src/domain/*-assets.ts`
- Modify: `src/domain/public-v2-detail-loaders.ts`
- Modify: `src/domain/global-database-reference-layer.ts`

- [ ] **Step 1: Add or update failing tests for unchanged public behavior.**
  Preserve current getter IDs/names/order, search results, detail description args, computed stat formatting, covenant set-effect hydration, and asset URL resolution.

- [ ] **Step 2: Rewire root entity getters to V3 catalogs.**
  Keep exported interfaces stable where UI still expects them, but source the data from repository catalog records.

- [ ] **Step 3: Rewire search helpers to V3 search docs.**
  Keep local Fuse/ranking behavior while using generated tokens/facets instead of frontend-invented aliases/tags.

- [ ] **Step 4: Rewire detail loaders to V3 records.**
  Adapt V3 root and child records into existing full-detail TypeScript shapes until the detail UI consumes repository shapes directly.

- [ ] **Step 5: Remove direct public-v2 aggregate imports that V3 replaces.**
  Leave only shipped persistence/import compatibility fixtures and migration maps.

## Task 3: Database Routes And Detail Host

**Files:**
- Modify: `src/domain/database-paths.ts`
- Modify: `src/domain/database-entity-paths.ts`
- Modify: `src/App.tsx`
- Modify: `src/pages/DatabasePage.tsx`
- Create: `src/stores/dbDetailStore.ts`
- Create: `src/features/database/detail/DbDetailModalHost.tsx`
- Create: `src/features/database/detail/dbDetailRegistry.tsx`
- Create: `src/features/database/detail/DbDetailShell.tsx`

- [ ] **Step 1: Add route resolver tests for V3 canonical slugs and legacy redirects.**
- [ ] **Step 2: Route `/database/awakeners/:slug` through the generated route index and redirect old `/database/awk/:slug` paths.**
- [ ] **Step 3: Add shared DB detail stack store keyed by `{kind, id}`.**
- [ ] **Step 4: Move reference clicks to push the detail stack and keep explicit canonical navigation.**
- [ ] **Step 5: Run database route and modal focused tests.**

## Task 4: Persistence And User State

**Files:**
- Modify: `src/domain/persistence-contract.test.ts`
- Modify: `src/domain/persistence-id-migration.v2.ts`
- Modify: `src/domain/collection-ownership.ts`
- Modify: `src/pages/builder/builder-persistence.ts`
- Modify: `src/domain/import-export.ts`
- Modify: `src/domain/ingame-codec.ts`

- [ ] **Step 1: Rename/bridge V1-to-current migration helpers without losing existing exports.**
- [ ] **Step 2: Source valid builder and collection IDs from V3 catalogs.**
- [ ] **Step 3: Keep V1 localStorage/import/export/standard-code fixtures passing against current public IDs.**
- [ ] **Step 4: Add tests that old names, old codes, old groups, and current public IDs do not shuffle units.**

## Task 5: Legacy Deletion And Verification

**Files:**
- Delete or quarantine: obsolete `public-v2` aggregate helpers after replacements are covered.
- Modify: tests that intentionally reference branch-only V2 contracts so they target current public IDs instead.

- [ ] **Step 1: Delete V2-only frontend adapters no longer imported by runtime code.**
- [ ] **Step 2: Run `npm run lint`.**
- [ ] **Step 3: Run `npm run test:bounded`.**
- [ ] **Step 4: Run `npm run build`.**
- [ ] **Step 5: Start the dev server and smoke database, builder, collection, import/export, and migrated localStorage paths in browser.**
