# Database Wheels Implementation Plan

**Goal:** Build a wheels database page and modal flow that mirrors the awakener database UX while reusing as much shared browse, modal, rich-text, and popover infrastructure as possible.

**Architecture:** Treat wheels as a second database entity living inside the same route-backed database shell, not as a separate one-off page. Reuse the current awakeners browse/modal patterns where they are genuinely generic, extract the chrome and routing seams that should be shared, and keep wheel-specific search/filter/detail logic in dedicated domain modules. Wheel descriptions should render through the same rich-text pipeline as awakeners, while wheel popovers should reuse the existing popover shell with wheel-specific reference adapters and entity-aware navigation helpers.

**Tech Stack:** React, React Router, Suspense/lazy loading, existing database rich-text/popover stack, wheel full/lite compiled datasets, Vitest, Testing Library

---

**Status:** Draft

**Last updated:** 2026-04-18

**Related docs:**
- Notes: None yet
- Roadmap item: N/A
- Backlog source: N/A

## Scope

- Add a wheels browse surface under the database section with search, rarity, realm, mainstat, and sort controls.
- Add a wheel detail modal that keeps the same overall visual language and route-driven behavior as the awakener modal.
- Reuse the same rich-text description rendering pipeline so wheel descriptions support overlays/popovers the same way awakeners do.
- Add wheel popover support so awakener database surfaces can reference wheel effects inline without inventing a separate UI system.
- Enable route-only modal switching between awakeners and wheels so cross-links do not trigger full page reloads.
- Keep the implementation modular so future database redesigns do not drift between awakeners and wheels.

## Out of Scope

- Wiring wheel lore into the writer/compiler in this pass.
- Acquisition/source data beyond leaving a stable display slot for it in the modal.
- A separate list/table browse mode unless the wheels browse implementation proves it is needed immediately.
- A broad redesign of the existing awakener database visuals.

## Risks / Watchpoints

- The current database browse shell is more generic than the detail stack; copying it without extracting the right seams will create long-term drift.
- The current popover/reference layer is typed around awakeners and overlays, so wheel popovers need an adapter or shared reference contract before they can be reused cleanly.
- Route design matters: wheels should deep-link cleanly and preserve browse search params the same way awakeners do today.
- Cross-entity modal jumping must stay SPA-only and preserve search/filter state in the URL.
- Wheel descriptions already match the described-record shape, so the plan should avoid inventing a wheel-only rich-text path.

## Recommended Decisions

- Use `/database` as the awakener landing route for backward compatibility, and add a sibling wheels route family:
  - `/database/wheels`
  - `/database/wheels/:wheelSlug`
- Keep wheel browse filters URL-backed with the same replace-for-typing / push-for-discrete-changes behavior as awakeners.
- Start with a single wheels browse grid, not an abstract list/grid toggle.
- Put lore on the main wheel modal surface as a collapsible section once lore data exists, rather than introducing a separate tab immediately.
- Keep the wheel modal as a single-page modal view rather than tabbed, because the content density is much lower than awakeners.
- Reuse the existing popover shell for wheel popovers; add wheel-specific entry builders and navigation hooks rather than a second popover UI.

## Progress Snapshot

- Done:
  - Audited the current database browse shell, awakener modal stack, rich-text renderer, and popover controller.
  - Confirmed wheel datasets and mainstat scaling are ready for page consumption.
  - Confirmed route-backed modal swapping is already the app’s pattern for awakener-to-awakener navigation.
- In progress:
  - Finalizing the implementation plan and extraction seams before starting code.
- Next:
  - Implement the shared route/path and browse-shell changes.
  - Add wheel browse/search/sort/filter domain modules.
  - Build the wheel detail modal and wire wheel popovers/cross-links.
- Blockers:
  - None

## Verification

- `npm run test -- --run src/pages/DatabasePage.test.tsx src/pages/database/useDatabaseBrowseState.test.tsx`
- `npm run test -- --run src/domain/wheels.test.ts src/domain/wheels-full-v1-loader.test.ts`
- `npm run lint`

### Task 1: Route and Navigation Foundation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/domain/database-paths.ts`
- Create: `src/domain/database-entity-paths.ts` or equivalent shared path helper module
- Test: `src/pages/DatabasePage.test.tsx`
- Test: `src/domain/database-paths.test.ts` or new route helper test

**Step 1: Write the failing tests**

