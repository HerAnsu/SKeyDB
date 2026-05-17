# Refactor Goal: domain-storage-transfer

## Intake

Status:
- [x] Intake completed from user prompt
- [ ] Intake skipped explicitly by user

Mode: local Refactor Discipline goal workflow for one contained implementation.
Risk posture: conservative. Prefer small domain modules, explicit allowlists, and tests before UI wiring.
Harness update policy: no AGENTS.md, skill, lint, dependency, or harness changes unless a repeated workflow problem appears and is recorded as a maintenance candidate.
Allowed areas: `src/domain/storage-migration/`, `src/features/migration/`, `src/App.tsx`, focused tests, and this goal packet.
Protected areas: Cloudflare Pages migration, D1, Better Auth, Workers/Pages Functions, package dependency changes, DNS/deploy configuration, and unrelated UI refactor work.
Max worker-slice size: one concept-complete migration slice; scope expansion must be recorded before touching additional app domains.
Stop condition: stop when the domain transfer bridge is implemented and verified, validation fails twice on the same issue, same-concept scope must expand outside allowed areas, or a product/security decision is needed.

## Objective

Implement a contained browser-origin transfer flow that lets users copy known SKeyDB `localStorage` data from `https://dansa.github.io/SKeyDB/` to `https://skeydb.com` without requiring file download/upload.

## Success Criteria

- Known SKeyDB storage keys are collected through a typed allowlist and critical JSON payloads are validated before transfer.
- The target origin imports only nonce-matched messages from allowed legacy origins.
- The legacy origin exports only to allowed target origins.
- Existing target data is not overwritten silently; conflicts require explicit user action and create a best-effort backup first.
- Migration UI is hidden from primary navigation and lives under hash routes only.
- Browser testing proves the flow can move data between two localhost origins.
- Cloudflare Pages, D1, Better Auth, and server transfer endpoints remain out of scope.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/domain-storage-transfer
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| Domain transfer only | implemented | User narrowed scope to domain transfer and excluded CF Pages/D1/Better Auth. | Completed by W1/W2/R1. |
| Storage snapshot allowlist | implemented | Current storage keys are documented in `docs/plans/2026-05-17-domain-storage-migration.md`; scout added `skeydb.builder.awakenerSortExpanded.v1`. | Completed by W1/R1. |
| Cross-origin bridge protocol | implemented | Browser same-origin limits require `postMessage` or equivalent user-mediated transfer. | Completed by W1/W2. |
| Import conflict safety | implemented | User data can already exist on target origin. | Completed by W1/W2/R1. |
| Local two-origin verification | implemented | User asked to figure out localhost testing. | Completed with Playwright across 127.0.0.1:5173 and 127.0.0.1:5174. |
| CF Pages/D1/Better Auth | out_of_scope_by_user | User explicitly said this is bigger future roadmap and not in scope. | Terminal by user scope. |

## Candidate Register

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| Build storage snapshot domain module | S1 | implemented | `src/domain/storage-migration/*`, tests | Known key inventory and existing persistence validators. | Completed by W1/R1. |
| Build import planning/apply module | S1 | implemented | `src/domain/storage-migration/*`, tests | Need conflict and backup policy before UI wiring. | Completed by W1/R1. |
| Build bridge protocol helpers | S1 | implemented | `src/domain/storage-migration/*`, tests | Need nonce and origin allowlists for cross-origin messages. | Completed by W1. |
| Add hidden migration routes | S1 | implemented | `src/features/migration/*`, `src/App.tsx`, tests | Routes must remain outside nav. | Completed by W2/R1. |
| Verify two-origin localhost flow | S1 | implemented | dev server/browser verification only | jsdom cannot fully prove opener/origin behavior. | Completed by R1. |
| Server-backed encrypted transfer | S1 | out_of_scope_by_user | Cloudflare Pages Functions/D1/KV | User excluded CF Pages/D1/Auth. | Terminal by user scope. |

## Scope Expansion Protocol

Worker slices remain bounded by `allowed_files`, but the allowed set should be large enough for the approved concept.

If Worker discovers another file is required for the same approved concept, Worker must stop with:

```text
needs_scope_expansion:
Concept:
Additional files:
Why same concept:
Behavior risk:
Verification update:
```

Judge should then widen the allowed file set or record a concrete blocker.

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| None yet | No repeated harness or workflow smell observed. | n/a | out_of_scope_by_user | Harness changes are protected unless concrete evidence appears. |

## Non-goals / Protected Behavior

- Do not change Cloudflare DNS, Worker bridge, Pages settings, D1, Better Auth, or future account-sync architecture.
- Do not change existing builder, collection, database, or export behavior except through the migration routes writing existing storage keys after confirmation.
- Do not add packages.
- Do not put migration links in the main nav during this slice.
- Do not attempt silent cross-origin storage access.

