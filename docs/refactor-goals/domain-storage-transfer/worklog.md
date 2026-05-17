# Refactor Goal Worklog: domain-storage-transfer

## Entries

### 2026-05-17 - Goal packet created

- Source: user requested `$refactor-goal-prep`, narrowed scope to only browser domain transfer, and explicitly excluded Cloudflare Pages migration, D1, and Better Auth.
- Intake: completed from prompt. Conservative risk posture; contained allowed areas; no harness/dependency/platform changes.
- Active task: S1, read-only scout to confirm boundaries and missing details before implementation.
- Validation: checker passed with `node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/domain-storage-transfer`.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/domain-storage-transfer/goal.md.`

### 2026-05-17 - S1 scout completed

- Result: scout confirmed no `sessionStorage`, `indexedDB`, Cache API, cookie, or other browser persistence usage in `src`.
- Added storage key: `skeydb.builder.awakenerSortExpanded.v1` from `src/features/builder/BuilderSelectionControls.tsx`.
- Routing note: hidden routes must be added before the catch-all in `src/App.tsx`; tests using `MemoryRouter` should use plain `/migrate` paths.
- State transition: S1 done, W1 active.

### 2026-05-17 - W1 domain modules completed

- Slice: storage snapshot allowlist, import conflict/backup policy, and bridge protocol helpers.
- Files changed: `src/domain/storage-migration/storageMigrationSnapshot.ts`, `migrationImportPolicy.ts`, `migrationBridgeProtocol.ts`, and focused tests.
- Behavior preserved: existing builder/collection/database modules are read through public validators/helpers; no product-domain behavior changed.
- Validation: `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts src/domain/storage-migration/migrationImportPolicy.test.ts src/domain/storage-migration/migrationBridgeProtocol.test.ts` passed, 15 tests.
- State transition: W1 done, W2 active.

### 2026-05-17 - W2 hidden routes completed

- Slice: hidden `/migrate` and `/migrate/export` routes, migration receive/export pages, and route-level tests.
- Files changed: `src/features/migration/MigrationReceivePage.tsx`, `MigrationExportPage.tsx`, route tests, and `src/App.tsx`.
- Behavior preserved: no primary navigation changes and no edits to builder/collection product behavior.
- Validation:
  - `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts src/domain/storage-migration/migrationImportPolicy.test.ts src/domain/storage-migration/migrationBridgeProtocol.test.ts src/features/migration/MigrationExportPage.test.tsx src/features/migration/MigrationReceivePage.test.tsx` passed, 24 tests.
  - `npm run format:check` passed.
  - `npm run lint` passed.
  - `npm run build` passed with existing Vite chunk-size warnings.
  - Two-origin Playwright verification passed with source `http://127.0.0.1:5173` and target `http://127.0.0.1:5174`.
- State transition: W2 done, R1 active.

### 2026-05-17 - R1 review completed

- Audit: reviewed migration domain modules, hidden route components, tests, route wiring, and scope docs.
- Fix from audit: hardened `isDomainStorageMigrationSnapshot` so imported entries must match the manifest key, category, and per-key value validator before any apply plan is accepted.
- Validation:
  - `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts src/domain/storage-migration/migrationImportPolicy.test.ts src/domain/storage-migration/migrationBridgeProtocol.test.ts src/features/migration/MigrationExportPage.test.tsx src/features/migration/MigrationReceivePage.test.tsx` passed, 24 tests.
  - `npm run format:check` passed.
  - `npm run lint` passed.
  - `npm run build` passed with existing Vite chunk-size and plugin timing warnings.
  - Two-origin Playwright verification passed again with source `http://127.0.0.1:5173` and target `http://127.0.0.1:5174`.
  - Refactor goal checker passed.
- Residual launch note: smoke-test mobile popup/manual paste behavior on real devices before telling users to migrate.
- State transition: R1 done, final audit complete.

### 2026-05-17 - W3 discovery notice completed

- Source: user asked whether users must manually visit `/migrate`, requested a non-annoying notice across pages, and clarified that a transfer CTA is only needed when persisted builder/collection data exists.
- Slice: app-level `DomainMigrationNotice`, old/new origin heuristics, local dismissal storage, migration-route suppression, and friendlier "transfer code" wording for manual fallback.
- Behavior:
  - Old origin shows a saved-data CTA only when valid builder or collection storage exists.
  - Old origin without saved builder/collection data shows only compatibility guidance.
  - New origin shows a transfer prompt only before the new origin has saved builder or collection data.
  - The notice is hidden on migration routes and can be dismissed per origin.
