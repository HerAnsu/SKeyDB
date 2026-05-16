# Refactor Goal Worklog: database-detail-audit

## Entries

### 2026-05-16 - Goal packet created

- Source: user requested `$refactor-goal-prep` continuation/refinement of current refactor branch with focused domain/database/detail audit.
- Intake: completed from user-supplied continuation rules plus prior packets in `docs/goals`.
- Active task: `S1` focused domain/database/detail audit, using four low-reasoning scout subagents.
- Validation: packet checker queued after files are created.
- Notes: complexity/performance scanners were run as hints; outputs included stale `.worktrees/awakener-builds-guide` paths and must be filtered to current source scope.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/database-detail-audit/goal.md.`

### 2026-05-16 - Scout reconciliation and first slice selection

- Source: `S1` completed with domain/detail, database React, rich/reference, and prior-ledger scout reports.
- Candidate register: prior public-detail, upgrade-patch, token-grammar, and fixture slices recorded as implemented; fresh candidates C1-C10 recorded with concrete statuses.
- Judge decision: selected C1 as W1 because repeated `DbDetailModalHost` scans and route-loading duplication are in-scope, root-fixable, and covered by existing targeted tests.
- Active task: `W1` simplify `DbDetailModalHost` detail lookup and non-awakener route-loading branches.
- Validation planned: `npm test -- --run src/features/database/detail/DbDetailModalHost.test.tsx src/features/database/DatabaseRoutes.test.tsx --pool=forks --maxWorkers=1`, `git diff --check`, packet checker.

### 2026-05-16 - W1 implemented and reviewed

- Slice: `DbDetailModalHost` detail lookup and non-awakener route-loading simplification.
- Files changed: `src/features/database/detail/DbDetailModalHost.tsx`, `src/features/database/detail/DbDetailModalHost.test.tsx`.
- Characterization: added fallback normalized wheel-name overlay selection when id is missing.
- Simplification: overlay ref resolution now uses one lookup object; wheel/posse/covenant route modal loading uses one generic non-awakener component; awakener canonical tab redirect remains separate.
- Refactor review: pass. No behavior change, no dependency change, no builder/collection/app shell touch, no new casts.
- Validation: `npm test -- --run src/features/database/detail/DbDetailModalHost.test.tsx src/features/database/DatabaseRoutes.test.tsx --pool=forks --maxWorkers=1` passed with 38 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; `git diff --check` passed.
- Commit: `88aa9e5 refactor: simplify database detail modal host`. Pre-commit ran lint, `test:bounded` (186 files / 1226 tests), script tests, and `build:quiet`.
- Next: queue the rich/reference lookup slice.

### 2026-05-16 - W2 selected

- Judge decision: selected C2 because `RichSegmentRenderer` scans overlay arrays per mechanic/realm segment while `ResolvedDatabaseReferenceLayer` already exposes `overlayByName`.
- Active task: `W2` use reference-layer overlay lookup in rich segment rendering.
- Allowed files: `RichSegmentRenderer.tsx`, `RichSegmentRenderer.test.tsx`, `DatabaseRichTextContent.tsx`, `DatabaseRichTextContent.test.tsx`, and this packet.
- Validation planned: `npm test -- --run src/features/database/internal/RichSegmentRenderer.test.tsx src/features/database/internal/DatabaseRichTextContent.test.tsx src/domain/database-rich-text.test.ts --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, `git diff --check`, packet checker.

### 2026-05-16 - W2 implemented and reviewed

- Slice: rich/reference overlay lookup in `RichSegmentRenderer`.
- Files changed: `src/features/database/internal/RichSegmentRenderer.tsx`, `src/features/database/internal/RichSegmentRenderer.test.tsx`, `src/features/database/internal/DatabaseRichTextContent.tsx`.
- Characterization: added a focused renderer test proving a mechanic token resolves through `overlayByName` even when the legacy overlay list is empty.
- Simplification: database rich text now passes `referenceLayer.overlayByName`; mechanic/realm rendering performs normalized map lookup before falling back to the existing list scan.
- Refactor review: pass. No dependency change, no builder/collection/app shell touch, no public prop behavior removed.
- Validation: `npm test -- --run src/features/database/internal/RichSegmentRenderer.test.tsx src/features/database/internal/DatabaseRichTextContent.test.tsx src/domain/database-rich-text.test.ts --pool=forks --maxWorkers=1` passed with 37 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; Prettier check passed after formatting `RichSegmentRenderer.tsx`; `git diff --check` passed.
- Commit: `5e3ecae refactor: use overlay lookup for rich tokens`. Pre-commit ran lint, `test:bounded` (186 files / 1227 tests), script tests, and `build:quiet`.
- Next: queue a public detail adapter owned-record index slice.

