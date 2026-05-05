## PUSHBACK UPDATE; ROUTING:

Agreed. I would change that part of the recommendation.

The **public ID should remain canonical inside the data contract**, but the **user-facing URL should be human-readable**.

The better rule is:

> IDs are for data. Slugs are for humans. The frontend route resolver maps slugs to IDs through a generated route index.

So instead of this as the canonical route:

```text
/database/awakeners/awakener-0003
/database/awakeners/awakener-0003-mason
```

I would use this:

```text
/database/awakeners/mason
/database/wheels/obsidian-crown
/database/posses/iron-vanguard
/database/covenants/oath-of-flame
```

or, if you prefer singular route sections:

```text
/database/awakener/mason
/database/wheel/obsidian-crown
/database/posse/iron-vanguard
/database/covenant/oath-of-flame
```

I still prefer plural sections because they read like database categories, but that is product taste. The important thing is that the final token should be a **human content slug**, not an exposed database ID.

## Revised routing recommendation

Canonical public URLs should look like this:

```text
/database/awakeners/{humanSlug}
/database/wheels/{humanSlug}
/database/posses/{humanSlug}
/database/covenants/{humanSlug}
/database/relics/{humanSlug}
```

Examples:

```text
/database/awakeners/mason
/database/awakeners/24
/database/wheels/nightfall-orbit
/database/posses/silver-guard
/database/covenants/blood-oath
```

Internally, those slugs resolve to stable IDs:

```ts
"/database/awakeners/mason"
  → { kind: "awakener", id: "awakener-0003" }
```

The frontend should never infer that mapping. Python should generate it.

## The generated route index should own this

Example generated route contract:

```json
{
  "schemaVersion": 3,
  "routes": {
    "awakeners": {
      "mason": {
        "kind": "awakener",
        "id": "awakener-0003",
        "canonicalSlug": "mason",
        "canonicalPath": "/database/awakeners/mason"
      },
      "24": {
        "kind": "awakener",
        "id": "awakener-0001",
        "canonicalSlug": "24",
        "canonicalPath": "/database/awakeners/24"
      }
    },
    "wheels": {
      "nightfall-orbit": {
        "kind": "wheel",
        "id": "wheel-0042",
        "canonicalSlug": "nightfall-orbit",
        "canonicalPath": "/database/wheels/nightfall-orbit"
      }
    }
  },
  "redirects": {
    "awakeners": {
      "old-mason-name": {
        "kind": "awakener",
        "id": "awakener-0003",
        "canonicalPath": "/database/awakeners/mason"
      }
    }
  }
}
```

Then every catalog/detail record can include:

```json
{
  "kind": "awakener",
  "id": "awakener-0003",
  "name": "Mason",
  "route": {
    "slug": "mason",
    "canonicalPath": "/database/awakeners/mason"
  }
}
```

The frontend displays and navigates with `canonicalPath`, but stores and relates data with `id`.

## Slugs should be stable content keys, not freshly derived names

This is the subtle but important part.

Do **not** regenerate canonical slugs from the current display name every export unless you explicitly want URLs to change.

Instead, Python should maintain a route registry:

```text
public_route_registry.json
```

Conceptually:

```json
{
  "awakener-0003": {
    "canonicalSlug": "mason",
    "aliases": ["old-mason-name", "mason-the-brave"]
  },
  "wheel-0042": {
    "canonicalSlug": "nightfall-orbit",
    "aliases": ["nightfall-wheel"]
  }
}
```

When a name changes, you have three options:

1. Keep the old slug because it is recognizable enough.
2. Change the canonical slug and emit the old slug as a redirect.
3. Add a manual override if the generated slug is ugly.

That means the data identity can be stable without forcing ugly URLs.

## Collision handling should be human-first

If two things produce the same slug, do not append raw IDs by default.

Bad:

```text
/database/awakeners/mason-0003
/database/wheels/storm-0042
```

Better:

```text
/database/awakeners/mason
/database/awakeners/mason-shadow
```

or:

```text
/database/wheels/storm-blade
/database/wheels/storm-orbit
```

Collision rules should be generated in Python with optional manual overrides.

Suggested priority:

```text
1. Use explicit manual slug override if present.
2. Use normalized primary display name.
3. If collision, add a meaningful qualifier:
   - realm
   - role
   - owner name
   - item class
   - source category
4. Only as last resort, append a short opaque suffix.
```

Even the last resort should be short and non-primary, for example:

```text
/database/skills/storm-a7f
```

not:

```text
/database/skills/skill-000184
```

For main database entities, manual overrides should prevent almost all ugly fallbacks.

## For child/owned entities, use owner-scoped human routes

For things like skills, derived skills, talents, overlays, or awaken-specific content, top-level slugs may collide constantly. So I would not expose them as:

```text
/database/skills/skill-000184
```

I would use owner-scoped routes:

```text
/database/awakeners/mason/skills/battle-instinct
/database/awakeners/mason/talents/last-stand
/database/awakeners/mason/overlays/crimson-form
```

Internally:

```ts
{
  owner: { kind: "awakener", id: "awakener-0003" },
  child: { kind: "skill", id: "skill-0184" }
}
```

This gives users readable paths while preserving stable internal identity.

For modal-only references, you may not need full child URLs immediately. But if direct linking matters later, owner-scoped routes are the cleanest human-facing option.

## The frontend resolver should work like this

When the user visits:

```text
/database/awakeners/mason
```

The frontend does:

```ts
const resolution = await resolveRoute({
  scope: "awakeners",
  slug: "mason"
});
```

The resolver returns:

```ts
{
  status: "ok",
  ref: {
    kind: "awakener",
    id: "awakener-0003"
  },
  canonicalPath: "/database/awakeners/mason"
}
```

If they visit an old slug:

```text
/database/awakeners/old-mason-name
```

It returns:

```ts
{
  status: "redirect",
  ref: {
    kind: "awakener",
    id: "awakener-0003"
  },
  canonicalPath: "/database/awakeners/mason"
}
```

If they visit an unknown slug:

```ts
{
  status: "notFound",
  scope: "awakeners",
  slug: "whatever"
}
```

The route index lets the site be static/CDN-friendly while still giving you proper deep links.

## What I would remove from my earlier recommendation

I would no longer recommend this as the default public route:

```text
/database/awakeners/awakener-0001-24
```

That is technically safe but product-hostile.

I would keep this only as an internal/debug/admin route, or maybe as a non-canonical rescue alias:

```text
/database/awakeners/awakener-0001
```

If someone lands there, redirect them to:

```text
/database/awakeners/24
```

The stable ID remains useful for data, tests, references, saved builder state, collection ownership, backend records, and generated indexes. It does not need to be visible in normal navigation.

## Updated architecture rule

The revised rule should be:

> The canonical data identity is `{kind, id}`.
> The canonical user route is `{scope, humanSlug}`.
> Python generates the mapping.
> React resolves routes through the generated index.
> Components never derive slugs or use route slugs as identity.

That gives you the best of both worlds: clean URLs for players, stable IDs for architecture.

----------
## REVIEW START

## 1. Blunt diagnosis

The current architecture is not “static frontend consuming generated data.” It is **Python generating a semi-public dump, then React compiling it again at runtime**.

That is the root problem.

The frontend currently performs too many data-pipeline jobs: identity conversion, owner joins, legacy model adaptation, canonical name resolution, slug generation, asset stem inference, reference-layer assembly, search-field construction, filter derivation, and ownership catalog construction. That means the website is carrying private-tooling responsibilities without the safety, tests, or source context that the tooling repo has.

The worst architectural smells in the packet are:

| Area                        | Diagnosis                                                                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canonical boundary**      | `public-v2` is not yet a real product contract. It is a partially normalized export plus frontend adapters.                                                                         |
| **Identity**                | IDs are fragmented: public string IDs, numeric IDs, name slugs, lineup tokens, asset IDs, source IDs, and owner IDs all appear as authority in different places.                    |
| **Frontend data loading**   | Some files correctly use lazy per-record loaders, while others eagerly import full aggregates. The result is inconsistent, fragile, and easy to regress.                            |
| **Schemas**                 | `public-v2-schema.ts` validates envelopes and some relationships, but several entity shapes are still too permissive. The frontend assumes more than the contract guarantees.       |
| **Database page**           | `DatabasePage.tsx` is a controller god component. It owns routing, tab behavior, search capture, browse rendering, detail routing, modal open/close behavior, and entity branching. |
| **Detail modals**           | The current detail modal approach is page-coupled. Builder and collection will keep fighting it unless detail viewing becomes an app-level overlay service.                         |
| **Search/reference layer**  | The frontend builds search/reference metadata that should be generated by Python. It should rank results locally, not invent searchable facts.                                      |
| **Assets**                  | Asset lookup is still partly filename-convention based. That is acceptable during extraction, not as a public frontend contract.                                                    |
| **Ownership/builder state** | Local user state is spread across hooks and local storage helpers. It is not yet modeled as a coherent client state domain.                                                         |
| **Zustand**                 | Zustand is installed but effectively unused. That is worse than not having it: the architecture has no clear opinion about state ownership.                                         |

The current deslop plan is too frontend-heavy. Some P0 stabilization is worth doing, but a lot of the proposed cleanup would be made obsolete by fixing the data contract. Do not spend weeks polishing adapters around a boundary that should change.

The correct direction is: **make Python own the public product data model, then make React a typed, lazy, route-aware renderer over that model.**

---

## 2. Recommended target architecture

Use this ownership split:

```text
Game/source evidence
  ↓
Private Python extraction/discovery/approval
  ↓
Approved normalized Python model
  ↓
Compiled internal model
  ↓
Generated public contract bundle
  ↓
Frontend repository/data-access layer
  ↓
Feature view models and UI
```

The canonical boundary should be two-layered:

1. **Canonical private truth:** the approved normalized/compiled Python model.
2. **Canonical frontend boundary:** a generated public JSON contract bundle.

The frontend domain model should **not** be canonical. It should be a thin typed façade over generated data.

I would not keep stretching `public-v2` indefinitely. I would create a **`public-v3` projection layer** even if much of the data initially comes from the same projector code. The reason is practical: `public-v2` already encodes ambiguity. It has weak shape guarantees, mixed identity semantics, aggregates that the frontend can accidentally import, and historical adapter assumptions. A versioned break lets you remove ambiguity instead of documenting around it.

The target should be:

```text
frontend/src/data/public-v3/
  manifest.json
  catalogs/
    awakeners.json
    wheels.json
    posses.json
    covenants.json
    relics.json
    ...
  records/
    awakeners/awakener-0001.json
    wheels/wheel-0001.json
    posses/posse-0001.json
    ...
  indexes/
    entities.json
    routes.json
    search-awakeners.json
    search-wheels.json
    search-posses.json
    search-covenants.json
    references.json
    relationships.json
    facets.json
    assets.json
    collection-catalog.json
    builder-catalog.json
  metadata/
    gameplay-math.json
```

The frontend should mostly import/load from a single data-access layer:

```text
src/data-access/public-data/
  contract.ts
  schemas.ts
  manifest.ts
  loaders.ts
  repository.ts
  routeResolver.ts
  searchRepository.ts
  referenceRepository.ts
  assetRepository.ts
  cache.ts
```

Then features consume repositories, not raw generated JSON.

---

## 3. Entity identity scheme

The identity rule should be brutally simple:

> Every public entity has exactly one canonical public ID. Every public relationship uses that ID. Everything else is an alias, attribute, route helper, or source/debug field.

Use canonical public IDs like this:

```ts
type EntityKind =
  | "awakener"
  | "wheel"
  | "posse"
  | "covenant"
  | "relic"
  | "skill"
  | "derivedSkill"
  | "overlay"
  | "talent"
  | "enlighten"
  | "awakenerBuild";

type EntityRef = {
  kind: EntityKind;
  id: string;
};
```

Recommended ID patterns:

| Scope                       | Public ID pattern                                                            | Notes                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Awakeners                   | `awakener-0001`                                                              | Current pattern is good. Keep `numericId` as attribute only.                             |
| Wheels                      | `wheel-0001`                                                                 | Keep owner relationship as `ownerAwakenerId: "awakener-0048"`, never numeric.            |
| Posses                      | `posse-0001`                                                                 | `index` should be generated, not derived from suffix in React.                           |
| Covenants                   | `covenant-0001`                                                              | Same.                                                                                    |
| Relics                      | `relic-0001`                                                                 | Good root entity.                                                                        |
| Awakener builds             | `awakener-build-0001`                                                        | Fine.                                                                                    |
| Skills                      | Prefer stable public IDs, e.g. `skill-0001` or `skill.awakener-0001.slot-c1` | If owner-scoped IDs remain slug-like, still enforce `kind`, `id`, and `ownerAwakenerId`. |
| Derived skills              | Same as skills                                                               | Must have explicit parent/root relationships.                                            |
| Talents/enlightens/overlays | Same rule                                                                    | No numeric owner bridge.                                                                 |

Do **not** use names as identity. Do **not** use route slugs as identity. Do **not** use asset IDs as identity. Do **not** use lineup tokens as identity.

Generated records should include aliases, but aliases must be non-authoritative:

```json
{
  "kind": "awakener",
  "id": "awakener-0001",
  "name": "\"24\"",
  "numericId": 1,
  "ingameId": "A001",
  "aliases": ["24", "Mason"],
  "route": {
    "slug": "24",
    "canonicalPath": "/database/awakeners/awakener-0001-24",
    "redirectSlugs": ["mason"]
  }
}
```

For routes, I would avoid pure name slugs. Use either:

```text
/database/awakeners/awakener-0001
```

or:

```text
/database/awakeners/awakener-0001-24
```

The first is cleanest. The second is prettier while still stable. In either case, the resolver should use the generated route index, not regenerate slugs from names in React.

Generated route index:

```json
{
  "awakeners": {
    "awakener-0001": {
      "id": "awakener-0001",
      "slug": "24",
      "canonicalPath": "/database/awakeners/awakener-0001-24",
      "redirects": [
        "/database/awakeners/24",
        "/database/awakeners/mason"
      ]
    }
  }
}
```

The route resolver should handle old name slugs as redirects, but they should not be the canonical address.

---

## 4. Generated-data contract proposal

The generated public bundle should be treated as an API, even though it is static JSON.

### 4.1 Manifest

Every public bundle should start with a manifest:

```json
{
  "schemaVersion": 3,
  "gameDataVersion": "unknown-or-build-id",
  "buildId": "2026-05-04T00:00:00Z-abcd1234",
  "generatedAt": "2026-05-04T00:00:00Z",
  "scopes": {
    "awakeners": {
      "kind": "awakener",
      "catalog": "catalogs/awakeners.json",
      "recordPattern": "records/awakeners/{id}.json",
      "count": 56,
      "hash": "sha256..."
    }
  },
  "indexes": {
    "entities": "indexes/entities.json",
    "routes": "indexes/routes.json",
    "references": "indexes/references.json",
    "relationships": "indexes/relationships.json",
    "assets": "indexes/assets.json",
    "facets": "indexes/facets.json",
    "collectionCatalog": "indexes/collection-catalog.json",
    "builderCatalog": "indexes/builder-catalog.json"
  }
}
```

The manifest lets the frontend load small things first, cache aggressively, and avoid hardcoded path knowledge.

### 4.2 Catalog records

Catalogs are for browse/search/filter cards. They should be intentionally small.

Example:

```json
{
  "schemaVersion": 3,
  "kind": "wheel",
  "records": [
    {
      "kind": "wheel",
      "id": "wheel-0001",
      "name": "Example Wheel",
      "rarity": "SSR",
      "realm": "NEUTRAL",
      "mainstatKey": "attack",
      "ownerAwakenerId": "awakener-0048",
      "ownerAwakenerName": "Example Owner",
      "assets": {
        "icon": "asset-wheel-icon-0001"
      },
      "route": {
        "slug": "example-wheel",
        "canonicalPath": "/database/wheels/wheel-0001-example-wheel"
      },
      "search": {
        "primary": "Example Wheel",
        "aliases": [],
        "tags": ["attack", "neutral", "example owner"]
      }
    }
  ]
}
```

Catalog records should include enough for browse cards and filters, but not full lore, rich description graphs, formulas, or nested detail content.

### 4.3 Detail records

Detail chunks are for modal/page detail.

```json
{
  "schemaVersion": 3,
  "kind": "posse",
  "id": "posse-0001",
  "name": "Example Posse",
  "realm": "FADED_LEGACY",
  "lineupToken": "P01",
  "assets": {
    "icon": "asset-posse-icon-0001",
    "badge": "asset-posse-badge-0001",
    "fullArt": "asset-posse-full-0001"
  },
  "description": {
    "template": "...",
    "args": []
  },
  "lore": [],
  "references": [
    { "kind": "awakener", "id": "awakener-0001", "role": "mentioned" }
  ]
}
```

The frontend may render rich descriptions, but it should not discover what references exist.

### 4.4 Entity index

A global entity index should exist:

```json
{
  "byId": {
    "awakener-0001": {
      "kind": "awakener",
      "id": "awakener-0001",
      "name": "\"24\"",
      "route": "/database/awakeners/awakener-0001-24",
      "assets": {
        "icon": "asset-awakener-icon-0001"
      }
    }
  }
}
```

This allows any feature to resolve labels, routes, icons, and kind without importing every scope.

### 4.5 Search indexes

Search docs should be generated per scope, not invented in React:

```json
{
  "schemaVersion": 3,
  "scope": "awakeners",
  "records": [
    {
      "kind": "awakener",
      "id": "awakener-0001",
      "name": "\"24\"",
      "aliases": ["24", "Mason"],
      "tokens": ["mason", "24", "faction-name", "realm-name"],
      "facets": {
        "realm": "NEUTRAL",
        "rarity": "SSR",
        "type": "DPS"
      },
      "boosts": {
        "name": 10,
        "alias": 6,
        "tag": 2
      }
    }
  ]
}
```