- Validation:
  - `npx vitest run src/App.test.tsx src/features/migration/DomainMigrationNotice.test.tsx src/features/migration/MigrationReceivePage.test.tsx src/features/migration/MigrationExportPage.test.tsx src/domain/storage-migration/storageMigrationSnapshot.test.ts src/domain/storage-migration/migrationImportPolicy.test.ts src/domain/storage-migration/migrationBridgeProtocol.test.ts` passed, 39 tests.
  - `npm run format:check` passed.
  - `npm run lint` passed.
  - `npm run build` passed with existing Vite chunk-size and plugin timing warnings.
  - Two-origin Playwright notice smoke check passed on a 390px viewport with `http://127.0.0.1:5173` as old origin and `http://127.0.0.1:5174` as new origin.
  - Refactor goal checker passed.
- Residual launch note: smoke-test real mobile browsers before launch communications.

### 2026-05-17 - W3 performance follow-up

- Source: user reported localhost feeling slow and asked whether the code had genuine performance concerns.
- Finding: the app-level notice imported the full bridge/snapshot validator chain, which pulled builder/collection/database storage modules and catalog data into the initial app shell.
- Fix: `DomainMigrationNotice` now uses lightweight local origin/key checks and leaves full snapshot validation in the hidden migration routes where it is actually needed.
- Measurement:
  - Dev home dropped from 116 resources and about 9.4 MB transferred to 44 resources and about 4.4 MB transferred.
  - Production preview home dropped from 39 resources and about 338 KB transferred to 22 resources and about 210 KB transferred.
- Residual note: localhost still pays Vite dev-mode costs for large unbundled modules, especially `react-icons/fa6`, while builder/database routes remain naturally heavier than the home route.

### 2026-05-17 - W4 production readiness audit

- Source: user requested a `$refactor-goal-prep` production-readiness pass with TypeScript/React focus because the migration cannot land wrong.
- Skills: `$refactor-goal-prep`, `$refactor-review`, `$refactor-typescript`, `$refactor-react`, `$refactor-ui-a11y`, and `$refactor-characterization-tests`.
- Findings fixed:
  - Reused named export windows could receive a new nonce without sending a second message because the export route tracked only a lifetime boolean.
  - The export route did not explicitly reject running from the new production origin.
  - Empty source snapshots produced an import review instead of the existing no-data error path.
  - Popup-blocked starts left the user waiting without a direct fallback link.
- Fixes:
  - `MigrationExportPage` now sends once per nonce/target request, rejects non-source origins, sends `snapshot_empty` for empty snapshots, and keeps the manual fallback.
  - `MigrationReceivePage` now shows a GitHub Pages transfer-page fallback link when the browser blocks the popup.
- Validation:
  - `npx vitest run src/features/migration/MigrationExportPage.test.tsx src/features/migration/MigrationReceivePage.test.tsx` passed, 13 tests.
  - `npx vitest run src/App.test.tsx src/features/migration/DomainMigrationNotice.test.tsx src/features/migration/MigrationReceivePage.test.tsx src/features/migration/MigrationExportPage.test.tsx src/domain/storage-migration/storageMigrationSnapshot.test.ts src/domain/storage-migration/migrationImportPolicy.test.ts src/domain/storage-migration/migrationBridgeProtocol.test.ts` passed, 44 tests.
  - `npm run format:check` passed.
  - `npm run lint` passed.
  - `npm run test:bounded` passed, 195 files and 1277 tests.
  - `npm run test:scripts` passed, 4 tests.
  - `npm run build:quiet` passed.
  - Two-origin Playwright smoke passed on a 390px viewport with `127.0.0.1:5173` as the legacy origin and `127.0.0.1:5174` as the target origin, including first import plus reused-popup conflict flow.
- Residual launch gate: after DNS/build routing is final, smoke-test the real `https://skeydb.com/#/migrate` to `https://dansa.github.io/SKeyDB/#/migrate/export` flow before public launch messaging.