- Add route helper coverage for wheel browse/detail paths and slug lookup.
- Extend `DatabasePage` routing tests to cover:
  - `/database/wheels`
  - `/database/wheels/:wheelSlug`
  - invalid wheel slug redirecting back to wheel browse
  - route-only wheel -> awakener and awakener -> wheel transitions preserving `location.search`

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/DatabasePage.test.tsx`
Expected: missing wheel routes/path helpers

**Step 3: Write minimal implementation**

- Introduce entity-aware database path helpers instead of expanding awakener-only helpers ad hoc.
- Keep existing awakener paths stable.
- Add the wheels route family under the same `DatabasePage` container instead of creating a second top-level page.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/DatabasePage.test.tsx`
Expected: PASS

### Task 2: Shared Browse Shell Extraction

**Files:**
- Modify: `src/pages/DatabasePage.tsx`
- Modify: `src/pages/database/DatabaseFilters.tsx`
- Modify: `src/domain/database-browse-state.ts`
- Modify: `src/pages/database/useDatabaseBrowseState.ts`
- Create: `src/pages/database/CatalogFiltersShell.tsx` or equivalent
- Create: `src/pages/database/CatalogGrid.tsx` or equivalent shared browse renderer seam
- Test: `src/pages/database/useDatabaseBrowseState.test.tsx`
- Test: `src/pages/DatabasePage.test.tsx`

**Step 1: Write the failing test**

- Add coverage for a wheels browse state with:
  - query
  - rarity
  - realm
  - mainstat
  - sort
- Add coverage proving search typing still uses replace-style history while filter/sort toggles use push-style history on wheel routes.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/database/useDatabaseBrowseState.test.tsx src/pages/DatabasePage.test.tsx`
Expected: wheel browse-state wiring missing

**Step 3: Write minimal implementation**

- Extract the reusable browse-shell layout from the current awakener page:
  - search input + filtered count
  - filter row layout
  - sort controls row
  - grid surface wrapper
- Keep entity-specific filter vocabulary outside the shared shell.
- Preserve current awakeners behavior exactly while making room for wheels.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/database/useDatabaseBrowseState.test.tsx src/pages/DatabasePage.test.tsx`
Expected: PASS

### Task 3: Wheel Browse Domain

**Files:**
- Create: `src/domain/wheels-search.ts`
- Create: `src/domain/wheels-database-browse-state.ts`
- Create: `src/domain/wheels-database-sorting.ts`
- Create: `src/pages/database/useWheelsDatabaseViewModel.ts`
- Create: `src/pages/database/WheelDatabaseFilters.tsx`
- Create: `src/pages/database/WheelGrid.tsx`
- Create: `src/pages/database/WheelGridCard.tsx`
- Reuse/Modify: `src/domain/wheel-mainstat-filters.ts`
- Test: `src/domain/wheels-search.test.ts`
- Test: `src/domain/wheels-database-browse-state.test.ts`
- Test: `src/pages/database/WheelGridCard.test.tsx`

**Step 1: Write the failing test**

- Search tests should cover:
  - name
  - aliases
  - owner awakener name
  - realm label
  - mainstat label
  - overlay/search tags from descriptions
- Browse-state tests should cover wheel-specific params and default elision.
- Grid card tests should assert wheel art, name, rarity, realm/mainstat chrome, and accessible open action.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/domain/wheels-search.test.ts src/domain/wheels-database-browse-state.test.ts`
Expected: missing wheel browse/search modules

**Step 3: Write minimal implementation**

- Model wheel browse state independently from awakeners because the filter vocabulary differs.
- Recommended wheel sort options:
  - alphabetical
  - rarity
  - realm
  - mainstat
- Recommended search fields:
  - wheel name
  - aliases
  - owner awakener name
  - realm
  - mainstat label
  - lite tags inferred from rich text

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/domain/wheels-search.test.ts src/domain/wheels-database-browse-state.test.ts src/pages/database/WheelGridCard.test.tsx`
Expected: PASS

### Task 4: Wheel Detail Modal Shell

**Files:**
- Create: `src/pages/database/WheelDetailModal.tsx`
- Create: `src/pages/database/useWheelDetailModalState.ts`
- Create: `src/pages/database/WheelDetailSidebar.tsx`
- Create: `src/pages/database/WheelDetailContent.tsx`
- Create: `src/pages/database/WheelEnhanceSlider.tsx`
- Modify: `src/pages/database/useAwakenerDetailChrome.ts` or extract generic modal chrome hook
- Modify: `src/pages/DatabasePage.tsx`
- Test: `src/pages/database/WheelDetailModal.test.tsx`

**Step 1: Write the failing test**