The frontend can still run Fuse locally. The point is that Python owns the searchable fields and aliases. Fuse is still a reasonable short-term client search dependency because it supports configurable fuzzy matching and scoring behavior; do not replace it until profiling proves it is a bottleneck. ([Fuse.js][1])

### 4.6 Facet index

Filter options should be generated:

```json
{
  "awakeners": {
    "realm": [
      { "value": "NEUTRAL", "label": "Neutral", "order": 10 }
    ],
    "rarity": [
      { "value": "SSR", "label": "SSR", "order": 30 }
    ]
  }
}
```

React should not silently map `OTHER` to `NEUTRAL`. If a value should be normalized, Python should normalize it and tests should enforce it.

### 4.7 Reference index

References should be generated as a public index:

```json
{
  "tokens": {
    "mason": [
      { "kind": "awakener", "id": "awakener-0001", "confidence": "exact-alias" }
    ],
    "example wheel": [
      { "kind": "wheel", "id": "wheel-0001", "confidence": "name" }
    ]
  },
  "ambiguous": {
    "storm": [
      { "kind": "skill", "id": "skill-0010" },
      { "kind": "wheel", "id": "wheel-0042" }
    ]
  }
}
```

Silent “first wins” alias behavior should be forbidden. Ambiguity should be surfaced in tooling reports.

### 4.8 Relationship index

Generated relationships should include both forward and reverse edges:

```json
{
  "forward": {
    "awakener-0001": {
      "skills": ["skill-0001", "skill-0002"],
      "talents": ["talent-0001"],
      "overlays": ["overlay-0001"],
      "recommendedWheels": ["wheel-0001"]
    }
  },
  "reverse": {
    "wheel-0001": {
      "ownerAwakenerId": "awakener-0001",
      "mentionedBy": ["awakener-build-0001"]
    }
  }
}
```

This removes repeated frontend joins like “load all full skills/talents/enlightens/derived/overlays and filter by owner.”

### 4.9 Asset index

Assets should be modeled explicitly:

```json
{
  "assets": {
    "asset-posse-icon-0001": {
      "slot": "icon",
      "kind": "posse",
      "ownerId": "posse-0001",
      "importKey": "posses/icons/posse-0001.webp",
      "width": 256,
      "height": 256
    }
  },
  "entities": {
    "posse-0001": {
      "icon": "asset-posse-icon-0001",
      "badge": "asset-posse-badge-0001",
      "fullArt": "asset-posse-full-0001"
    }
  }
}
```

The frontend can still use Vite `import.meta.glob`, but it should match generated import keys. It should not infer that `covenant-icon-###` maps to `Icon_Trinket_###`.

### 4.10 Builder and collection catalogs

Builder and collection should get their own generated catalogs:

```json
{
  "collectables": {
    "awakeners": ["awakener-0001"],
    "wheels": ["wheel-0001"],
    "posses": ["posse-0001"],
    "covenants": ["covenant-0001"]
  },
  "linkedAwakenerGroups": [
    ["awakener-0001", "awakener-0017"]
  ]
}
```

```json
{
  "builder": {
    "awakenerOptions": ["awakener-0001"],
    "wheelOptions": ["wheel-0001"],
    "posseOptions": ["posse-0001"],
    "covenantOptions": ["covenant-0001"],
    "lineupTokens": {
      "awakener-0001": "A01",
      "wheel-0001": "W01"
    }
  }
}
```

Ownership state remains local/user-specific, but the ownership **catalog** should be generated.

---

## 5. What should remain frontend-only

The frontend should own:

| Frontend-only                       | Reason                                                    |
| ----------------------------------- | --------------------------------------------------------- |
| Current URL search params           | UI state, not game data.                                  |
| Active filters/sorts                | User/session state.                                       |
| Modal stack and navigation context  | Runtime UI state.                                         |
| Popovers, tabs, art viewer state    | Pure presentation state.                                  |
| Local collection ownership          | User state.                                               |
| Builder draft/team state            | User state.                                               |
| Builder preferences/autosave status | User state.                                               |
| Search ranking implementation       | Acceptable locally, as long as search docs are generated. |
| Description rendering components    | Presentation concern.                                     |
| Importing asset URLs through Vite   | Build/runtime concern.                                    |

The frontend should **not** own:

| Should move to Python      | Current problem                                            |
| -------------------------- | ---------------------------------------------------------- |
| Canonical names/aliases    | Duplicated in frontend.                                    |
| Owner joins                | Causes eager aggregate loading and unsafe numeric bridges. |
| Route slug generation      | Breaks on rename/collision.                                |
| Asset filename mapping     | Convention leakage.                                        |
| Searchable fields/tags     | Frontend becomes data compiler.                            |
| Reference extraction       | Frontend lacks source context.                             |
| Filter option lists/order  | Should be contract metadata.                               |
| Collection default catalog | Should come from public data.                              |
| Builder picker catalog     | Should come from public data.                              |
| Relationship graph         | Should be generated once.                                  |

---

## 6. Frontend data-access and state architecture

### 6.1 Data-access layer

Create a real repository boundary:

```text
frontend/src/data-access/public-data/
  contract.ts
  schemas.ts
  ids.ts
  manifest.ts
  cache.ts
  loaders.ts
  repository.ts
  routeResolver.ts
  searchRepository.ts
  referenceRepository.ts
  assetRepository.ts
```

Responsibilities:

```ts
// repository.ts
export async function listEntities(kind: EntityKind): Promise<EntityCatalogRecord[]>;

export async function getEntityDetail(ref: EntityRef): Promise<EntityDetailRecord>;

export async function resolveEntityRoute(
  kind: EntityKind,
  routeToken: string
): Promise<RouteResolution>;

export async function getEntitySummary(ref: EntityRef): Promise<EntitySummary>;

export async function getRelationships(id: EntityId): Promise<EntityRelationships>;
```

