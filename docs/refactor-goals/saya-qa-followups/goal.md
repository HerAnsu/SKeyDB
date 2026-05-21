# Refactor Goal: saya-qa-followups

## Intake

Status:
- [x] Intake completed from the user's follow-up QA notes and scout reports
- [ ] Intake skipped explicitly by user

Mode: Follow-up Refactor Discipline goal for Saya QA polish after the first QA pass.
Risk posture: Moderate UI/product behavior change. Prefer root fixes at the state/routing boundary, with focused tests and Browser checks for transient UI behavior.
Harness update policy: Goal docs and focused tests are allowed. No dependency, AGENTS.md, remote publishing, deploy, or PR changes without explicit approval.
Allowed areas: `src/domain/**`, `src/features/database/**`, `src/pages/timeline/**`, `src/ui/modal/**`, focused tests, and this goal packet.
Protected areas: dependency files, remote state, unrelated public-v3 data/tooling output, unrelated Builder/Collection behavior except shared sort/filter state, and atlas/spritesheet work.
Max worker-slice size: One concept-complete product behavior slice spanning producer, direct consumers, focused tests, and narrowly necessary shared helpers.
Stop condition: Stop when all follow-up issues are implemented or terminal, a product/design decision is required, verification fails twice for the same slice, or scope expands beyond this follow-up list.

## Objective

Resolve the Saya QA follow-up issues:

1. Timeline preview date copy should clearly communicate both start and end dates for upcoming banners and events, while leaving D-Zone behavior effectively unchanged.
2. The dual start/end date text must be allowed to stack cleanly on low-width event rows; banner hero text should keep contextual `Starts ... · Ends ...` copy, while the banner detail drawer uses a compact absolute `date → date` range.
3. 24's scaling popovers should remain open and live-update while the user interacts with detail sidebar controls.
4. Scaling filters should express the intended distinction: selected main-scaling stats and selected sub-scaling stats, not one global main/sub role applied to every selected stat.
5. Awakener detail tabs should hide Overview and Teams, keep Builds visible, put Lore last, and default to Upgrades.
6. Consider and, if clean, wire a persisted user default awakening detail tab preference.
7. Closing a route-backed detail modal should not briefly dismantle/re-render as an overlay modal before disappearing.
8. Persisted database sorting should be treated as a local preference; URL sort params may remain as read-only legacy/share overrides, but normal sort changes should not keep writing preference state into the URL.

## Success Criteria

- Upcoming banner and event cards use clear `Starts #date · Ends #date` or `Starts in #countdown · Ends #date` style copy.
- Low-width event rows stack `Starts ...` and `Ends ...`; banner hero date text remains contextual, and banner detail drawer date text uses compact `date → date` output.
- D-Zone countdown UX is not broadened accidentally by the banner/event date work.
- Popovers opened from scaled content remain open during sidebar progression interactions and reflect updated scaling context.
- Scaling filters let users independently filter `Main scaling` and `Sub scaling` stats, with clear active chips and deterministic URL parsing for legacy links.
- Awakener visible tabs are Upgrades, Skills, Builds, Lore; Overview and Teams routes remain compatible but do not appear as active visible tabs.
- If default-tab persistence is implemented, explicit tab URLs still win over the preference and invalid/hidden tab URLs canonicalize safely.
- Route modal close does not swap to overlay modal chrome/content for an intermediate render.
- Sort persistence does not create noisy URL/history churn during ordinary sort changes; explicit URL sort params still work as overrides.
- Focused tests and Browser spot checks cover the risky UI/state behavior.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/saya-qa-followups
```

after editing packet files.

## Candidate Register

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| C1: banner/event preview date display | S1 | done | `src/domain/timeline.ts`, banner/event timeline components, focused date/card tests | User clarified events share the unclear start-only/hidden-end-date issue; D-Zones are not previewed before active. | Implemented clear start/end copy; event rows stack on cramped cards, banner hero stays contextual, and banner drawer uses compact absolute date ranges. |
| C2: sidebar-safe live popovers | S1 | done | `src/ui/modal/useDetailModalChrome.ts`, database popover controller consumers, focused modal/popover tests | Scout found sidebar clicks bubble to the overlay click handler and close popovers as outside clicks. | Added narrow preserve zones for sidebar controls and live current-rank popover context. |
| C3: independent main/sub scaling filters | S1 | done | scaling domain helper, browse state, filters, active chips, view-model tests | Current role filter applies one role to all selected stats, which does not match `Main: Amp, Sub: Keyflare`. | Replaced global role with Any/Main/Sub selected-stat buckets and legacy URL migration. |
| C4: detail tabs and default preference | S1 | done | database paths, modal host/routing, detail preferences, settings panel, tab tests | User corrected the first pass: Teams should be hidden; Builds should stay visible. | Visible tabs are Upgrades/Skills/Builds/Lore; route-less opens honor persisted default tab. |
| C5: route-modal close teardown root fix | S1 | done | `DbDetailModalHost`, detail store/route tests, Browser close check | Scout found route close can render stale route stack entry as overlay modal for one frame. | Route-sourced stack entries no longer render as overlay fallback after route detail disappears. |
| C6: sort persistence without URL churn | S1 | done | browse state hooks/preferences, route tests | Persisted sorting makes URL sort writes mostly redundant; URL params remain useful for share/legacy overrides. | Normal sort changes persist locally and remove/avoid sort params; explicit URL sort params still read as overrides. |

## Non-goals / Protected Behavior

- Do not push, create PRs, deploy, or mutate remote state.
- Do not add dependencies.
- Do not solve Cloudflare Pages file count with spritesheets in this goal.
- Do not rework generated public-v3 data unless a focused test exposes a direct need.
- Do not redesign the whole detail/sidebar/filter surface beyond the named follow-up behaviors.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Broad multi-slice workflow | `$refactor-goal-prep`, `$refactor-scout`, `$refactor-worker-slice`, `$refactor-review` | yes | Packet state is durable truth. |
| React state/routing/modal behavior | `$refactor-react`, `$refactor-ui-a11y` | yes | Preserve accessible tabs, buttons, focus, and explicit route links. |
| Timeline/date layout and wrapping | `$refactor-tailwind`, `$refactor-ui-a11y` | yes | Browser check narrow card behavior. |
| URL/state/storage migration | `$refactor-typescript`, `$refactor-rootfix` | yes | Keep share links deterministic and storage safe. |
| Modal close root cause | `$refactor-rootfix`, `$refactor-complexity` | yes | Fix stale route/stack boundary, not animation symptoms. |

## First Tranche

Type:
- [x] read-only scout
- [x] React route/state cleanup
- [x] TypeScript trust-boundary cleanup
- [x] UI/a11y date/filter/modal cleanup
- [x] root-fix for stale route modal close

Allowed files/areas: one candidate slice at a time within the allowed areas above.
Protected files/areas: dependency files, remote state, unrelated generated data, and unrelated app routes.
Expected simplification: State should model user intent directly rather than encoding intent through overloaded global filter or URL-only preference state.
Validation: goal checker, focused tests per slice, `npm run lint`, Browser checks for timeline event wrapping, banner date compactness, popover hooks, tab visibility/defaulting, and sort URL behavior.
Rollback: revert the current worker slice files and restore `state.json`/`worklog.md` to the previous task state.

## Root-Fix Policy

Prefer root fixes for stale route stack fallback, filter state shape, sort preference ownership, and modal overlay click semantics. Local visual patches are acceptable only for the date wrapping/card layout issue.