- Add modal tests for:
  - opening from browse grid
  - closing back to browse
  - deep-linking directly to a wheel route
  - E-level slider changing both mainstat value and resolved description args
  - owner awakener link navigating to the awakener modal via route change

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/database/WheelDetailModal.test.tsx src/pages/DatabasePage.test.tsx`
Expected: missing wheel detail modal

**Step 3: Write minimal implementation**

- Reuse the existing modal chrome patterns:
  - route-backed open/close
  - body scroll lock
  - focus restore
  - ESC behavior
  - responsive header
- Keep wheel modal content single-page:
  - art
  - name / rarity / realm / owner
  - mainstat
  - future acquisition slot
  - E-level slider
  - rich description
  - lore placeholder section, hidden if no lore is present yet
- Use `resolveWheelMainstatValue` for the sidebar/mainstat display and description-arg resolution for text.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/database/WheelDetailModal.test.tsx src/pages/DatabasePage.test.tsx`
Expected: PASS

### Task 5: Shared Rich Text and Wheel Popovers

**Files:**
- Modify: `src/domain/database-rich-text.ts`
- Modify: `src/pages/database/DatabaseRichTextContent.tsx`
- Modify: `src/pages/database/useDatabasePopoverController.ts`
- Modify: `src/pages/database/database-reference-entry.ts`
- Create: `src/domain/wheels-database-reference-layer.ts`
- Create: `src/domain/wheels-database-reference-info.ts`
- Create: `src/pages/database/buildWheelPopoverEntry.ts` or equivalent adapter
- Test: `src/pages/database/useDatabasePopoverController.test.tsx`
- Test: `src/pages/database/RichDescription.test.tsx`
- Test: `src/pages/database/WheelDetailModal.test.tsx`

**Step 1: Write the failing test**

- Add tests proving wheel descriptions render through the same rich-text path as awakeners.
- Add tests for opening a wheel popover from:
  - wheel modal content
  - awakener database content
- Add tests for nested overlay popovers from wheel descriptions if the wheel description references overlays.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/database/useDatabasePopoverController.test.tsx src/pages/database/RichDescription.test.tsx`
Expected: wheel reference layer / popover entries missing

**Step 3: Write minimal implementation**

- Do not build a second popover UI.
- Reuse the current popover shell and introduce a wheel reference adapter:
  - initial version can adapt wheel records into generic info entries
  - richer version adds a wheel reference layer so wheel descriptions can resolve overlays and cross-links cleanly
- Extend navigation callbacks so a popover can request “open wheel modal” or “open awakener modal” through the same database route shell.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/database/useDatabasePopoverController.test.tsx src/pages/database/RichDescription.test.tsx src/pages/database/WheelDetailModal.test.tsx`
Expected: PASS

### Task 6: Database Page Composition

**Files:**
- Modify: `src/pages/DatabasePage.tsx`
- Create: `src/pages/database/DatabaseEntityTabs.tsx` or equivalent
- Create: `src/pages/database/WheelsDatabaseSection.tsx`
- Potentially Modify: `src/App.tsx`
- Test: `src/pages/DatabasePage.test.tsx`

**Step 1: Write the failing test**

- Add browse-level tests for switching between awakeners and wheels while preserving the correct route and search params.
- Add tests for opening a wheel modal from the wheels browse page and opening an awakener modal from a wheel owner link without remounting the entire app shell.

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/DatabasePage.test.tsx`
Expected: database page still awakener-only

**Step 3: Write minimal implementation**

- Introduce a small entity switcher/header inside the database area.
- Keep `/database` pointing at awakeners.
- Add `/database/wheels` as the wheels browse entry point.
- Make `DatabasePage` an entity-aware controller rather than duplicating a separate top-level wheels page component.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/DatabasePage.test.tsx`
Expected: PASS

### Task 7: Polish and Visual Parity

**Files:**
- Modify: wheel browse and modal components created above
- Test: `src/pages/database/WheelDetailModal.test.tsx`
- Optional visual QA via Playwright/manual pass

**Step 1: Write the failing test**

- Add final behavior tests for:
  - slider bounds
  - neutral realm filtering
  - empty owner rendering
  - no-art fallback
  - no-lore rendering

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/database/WheelDetailModal.test.tsx`
Expected: final edge cases not yet covered

**Step 3: Write minimal implementation**

- Make wheel cards visually align with the awakener grid language while staying wheel-specific.
- Use the existing database modal tone and typography rather than introducing a separate aesthetic.
- Keep lore collapsed by default once lore exists.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/database/WheelDetailModal.test.tsx`
Expected: PASS

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
