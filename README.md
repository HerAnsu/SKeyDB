# SKeyDB

Unofficial Morimens database and team planner web app (community project, running name: SKeyDB).

Live site (stable beta, actively developed):
- https://dansa.github.io/SKeyDB/#/builder

## Tech Stack
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Zustand + Immer (state)
- Zod (schema validation)
- Fuse.js (fuzzy search)
- dnd-kit (drag and drop)
- Vitest + Testing Library

## Quick Start
```bash
npm install
npm run dev
```

App runs on `http://127.0.0.1:5173`.

## Scripts
- `npm run dev` - start local dev server
- `npm run build` - type-check + production build
- `npm run preview` - preview built app
- `npm run test` - run tests once
- `npm run test:unit` - fast domain and utility regression pass
- `npm run test:integration` - builder-heavy interaction regression pass
- `npm run test:quick` - small collection/UI smoke suite
- `npm run test:watch` - run tests in watch mode
- `npm run lint` - run ESLint
- `npm run data:refresh-awakener-v2` - regenerate the committed awakener V2 read models from tracked source data
- `npm run verify` - refresh committed awakener artifacts, then format, lint, test, and build

Tracked data artifacts are committed to the repo and consumed directly by the app. Contributor-facing commands in this README are intended to work from a fresh clone.

## Project Structure
- `src/pages/` - route-level surfaces for overview, database, timeline, builder, and collection
- `src/pages/builder/` - builder UI components, drag/drop coordination, import/export, and team orchestration
- `src/pages/database/` - database browse/detail UI, rich references, modal flows, and shared detail rendering
- `src/domain/` - domain logic, codecs, search, normalization, database read models, and asset helpers
- `src/data/` - tracked canonical datasets plus compiled frontend-ready artifacts
- `scripts/` - public-safe data compilers, sync helpers, and repo tooling
- `docs/` - roadmap, backlog, notes, archive, and templates (see `docs/README.md`)

## Contributors
- `DZ-David`, Original database and team builder, which some of our data originates from.
- `V`, Project management, data help/cleanup and a whole lot of other things
- `Zekiel`, Data collection/help, anti-tawil propaganda in my DMs + more
- `Ansu`, Migration and restructuring of awakener json db, plus a lot of work on the
  codebase.
- `Juno`, Made the website icon and is working on our logo
- `Happy`, Working on our logo
- `Jynn`, Invaluable help with awakener scaling mathematics, and is the actual source of
  most our database text content.
- `Fish`, Collected and mapped out every covenant slice (and more) in the game, so that
  our export codes actually work as they should.
- `Frosthief`, Also helped out a lot with collecting wheel mappings and more for the
  export codes.
- Everyone else who has, or will, provide feedback, suggestions, or other contributions
  to the project.


## Attribution & Other contributions
- Posse images are currently - and Awakener avatars/cards were previously - sourced from Morimens HuijiWiki community pages:
  - https://morimens.huijiwiki.com/p/1
- HuijiWiki content for these assets is credited under CC BY-NC-SA:
  - https://creativecommons.org/licenses/by-nc-sa/4.0/
- Big thanks to the Huiji contributors for putting those resources, and a lot of other information together. It helped us get going a lot quicker than we would have otherwise.


## Asset & IP Notice
- SKeyDB is an unofficial, non-commercial fan project.
- `Morimens`, related logos, character art, portraits, card art, and other in-game assets are owned by Qookka Games and/or their licensors.
- No endorsement or affiliation with Qookka Games is implied.
- If you plan to reuse game assets in another project (especially commercial use), obtain permission from the rights holder first.
- If a rights holder requests removal of any asset or content in this repo, it should be removed promptly.

Reference legal pages:
- https://account.qookkagames.com/service.en-US.html
- https://agreement.qookkagames.com/qookka/webshop-user-agreement/en/agreement.html

## Current App Surfaces
- `Overview` - project status, recent changelog, contributor acknowledgements, and public resource links
- `Database` - awakener filters, ranked search, deep-linked detail routes, exact level 1-90 stat scaling, cards/guide/build tabs, and interactive reference popovers
- `Timeline` - current and upcoming event/banner tracking
- `Builder` - multi-team planning with drag/drop, realm rules, quick-lineup helpers, compact `t1.` / `mt1.` codes, and in-game `@@...@@` codec support
- `Collection` - owned/unowned tracking, dupe/enlighten progress, collection sorting, and snapshot export/import

For current priorities and unscheduled ideas, see:
- `docs/README.md`
- `docs/roadmap.md`
- `docs/backlog.md`