### 2026-05-16 - W3 selected

- Judge decision: selected C4 because public awakener detail adaptation repeatedly scans owned child records by slot/family inside the public detail adapter.
- Active task: `W3` index owned public awakener records before adaptation.
- Allowed files: `src/domain/public-detail-record-adapters.ts`, `src/domain/public-detail-record-adapters.test.ts`, and this packet.
- Validation planned: `npm test -- --run src/domain/public-detail-record-adapters.test.ts src/domain/public-v3-awakener-record-adapters.test.ts src/domain/public-data-runtime-boundary.test.ts --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, `git diff --check`, packet checker.

### 2026-05-16 - W3 implemented and reviewed

- Slice: owned public awakener record index inside `public-detail-record-adapters.ts`.
- Files changed: `src/domain/public-detail-record-adapters.ts`.
- Characterization: no new test added; existing public-detail adapter tests cover composed cards/talents/enlightens, optional public records, promoted extras, cache cloning, and upgrade retention at the public boundary.
- Simplification: repeated slot/family `.find()` calls became one internal `OwnedAwakenerRecordIndex` built from loaded owned records.
- Refactor review: pass. First-match semantics, missing-slot error text, optional OverExalt/AbsoluteAxiom, and passive talent ordering are preserved.
- Validation: `npm test -- --run src/domain/public-detail-record-adapters.test.ts src/domain/public-v3-awakener-record-adapters.test.ts src/domain/public-data-runtime-boundary.test.ts --pool=forks --maxWorkers=1` passed with 35 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; Prettier check passed after formatting `public-detail-record-adapters.ts`; `git diff --check` passed.
- Commit: `f2c6d57 refactor: index public awakener child records`. Pre-commit ran lint, `test:bounded` (186 files / 1227 tests), script tests, and `build:quiet`.
- Next: queue the resolver patched-record typing slice.

### 2026-05-16 - W4 selected

- Judge decision: selected C5 because `awakeners-full-resolver.ts` rebuilds patched skill and derived records through repeated terminal casts.
- Active task: `W4` remove patched-card casts from awakeners full resolver.
- Allowed files: `src/domain/awakeners-full-resolver.ts`, `src/domain/awakeners-full-resolver.test.ts`, and this packet.
- Validation planned: `npm test -- --run src/domain/awakeners-full-resolver.test.ts src/domain/awakeners-database-view.test.ts src/domain/public-detail-record-adapters.test.ts --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, `git diff --check`, packet checker.

### 2026-05-16 - W4 implemented and reviewed

- Slice: patched-card record narrowing in `awakeners-full-resolver.ts`.
- Files changed: `src/domain/awakeners-full-resolver.ts`.
- Characterization: no new test added; existing resolver tests cover skill, derived-skill, overlay, unsupported operation, malformed payload, and real public V3 upgrade behavior.
- Simplification: `rebuildRecordFromMaps` now uses `requireSkillRecord` and `requireDerivedRecord` instead of terminal casts.
- Refactor review: pass. Missing-card error text is preserved, new wrong-shape errors are explicit, no dependency or scope changes.
- Validation: `npm test -- --run src/domain/awakeners-full-resolver.test.ts src/domain/awakeners-database-view.test.ts src/domain/public-detail-record-adapters.test.ts --pool=forks --maxWorkers=1` passed with 40 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; Prettier check passed; `git diff --check` passed.
- Commit: `d9a4da4 refactor: narrow patched awakener records`. Pre-commit ran lint, `test:bounded` (186 files / 1227 tests), script tests, and `build:quiet`.
- Next: queue the rich text parse-context slice.

### 2026-05-16 - W5 selected

