# Refactor Goal Worklog: builder-v2-rebuild

## Entries

### 2026-05-22 - Goal packet created

- Source: User requested a ground-up Builder V2 page, barebones visual baseline, flow informed by `builder/mobile-ux`, and a full six-scout scoping pass using Refactor Discipline.
- Intake: Completed from prompt and repo facts. Mode is refactor goal workflow; risk posture preserves existing `/builder`; first tranches are isolated to `/builder-v2`.
- Scout task: Six read-only scout agents completed and were closed after completion.
- Scout evidence:
  - Current contracts: use `builderDraftStore`, public-id migrations/persistence, `team-state`, team collection helpers, ownership projection, action factories, import/export helpers, DnD ids, and detail modal store.
  - UX branch: salvage mobile overview/focused/picker/quick-lineup and tablet/desktop layout concepts only; drop old v2 store, persistence, and old visual implementation.
  - Tests: existing pure helper/store tests carry; current page tests are behavior references but DOM-coupled.
  - Visual baseline: use `DESIGN.md`, `PRODUCT.md`, D-Zone/Timeline/database patterns, and `docs/design` screenshots; avoid old builder blue-heavy chrome.
  - Route: add lazy `/builder-v2` in `src/App.tsx`; do not add nav entry in the first slice.
  - Interaction risks: do not mutate slots directly; preserve helper paths for realm caps, duplicate identity, support transfer, quick-lineup focus, and detail overlay navigation.
- Active task: J1, approve first Builder V2 Worker slice.
- Validation: `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-rebuild` passed.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-rebuild/goal.md.`

### 2026-05-22 - User approved first major slice

- Source: User confirmed the goal is healthy and gave go-ahead for first major local Builder V2 slice.
- Added constraints:
  - Use concept images as first-class input.
  - Treat this as long-running local work, not rushed shipping steps.
  - Surface healthier architecture around the known Builder workflow.
  - Keep mockups/sendoff unstaged unless intentionally selected later.
  - Commits may be chunked; `--no-verify` is acceptable for experimental local checkpoints when useful.
- Native Codex goal: active for the first major local Builder V2 slice.
- Subagents: fresh visual/layout and architecture/Judge scouts launched; prior scout handles were already closed after completion.

### 2026-05-22 - First Worker slice approved

- J1 result: approved C1 plus smallest viable C2/C3 as the first Worker.
- Concept: Builder V2 route and bare awakener draft loop shell.
- Allowed files: `src/App.tsx` and `src/features/builder-v2/**`.
- Protected: current `src/features/builder/**`, `builderDraftStore`, persistence/migrations/codecs, generated/domain data, dependencies, nav promotion, and remote state.
- Invariants:
  - `/builder` remains protected.
  - `/builder-v2` is lazy-routed but absent from nav.
  - V2 uses public ids and current builder contracts.
  - Slot assignment/removal goes through helper/model paths, not component-level slot mutation.
  - Concept images guide shell anatomy without overbuilding final polish.
- Active task: W1, build isolated Builder V2 awakener draft loop shell.

### 2026-05-22 - W1 landed and review started

- W1 result: implemented the isolated Builder V2 first slice.
- Product files changed:
  - `src/App.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2Page.test.tsx`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/builder-v2-test-mocks.ts`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - Added lazy `/builder-v2` route while keeping Builder V2 out of navigation.
  - Added a typed `useBuilderV2Model` facade over current draft store, persistence loader/saver, ownership hydration, search, identity keys, and `team-state` assign/remove helpers.
  - Added a concept-image-informed shell with left teams rail, center active builder, lower team overview, and right picker/armory.
  - Added minimal awakener picker, four active slots, selected slot state, assign, and remove.
  - Kept gear/posse/quick-lineup/drawer/import/export/team polish queued.
- Validation:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 9 tests.
  - `npx vitest run src/features/builder/useBuilderViewModel.test.ts src/features/builder/builder-persistence.test.ts src/features/builder/builder-ownership-projection.test.ts` passed, 3 files / 50 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed.
  - Playwright smoke rendered `http://127.0.0.1:5173/#/builder-v2` at 1440x1000 and 390x844; console output was only the React DevTools info banner.
- Active task: R1, review W1 diff and receipts.
- Subagent: reviewer `019e4ce4-19d7-7420-82a3-01e41d16194f` spawned for read-only W1 review; do not close until it has completed.

### 2026-05-22 - R1 review fixed and closed

- R1 finding: V2 initially used active-team slot helpers without the current builder action layer's cross-team duplicate/transfer guard. That could duplicate a non-support awakener already owned by another team and autosave the duplicate into shared builder persistence.
- Fix:
  - `useBuilderV2Model` now builds a non-support `usedAwakenerByIdentityKey` map like V1.
  - V2 reads the current `skeydb.builder.allowDupes.v1` preference and passes it into `team-state` helper calls.
  - When duplicate identities are not allowed and the owner is another team, V2 blocks the assignment with a message instead of committing the slot update. Full transfer UI remains queued for a later slice.
  - `useBuilderV2Model.test.ts` now covers assigning an in-use awakener from another team and verifies the active team remains unchanged.
- Subagent: reviewer completed and was closed after the finding was recorded.
- Validation after fix:
  - `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx` passed, 2 files / 10 tests.
  - `npx vitest run src/features/builder/useBuilderViewModel.test.ts src/features/builder/builder-persistence.test.ts src/features/builder/builder-ownership-projection.test.ts` passed, 3 files / 50 tests.
  - `npm run test:integration` passed, 7 files / 57 tests.
  - `npm run lint` passed.
  - `npm run build` passed.
- Active task: none. First major local Builder V2 tranche is complete; broader Builder V2 goal remains active with queued candidates C4-C8.
