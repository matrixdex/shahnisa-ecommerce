/* ============================================================
   DASTKARI CHIKAN — api.js
   ------------------------------------------------------------
   This is the ONE file that stands in for your real backend.
   Every page calls functions on `window.Api` and `window.Cart` —
   nothing else in the codebase touches localStorage or the JSON
   file directly. When your real backend is ready, replace the
   internals of the functions below with real `fetch()` calls to
   your API. Nothing else in the site needs to change.

   Current "dummy backend":
   - Product catalog  -> data/products.json (static file)
   - Cart / sessions   -> localStorage (this browser only)
   - Orders            -> localStorage, fake order IDs
   - Auth              -> localStorage, no real password checking
   ============================================================ */

(function () {
  const LATENCY = 260; // ms — simulated network delay, remove once real API is live

  function delay(value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
  }

  let _catalogCache = null;
  async function loadCatalog() {
    if (_catalogCache) return _catalogCache;
    // TODO: replace with `const res = await fetch('/api/products'); const data = await res.json();`
    const res = await fetch('data/products.json');
    _catalogCache = await res.json();
    return _catalogCache;
  }

  function money(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  /* ── Products ──────────────────────────────────────────── */
  const Api = {
    money,

    async getProducts(filters = {}) {
      const data = await loadCatalog();
      let items = [...data.products];

      if (filters.category) items = items.filter(p => p.category === filters.category);
      if (filters.collection) items = items.filter(p => p.collection === filters.collection);
      if (filters.stitch) items = items.filter(p => p.stitch === filters.stitch);
      if (filters.color) items = items.filter(p => p.colors.includes(filters.color));
      if (filters.size) items = items.filter(p => p.sizes.includes(filters.size));
      if (filters.maxPrice != null) items = items.filter(p => p.price <= filters.maxPrice);
      if (filters.minPrice != null) items = items.filter(p => p.price >= filters.minPrice);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.stitch.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q)
        );
      }

      switch (filters.sort) {
        case 'price-asc': items.sort((a, b) => a.price - b.price); break;
        case 'price-desc': items.sort((a, b) => b.price - a.price); break;
        case 'rating': items.sort((a, b) => b.rating - a.rating); break;
        case 'newest': items.sort((a, b) => (b.isNew === a.isNew) ? 0 : b.isNew ? 1 : -1); break;
        default: break; // 'featured' — catalog order
      }
      return delay(items);
    },

    async getProductBySlug(slug) {
      const data = await loadCatalog();
      return delay(data.products.find(p => p.slug === slug) || null);
    },

    async getCollections() {
      const data = await loadCatalog();
      return delay(data.collections);
    },

    async getRelated(product, limit = 4) {
      const data = await loadCatalog();
      const items = data.products
        .filter(p => p.id !== product.id && (p.collection === product.collection || p.category === product.category))
        .slice(0, limit);
      return delay(items);
    },

    async getNewArrivals(limit = 8) {
      const data = await loadCatalog();
      const items = data.products.filter(p => p.isNew).concat(data.products.filter(p => !p.isNew)).slice(0, limit);
      return delay(items);
    },

    /* ── Orders (dummy) ────────────────────────────────────── */
    async placeOrder(orderPayload) {
      // TODO: replace with `return (await fetch('/api/orders', {method:'POST', body: JSON.stringify(orderPayload)})).json();`
      const orderId = 'DC' + Math.floor(100000 + Math.random() * 900000);
      const order = {
        orderId,
        placedAt: new Date().toISOString(),
        ...orderPayload
      };
      const orders = JSON.parse(localStorage.getItem('dastkari_orders') || '[]');
      orders.push(order);
      localStorage.setItem('dastkari_orders', JSON.stringify(orders));
      localStorage.setItem('dastkari_last_order', JSON.stringify(order));
      return delay(order);
    },

    getLastOrder() {
      const raw = localStorage.getItem('dastkari_last_order');
      return raw ? JSON.parse(raw) : null;
    },

    /* ── Auth (dummy) ──────────────────────────────────────── */
    async login(email, _password) {
      // TODO: replace with a real auth call. Currently accepts any email/password.
      const session = { email, loggedInAt: new Date().toISOString() };
      localStorage.setItem('dastkari_session', JSON.stringify(session));
      return delay(session);
    },
    async signup(name, email, _password) {
      const session = { name, email, loggedInAt: new Date().toISOString() };
      localStorage.setItem('dastkari_session', JSON.stringify(session));
      return delay(session);
    },
    getSession() {
      const raw = localStorage.getItem('dastkari_session');
      return raw ? JSON.parse(raw) : null;
    },
    logout() { localStorage.removeItem('dastkari_session'); },

    /* ── Newsletter (dummy) ────────────────────────────────── */
    async subscribeNewsletter(email) {
      // TODO: replace with a real call to your email provider (Klaviyo, Mailchimp, etc.)
      const list = JSON.parse(localStorage.getItem('dastkari_newsletter') || '[]');
      if (!list.includes(email)) list.push(email);
      localStorage.setItem('dastkari_newsletter', JSON.stringify(list));
      return delay({ subscribed: true });
    }
  };

  /* ── Cart — persisted to localStorage, shared across all pages ── */
  const CART_KEY = 'dastkari_cart';

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function writeCart(lines) {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { lines } }));
  }

  const Cart = {
    get() { return readCart(); },

    add(product, variant, qty = 1) {
      const lines = readCart();
      const lineId = `${product.id}__${variant.color}__${variant.size}`;
      const existing = lines.find(l => l.lineId === lineId);
      if (existing) {
        existing.qty += qty;
      } else {
        lines.push({
          lineId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          stitch: product.stitch,
          price: product.price,
          color: variant.color,
          size: variant.size,
          qty
        });
      }
      writeCart(lines);
      return lines;
    },

    updateQty(lineId, qty) {
      let lines = readCart();
      if (qty <= 0) {
        lines = lines.filter(l => l.lineId !== lineId);
      } else {
        const line = lines.find(l => l.lineId === lineId);
        if (line) line.qty = qty;
      }
      writeCart(lines);
      return lines;
    },

    remove(lineId) {
      const lines = readCart().filter(l => l.lineId !== lineId);
      writeCart(lines);
      return lines;
    },

    clear() { writeCart([]); },

    count() { return readCart().reduce((sum, l) => sum + l.qty, 0); },

    subtotal() { return readCart().reduce((sum, l) => sum + l.qty * l.price, 0); }
  };

  window.Api = Api;
  window.Cart = Cart;
})();
