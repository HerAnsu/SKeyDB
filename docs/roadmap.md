# SKeyDB Roadmap

Last updated: 2026-04-15

## Current priorities

### Database follow-ups

- Keep the split canonical awakener datasets plus compiled V2 artifacts as the maintained database path.
- Treat the main DB V2 migration as shipped foundation rather than active backend work.
- Keep soulforge-driven card/exalt scaling deferred unless a narrow curated subset becomes worth the manual authoring cost.
- Keep lower-priority niceties such as tag icons and tag-stacking search deferred until there is a concrete product need.
- References:
  - `docs/notes/2026-03-31-awakener-db-v2-data-model.md`
  - `docs/backlog.md`

### In-game codec completion

- Finish covenant support for `@@...@@` import/export.
- Finish posse support for `@@...@@` import/export.
- Remove WIP fallback behavior once those two blocks are supported for real.
- Reference:
  - `docs/notes/2026-02-27-ingame-team-codec-status.md`

### Persistence migration scaffolding

- Add a migration registry when the first real schema bump requires it.
- Keep boundary compatibility behavior explicit rather than scattering one-off fallbacks.
- Reference:
  - `docs/archive/plans/2026-02-22-persistence-plan.md`

## Next larger passes

- Mobile and compact builder layout pass.
- Share-via-link flow with safe overwrite UX.
- Multiple on-site saved planners.
- Richer database detail surfaces beyond the current awakener scope, if or when wheels, covenants, or posses need the same treatment.

## Recently shipped foundations

- Repo strict TypeScript ESLint compliance cleanup, plus an optional isolated React sidecar lint diagnostic for high-value React rules.
- Database V2 compiled read model, selected-state resolver, generated lite projection, and canonical split dataset pipeline.
- Database detail modal: Overview, Cards, and Guide tabs with rich text parsing, interactive skill/tag popovers, draggable stacked references, modal jump search, persistent detail preferences, exact level 1-90 stat scaling, and shared rendering infrastructure for future tabs.
- Database & Tools page with filters, stronger ranked search, sorting, basic modal, and deep-linked awakener routes.
- Generated dimensional relic dataset with cleaned-up canonical descriptions.
- Multi-team builder and cross-team management.
- Compact `t1.` / `mt1.` import-export.
- Baseline in-game `@@...@@` import-export support.
- Builder and collection local persistence.
- Builder QOL stage 2 improvements.
- Realm terminology migration.

Reference history:

- `docs/archive/plans/`
- `docs/archive/roadmaps/2026-02-20-project-roadmap.md`
