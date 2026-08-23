# Dastkari Chikan — Storefront

A full HTML/CSS/JS storefront (home, catalog, product pages, cart drawer,
checkout, order confirmation, account) backed by a real **MedusaJS**
backend in [`backend/`](backend) — real products, cart, checkout/orders
and customer accounts. Payment stays a front-end simulation on top of a
real order (see the on-page notice in checkout).

## Running it locally

Two things need to be running: the Medusa backend, and this static
frontend.

**1. Backend** (needs Node 20+/22+ and PostgreSQL — see
[`backend/AGENTS.md`](backend/AGENTS.md) for the full layout):

```bash
cd backend
npm run backend:dev
# Medusa on http://localhost:9000, admin dashboard at /app
```

The first run seeds the catalog from `data/products.json` automatically
(see `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`)
and prints a publishable API key — [`js/api.js`](js/api.js) already has
a matching dev key wired in as its fallback, alongside `MEDUSA_URL`.
Change those two constants if you point local dev at a different
backend. In production these are overridden via `window.__ENV__` — see
[Deployment](#deployment-render) below.

**2. Frontend** — this site uses `fetch()` to load `partials/*.html`
(header/footer/cart drawer), which browsers block when a page is opened
directly as a `file://` URL. Serve it over local HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Any static server works — `npx serve`, VS Code's "Live Server", etc.)

## Pages

| Page                     | Purpose |
|--------------------------|---------|
| `index.html`             | Home — hero, new-arrivals carousel, shop-by-stitch, brand story, testimonials, newsletter |
| `shop.html`               | Catalog — filters (category, stitch/collection, colour, size, price), sort, pagination |
| `product.html?slug=...`  | Product detail — gallery, variants, add to bag / buy now, related products |
| `checkout.html`          | Contact, shipping address, shipping method, payment (demo), order summary |
| `order-confirmation.html`| Thank-you page for the order just placed |
| `account.html`           | Dummy sign in / sign up + order history |

## `js/api.js` — the one file that talks to the backend

Every page talks **only** to `window.Api` and `window.Cart` (both defined
in `js/api.js`) — nothing else touches the network or `localStorage`
directly.

| Feature   | Backed by |
|-----------|-----------|
| Product catalog | Medusa Store API (`GET /store/products`, `/store/collections`), cached client-side |
| Cart | A real Medusa cart; `js/api.js` keeps an optimistic local mirror so the UI updates instantly while it syncs in the background |
| Checkout totals / shipping / tax / promo codes | The real Medusa cart's totals — see `checkout.js` |
| Orders | Real Medusa orders (`POST .../complete`); order history via `GET /store/orders` |
| Auth | Real Medusa customer accounts (`/auth/customer/emailpass`) |
| Newsletter | Still a local `localStorage` stub — no Medusa equivalent; wire up Klaviyo/Mailchimp/your ESP here |

`data/products.json` is no longer read at runtime — it's kept as the
historical source the backend's seed script was transcribed from. Add,
edit or remove products via the Medusa admin dashboard (`/app`) or by
editing the seed script and reseeding.

## Adding real product photography

Right now every image slot renders a **"pattern card"** — a placeholder
that shows the product's chikankari stitch name as line art, defined in
`js/main.js` (`STITCH_ICONS` / `patternCard()`). To swap in real photos:

1. Add product images in the Medusa admin dashboard (`/app` → a
   product's Media section), or via the seed script's `images` field.
2. In `js/main.js` (`productCardHTML`) and `js/product.js`
   (`renderPDP`'s gallery block), replace the `patternCard(...)` calls
   with an `<img src="${p.images[0]}">` — `js/api.js`'s `mapProduct`
   would need a matching `images` field added to what it reads back.

Everything else (cart, checkout, filters) is already keyed off product
`id`/`slug`, so this is a purely visual swap.

## Editing the catalog

Add, edit, or remove products via the Medusa admin dashboard (`/app`),
or edit `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`
and reseed against a fresh database. `data/products.json` is not read at
runtime — it only documents the original catalog the seed script was
transcribed from.

## Instagram

`instagram.com/dastkari_chikan` is linked from the footer. Note that
Instagram blocks automated scraping and serves photos from expiring,
signed CDN URLs — so this site can't pull your posts in automatically.
Export/download your photos from Instagram yourself and drop them into
`assets/products/` (see above) when you're ready.

## Deployment (Render)

**Live**: backend at [shahnisa-backend.onrender.com](https://shahnisa-backend.onrender.com) (Singapore), frontend at [shahnisa.onrender.com](https://shahnisa.onrender.com). Database is a free Neon Postgres project (not on Render).

Two Render services, deployed from this repo:

**Backend** — Web Service, root directory `backend`, Node.

| | |
|---|---|
| Build command | `npm install && npm run build --workspace=@dtc/backend && cd apps/backend/.medusa/server && npm install` |
| Start command | `cd apps/backend/.medusa/server && npx medusa db:migrate && npm run start` |
| Env vars | `DATABASE_URL` (Postgres), `JWT_SECRET`, `COOKIE_SECRET`, `AUTH_MFA_ENCRYPTION_KEY`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `NODE_VERSION` |

`medusa db:migrate` also runs any script under `src/migration-scripts/`
(e.g. `initial-data-seed.ts`) exactly once, tracked in the database —
safe to redeploy or point a new Render service at the same database
without reseeding. No Redis is configured — Medusa falls back to its
in-memory event bus/cache/locking modules, which is fine for a single
instance; add `REDIS_URL` if this ever scales to multiple instances.

The very first deploy's seed run prints a publishable API key in the
logs — that's the `MEDUSA_PUBLISHABLE_KEY` the frontend needs (see
below). The admin dashboard is at `<backend-url>/app`.

Render's free plan doesn't allow one-off Jobs, so there's no
`medusa user -e -p` post-deploy step to run for the first admin login —
that account was created once via a temporary bootstrap API route
(see the "Add/Remove temporary admin-bootstrap route" commits). To add
more admins later, either use the Medusa Admin dashboard's own invite
flow (once logged in) or run `npx medusa user -e ... -p ...` from a
local checkout against the production `DATABASE_URL`.

**Frontend** — Static Site, root directory `.` (repo root).

| | |
|---|---|
| Build command | `node scripts/render-frontend-build.mjs` |
| Publish directory | `dist` |
| Env vars | `MEDUSA_URL` (the backend's Render URL), `MEDUSA_PUBLISHABLE_KEY` (from the seed job above) |

The build script ([`scripts/render-frontend-build.mjs`](scripts/render-frontend-build.mjs))
copies the site's pages/assets into `dist/` and writes `dist/env-config.js`
from those two env vars — that's what `js/api.js` reads at runtime
instead of its localhost fallback (see `window.__ENV__` near the top of
that file). Once both services are up, set the backend's `STORE_CORS` /
`ADMIN_CORS` / `AUTH_CORS` to the frontend's real `onrender.com` URL and
redeploy.

## What's still a placeholder / demo

- **Checkout does not process real payments** — it's a front-end
  simulation on top of a real Medusa order (paid via the `pp_system_default`
  manual provider). Wire up Razorpay, Stripe, or similar before accepting
  real orders.
- **Newsletter** is still a `localStorage` stub — no Medusa equivalent.
- Real product photography and transactional email are also not wired up
  (see above).
