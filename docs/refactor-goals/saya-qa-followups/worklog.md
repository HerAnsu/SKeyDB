# Refactor Goal Worklog: saya-qa-followups

## Entries

### 2026-05-21 - Goal packet created

- Source: User requested a follow-up `$refactor-goal-prep` pass after reviewing the first Saya QA implementation.
- Intake: Completed from user clarifications and read-only scout findings.
- Scope changes from first pass: banners and events need clearer visible end dates; D-Zones are not target UX; Teams should be hidden instead of Builds; scaling filters need independent main/sub stat buckets; sort persistence should stop treating the URL as the primary preference store.
- Additional layout acceptance: dual date text may wrap on low-width cards instead of compressing titles/art.
- Active task: W1, implement C1-C6 with focused tests and Browser checks.
- Validation planned: goal checker, focused Vitest suites, lint, and Browser checks for date wrapping, live popovers, tab visibility/defaults, and modal close behavior.

### 2026-05-21 - Follow-up implementation completed

- Implemented timeline date copy for upcoming banners/events: normal surfaces use `Starts ... · Ends ...`, near-upcoming surfaces include `Starts in ... · Ends ...`, and D-Zone behavior was left alone.
- Refined the timeline layout after visual feedback: event rows split `Starts ...` / `Ends ...` on cramped cards, banner hero text stays contextual, and the banner detail drawer uses compact absolute `date → date` text.
- Corrected popover dismissal/live-update behavior by limiting preserve behavior to marked sidebar controls and plumbing current-rank context through database popover entries.
- Reworked scaling filters into independent `Any scaling`, `Main scaling`, and `Sub scaling` buckets with matching chips and legacy URL migration.
- Restored Builds, hid Teams/Overview from visible awakener tabs, kept Lore last, defaulted to Upgrades, and added a persisted route-less default tab preference.
- Fixed route-modal close teardown by preventing route-sourced stack entries from rendering as overlay fallback after the route detail is gone.
- Changed database/wheel sorting so normal sort changes persist locally without writing noisy sort params into the URL; explicit URL sort params still read as overrides.
- Browser receipts: `Triune Verdant` hero rendered `Starts Jun 15 · Ends Jul 13`; opened drawer rendered `Jun 15 → Jul 13`; event rows split start/end lines at two-column width; tabs showed Upgrades/Skills/Builds/Lore with Overview/Teams absent; scaling buckets were present; changing sort left `#/database` clean.
- Validation receipts: focused timeline tests passed, TypeScript passed, lint passed; full focused QA suite passed before the final banner drawer/hero mapping correction and timeline-focused tests passed after it.
- No commit was made per user request.