Use simple promise caches:

```ts
const catalogCache = new Map<EntityKind, Promise<EntityCatalogRecord[]>>();
const detailCache = new Map<string, Promise<EntityDetailRecord>>();
```

Do not add a server-state library just to read static JSON. Static `import.meta.glob` plus promise caches are enough for now.

TanStack Query becomes attractive later if you introduce real remote server state, invalidation, refetching, mutations, or account-backed data. Its official positioning is around async/server-state fetching, caching, updating, and synchronization, which is not the main problem while the product is static generated JSON. ([tanstack.com][2])

### 6.2 Feature folders

Recommended frontend structure:

```text
src/
  data/
    public-v3/
      manifest.json
      catalogs/
      records/
      indexes/
      metadata/

  data-access/
    public-data/
      contract.ts
      schemas.ts
      loaders.ts
      repository.ts
      routeResolver.ts
      searchRepository.ts
      referenceRepository.ts
      assetRepository.ts
      cache.ts

  domain/
    entities/
      types.ts
      display.ts
      description.ts

  features/
    database/
      routes.tsx
      DatabaseLayout.tsx
      browse/
        DatabaseBrowsePage.tsx
        entityBrowseRegistry.ts
        useEntityBrowseController.ts
      detail/
        DbDetailModalHost.tsx
        dbDetailRegistry.tsx
        DbDetailShell.tsx
        AwakenerDetailBody.tsx
        WheelDetailBody.tsx
        PosseDetailBody.tsx
        CovenantDetailBody.tsx

    builder/
      BuilderPage.tsx
      useBuilderViewModel.ts
      builderMigrations.ts

    collection/
      CollectionPage.tsx
      useCollectionViewModel.ts
      collectionMigrations.ts

  stores/
    dbDetailStore.ts
    collectionOwnershipStore.ts
    builderDraftStore.ts
    preferencesStore.ts

  ui/
    modal/
    cards/
    filters/
    search/
```

### 6.3 Database routes

Stop hand-parsing pathname strings in page components.

React Router supports nested routes and child rendering through `Outlet`, so the database section should be represented as route structure rather than manual `pathname.split()` branching. ([reactrouter.com][3])

Target shape:

```tsx
<Route path="database" element={<DatabaseLayout />}>
  <Route index element={<DatabaseHomeRedirect />} />
  <Route path=":scope" element={<DatabaseBrowseRoute />} />
  <Route path=":scope/:entityRouteToken" element={<DatabaseDetailRoute />} />
</Route>
```

`DatabaseDetailRoute` resolves `:entityRouteToken` through the generated route index.

### 6.4 Browse controllers

Use one generic browse controller, configured by generated facet/search metadata:

```ts
type BrowseConfig = {
  scope: EntityScope;
  defaultSort: SortKey;
  searchIndex: SearchIndexName;
  facets: FacetConfig[];
  card: React.ComponentType<{ record: EntityCatalogRecord }>;
};
```

Entity-specific browse pages can still customize card rendering, but they should not each reinvent search, filters, route opening, and state serialization.

### 6.5 Zustand usage

Yes, use Zustand, but narrowly.

Zustand is a good fit for small cross-component client state because its API is hook-based and intentionally light. That does not mean it should become the generated-data cache or replace URL state. ([zustand.docs.pmnd.rs][4])

Use Zustand for:

```text
src/stores/dbDetailStore.ts
```

App-wide detail modal stack:

```ts
type DbDetailEntry = {
  ref: EntityRef;
  source: "database" | "builder" | "collection" | "reference";
  routeBound?: boolean;
};

type DbDetailStore = {
  stack: DbDetailEntry[];
  open: (entry: DbDetailEntry) => void;
  replace: (entry: DbDetailEntry) => void;
  close: () => void;
  closeAll: () => void;
};
```

```text
src/stores/collectionOwnershipStore.ts
```

Local ownership, persistence, migrations, derived selectors.

```text
src/stores/builderDraftStore.ts
```

Only after migrating builder identity to public IDs. Do not move the current name-based builder state into a global store unchanged.

```text
src/stores/preferencesStore.ts
```

UI preferences that span database, builder, and collection.

Do **not** use Zustand for:

| Do not store in Zustand          | Owner                                 |
| -------------------------------- | ------------------------------------- |
| Generated public data            | Repository promise cache.             |
| Current route params             | React Router.                         |
| Browse filters encoded in URL    | React Router/search params.           |
| Pure derived filtered lists      | `useMemo`/view model.                 |
| Component-local popover booleans | Component state unless cross-cutting. |

A common failure mode would be replacing a `DatabasePage.tsx` god component with a `dbStore.ts` god store. Avoid that.

---

## 7. Reusable DB detail-modal strategy

You need a detail system that works in four contexts:

```text
Database page
Builder
Collection
Future content surfaces
```

The current pattern is backwards: detail route/page ownership determines modal composition. Instead, detail viewing should be an app capability.

### 7.1 Modal host

Mount this once near the app root or database/layout root:

```tsx
<DbDetailModalHost />
```

The host reads from `dbDetailStore`, loads the detail record through the repository, and renders through a registry.

```ts
const dbDetailRegistry = {
  awakener: {
    load: (id) => getEntityDetail({ kind: "awakener", id }),
    render: AwakenerDetailBody,
    getTitle: getAwakenerTitle,
    getActions: getAwakenerActions
  },
  wheel: {
    load: (id) => getEntityDetail({ kind: "wheel", id }),
    render: WheelDetailBody
  },
  posse: {
    load: (id) => getEntityDetail({ kind: "posse", id }),
    render: PosseDetailBody
  },
  covenant: {
    load: (id) => getEntityDetail({ kind: "covenant", id }),
    render: CovenantDetailBody
  }
};
```

### 7.2 Shared shell

The shell owns:

```text
Modal chrome
Focus trap / escape behavior
Back/close behavior
Reference-click stack behavior
Art viewer
Settings popovers
Formula/reference context
Common action slot
```