- Judge decision: selected C3 because `parseRichDescription` rebuilds normalized card names and parse options per call, while database rendering can reuse a stable context for a given reference layer/record/options set.
- Active task: `W5` reuse rich text parse context.
- Allowed files: `src/domain/rich-text.ts`, `src/domain/database-rich-text.ts`, related direct tests, `DatabaseRichTextContent.tsx`, and this packet.
- Validation planned: `npm test -- --run src/domain/rich-text.test.ts src/domain/database-rich-text.test.ts src/features/database/internal/DatabaseRichTextContent.test.tsx --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, `git diff --check`, packet checker.

### 2026-05-16 - W5 implemented and reviewed

- Slice: rich text parse-context reuse.
- Files changed: `src/domain/rich-text.ts`, `src/domain/rich-text.test.ts`, `src/domain/database-rich-text.ts`, `src/features/database/internal/DatabaseRichTextContent.tsx`.
- Characterization: added a parser test proving a reused context still keeps description args parse-specific.
- Simplification: parser callers can build a `RichTextParseContext` once; database rich text memoizes that context for the current record/reference layer while preserving the existing `parseRichDescription` wrapper.
- Refactor review: pass. Parser precedence and database rich-text behavior are preserved; no dependency, builder, collection, or app shell changes.
- Validation: `npm test -- --run src/domain/rich-text.test.ts src/domain/database-rich-text.test.ts src/features/database/internal/DatabaseRichTextContent.test.tsx --pool=forks --maxWorkers=1` passed with 46 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; Prettier check passed; `git diff --check` passed.
- Commit: `1e97410 refactor: reuse rich text parse context`. Pre-commit ran lint, `test:bounded` (186 files / 1228 tests), script tests, and `build:quiet`.
- Next: queue the reference-layer accumulator or popover-controller slice.

### 2026-05-16 - W6 selected

- Scout reconciliation: C6 is a real source-level boundary smell; C9 is also a strong bounded renderer split; C7 remains queued because the popover controller already has a model seam and no active bug.
- Judge decision: selected C6 because reference lookup assembly and derived-skill info creation are duplicated across awakener, wheel, and global layers, while first-writer-wins precedence is subtle enough to pin before rewriting.
- Active task: `W6` extract shared database reference-layer accumulator.
- Root-fix shape: add a small shared accumulator and shared derived-skill reference-info builder, but keep each layer's ordering/accessibility decisions visible in the layer builders.
- Validation planned: `npm test -- --run src/domain/wheels-database-reference-layer.test.ts src/domain/global-database-reference-layer.test.ts src/domain/awakeners-database-view.test.ts src/domain/database-reference-layer-audit.test.ts --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, Prettier, `git diff --check`, packet checker.

### 2026-05-16 - W6 implemented and reviewed

- Slice: shared database reference-layer accumulator.
- Files changed: `src/domain/database-reference-layer.ts`, `src/domain/awakeners-database-reference-layer.ts`, `src/domain/wheels-database-reference-layer.ts`, `src/domain/global-database-reference-layer.ts`, `src/domain/wheels-database-reference-layer.test.ts`, `src/domain/global-database-reference-layer.test.ts`.
- Characterization: added wheel duplicate name/id precedence, overlay alias first-writer-wins, and global same-named overlay-over-skill/derived coverage.
- Simplification: shared lookup insertion policy now lives in `DatabaseReferenceLookupAccumulator`; shared derived-skill reference-info construction now lives in `buildDatabaseDerivedSkillReferenceInfo`.
- Refactor review: pass after correcting a potential semantic drift where awakener-layer global derived references briefly received `formulaContext`; final behavior keeps prior rank/stats-only resolution there.
- Validation: targeted reference-layer tests passed with 19 tests; broader `src/domain` sweep passed with 77 files / 520 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; Prettier check passed; `git diff --check` passed.
- Commit: `a76a6e9 refactor: centralize database reference lookups`. Pre-commit ran lint, `test:bounded` (186 files / 1231 tests), script tests, and `build:quiet`.
- Next: queue C9 rich segment renderer split as the next strong root-fix candidate; C8 needs characterization first; C7 remains queued.

### 2026-05-16 - W7 selected

