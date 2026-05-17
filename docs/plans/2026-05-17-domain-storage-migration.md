# Domain Storage Migration Implementation Plan

**Goal:** Build a no-file migration path that copies SKeyDB browser data from `https://dansa.github.io/SKeyDB/` to `https://skeydb.com` before the `.com` launch becomes the primary home.

**Architecture:** Use a top-level browser migration bridge rather than a hidden iframe as the first implementation. The new domain opens a legacy GitHub Pages migration route in a user-initiated window, the legacy route reads its own first-party `localStorage`, and the two windows exchange a nonce-bound `postMessage` payload that the new domain validates before writing its own `localStorage`.

**Tech Stack:** React 19, React Router `HashRouter`, TypeScript, Vitest/jsdom, browser `localStorage`, browser `postMessage`.

---

**Status:** Done on branch

**Last updated:** 2026-05-17

**Related docs:**
- GitHub Pages deployment workflow: `.github/workflows/deploy-pages.yml`
- Current storage helpers: `src/domain/storage.ts`
- Builder persistence: `src/features/builder/builder-persistence.ts`
- Collection persistence: `src/features/collection/collectionMigrations.ts`

## Recommended Approach

Start with a top-level `postMessage` bridge.

This avoids download/upload UX, keeps user data out of infrastructure, and works while `dansa.github.io/SKeyDB/` and `skeydb.com` both exist. It also avoids relying on a third-party iframe. A hidden iframe looks smoother, but modern mobile browsers and privacy settings can block or partition third-party storage, which means the old origin might not see the user's real GitHub Pages `localStorage`. A user-opened top-level window reads the old origin as first-party storage, which is the important bit.

The first production route should be:

- Target/new domain: `https://skeydb.com/#/migrate`
- Source/legacy domain: `https://dansa.github.io/SKeyDB/#/migrate/export`

The source route should only answer allowed target origins. The target route should only accept messages from allowed source origins. Both sides should include a generated nonce so random tabs cannot inject or replay an unrelated payload.

## Scope

- Add a storage migration snapshot contract for known SKeyDB `localStorage` keys.
- Add an export route that runs on the legacy origin and sends the snapshot to the opener.
- Add an import route that runs on the new origin, receives the snapshot, previews what will change, and writes to local storage after user confirmation.
- Add a quiet dismissible app-level notice so users can discover the transfer without needing to manually know `#/migrate`.
- Keep GitHub Pages compatibility alive long enough for old users to migrate.
- Keep `dansa.github.io/` root untouched. The compatibility surface is only `dansa.github.io/SKeyDB/`.
- Keep the implementation client-only. No account system, D1, Cloudflare Pages, or server-side user data.

## Out Of Scope

- Better Auth and account-backed sync.
- D1 schema design for permanent user profiles.
- Cloudflare Pages migration itself.
- Cloudflare Pages Functions, KV, D1, and transfer endpoints.
- Automatic silent cross-origin migration. Browsers intentionally do not allow that.
- File import/export as the primary migration path. A copy-code fallback can exist only as a last resort.

## Storage Inventory

Known exact keys:

- `skeydb.builder.v2`
- `skeydb.builder.v1`
- `skeydb.collection.v2`
- `skeydb.collection.v1`
- `skeydb.builder.awakenerSortKey.v1`
- `skeydb.builder.awakenerSortDirection.v1`
- `skeydb.builder.awakenerSortGroupByFaction.v1`
- `skeydb.builder.displayUnowned.v1`
- `skeydb.builder.allowDupes.v1`
- `skeydb.builder.promoteRecommendedGear.v1`
- `skeydb.builder.promoteMatchingWheelMainstats.v1`
- `skeydb.builder.sinkUnownedToBottom.v1`
- `skeydb.builder.teamPreviewMode.v1`
- `skeydb.builder.awakenerSortExpanded.v1`
- `skeydb.collection.awakenerSort.v1`
- `database-detail-preferences`

Known dynamic export-config keys:

- `skeydb.ownedBoxExport.layout.v1`
- `skeydb.ownedBoxExport.visuals.v1`
- `skeydb.ownedBoxExport.sort.v1`
- `skeydb.ownedBoxExport.rarities.v1`
- `skeydb.ownedWheelBoxExport.layout.v1`
- `skeydb.ownedWheelBoxExport.visuals.v1`
- `skeydb.ownedWheelBoxExport.sort.v1`
- `skeydb.ownedWheelBoxExport.rarities.v1`

Snapshot envelope:

```ts
interface DomainStorageMigrationSnapshot {
  kind: 'skeydb.domain-storage-migration.snapshot'
  version: 1
  createdAt: string
  sourceOrigin: string
  sourcePathname: string
  entries: Array<{
    key: string
    value: string
    category: 'builder' | 'collection' | 'preference' | 'export-config'
  }>
  skipped: Array<{
    key: string
    reason: 'missing' | 'invalid' | 'unrecognized'
  }>
}
```

Message contract:

```ts
type MigrationBridgeMessage =
  | {
      type: 'skeydb:migration-ready:v1'
      nonce: string
      sourceOrigin: string
    }
  | {
      type: 'skeydb:migration-snapshot:v1'
      nonce: string
      snapshot: DomainStorageMigrationSnapshot
    }
  | {
      type: 'skeydb:migration-error:v1'
      nonce: string
      error: 'storage_unavailable' | 'snapshot_empty' | 'invalid_target_origin'
    }
```

## Import Policy

The migration should be safe by default:

- If a target key is absent, copy the source value.
- If a target key already exists and matches the source value, mark it unchanged.
- If a target key already exists and differs, require explicit user confirmation before replacing it.
- For preferences and export-config keys, default to keeping the target value when there is a conflict.
- For `skeydb.collection.v2`, consider a semantic merge only after tests prove the behavior. The first pass can treat it as a replaceable snapshot to avoid inventing subtle merge behavior.
- For `skeydb.builder.v2`, do not attempt automatic team merging in the first pass. Builder teams have enough identity and duplicate constraints that replacement is safer than a half-smart merge.
- Before applying replacements, write a best-effort backup under `skeydb.migration.backup.<timestamp>.v1` containing the target values that will be overwritten.

## Risks / Watchpoints

- Third-party iframe storage is unreliable on mobile and privacy-hardened browsers. Use a top-level window as the main path.
- Popup blockers require the legacy window to be opened from a direct user click.
- `window.opener` may be absent if a browser strips it or the user opens the link manually. Provide a copy-code fallback, but do not make it the happy path.
- The source route must never answer arbitrary origins. Allow `https://skeydb.com`, `https://www.skeydb.com`, and local dev origins only.
- The target route must never accept arbitrary source origins. Allow `https://dansa.github.io` and local dev origins only.
- `localStorage` is shared by scheme, host, and port, not by hash route. Moving from the current Worker bridge on `skeydb.com` to Cloudflare Pages on `skeydb.com` should keep the same storage.
- `www.skeydb.com` should keep redirecting to apex so users do not split storage between two hosts.
- Do not use `skeydb.pages.dev` as a public migration target. That origin would create another separate storage bucket.
- Domain move messaging should stay quiet: no automatic popup, no forced redirect, and no transfer CTA on the old origin unless this browser has valid builder or collection data to move.

## Progress Snapshot

- Done:
  - DNS and Pages compatibility investigation.
  - Current storage key inventory.
  - Selected top-level `postMessage` bridge as the first implementation.
  - Build snapshot collection/parsing tests.
  - Build bridge protocol tests.
  - Add hidden migration routes.
  - Add dismissible domain move notices on old/new origins.
  - Replace user-facing "payload" copy with "transfer code".
  - Harden production edge cases for reused export windows, wrong-origin export route access, empty source snapshots, and popup-blocked starts.
  - Verify the transfer between two localhost origins.
- In progress:
  - None.
- Next:
  - Manual real-device smoke test before launch communications.
- Blockers:
  - None for the contained branch implementation.

## Verification

- `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts`
- `npx vitest run src/domain/storage-migration/migrationImportPolicy.test.ts`
- `npx vitest run src/features/migration/MigrationReceivePage.test.tsx src/features/migration/MigrationExportPage.test.tsx`
- `npx vitest run src/features/migration/DomainMigrationNotice.test.tsx`
- `npm run lint`
- `npm run build`
- Browser manual test with two origins:
  - Run app as the legacy origin on one local host/port.
  - Run app as the target origin on another local host/port.
  - Seed legacy `localStorage`.
  - Start migration from target.
  - Confirm target receives only known keys and writes only after confirmation.
  - Confirm old-origin notice shows the saved-data CTA only when valid builder or collection data exists.
  - Confirm new-origin notice shows only before the new origin has saved builder or collection data.
  - Confirm starting the transfer again with the same named export window still sends the new nonce and handles conflicts.
  - Confirm popup-blocked starts show the GitHub Pages transfer-page fallback link.

### Task 1: Storage Snapshot Contract