Detail bodies own only rendering:

```tsx
function WheelDetailBody({
  detail,
  summary,
  context,
  actions
}: DbDetailBodyProps<WheelDetailRecord>) {
  return ...
}
```

### 7.3 Context-aware opening

Use one API everywhere:

```ts
openDbDetail({
  ref: { kind: "wheel", id: "wheel-0001" },
  source: "builder"
});
```

Behavior:

| Source                        | Behavior                            |
| ----------------------------- | ----------------------------------- |
| Database browse               | Opens detail and updates URL.       |
| Database direct URL           | Opens same detail host route-bound. |
| Builder                       | Opens modal in place, no page jump. |
| Collection                    | Opens modal in place, no page jump. |
| Reference inside modal        | Pushes onto modal stack.            |
| Explicit “view database page” | Navigates to canonical route.       |

This avoids the builder/collection future problem entirely.

### 7.4 Reference clicks

Reference rendering should emit `EntityRef`, not route strings:

```ts
onReferenceClick(ref: EntityRef) {
  openDbDetail({ ref, source: "reference" });
}
```

The route is derived only when the user asks to navigate.

---

## 8. Package/dependency recommendations

### Keep

| Package/tool          | Recommendation                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Zod**               | Keep for runtime validation at the public-data boundary. Use it at repository load points, not inside every component.        |
| **Fuse.js**           | Keep short-term for local fuzzy search. Move searchable documents to generated JSON first; only replace Fuse after profiling. |
| **Zustand**           | Use deliberately for modal stack, ownership, builder draft, and cross-surface preferences.                                    |
| **React Router**      | Use its nested routes/params instead of pathname parsing.                                                                     |
| **Vite import globs** | Keep for static JSON/assets, but drive them from generated manifests.                                                         |

### Do not add now

| Package                        | Why not now                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query**             | Not necessary for static generated JSON. Add when real remote server state, refetching, mutations, or account sync exists. |
| **XState**                     | Overkill for this scope. Modal stack and builder draft do not need formal statecharts yet.                                 |
| **Jotai/Recoil/Redux**         | Would only create state ownership confusion. Zustand is already present and sufficient.                                    |
| **Dexie/IndexedDB libraries**  | LocalStorage is enough unless builder/collection data becomes large or offline-first.                                      |
| **Effect-style frameworks**    | Too much architecture weight for this product stage.                                                                       |
| **Search backend/client SDKs** | Premature. Generate better local search docs first.                                                                        |

### Maybe later

| Package/tool                      | Trigger                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **TanStack Query**                | Backend/user accounts/server search.                                                                           |
| **MiniSearch/FlexSearch**         | Only if generated search indexes become large and Fuse is profiled as slow.                                    |
| **Pydantic or msgspec in Python** | Only if stdlib validators become too painful. Right now the Python tooling intentionally has few dependencies. |

The key package rule: adopt one tool for one clear ownership problem. Do not use packages to paper over a bad data boundary.

---

## 9. Proposed repo/module ownership

### 9.1 Private Python tooling repo

Recommended structure:

```text
MomenTB-Tools/
  src/momentb_tools/
    extraction/
      ...
    discovery/
      ...
    approval/
      ...
    normalize/
      ...

    compile/
      internal_model.py
      relationships.py

    public_contract/
      ids.py
      entity_ref.py
      schemas.py
      validation.py
      manifest.py

    projectors/
      awakeners.py
      wheels.py
      posses.py
      covenants.py
      relics.py
      skills.py
      talents.py
      overlays.py
      awakener_builds.py

    indexes/
      entity_index.py
      route_index.py
      search_index.py
      reference_index.py
      relationship_index.py
      asset_index.py
      facet_index.py
      collection_catalog.py
      builder_catalog.py

    exporters/
      public_v3_bundle.py
      hashes.py
      safety_scan.py

  tests/
    public_contract/
      test_public_ids.py
      test_manifest.py
      test_schema_shapes.py
      test_relationship_integrity.py
      test_route_index.py
      test_search_index.py
      test_reference_index.py
      test_asset_index.py
      test_collection_catalog.py
      test_builder_catalog.py
      test_no_private_leaks.py
```

The Python repo should own:

```text
Public IDs
Aliases
Route slugs and redirects
Search docs
Reference tokens
Filter/facet values and order
Relationship graph
Asset manifest
Collection catalog
Builder catalog
Detail projections
Public schema validation
Public bundle manifest/hashes
```

### 9.2 Frontend repo

Recommended structure:

```text
frontend/src/
  data/public-v3/
    ...

  data-access/public-data/
    contract.ts
    schemas.ts
    ids.ts
    manifest.ts
    loaders.ts
    repository.ts
    routeResolver.ts
    searchRepository.ts
    referenceRepository.ts
    assetRepository.ts
    cache.ts

  features/database/
    routes.tsx
    DatabaseLayout.tsx
    browse/
    detail/

  features/builder/
    ...

  features/collection/
    ...

  stores/
    dbDetailStore.ts
    collectionOwnershipStore.ts
    builderDraftStore.ts
    preferencesStore.ts

  domain/entities/
    descriptionRendering.ts
    displayFormatting.ts
```

The frontend should own:

```text
Rendering
URL state
Modal state
User state
Search ranking
Filtering interaction
Local persistence
Builder draft behavior
Collection interactions
```

It should not own public data compilation.

---

## 10. Migration roadmap that avoids doing work twice

### Phase 0 — Stop digging

Do not broadly refactor `DatabasePage.tsx` yet. Do not polish legacy adapters beyond immediate correctness. Do not add new packages.

Keep only short-term stabilization that prevents bad runtime behavior.

### Phase 1 — P0 stabilization only

Do these current-plan items, but narrowly:

1. Replace eager posse/covenant full aggregate imports with lazy per-record loaders.
2. Fix covenant hydration so all set effects are available, not only the first effect.
3. Strengthen posse/covenant schemas enough to match current UI assumptions.
4. Add a test that fails if feature code imports `src/data/public-v2/full/*.json` aggregates directly.
5. Remove or quarantine the unsafe numeric owner bridge where practical.

