# SKeyDB Cloudflare Pages Cutover Note

Last updated: 2026-05-17

## Why this exists

- Preserve the exact deployment strategy for moving `skeydb.com` from the temporary Cloudflare Worker GitHub Pages bridge to Cloudflare Pages.
- Keep `https://dansa.github.io/SKeyDB/` working as the compatibility origin for browser-storage migration.
- Avoid launching the user-facing domain move notice before Cloudflare Pages owns the production hostname.

## Current state

- Cloudflare account: `07e4deba458fcc5376076d42d3a5cc94`.
- Zone: `skeydb.com`, zone ID `05e89f7d858dfe19c93308f23b1623f7`, active full setup.
- There is no SKeyDB Cloudflare Pages project yet. Existing Pages projects in the account are unrelated.
- Current Worker routes:
  - `471a2ab3895a4a85b54a02f561ffa836`: `skeydb.com/*` -> `skeydb-github-pages-bridge`
  - `e1d98114bdd5494db0881018d1caae34`: `www.skeydb.com/*` -> `skeydb-github-pages-bridge`
- Current DNS is still GitHub Pages oriented:
  - Apex `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, proxied.
  - Apex `AAAA` records to `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`, proxied.
  - `www.skeydb.com` `CNAME` to `dansa.github.io`, proxied.
- Header check on 2026-05-17 confirms apex is still the bridge: `X-SKeyDB-Bridge: github-pages`, with GitHub/Fastly cache headers.
- `www.skeydb.com` currently redirects to `https://skeydb.com/`.

## Cloudflare Pages project settings

- Product: Cloudflare Pages, Git-connected project.
- Project name: `skeydb`.
- Repository: `dansa/SKeyDB`.
- Production branch: `main`.
- Root directory: `/`.
- Framework preset: React (Vite), or manual settings equivalent to the preset.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Compatibility flags, Functions, D1, KV, and Pages Functions: none for this cutover.

Production environment variables:

```text
NODE_VERSION=22.16.0
VITE_BASE_PATH=/
VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=0
```

Preview environment variables:

```text
NODE_VERSION=22.16.0
VITE_BASE_PATH=/
VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=0
```

Set `VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=1` only after the Pages production deployment, apex custom domain, and `www` redirect have been verified. The migration routes can ship earlier with the notice disabled.

References:

- Cloudflare Pages build config: `https://developers.cloudflare.com/pages/configuration/build-configuration/`
- Cloudflare Pages build image / `NODE_VERSION`: `https://developers.cloudflare.com/pages/configuration/build-image/`
- Cloudflare Pages custom domains: `https://developers.cloudflare.com/pages/configuration/custom-domains/`
- Cloudflare Pages `www` apex redirect: `https://developers.cloudflare.com/pages/how-to/www-redirect/`
- Cloudflare Workers routes: `https://developers.cloudflare.com/workers/configuration/routing/routes/`

## GitHub Pages compatibility settings

- Keep `.github/workflows/deploy-pages.yml` building from `main` with `VITE_BASE_PATH=/SKeyDB/`.
- The legacy migration export URL remains `https://dansa.github.io/SKeyDB/#/migrate/export`.
- The optional GitHub repository variable `VITE_ENABLE_DOMAIN_MIGRATION_NOTICE` controls whether the old-origin notice appears in the GitHub Pages build.
- Leave that GitHub variable unset or `0` until Cloudflare Pages is live and verified.

## Cutover sequence

1. Create the `skeydb` Cloudflare Pages project from `dansa/SKeyDB` with the settings above.
2. Deploy a production build with `VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=0`.
3. Verify the Pages deployment on its `*.pages.dev` URL for build correctness only. Do not publish `*.pages.dev` as a migration target because it is a separate browser-storage origin.
4. Add `skeydb.com` as the Pages custom domain.
5. If Cloudflare cannot activate the apex custom domain while the GitHub Pages apex records exist, perform the DNS replacement during the cutover window: remove the GitHub Pages apex `A`/`AAAA` records and let Pages create or point the apex record to the Pages project.
6. Configure `www.skeydb.com` as an apex redirect with Cloudflare Bulk Redirects:
   - Source: `www.skeydb.com`
   - Target: `https://skeydb.com`
   - Status: `301`
   - Preserve query string, subpath matching, preserve path suffix, include subdomains.
   - DNS: proxied `A` record, name `www`, content `192.0.2.1`, replacing the current `CNAME` to `dansa.github.io`.
7. Remove the Worker routes once Pages and DNS are ready to own the hostnames:
   - Delete route `471a2ab3895a4a85b54a02f561ffa836`.
   - Delete route `e1d98114bdd5494db0881018d1caae34`.
   - This matters because Worker routes execute for matching URL patterns and can take precedence on the same hostname.
8. Verify production:
   - `https://skeydb.com/` returns `200`.
   - Response no longer includes `X-SKeyDB-Bridge`, `x-github-request-id`, `x-fastly-request-id`, or `Via: 1.1 varnish`.
   - Asset URLs are rooted at `/assets/...`, not `/SKeyDB/assets/...`.
   - `https://www.skeydb.com/path?x=1` returns `301` to `https://skeydb.com/path?x=1`.
   - `https://dansa.github.io/SKeyDB/#/migrate/export` still loads.
   - `https://skeydb.com/#/migrate` can open the legacy export route and import storage.
9. After verification, enable launch messaging:
   - Cloudflare Pages production env: set `VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=1`, redeploy production.
   - GitHub repository variable: set `VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=1`, rerun the GitHub Pages deployment.

## Rollback

- If Pages activation fails before route removal, keep the Worker routes and GitHub Pages DNS records in place.
- If failure occurs after cutover, restore the two Worker routes to `skeydb-github-pages-bridge` and restore the GitHub Pages DNS records listed in Current state.
- Keep `VITE_ENABLE_DOMAIN_MIGRATION_NOTICE=0` during rollback so users do not see launch messaging for an unready hostname.

## Watchpoints

- Do not add Cloudflare Pages Functions, D1, KV, Better Auth, or server-side transfer endpoints in this cutover.
- Do not make `www.skeydb.com` serve the app directly; redirect it to apex to avoid a separate `localStorage` bucket.
- Do not enable the notice on either GitHub Pages or Cloudflare Pages until the apex and `www` behavior is verified.
- Do not change the GitHub Pages base path; `VITE_BASE_PATH=/SKeyDB/` is what keeps the compatibility route alive.