**Files:**
- Create: `src/domain/storage-migration/storageMigrationSnapshot.ts`
- Create: `src/domain/storage-migration/storageMigrationSnapshot.test.ts`
- Read: `src/features/builder/builder-persistence.ts`
- Read: `src/features/collection/collectionMigrations.ts`
- Read: `src/domain/database-detail-preferences.ts`

**Step 1: Write failing tests**

Cover these cases:

- Collects exact known keys from a fake `StorageLike`.
- Collects export-config keys by exact suffix.
- Skips absent keys.
- Rejects invalid current builder and collection payloads.
- Includes simple preference keys without parsing when their accepted values are primitive strings.
- Does not include unknown `skeydb.*` keys.

Run: `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts`
Expected: FAIL because the module does not exist.

**Step 2: Implement snapshot collection**

Create a manifest-driven collector:

```ts
export const DOMAIN_STORAGE_MIGRATION_VERSION = 1

export function createDomainStorageMigrationSnapshot(
  storage: StorageLike | null,
  locationLike: Pick<Location, 'origin' | 'pathname'>,
): DomainStorageMigrationSnapshot {
  // Read only manifest keys, validate critical JSON snapshots, return entries and skipped records.
}
```

Use existing validators where practical:

- `loadBuilderDraft` or lower-level builder parser logic for `skeydb.builder.v2` and `skeydb.builder.v1`.
- `parseCollectionOwnershipSnapshot` for collection snapshots.
- `normalizeDatabaseDetailPreferences` for database-detail preferences.

**Step 3: Verify**

Run: `npx vitest run src/domain/storage-migration/storageMigrationSnapshot.test.ts`
Expected: PASS.

### Task 2: Import Plan And Apply Policy

**Files:**
- Create: `src/domain/storage-migration/migrationImportPolicy.ts`
- Create: `src/domain/storage-migration/migrationImportPolicy.test.ts`
- Read: `src/domain/storage.ts`

**Step 1: Write failing tests**

Cover:

- Missing target keys are planned as `copy`.
- Equal target keys are planned as `unchanged`.
- Different target keys are planned as `conflict`.
- Preference conflicts default to `keep-target`.
- User-selected replacement writes a backup key before overwriting.
- Invalid snapshot version is rejected.

Run: `npx vitest run src/domain/storage-migration/migrationImportPolicy.test.ts`
Expected: FAIL because the module does not exist.

**Step 2: Implement planner and applier**

Expose two pure-ish entry points:

```ts
export function planDomainStorageMigration(
  snapshot: DomainStorageMigrationSnapshot,
  targetStorage: StorageLike | null,
): DomainStorageMigrationPlan

export function applyDomainStorageMigrationPlan(
  plan: DomainStorageMigrationPlan,
  targetStorage: StorageLike | null,
  decisions: Record<string, 'copy-source' | 'keep-target'>,
  now: Date,
): DomainStorageMigrationApplyResult
```

Backups should be written before any conflict replacement:

```ts
const backupKey = `skeydb.migration.backup.${now.toISOString()}.v1`
```

**Step 3: Verify**

Run: `npx vitest run src/domain/storage-migration/migrationImportPolicy.test.ts`
Expected: PASS.

### Task 3: Bridge Protocol

**Files:**
- Create: `src/domain/storage-migration/migrationBridgeProtocol.ts`
- Create: `src/domain/storage-migration/migrationBridgeProtocol.test.ts`

**Step 1: Write failing tests**

Cover:

- Generates a non-empty nonce.
- Accepts only allowed source origins on the target side.
- Accepts only allowed target origins on the source side.
- Rejects mismatched nonces.
- Rejects unknown message types.

Run: `npx vitest run src/domain/storage-migration/migrationBridgeProtocol.test.ts`
Expected: FAIL because the module does not exist.

**Step 2: Implement protocol helpers**

Keep origin rules centralized:

```ts
export const DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS = ['https://dansa.github.io']
export const DEFAULT_MIGRATION_TARGET_ORIGINS = ['https://skeydb.com', 'https://www.skeydb.com']
```

Allow local dev origins only when `import.meta.env.DEV` is true.

**Step 3: Verify**

Run: `npx vitest run src/domain/storage-migration/migrationBridgeProtocol.test.ts`
Expected: PASS.

### Task 4: Legacy Export Route

**Files:**
- Create: `src/features/migration/MigrationExportPage.tsx`
- Create: `src/features/migration/MigrationExportPage.test.tsx`
- Modify: `src/App.tsx`

**Step 1: Write failing tests**