This is stabilization, not architecture completion.

### Phase 2 — Write the `public-v3` contract

Create an ADR/spec before writing much code:

```text
public-v3-contract.md
```

It should define:

```text
EntityRef
ID patterns
Manifest shape
Catalog shape
Detail shape
Route index
Search index
Reference index
Relationship index
Facet index
Asset index
Builder catalog
Collection catalog
Safety rules
Versioning rules
```

This is the highest-leverage work.

### Phase 3 — Generate indexes before rewriting UI

In the Python tooling, generate these first:

```text
manifest.json
indexes/entities.json
indexes/routes.json
indexes/assets.json
indexes/references.json
indexes/relationships.json
indexes/facets.json
```

Even if some records are still v2-shaped internally, the indexes will force identity and route clarity.

### Phase 4 — Add frontend repository façade

Create `src/data-access/public-data`.

Initially it can read `public-v3` where available and fall back to `public-v2` where not. The important thing is to stop page/components from importing generated JSON directly.

### Phase 5 — Migrate database browse by scope

Migrate in this order:

1. Covenants
2. Posses
3. Wheels
4. Awakeners

Reason: covenants and posses are smaller and expose the modal/reference/asset problems without the full awakener complexity.

### Phase 6 — Introduce reusable detail modal host

Build the `DbDetailModalHost` and registry. Wire database detail routes to it first, then builder and collection.

Do not create separate builder detail modals.

### Phase 7 — Migrate builder identity

Change builder team state from name-based to ID-based:

```ts
type TeamSlot = {
  awakenerId?: string;
  wheels: [string | null, string | null];
  covenantId?: string;
};
```

Keep a migration from `awakenerName` to `awakenerId` using the generated entity/alias index.

### Phase 8 — Migrate collection ownership

Move ownership to a Zustand store and generated collection catalog.

LocalStorage should store user deltas keyed by public IDs, not frontend-derived identity groups.

### Phase 9 — Delete legacy adapters and aggregate helpers

Delete or retire:

```text
awakeners-lite-v2.ts
posses-full-v2.ts
covenants-full-v2.ts
wheels-full-v2.ts
frontend-derived slug helpers
frontend-derived asset stem mapping
frontend-built global reference stubs
unsafe numeric owner adapters
```

### Phase 10 — Then clean up `DatabasePage.tsx`

Only after the repository and modal host exist should you split the database page into a generic route/layout plus entity registry. Otherwise you will refactor the same code twice.

---

## 11. Current deslop plan: keep, replace, or defer

| Current plan item                                                   | Recommendation                                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Task 1: Lazy Typed Artifact Full Records**                        | Keep as P0 stabilization, but do not over-invest in v2 adapter polish.            |
| **Task 2: URL-Backed Simple Artifact Browse State**                 | Defer/reframe. Generic browse should use generated facet/search metadata.         |
| **Task 3: Single Database Route And Page Controller Pass**          | Defer. Do this after route index and detail host exist.                           |
| **Task 4: Shared Search Utilities And Covenant Search Correctness** | Fix correctness if needed, but broader search docs should be generated by Python. |
| **Task 5: Simple Artifact Modal And Reference Scope**               | Replace with shared DB detail modal host/registry.                                |
| **Task 6: Shared Detail State Store And Effect Cleanup**            | Keep concept, but scope it to `dbDetailStore`, not a broad global database store. |
| **Task 7: Overlay Icon Loading Resource**                           | Reframe under generated asset manifest.                                           |
| **Task 8: Legacy Public-V2 And Awakener Domain Cleanup**            | Do after v3 consumers land, not before.                                           |

The big warning: do not spend serious time making the current frontend compiler prettier. Move the compiler responsibilities back to Python.

---

## 12. Tests and contracts

### 12.1 Python export gates

Add tests that fail the export if any of these are false:

| Test                                                                                      | Purpose                                  |
| ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| Public IDs are unique and match patterns                                                  | Prevent identity drift.                  |
| Public ID maps are stable/append-only                                                     | Prevent accidental breaking renumbering. |
| Every relationship target exists                                                          | Prevent broken modal/reference links.    |
| Every reverse relationship is consistent                                                  | Prevent stale graph projections.         |
| Every catalog record has a detail chunk                                                   | Prevent browse/detail mismatch.          |
| Manifest counts/hashes match emitted files                                                | Prevent partial exports.                 |
| Route slugs are unique per scope                                                          | Prevent ambiguous routes.                |
| Redirect slugs resolve to one canonical entity                                            | Preserve old links safely.               |
| Search docs target existing entities                                                      | Prevent dead search results.             |
| Reference tokens target existing entities or are explicitly ambiguous                     | Prevent silent wrong links.              |
| Asset manifest entries resolve to actual website asset files or explicit missing statuses | Prevent filename-convention bugs.        |
| Forbidden private keys do not appear anywhere in public output                            | Prevent raw/source/debug leakage.        |
| Builder catalog IDs all exist                                                             | Prevent invalid builder options.         |
| Collection catalog IDs all exist                                                          | Prevent invalid ownership state.         |
| Facet values are valid and ordered                                                        | Prevent frontend enum hacks.             |
| Generated TypeScript/JSON schema snapshots match expected shape                           | Prevent accidental contract drift.       |

### 12.2 Frontend gates

Add tests that fail if:

| Test                                                                      | Purpose                                    |
| ------------------------------------------------------------------------- | ------------------------------------------ |
| Feature code imports full aggregate JSON directly                         | Prevent regression to eager loading.       |
| Repository validates manifest/catalog/detail fixtures                     | Protect boundary.                          |
| Route resolver handles canonical IDs, canonical slugs, and redirect slugs | Protect deep links.                        |
| Modal host opens from database, builder, and collection contexts          | Protect reuse.                             |
| Reference click pushes modal stack instead of forcing page navigation     | Protect in-context detail.                 |
| Builder migration maps `awakenerName` to `awakenerId`                     | Protect saved teams.                       |
| Collection ownership migration preserves IDs/groups                       | Protect user data.                         |
| Search smoke tests use generated docs                                     | Prevent frontend search-field reinvention. |
| Asset resolver uses generated manifest keys                               | Prevent stem-convention fallback creep.    |

