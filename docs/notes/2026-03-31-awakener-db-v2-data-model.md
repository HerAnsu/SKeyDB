# Awakener DB V2 Data Model Note

Last updated: 2026-04-15

## Why this exists

- Preserve the DB V2 source-of-truth boundary before more schema and migration work lands.
- Keep future source/reference imports from turning back into another hand-maintained `awakeners-full.json`.

## Current state

- The repo now has tracked normalized awakener datasets under `src/data/awakeners/`.
- The database page and rich popover flow now consume the compiled V2 awakener dataset plus the canonical `/awakeners` side datasets.
- The compiled V2 full and lite artifacts are generated and in live use; the old top-level full/lite/tag blobs are retired as maintained runtime inputs.
- Source CSV and external validation inputs are still acting as reference material, not a clean canonical data pipeline.
- The repo can now compile an aggregated V2 awakener payload directly from canonical tracked datasets via `src/domain/awakeners-full-v2.ts`, without reading legacy runtime blobs.
- Canonical records now cover card keywords, derived groups, overlay/popover ownership, continuation refs, and talent-owned upgrade patches as part of the normal DB V2 model.

## Key decisions or observations

- Canonical tracked datasets, not source imports, are the DB source of truth.
  - CSV is for source-backed text and relationship discovery.
  - Runtime/reference data is for reviewed scaling import and comparison only.
  - External validation inputs are reference material for checking tags, scaling, and coverage gaps only.

- The long-term pipeline is:
  - source inputs -> reviewed canonical tracked datasets -> compiled frontend read model

- `src/data/awakeners/awakener-kits.json` remains ownership/binding only.
  - It should define which records are visible as `C1-C5`, `Exalt`, `Over Exalt`, `T1-T4`, and `E1-E3`.
  - It should not own descriptions, scaling payloads, or tag mechanics.

- Curated gameplay/search labels should live on roster ownership, not in overlays.
  - Use authored roster `searchTags` for list/search concepts like broad kit identity or reviewed semantic buckets.
  - Do not force every search tag to become an overlay or sourced mechanic record.

- Text-bearing records keep their own structured scaling.
  - `awakener-skills.json`
  - `derived-skills.json`
  - `awakener-talents.json`
  - `awakener-enlightens.json`

- `descriptionTemplate` plus `descriptionArgs` is the canonical display contract.
  - Templates use `{...}` for references and `[...]` for args.
  - `descriptionArgs` should stay frontend-ready:
    - `fixed`
    - `scaling`
    - optional `suffix`
    - optional `stat`

- Cards need structured keyword/tag support in addition to prose.
  - Add `cardKeywords` on card-like records.
  - This is primarily for intrinsic card tags the CSV/prose omits or represents inconsistently, such as `Retain`, `Exhaust`, `Prepare`, and similar card-state mechanics.
  - Do not use `cardKeywords` to duplicate every mechanic already expressed well in prose.

- Enlightens should own cumulative upgrade patches, not standalone upgraded-card truth.
  - Base cards remain the canonical authored records.
  - Each enlighten can carry `upgradePatches` that target:
    - visible skills
    - derived skills
    - overlays/shared mechanic records
  - Patch payloads can change:
    - description text
    - args/scaling
    - intrinsic card keywords
  - Compiled upgraded card variants are a read-model concern derived from:
    - base card
    - all patches unlocked up to the selected enlighten tier

- Overlay/popover content belongs in a separate canonical dataset.
  - `awakener-overlays.json` should own:
    - tags
    - states
    - personas
    - realm effects
    - mechanic/help popovers

- Derived groups are first-class records.
  - Some clickable references are families or bundles of cards rather than single playable cards.
  - Example shape: `Divine Realm's Illusion` as a group node with child derived card ids.

- Legacy top-level full/lite/tag blobs should stay retired; the maintained path is canonical `/awakeners` datasets plus compiled V2 artifacts.
- The preferred target is now:
  - canonical split datasets remain the authored source of truth
  - a generated `compiled/awakeners-full.v2.json` becomes the runtime-facing read model
  - smaller runtime projections such as `compiled/awakeners-lite.v2.json` and tag/search indexes should derive from that same compiled graph
- The compiler and resolver now do the heavy lifting before React consumers render the database experience.
- Frontend code should keep consuming resolved read models, not reimplement compiler behavior inside selectors or components.

- Public-safe gating remains mandatory.
  - Unreleased or source-only future content must stay out of tracked parent-repo data unless explicitly approved for inclusion.

## Proposed canonical storage

Tracked canonical datasets in `src/data/awakeners/`:

- `awakener-roster.json`
- `awakener-kits.json`
- `awakener-skills.json`
- `derived-skills.json`
- `awakener-talents.json`
- `awakener-enlightens.json`
- `awakener-overlays.json`

Generated frontend read model:

- `src/data/awakeners/compiled/awakeners-full.v2.json`
- `src/data/awakeners/compiled/awakeners-lite.v2.json` as a derived projection, not an independently maintained sibling

Reference-only inputs outside tracked canonical data:

- external source snapshots
- review reports
- legacy runtime JSON snapshots
- validation or audit materials

## Ideal workflow

1. Refresh the source/reference materials that feed the review process.
2. Regenerate or update any reference outputs used to compare source-backed text and relationships.
3. Review diffs for canonical tracked datasets where source-owned text changed.
4. Update canonical non-source fields only where needed:
   - kit bindings
   - scaling corrections
   - card keywords
   - enlighten upgrade patches
   - overlays
5. Run the compiler to regenerate the frontend read model.
6. Regenerate derived projections such as `compiled/awakeners-lite.v2.json` and tag/search indexes from the compiled output.
7. Frontend consumes the compiled read model and its derived projections, not stale hand-maintained artifacts.

This keeps imports disposable, canonical data durable, and frontend payloads reproducible.

## Implications

- We should keep non-`/awakeners` DB payloads out of the maintained source path entirely.
- The DB V2 schema is now stable enough that future work should mostly be follow-up coverage, not more foundational churn.
- Soulforge-driven card/exalt support is intentionally deferred for now; the reviewed cases skew toward mixed conditional behavior and injected effects rather than clean scalar upgrades.
- Search-oriented tags like `STR Up` / `STR Down` belong in derived search/index output.
  - They are useful list/search buckets.
  - They should not force canonical overlay display names to drift away from sourced mechanic text such as `STR` or `STR⯆`.
- Curated tags like `Strike` should remain authored-only when they express reviewed gameplay identity rather than automatic card-slot presence.
- Database scope questions such as wheels, covenants, posses, or future teams curation should be treated as separate product passes rather than as blockers for the awakener DB V2 foundation.

## Follow-up links

- Archive plan: `docs/archive/plans/2026-03-31-awakener-db-v2-migration-plan.md`
- Roadmap: `docs/roadmap.md`
- Backlog: `docs/backlog.md`
- Related note: `docs/notes/2026-03-02-database-split-notes.md`
