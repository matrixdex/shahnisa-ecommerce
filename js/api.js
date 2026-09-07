/* ============================================================
   SHAHNISA — api.js
   ------------------------------------------------------------
   This is the ONE file that talks to the real backend. Every page
   calls functions on `window.Api` and `window.Cart` — nothing else
   in the codebase talks to the network or localStorage directly.

   Backend: MedusaJS Store API (see ../backend). Products, cart,
   checkout/orders and customer auth are all real; payment stays a
   front-end simulation on top of a real Medusa order (see
   checkout.js). Newsletter signups go to a small custom Medusa module
   (see ../backend/apps/backend/src/modules/newsletter) — there's no
   built-in newsletter concept in Medusa.
   ============================================================ */

(function () {
  // Point this at your Medusa backend + the publishable API key its
  // seed script prints out (see backend/apps/backend/src/migration-scripts/
  // initial-data-seed.ts). Both are safe to expose client-side.
  //
  // In production these come from window.__ENV__, set by env-config.js —
  // a file generated at deploy time by scripts/render-frontend-build.mjs
  // from the MEDUSA_URL / MEDUSA_PUBLISHABLE_KEY env vars on the static
  // site's Render service. Locally, with no env-config.js present, this
  // falls back to localhost + the dev seed's key.
  const ENV = (typeof window !== 'undefined' && window.__ENV__) || {};
  const MEDUSA_URL = ENV.MEDUSA_URL || 'http://localhost:9000';
  const MEDUSA_PUBLISHABLE_KEY =
    ENV.MEDUSA_PUBLISHABLE_KEY || 'pk_040f929aed9182f6c9b63a98a591380029e5e045863bf9228a24679ce906e4e3';

  // A code-based (not customer-facing) Promotion seeded alongside the
  // catalog: 100% off the shipping method once the cart's item total
  // clears ₹3,500, replacing the old FREE_SHIPPING_THRESHOLD constant.
  // Applying it is harmless when the cart doesn't qualify yet — the
  // promotion's own rule gates whether it actually discounts anything.
  const FREE_SHIPPING_CODE = 'FREESHIP3500';
  const MAX_QTY_PER_ITEM = 3; // cap on how many of a single product+variant a cart line can hold

  const TOKEN_KEY = 'shahnisa_medusa_token';
  const CART_ID_KEY = 'shahnisa_cart_id';
  // "+" makes this additive to Medusa's default cart fields (which already
  // include items, shipping_methods, promotions and all the total/tax/
  // discount fields) — a bare field list would replace those defaults
  // instead of extending them and silently drop the totals.
  const CART_FIELDS = '+items.product.metadata';

  let _regionId = null;
  let _catalogCache = null;
  let _collectionsCache = null;
  let _cart = null; // the raw Medusa cart
  let _cartCache = []; // flattened line shape the rest of the site already expects
  let _session = null; // {email, name, loggedInAt} or null

  function money(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function withFields(path) {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}fields=${encodeURIComponent(CART_FIELDS)}`;
  }

  async function medusaFetch(path, opts = {}) {
    const headers = Object.assign(
      { 'Content-Type': 'application/json', 'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY },
      opts.headers || {}
    );
    if (!headers.Authorization) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) headers.Authorization = 'Bearer ' + token;
    }
    const res = await fetch(MEDUSA_URL + path, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      let body = {};
      try { body = await res.json(); } catch (e) { /* no JSON body */ }
      const err = new Error(body.message || `Request to ${path} failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function notify(message) {
    if (typeof showToast === 'function') showToast(message);
  }

  async function getRegionId() {
    if (_regionId) return _regionId;
    const data = await medusaFetch('/store/regions');
    _regionId = data.regions[0].id;
    return _regionId;
  }

  /* ── Product catalog mapping ──────────────────────────────
     Medusa's product shape -> the flat shape every template already
     destructures. Descriptive fields with no native Medusa column
     (stitch, fabric, care, artisanNote, rating, reviews, isNew,
     compareAt) live in product.metadata (see the seed script).
     `variants` is the one added field — {id, color, size, price} —
     so Cart.add can resolve a real Medusa variant id. */
  const PRODUCT_FIELDS = [
    'id', 'title', 'handle', 'description', 'type.value',
    'collection.title', 'collection.handle', 'collection.metadata', 'metadata',
    '*options', '*options.values', '*variants', '*variants.options', '*variants.calculated_price',
  ].join(',');

  function mapVariant(v) {
    const colorOpt = (v.options || []).find(o => o.option && o.option.title === 'Colour');
    const sizeOpt = (v.options || []).find(o => o.option && o.option.title === 'Size');
    return {
      id: v.id,
      color: colorOpt ? colorOpt.value : null,
      size: sizeOpt ? sizeOpt.value : null,
      price: v.calculated_price ? v.calculated_price.calculated_amount : null,
    };
  }

  function mapProduct(p) {
    const variants = (p.variants || []).map(mapVariant);
    const colorOption = (p.options || []).find(o => o.title === 'Colour');
    const sizeOption = (p.options || []).find(o => o.title === 'Size');
    const m = p.metadata || {};
    return {
      id: p.id,
      slug: p.handle,
      name: p.title,
      category: p.type ? p.type.value : '',
      collection: p.collection ? p.collection.handle : '',
      stitch: m.stitch || '',
      fabric: m.fabric || '',
      price: variants.length ? variants[0].price : 0,
      compareAt: m.compareAt != null ? m.compareAt : null,
      isNew: !!m.isNew,
      colors: colorOption ? colorOption.values.map(v => v.value) : [],
      sizes: sizeOption ? sizeOption.values.map(v => v.value) : [],
      rating: m.rating || 0,
      reviews: m.reviews || 0,
      description: p.description || '',
      care: m.care || '',
      artisanNote: m.artisanNote || '',
      variants,
    };
  }

  let _loadCatalogPromise = null;
  async function loadCatalog() {
    if (_catalogCache) return _catalogCache;
    if (!_loadCatalogPromise) {
      _loadCatalogPromise = (async () => {
        const regionId = await getRegionId();
        const data = await medusaFetch(`/store/products?region_id=${regionId}&limit=100&fields=${encodeURIComponent(PRODUCT_FIELDS)}`);
        _catalogCache = data.products.map(mapProduct);
        return _catalogCache;
      })();
    }
    return _loadCatalogPromise;
  }

  async function loadCollections() {
    if (_collectionsCache) return _collectionsCache;
    const data = await medusaFetch('/store/collections?fields=id,title,handle,metadata');
    _collectionsCache = data.collections.map(c => ({
      id: c.handle,
      name: c.title,
      stitch: (c.metadata && c.metadata.stitch) || '',
      description: (c.metadata && c.metadata.description) || '',
    }));
    return _collectionsCache;
  }

  /* ── Api ───────────────────────────────────────────────── */
  const Api = {
    money,
    MAX_QTY_PER_ITEM,

    /** Resolves once the cart and session have hydrated from Medusa. */
    ready() { return _readyPromise; },

    async getProducts(filters = {}) {
      let items = [...(await loadCatalog())];

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
      return items;
    },

    async getProductBySlug(slug) {
      const items = await loadCatalog();
      return items.find(p => p.slug === slug) || null;
    },

    async getCollections() {
      return loadCollections();
    },

    async getRelated(product, limit = 4) {
      const items = await loadCatalog();
      return items
        .filter(p => p.id !== product.id && (p.collection === product.collection || p.category === product.category))
        .slice(0, limit);
    },

    async getNewArrivals(limit = 8) {
      const items = await loadCatalog();
      return items.filter(p => p.isNew).concat(items.filter(p => !p.isNew)).slice(0, limit);
    },

    /* ── Checkout ──────────────────────────────────────────── */
    async getShippingMethods() {
      await ensureCart();
      const data = await medusaFetch(`/store/shipping-options?cart_id=${_cart.id}`);
      return data.shipping_options.map(o => ({
        code: o.type ? o.type.code : o.id,
        label: o.name,
        sub: o.type ? o.type.description : '',
        cost: o.calculated_price ? o.calculated_price.calculated_amount : o.amount,
      }));
    },

    /** Sets the cart's shipping method and re-applies the silent
        free-shipping promotion (it can only discount a shipping method
        that already exists on the cart). Returns the refreshed totals. */
    async selectShippingMethod(code) {
      await ensureCart();
      const data = await medusaFetch(`/store/shipping-options?cart_id=${_cart.id}`);
      const option = data.shipping_options.find(o => (o.type ? o.type.code : o.id) === code);
      if (!option) throw new Error('That shipping method is not available.');
      const smData = await medusaFetch(withFields(`/store/carts/${_cart.id}/shipping-methods`), {
        method: 'POST',
        body: JSON.stringify({ option_id: option.id }),
      });
      _cart = smData.cart;
      try {
        const promoData = await medusaFetch(withFields(`/store/carts/${_cart.id}/promotions`), {
          method: 'POST',
          body: JSON.stringify({ promo_codes: [FREE_SHIPPING_CODE] }),
        });
        _cart = promoData.cart;
      } catch (err) {
        // non-fatal — the cart still has a valid shipping method either way
        console.error('Could not evaluate free-shipping promotion', err);
      }
      syncCacheFromCart();
      return cartTotals();
    },

    /** Applies a customer-entered promo code. Returns whether it actually applied. */
    async applyPromoCode(code) {
      await ensureCart();
      try {
        const data = await medusaFetch(withFields(`/store/carts/${_cart.id}/promotions`), {
          method: 'POST',
          body: JSON.stringify({ promo_codes: [code] }),
        });
        _cart = data.cart;
        syncCacheFromCart();
        return (_cart.promotions || []).some(p => p.code === code);
      } catch (err) {
        console.error('Could not apply promo code', err);
        return false;
      }
    },

    async getCartTotals() {
      await ensureCart();
      return cartTotals();
    },

    /* ── Orders ────────────────────────────────────────────── */
    async placeOrder(orderPayload) {
      await ensureCart();
      const cartId = _cart.id;
      const a = orderPayload.shippingAddress;
      const nameParts = (a.fullName || '').trim().split(/\s+/);
      const address = {
        first_name: nameParts[0] || a.fullName || '',
        last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
        address_1: a.address1,
        address_2: a.address2 || '',
        city: a.city,
        province: a.state,
        postal_code: a.pincode,
        // The seeded region only covers India — see backend/apps/backend's
        // migration-scripts/initial-data-seed.ts. The country dropdown in
        // checkout.html is otherwise cosmetic until more regions are added.
        country_code: 'in',
        phone: orderPayload.contact.phone,
      };

      await medusaFetch(`/store/carts/${cartId}`, {
        method: 'POST',
        body: JSON.stringify({
          email: orderPayload.contact.email,
          shipping_address: address,
          billing_address: address,
        }),
      });

      const payColData = await medusaFetch('/store/payment-collections', {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartId }),
      });
      const payCollectionId = payColData.payment_collection.id;

      if (orderPayload.paymentMethod === 'cod') {
        await medusaFetch(`/store/payment-collections/${payCollectionId}/payment-sessions`, {
          method: 'POST',
          body: JSON.stringify({ provider_id: 'pp_system_default' }),
        });
      } else {
        const sessionData = await medusaFetch(`/store/payment-collections/${payCollectionId}/payment-sessions`, {
          method: 'POST',
          body: JSON.stringify({ provider_id: 'pp_razorpay' }),
        });
        const session = sessionData.payment_collection.payment_sessions.find(s => s.provider_id === 'pp_razorpay');
        // Waits for the Razorpay modal to succeed and the payment to be
        // verified server-side — only then is the cart completed below.
        // Rejects (modal dismissed / payment.failed) propagate straight to
        // checkout.js's catch block as a human-readable message.
        await payWithRazorpay(session, cartId, orderPayload);
      }

      const completeData = await medusaFetch(`/store/carts/${cartId}/complete`, { method: 'POST' });
      if (completeData.type !== 'order') {
        throw new Error((completeData.error && completeData.error.message) || 'Could not complete the order.');
      }
      const medusaOrder = completeData.order;
      const orderId = 'SH' + String(medusaOrder.display_id).padStart(6, '0');
      const order = {
        orderId,
        placedAt: medusaOrder.created_at || new Date().toISOString(),
        ...orderPayload,
      };

      const orders = JSON.parse(localStorage.getItem('shahnisa_orders') || '[]');
      orders.push(order);
      localStorage.setItem('shahnisa_orders', JSON.stringify(orders));
      localStorage.setItem('shahnisa_last_order', JSON.stringify(order));

      // A completed cart can't be reused — start a fresh one for next time.
      _cart = null;
      _cartCache = [];
      localStorage.removeItem(CART_ID_KEY);
      ensureCart().catch(err => console.error('Could not start a new cart', err));

      return order;
    },

    getLastOrder() {
      const raw = localStorage.getItem('shahnisa_last_order');
      return raw ? JSON.parse(raw) : null;
    },

    /** Real order history from Medusa, for the account page. */
    async getOrderHistory() {
      const data = await medusaFetch('/store/orders?fields=id,display_id,created_at,total,items.id');
      return data.orders
        .map(o => ({
          orderId: 'SH' + String(o.display_id).padStart(6, '0'),
          placedAt: o.created_at,
          items: o.items || [],
          totals: { total: o.total },
        }))
        .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
    },

    /* ── Auth ──────────────────────────────────────────────── */
    async login(email, password) {
      const data = await medusaFetch('/auth/customer/emailpass', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      await hydrateSession();
      return _session;
    },

    async signup(name, email, password) {
      const regData = await medusaFetch('/auth/customer/emailpass/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const nameParts = (name || '').trim().split(/\s+/);
      await medusaFetch('/store/customers', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + regData.token },
        body: JSON.stringify({
          email,
          first_name: nameParts[0] || name || '',
          last_name: nameParts.slice(1).join(' ') || '',
        }),
      });
      // The registration token isn't tied to the customer yet — log in
      // for real (we still have the plaintext password here) to get one.
      return Api.login(email, password);
    },

    getSession() { return _session; },

    logout() {
      localStorage.removeItem(TOKEN_KEY);
      _session = null;
    },

    /* ── Newsletter — a small custom Medusa module (see backend/apps/backend/
       src/modules/newsletter), not a built-in Medusa concept. Subscribers
       show up under the "Newsletter" tab in the admin dashboard. */
    async subscribeNewsletter(email) {
      try {
        return await medusaFetch('/store/newsletter', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      } catch (err) {
        console.error('Could not save newsletter signup to the backend', err);
        // Fall back to a local record so the signup isn't silently lost if
        // the backend is unreachable — not visible in admin, but not gone.
        const list = JSON.parse(localStorage.getItem('shahnisa_newsletter') || '[]');
        if (!list.includes(email)) list.push(email);
        localStorage.setItem('shahnisa_newsletter', JSON.stringify(list));
        return { subscribed: true };
      }
    },
  };

  /** Opens Razorpay's Standard Checkout modal for the given payment session
      and resolves once the payment is verified server-side (see
      backend/apps/backend/src/api/store/razorpay/verify). Rejects with a
      human-readable message if the customer cancels or the payment fails —
      checkout.js surfaces that message directly in a toast. */
  function payWithRazorpay(session, cartId, orderPayload) {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay === 'undefined') {
        reject(new Error('Could not load the Razorpay checkout — please try again.'));
        return;
      }
      const rzp = new Razorpay({
        key: session.data.key_id,
        amount: session.data.amount,
        currency: session.data.currency,
        order_id: session.data.razorpay_order_id,
        name: 'Shahnisa',
        description: 'Order payment',
        prefill: {
          email: orderPayload.contact.email,
          contact: orderPayload.contact.phone,
          name: orderPayload.shippingAddress.fullName,
        },
        theme: { color: '#1e241f' },
        handler: async function (response) {
          try {
            await medusaFetch('/store/razorpay/verify', {
              method: 'POST',
              body: JSON.stringify({
                cart_id: cartId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            resolve();
          } catch (err) {
            reject(new Error('Payment could not be verified — please try again.'));
          }
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled.'));
          },
        },
      });
      rzp.on('payment.failed', function (response) {
        reject(new Error((response.error && response.error.description) || 'Payment failed — please try again.'));
      });
      rzp.open();
    });
  }

  async function hydrateSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { _session = null; return; }
    try {
      const data = await medusaFetch('/store/customers/me');
      const name = [data.customer.first_name, data.customer.last_name].filter(Boolean).join(' ');
      _session = { email: data.customer.email, name: name || undefined, loggedInAt: new Date().toISOString() };
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      _session = null;
    }
  }

  function cartTotals() {
    const c = _cart || {};
    return {
      subtotal: c.item_subtotal || 0,
      shippingCost: c.shipping_total || 0,
      discount: c.item_discount_total || 0,
      tax: c.tax_total || 0,
      total: c.total || 0,
    };
  }

  function parseVariantTitle(title) {
    const parts = (title || '').split(' / ');
    return { color: parts[0] || null, size: parts[1] || null };
  }

  function syncCacheFromCart() {
    _cartCache = (_cart.items || []).map(item => {
      const { color, size } = parseVariantTitle(item.variant_title);
      return {
        lineId: item.id,
        productId: item.product_id,
        slug: item.product_handle,
        name: item.product_title,
        stitch: (item.product && item.product.metadata && item.product.metadata.stitch) || '',
        price: item.unit_price,
        color,
        size,
        qty: item.quantity,
      };
    });
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { lines: _cartCache } }));
  }

  let _ensureCartPromise = null;
  async function ensureCart() {
    if (_cart) return _cart;
    if (_ensureCartPromise) return _ensureCartPromise;
    _ensureCartPromise = (async () => {
      const regionId = await getRegionId();
      const existingId = localStorage.getItem(CART_ID_KEY);
      if (existingId) {
        try {
          const data = await medusaFetch(withFields(`/store/carts/${existingId}`));
          _cart = data.cart;
          syncCacheFromCart();
          return _cart;
        } catch (err) {
          localStorage.removeItem(CART_ID_KEY);
        }
      }
      const data = await medusaFetch(withFields('/store/carts'), {
        method: 'POST',
        body: JSON.stringify({ region_id: regionId }),
      });
      _cart = data.cart;
      localStorage.setItem(CART_ID_KEY, _cart.id);
      syncCacheFromCart();
      return _cart;
    })();
    try {
      return await _ensureCartPromise;
    } finally {
      _ensureCartPromise = null;
    }
  }

  function findVariantId(product, variant) {
    const match = (product.variants || []).find(v => v.color === variant.color && v.size === variant.size);
    return match ? match.id : null;
  }

  /* ── Cart — an optimistic local mirror of the real Medusa cart.
     Every call updates `_cartCache` (and fires `cart:updated`)
     immediately so existing synchronous call sites keep working,
     then reconciles against the server in the background. ── */
  const Cart = {
    get() { return _cartCache; },

    count() { return _cartCache.reduce((sum, l) => sum + l.qty, 0); },

    subtotal() { return _cartCache.reduce((sum, l) => sum + l.qty * l.price, 0); },

    add(product, variant, qty = 1) {
      const existing = _cartCache.find(l => l.productId === product.id && l.color === variant.color && l.size === variant.size);
      const currentQty = existing ? existing.qty : 0;
      // Clamp to MAX_QTY_PER_ITEM here (not just in the UI) so this is the
      // one place every add-to-cart path — quick add, PDP, buy-now — is
      // guaranteed to respect the cap, including the case where some of
      // this item is already in the bag. Only the resulting DELTA (not the
      // raw requested qty) goes to the server, so a request that gets
      // partially clamped doesn't overshoot the cap server-side too.
      const finalQty = Math.min(currentQty + qty, MAX_QTY_PER_ITEM);
      const qtyToAdd = finalQty - currentQty;
      if (finalQty < currentQty + qty) {
        notify(`Only ${MAX_QTY_PER_ITEM} of ${product.name} can be added to your bag.`);
      }
      if (qtyToAdd <= 0) return _cartCache; // already at the cap — nothing to do

      if (existing) {
        existing.qty = finalQty;
      } else {
        _cartCache.push({
          lineId: `pending__${product.id}__${variant.color}__${variant.size}`,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          stitch: product.stitch,
          price: product.price,
          color: variant.color,
          size: variant.size,
          qty: finalQty,
        });
      }
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { lines: _cartCache } }));

      (async () => {
        try {
          await ensureCart();
          const variantId = findVariantId(product, variant);
          if (!variantId) throw new Error(`No matching variant for ${product.name} (${variant.color}/${variant.size})`);
          const data = await medusaFetch(withFields(`/store/carts/${_cart.id}/line-items`), {
            method: 'POST',
            body: JSON.stringify({ variant_id: variantId, quantity: qtyToAdd }),
          });
          _cart = data.cart;
          syncCacheFromCart();
        } catch (err) {
          console.error('Could not add to bag', err);
          notify('Could not add that to your bag — please try again.');
          try {
            const data = await medusaFetch(withFields(`/store/carts/${_cart.id}`));
            _cart = data.cart;
            syncCacheFromCart();
          } catch (err2) { /* give up silently — next mutation will resync */ }
        }
      })();

      return _cartCache;
    },

    updateQty(lineId, qty) {
      const line = _cartCache.find(l => l.lineId === lineId);
      if (!line) return _cartCache;
      if (qty > MAX_QTY_PER_ITEM) {
        qty = MAX_QTY_PER_ITEM;
        notify(`Only ${MAX_QTY_PER_ITEM} of ${line.name} can be added to your bag.`);
      }
      if (qty <= 0) {
        _cartCache = _cartCache.filter(l => l.lineId !== lineId);
      } else {
        line.qty = qty;
      }
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { lines: _cartCache } }));

      (async () => {
        try {
          await ensureCart();
          if (qty <= 0) {
            const data = await medusaFetch(withFields(`/store/carts/${_cart.id}/line-items/${lineId}`), { method: 'DELETE' });
            _cart = data.parent || _cart;
          } else {
            const data = await medusaFetch(withFields(`/store/carts/${_cart.id}/line-items/${lineId}`), {
              method: 'POST',
              body: JSON.stringify({ quantity: qty }),
            });
            _cart = data.cart;
          }
          syncCacheFromCart();
        } catch (err) {
          console.error('Could not update your bag', err);
          notify('Could not update your bag — please try again.');
          try {
            const data = await medusaFetch(withFields(`/store/carts/${_cart.id}`));
            _cart = data.cart;
            syncCacheFromCart();
          } catch (err2) { /* give up silently */ }
        }
      })();

      return _cartCache;
    },

    remove(lineId) { return Cart.updateQty(lineId, 0); },

    clear() {
      _cart = null;
      _cartCache = [];
      localStorage.removeItem(CART_ID_KEY);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { lines: _cartCache } }));
      ensureCart().catch(err => console.error('Could not start a new cart', err));
    },

    /** The full raw Medusa cart — used by checkout.js for authoritative totals. */
    async getServerCart() {
      await ensureCart();
      return _cart;
    },
  };

  const _readyPromise = (async () => {
    try {
      await getRegionId();
      await Promise.all([ensureCart(), hydrateSession()]);
    } catch (err) {
      console.error(`Could not reach the Medusa backend at ${MEDUSA_URL} — is it running?`, err);
    }
  })();

  window.Api = Api;
  window.Cart = Cart;
})();