Also add a lint-like architectural test: generated JSON may be imported only by `src/data-access/public-data/**` and test fixtures. Components should not import it directly.

---

## 13. Performance and future backend/server-cost choices

For the static site now:

| Choice       | Recommendation                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Initial data | Load manifest + active scope catalog only.                                                            |
| Detail data  | Lazy load per-record chunks.                                                                          |
| Search       | Lazy load per-scope search index.                                                                     |
| References   | Load small global reference index, or split by scope if it grows.                                     |
| Assets       | Use generated asset manifest and lazy image loading.                                                  |
| Caching      | Use content-hashed assets/JSON where possible. Manifest can be short-cache; chunks can be long-cache. |
| Prefetch     | Prefetch detail chunks on hover or visible cards if useful.                                           |
| Aggregates   | Keep full aggregates out of frontend runtime imports. They can exist for tooling/audit only.          |

For a later backend:

Do **not** put public static game data behind dynamic API calls just because a backend exists. Keep public data as versioned static bundles on a CDN. A backend should initially own only user-specific data: accounts, synced collection, saved builder teams, preferences, maybe private notes.

If search eventually becomes too large for the client, add a backend search endpoint keyed by the same public IDs and generated search docs. Do not redesign identity for the backend.

Future backend shape:

```text
CDN/static:
  public-v3 manifest/catalogs/records/indexes/assets

Backend:
  users
  ownership deltas
  saved teams
  preferences
  optional search endpoint
  optional comments/notes/social features
```

User data should store deltas:

```json
{
  "userId": "user-123",
  "dataVersion": "public-v3-build-id",
  "ownership": {
    "awakener-0001": { "owned": true, "level": 60 },
    "wheel-0001": { "owned": true, "copies": 2 }
  }
}
```

This keeps hosting cheap and avoids server joins for public content.

---

## 14. Risk register

| Risk                                                  | Severity | Mitigation                                                                                                           |
| ----------------------------------------------------- | -------: | -------------------------------------------------------------------------------------------------------------------- |
| `public-v3` becomes overbuilt before UI value appears |     High | Start with manifest, entity IDs, routes, assets, and two small scopes: covenants/posses.                             |
| Saved builder teams break during name-to-ID migration |     High | Add explicit migration using generated alias/entity index. Keep old field read-only during transition.               |
| Route renames break deep links                        |     High | Generated redirect slug map; tests for old slug resolution.                                                          |
| Frontend keeps both v2 and v3 forever                 |     High | Set deletion milestones per scope. Ban new v2 imports.                                                               |
| Asset manifest misses files                           |   Medium | Python export test plus frontend resolver test.                                                                      |
| Reference aliases link wrong entity                   |   Medium | Ambiguity report; no silent first-wins behavior.                                                                     |
| Zustand becomes a dumping ground                      |   Medium | Only use it for cross-surface client state; generated data stays in repository cache.                                |
| Search index grows too large                          |   Medium | Split search indexes per scope; lazy load active scope.                                                              |
| Backend work starts too early                         |   Medium | Keep public data static; backend only for user data when needed.                                                     |
| Package creep                                         |   Medium | Require each dependency to have one named owner and one named problem.                                               |
| Weak schemas persist                                  |     High | Contract tests in Python and repository validation in frontend.                                                      |
| Detail modal stack becomes route-inconsistent         |   Medium | Define source behavior: database route-bound, builder/collection overlay-only, explicit canonical navigation action. |

---

## 15. Concrete “do this next” tasks

1. **Write the `public-v3` contract ADR.**
   Define `EntityRef`, ID patterns, route index, search docs, reference index, relationship index, asset manifest, catalog/detail split, builder catalog, collection catalog, manifest, and safety rules.

2. **Patch only the P0 v2 frontend issues.**
   Remove eager posse/covenant aggregate imports, switch hydration to per-record loaders, fix covenant set-effect hydration, strengthen schemas, and add a test that blocks future aggregate imports from feature code.

3. **Generate the first v3 indexes in Python.**
   Start with:

   ```text
   manifest.json
   indexes/entities.json
   indexes/routes.json
   indexes/assets.json
   indexes/references.json
   indexes/relationships.json
   indexes/facets.json
   ```

   Do this before more frontend page cleanup.

4. **Create the frontend public-data repository.**
   Add one import boundary under `src/data-access/public-data`. Components and feature hooks should call repository functions, not import JSON.

5. **Migrate covenants and posses first.**
   They are small enough to prove the route, asset, reference, catalog, and detail model without the awakener complexity.

6. **Build `DbDetailModalHost` and `dbDetailStore`.**
   Make database, builder, and collection open the same detail modal by `{kind, id}`.

7. **Move builder from `awakenerName` to `awakenerId`.**
   Add a migration using generated aliases. Do not globalize the current name-based builder state.

8. **Move collection ownership to a proper store.**
   Use generated collection catalog plus local user deltas. Add migration tests.

9. **Delete legacy adapters once each scope migrates.**
   Remove `*-full-v2` aggregate helpers, duplicate awakener lite adapters, frontend slug generation, and unsafe numeric owner conversions.

10. **Only then split `DatabasePage.tsx`.**
    The final page cleanup should be a registry/nested-route cleanup over the new data boundary, not a prettier version of the current frontend compiler.

[1]: https://www.fusejs.io/fuzzy-search.html?utm_source=chatgpt.com "Fuzzy Search"
[2]: https://tanstack.com/query/latest/docs/framework/react/overview?utm_source=chatgpt.com "Overview | TanStack Query React Docs"
[3]: https://reactrouter.com/start/declarative/routing?utm_source=chatgpt.com "Routing"
[4]: https://zustand.docs.pmnd.rs/?utm_source=chatgpt.com "Zustand: Introduction"