- Judge decision: selected C9 because `RichSegmentRenderer` still owns too many independent responsibilities in one component after the lookup/parser root-fixes, and the existing renderer tests cover the risky interactions.
- Active task: `W7` split rich segment renderer responsibilities.
- Root-fix shape: keep the public `RichSegmentRenderer` props stable, split local token/scaling/description-arg responsibilities into focused components or helpers, and avoid any visual redesign or popover controller change.
- Validation planned: `npm test -- --run src/features/database/internal/RichSegmentRenderer.test.tsx src/features/database/internal/DatabaseRichTextContent.test.tsx --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, Prettier, `git diff --check`, packet checker.

### 2026-05-16 - W7 implemented and reviewed

- Slice: rich segment renderer component split.
- Files changed: `src/features/database/internal/RichSegmentRenderer.tsx`, `src/features/database/internal/RichSegmentTokens.tsx`, `src/features/database/internal/RichScalingSegment.tsx`, `src/features/database/internal/RichDescriptionArgSegment.tsx`.
- Characterization: no test churn; existing renderer and rich-text content tests already cover token clicks/keyboard activation, overlay icons, scaling, formula args, plurals, tinting, and the parse-to-render seam.
- Simplification: main renderer now handles segment dispatch while token interactivity, overlay label/icon behavior, scaling display, and description arg/plural rendering live in focused local modules.
- Refactor review: pass. Public props, `ActivationEvent`, variant typing, callbacks, styling, and rendered behavior are preserved; no parser/domain/popover controller changes.
- Validation: `npm test -- --run src/features/database/internal/RichSegmentRenderer.test.tsx src/features/database/internal/DatabaseRichTextContent.test.tsx --pool=forks --maxWorkers=1` passed with 33 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; Prettier check passed; `git diff --check` passed.
- Commit: `71cc332 refactor: split rich segment renderer`. Pre-commit ran lint, `test:bounded` (186 files / 1231 tests), script tests, and `build:quiet`.
- Next: C8 needs characterization first; C7 remains queued behind a concrete controller smell.

### 2026-05-16 - W8 selected

- Scout reconciliation: C8 is real but already contained by canonical adaptation; it is a narrow trust-boundary/type-contract smell rather than a broad runtime safety issue.
- Judge decision: selected C8 because public V3 child parsers accept `descriptionArgs` and `cardKeywords` as unknown even though this module already has the canonical schemas that adaptation later enforces.
- Active task: `W8` validate public V3 child description fields at parse boundary.
- Root-fix shape: replace `z.unknown()` child `descriptionArgs`/`cardKeywords` schemas with canonical schemas, keep `z.looseObject` for public-only metadata, and leave `upgrades.patch` compatibility untouched.
- Validation planned: `npm test -- --run src/domain/public-v3-awakener-record-adapters.test.ts src/domain/public-detail-record-adapters.test.ts src/domain/public-data-runtime-boundary.test.ts --pool=forks --maxWorkers=1`, `npx tsc -p tsconfig.app.json --noEmit --pretty false`, Prettier, `git diff --check`, packet checker.

### 2026-05-16 - W8 implemented and reviewed

- Slice: public V3 child parser trust-boundary validation.
- Files changed: `src/domain/public-v3-awakener-record-adapters.ts`, `src/domain/public-v3-awakener-record-adapters.test.ts`.
- Characterization: added malformed `descriptionArgs` and `cardKeywords` parser tests plus a default/preserved-loose-metadata test.
- Simplification: child parsers now use canonical `descriptionArgsSchema` and `cardKeywordsSchema` instead of accepting unknown payloads and relying only on later adaptation.
- Refactor review: pass. Defaults, loose public-only metadata, and upgrade patch compatibility are preserved.
- Validation: `npm test -- --run src/domain/public-v3-awakener-record-adapters.test.ts src/domain/public-detail-record-adapters.test.ts src/domain/public-data-runtime-boundary.test.ts --pool=forks --maxWorkers=1` passed with 38 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; targeted ESLint passed; Prettier check passed; `git diff --check` passed.
- Commit: `88f2f3a refactor: validate public v3 child fields`. Pre-commit ran lint, `test:bounded` (186 files / 1234 tests), script tests, and `build:quiet`.
- Next: C7 is superseded for this tranche by the existing popover model seam unless a concrete controller smell appears; maintenance M1 remains queued for command hygiene.

### 2026-05-16 - Final audit reconciliation

- Outcome: completed the focused database/detail/domain tranche with C1, C2, C3, C4, C5, C6, C8, and C9 implemented in new slices; prior P1-P4 recorded as protected implemented work.
- Refactor review: pass. All implementation work stayed inside the scoped database/detail/domain/reference/public-detail/rich-rendering surfaces; no builder, collection, package, app shell, or broad visual redesign changes were made.
- Superseded with concrete reason: C7 is not an active implementation slice because the popover controller is complex but already has a model seam and no active bug/smell justifies a larger rewrite yet.
- Maintenance queued: M1 remains command hygiene because complexity scanners included stale `.worktrees` paths.
- Final validation state: every slice commit passed the pre-commit hook. Latest hook after W8 passed lint, `test:bounded` (186 files / 1234 tests), script tests, and `build:quiet`.

### 2026-05-17 - Completion-quality reconciliation reopened C7

- Source: user requested a completion-quality pass plus stricter `$refactor-rootfix` audit of earlier commits.
- Reconciliation: C7 was changed from `superseded` to active because the prior rationale cited an existing model seam, not an implemented change or explicit design decision that fully removed the popover controller hook/action smell.
- Maintenance: M1 was made terminal for this product refactor as `out_of_scope_by_user`; scanner command hygiene is outside the requested domain/database/detail TypeScript + React hardening scope, and harness edits remain protected unless explicitly approved.
- Active task: W9 split database popover controller trail actions.
- Characterization: added a test that opening a root trail in one controller closes another controller's trail, pinning the global ownership event behavior before the split.
- Root-fix decision: rejected the first thin extraction because it moved the 380-line knot into a new hook; final split keeps `useDatabasePopoverController` as a small ownership coordinator and moves trail state/action/hydration/projection work into focused root, nested, and portal-prop action seams in `useDatabasePopoverTrailActions`.
- Validation: targeted controller/model tests passed with 19 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; targeted ESLint passed; Prettier check passed; `git diff --check` passed.
- Complexity signal: scanner maxFunctionLines for the popover controller family dropped from the prior 404-line hook body to 140 lines after the split.
- User audit notes queued for post-C7 audit: browse-controller entity-state recomputation and rich rendering fallback/popover section branch work must be reconciled into the candidate register.

### 2026-05-17 - Earlier-commit root-fix audit reconciled missing findings

- Source: user requested `$refactor-rootfix` audit of earlier branch commits and supplied two missing audit notes.
- Scout/review result: C7 was a prior root-fix miss but is now implemented by `b190fe6 refactor: split database popover trail actions`.
- Candidate register additions: C11 browse-controller inactive entity recomputation, C12 `DatabaseReferencePopover` description-section fallback duplication, and C13 `RichSegmentRenderer` overlay list-scan fallback compatibility fossil.
- Caller audit: FFF found the only production `RichSegmentRenderer` caller is `DatabaseRichTextContent`, which already has `referenceLayer.overlayByName`; direct overlays-only rendering remains test-only.
- Root-fix decision: selected C12 and C13 together as W10 because both are rich/reference rendering leftovers and can be simplified without crossing product scope.
- Active task: W10 resolve rich rendering fallback leftovers.

### 2026-05-17 - W10 implemented and reviewed

- Slice: rich rendering fallback leftovers.
- Files changed: `DatabaseReferencePopover.tsx`, `DatabaseReferencePopover.test.tsx`, `RichSegmentRenderer.tsx`, `RichSegmentRenderer.test.tsx`, `RichSegmentTokens.tsx`, `DatabaseRichTextContent.tsx`, `DatabaseRichTextContent.test.tsx`.
- Characterization: added popover description-section computed-arg coverage; updated rich segment tests to use the production overlay map contract.
- Simplification: popover entry/section fallback text now shares one builder; rich token overlay resolution is map-only; `DatabaseRichTextContent` no longer derives/passes an overlay array for renderer compatibility.
- Refactor review: pass. This removes the old fallback/compatibility paths rather than hardening around them; no builder, collection, package, app shell, or broad visual redesign changes.
- Validation: targeted rich rendering tests passed with 46 tests; `npx tsc -p tsconfig.app.json --noEmit --pretty false` passed; targeted ESLint passed; Prettier check passed; `git diff --check` passed.
- Next: implement C11 browse-controller inactive entity recomputation.