Render `MigrationExportPage` with stubbed storage and message target. Verify:

- It displays an export-ready state on the legacy origin.
- It sends a snapshot only to an allowed target origin.
- It displays a recoverable error if storage is unavailable.
- It does not send a snapshot when the nonce is missing.

Run: `npx vitest run src/features/migration/MigrationExportPage.test.tsx`
Expected: FAIL because the component does not exist.

**Step 2: Implement route**

Add route:

```tsx
<Route element={<MigrationExportPage />} path='/migrate/export' />
```

The page reads `nonce` and `targetOrigin` from search params after the hash route. It sends the snapshot via `window.opener.postMessage(...)` when `window.opener` exists. It should also show a fallback text area with the serialized snapshot for rare opener-less cases.

**Step 3: Verify**

Run: `npx vitest run src/features/migration/MigrationExportPage.test.tsx`
Expected: PASS.

### Task 5: Target Receive Route

**Files:**
- Create: `src/features/migration/MigrationReceivePage.tsx`
- Create: `src/features/migration/MigrationReceivePage.test.tsx`
- Modify: `src/App.tsx`

**Step 1: Write failing tests**

Render `MigrationReceivePage` with a stubbed `window.open`, fake `message` events, and fake storage. Verify:

- Start button opens `https://dansa.github.io/SKeyDB/#/migrate/export`.
- The URL includes a nonce and target origin.
- Messages from wrong origins are ignored.
- Messages with wrong nonce are ignored.
- Valid snapshots render a review summary.
- Applying migration writes expected keys and backup.

Run: `npx vitest run src/features/migration/MigrationReceivePage.test.tsx`
Expected: FAIL because the component does not exist.

**Step 2: Implement receive UI**

Keep the UI quiet and utilitarian:

- One start button.
- A compact summary of entries found.
- A conflict list only when conflicts exist.
- Default conflict decision: keep current target value for preferences and export config, require explicit replacement for builder and collection snapshots.
- A completion state that tells the user to refresh or continue.

Add route:

```tsx
<Route element={<MigrationReceivePage />} path='/migrate' />
```

Do not add it to primary navigation in the first implementation. Link it from launch communications or a legacy-origin banner when the domain launch plan is ready.

**Step 3: Verify**

Run: `npx vitest run src/features/migration/MigrationReceivePage.test.tsx`
Expected: PASS.

### Task 6: Domain Move Notice

**Files:**
- Modify: `src/App.tsx`
- Create: `src/features/migration/DomainMigrationNotice.tsx`
- Create: `src/features/migration/DomainMigrationNotice.test.tsx`

**Step 1: Write failing tests**

Verify:

- Old-origin notice appears on `https://dansa.github.io/SKeyDB/`.
- Old-origin notice links to `https://skeydb.com/#/migrate` only when valid builder or collection data exists.
- New-origin notice appears on `https://skeydb.com` only when the current domain has no saved builder or collection data yet.
- Notice does not appear on migration routes.
- Notice can be dismissed and stores dismissal on the current origin.

Run: `npx vitest run src/features/migration/DomainMigrationNotice.test.tsx`
Expected: FAIL because the component does not exist.

**Step 2: Implement notice**

Use a small app-level notice, not a large landing page or popup. This is compatibility guidance, not a marketing moment. Avoid technical user-facing words such as "payload"; call the fallback text a "transfer code."

**Step 3: Verify**

Run: `npx vitest run src/features/migration/DomainMigrationNotice.test.tsx`
Expected: PASS.

### Task 7: Local Two-Origin Browser Verification

**Files:**
- Optional create: `scripts/verify-domain-storage-migration.mjs`
- Optional create: `scripts/verify-domain-storage-migration.test.mjs`

**Step 1: Decide manual or scripted verification**

Manual is acceptable for the first branch because browser window/opener behavior is hard to model fully in jsdom. A script is useful if the migration route becomes permanent release-critical infrastructure.

**Step 2: Run two local origins**

Use two origins, not two hash routes on the same origin:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
npm run dev -- --host 127.0.0.1 --port 5174
```

Seed old-origin storage in DevTools or a Playwright script, then start target migration from the second origin.

**Step 3: Verify user-visible behavior**

Expected:

- Start opens a legacy migration window.
- Legacy window reads old-origin storage.
- Target receives snapshot.
- Target writes only after confirmation.
- Existing target data conflicts are not overwritten silently.

## Archive Trigger

Move this file to `docs/archive/plans/` when the domain transfer migration ships, is replaced by a future separately scoped account-backed sync project, or is abandoned.
