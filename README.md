# Dastkari Chikan — Storefront

A full HTML/CSS/JS storefront (home, catalog, product pages, cart drawer,
checkout, order confirmation, account) built as a static site with a
**dummy backend** you can swap for a real one later.

## Running it locally

This site uses `fetch()` to load `partials/*.html` (header/footer/cart
drawer) and `data/products.json`, which browsers block when a page is
opened directly as a `file://` URL. Serve it over local HTTP instead:

```bash
cd dastkari
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

## The "dummy backend" — `js/api.js`

Every page talks **only** to `window.Api` and `window.Cart` (both defined
in `js/api.js`) — nothing else touches `localStorage` or the JSON file
directly. That means swapping in a real backend is a matter of editing
the *inside* of the functions in this one file; every other file stays
the same.

Current stand-ins:

| Feature   | Dummy implementation | Replace with |
|-----------|----------------------|--------------|
| Product catalog | `data/products.json`, fetched once and cached | `GET /api/products` |
| Cart | `localStorage`, this browser only | A cart API / session, or keep client-side if you prefer |
| Orders | `localStorage`, fake `DC######` order IDs | `POST /api/orders`, real order IDs |
| Auth | `localStorage`, accepts any email/password | Real auth (sessions, JWT, etc.) |
| Newsletter | `localStorage` list | Klaviyo / Mailchimp / your ESP |

Each function in `api.js` has a `// TODO` comment showing the real
`fetch()` call it's standing in for.

## Adding real product photography

Right now every image slot renders a **"pattern card"** — a placeholder
that shows the product's chikankari stitch name as line art, defined in
`js/main.js` (`STITCH_ICONS` / `patternCard()`). To swap in real photos:

1. Add an `images: ["/assets/products/xyz-front.jpg", ...]` array to each
   product in `data/products.json`.
2. In `js/main.js` (`productCardHTML`) and `js/product.js`
   (`renderPDP`'s gallery block), replace the `patternCard(...)` calls
   with an `<img src="${p.images[0]}">`.

Everything else (cart, checkout, filters) is already keyed off product
`id`/`slug`, so this is a purely visual swap.

## Editing the catalog

Add, edit, or remove products directly in `data/products.json` — no
code changes needed. Each product needs: `id`, `slug` (used in the PDP
URL), `name`, `category`, `collection` (must match an id in the
`collections` array), `stitch`, `fabric`, `price`, optional `compareAt`,
`isNew`, `colors[]`, `sizes[]`, `rating`, `reviews`, `description`,
`care`, `artisanNote`.

## Instagram

`instagram.com/dastkari_chikan` is linked from the footer. Note that
Instagram blocks automated scraping and serves photos from expiring,
signed CDN URLs — so this site can't pull your posts in automatically.
Export/download your photos from Instagram yourself and drop them into
`assets/products/` (see above) when you're ready.

## What's still a placeholder / demo

- **Checkout does not process real payments** — it's a front-end
  simulation only (see the on-page notice). Wire up Razorpay, Stripe,
  or similar before accepting real orders.
- **Account system** accepts any email/password — no real auth.
- **Newsletter, orders, cart** all live in this browser's `localStorage`
  only — clearing browser data clears them.