## Repo Facts

Package manager: npm.
Framework: Vite, React 19, React Router `HashRouter`, TypeScript, Vitest.
Validation commands:
- `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts src/domain/storage-migration/migrationImportPolicy.test.ts src/domain/storage-migration/migrationBridgeProtocol.test.ts`
- `npx vitest run src/features/migration/MigrationReceivePage.test.tsx src/features/migration/MigrationExportPage.test.tsx`
- `npm run lint`
- `npm run build`
Relevant AGENTS.md files: user-provided root instructions prefer FFF for project search and require waiting for subagents to finish.
Relevant docs/ADRs: `docs/plans/2026-05-17-domain-storage-migration.md`.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Domain boundary and small module design | `$refactor-architecture`, `$refactor-typescript` | yes | Keep transfer logic outside existing builder/collection domains. |
| Runtime validation and browser trust boundary | `$refactor-typescript`, `$refactor-characterization-tests` | yes | Validate storage and messages with typed helpers and tests. |
| React routes and hidden migration UI | `$refactor-react`, `$refactor-ui-a11y` | yes | Route/UI work must stay isolated under `src/features/migration/`. |
| Diff/final audit confidence | `$refactor-review` | yes | Review all code from main agent and any subagents before final. |
| Dependencies | `$refactor-dependencies` | no | Package changes are protected. |
| Tailwind/CSS | `$refactor-tailwind` | no | Avoid new styling surface unless route UI requires tiny existing-class usage. |
| Harness/learning | `$refactor-learning-maintainer`, `$refactor-lint-law`, `$refactor-agents-md` | no | Only if repeated workflow issues appear. |

## First Tranche

Type:
- [x] read-only scout
- [x] one bounded root-fix slice
- [x] architecture seam cleanup
- [ ] React simplification
- [ ] Tailwind/custom CSS cleanup
- [x] TypeScript/trust-boundary cleanup
- [ ] N+1 / algorithmic hotspot cleanup
- [ ] dependency economics review
- [ ] AGENTS.md harness audit
- [ ] lint-law candidate review

Allowed files/areas: `src/domain/storage-migration/`, `src/features/migration/`, `src/App.tsx`, focused tests, `docs/plans/2026-05-17-domain-storage-migration.md`, and this goal packet.
Protected files/areas: CF Pages, D1, Better Auth, dependencies, DNS/deploy config, unrelated feature domains.
Expected simplification: a self-contained migration feature boundary with no changes to builder/collection internals beyond importing existing persistence validators.
Validation: focused Vitest suites, lint, build, and two-origin browser verification.
Rollback: remove `src/domain/storage-migration/`, `src/features/migration/`, migration routes from `src/App.tsx`, and goal/plan docs from this branch.

## Goal Loop

### Scout

Read-only discovery. Produce ranked candidates with evidence, concept blast-radius maps, characterization needs, and maintenance candidates.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review` style audit. Completion requires evidence, validation, and all in-scope candidates terminally tracked.

### Maintenance

Run only for concrete repeated workflow or harness issues. None are currently planned.

## Local State Rules

- Exactly zero or one `state.json` task may be `active`.
- Every `active`, `done`, `blocked`, or final-audit transition must be logged in `worklog.md`.
- Scout tasks are read-only and cannot mark the goal complete.
- Judge tasks choose one next slice and cannot edit product code.
- Worker tasks edit only the approved concept slice.
- Review tasks decide `needs_fix`, `continue`, or `complete` from evidence.
- Every Scout/Judge candidate must be terminally tracked as `implemented`, `queued`, `blocked`, `out_of_scope_by_user`, or `superseded`.

## Root-fix vs Patch Policy

The root fix for this scope is a dedicated migration boundary instead of adding transfer logic to builder, collection, database, or export modules.

Why not a tiny patch: local one-off calls inside existing pages would mix cross-origin migration concerns into unrelated product domains and make future removal harder.

## Dependency Policy

No dependency changes are allowed in this goal. If a library becomes necessary, stop and record a blocked dependency-review task.

## Harness / Learning Policy

No harness updates are planned. If repeated mistakes appear, record a maintenance candidate before changing repo instructions or lint.

## Receipts

Each worker slice must record:

```text
Slice:
Files changed:
Behavior preserved:
Root-fix/patch decision:
Dependency review needed/run:
Harness update considered:
Validation run:
Risks:
Follow-ups not done:
Scope expansion requested:
```

## Characterization Policy

Before route/UI wiring, pin the storage snapshot, import policy, and bridge protocol behavior with focused Vitest tests. Browser opener/origin behavior must be verified with a two-origin manual or automated local run before completion.
