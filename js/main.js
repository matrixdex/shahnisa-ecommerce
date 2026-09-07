/* ============================================================
   SHAHNISA — main.js
   Shared UI wiring used on every page: header cart badge, cart
   drawer, mobile nav, search overlay, toasts, scroll reveal,
   and the stitch-icon placeholder system.
   ============================================================ */

/* ── Stitch icon library ──────────────────────────────────────
   Used everywhere a real product photo isn't available yet. Each
   card shows the stitch name as line art instead of a blank box. */
const STITCH_ICONS = {
  'Bakhiya': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M24 6C14 6 8 16 8 24c0 10 7 18 16 18s16-8 16-18C40 16 34 6 24 6z"/><path d="M24 10c-6 3-10 9-10 14M24 10c6 3 10 9 10 14" stroke-dasharray="2 3"/></svg>',
  'Jaali': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 8h32v32H8z"/><path d="M8 16h32M8 24h32M8 32h32M16 8v32M24 8v32M32 8v32"/></svg>',
  'Murri': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><ellipse cx="16" cy="18" rx="4" ry="6" transform="rotate(-20 16 18)"/><ellipse cx="26" cy="14" rx="4" ry="6" transform="rotate(10 26 14)"/><ellipse cx="34" cy="24" rx="4" ry="6" transform="rotate(60 34 24)"/><ellipse cx="20" cy="30" rx="4" ry="6" transform="rotate(-40 20 30)"/><ellipse cx="30" cy="36" rx="4" ry="6" transform="rotate(20 30 36)"/></svg>',
  'Phanda': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="16" cy="16" r="3.4"/><circle cx="28" cy="12" r="3.4"/><circle cx="36" cy="24" r="3.4"/><circle cx="24" cy="26" r="3.4"/><circle cx="14" cy="30" r="3.4"/><circle cx="30" cy="36" r="3.4"/></svg>',
  'Taipchi': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 30c4-10 8-16 12-16s6 8 10 8 6-10 10-10 4 6 4 6" stroke-dasharray="3 3"/></svg>',
  'Keel Kangan': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 24c3-8 6-8 9 0s6 8 9 0 6-8 9 0 6 8 9 0"/></svg>',
  'Ghas Patti': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 36 L16 12 M12 36 L20 16 M16 36 L24 12 M20 36 L28 16 M24 36 L32 12 M28 36 L36 16"/></svg>',
  'Hool': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="18" cy="18" r="3"/><circle cx="30" cy="16" r="3"/><circle cx="34" cy="30" r="3"/><circle cx="18" cy="32" r="3"/><path d="M18 18 30 16 34 30 18 32Z" stroke-dasharray="1 3"/></svg>',
  'Bijli': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M26 6 12 26h10l-4 16 18-22H24z"/></svg>',
  'default': '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M24 6C14 6 8 16 8 24c0 10 7 18 16 18s16-8 16-18C40 16 34 6 24 6z"/></svg>'
};

function stitchIcon(stitch) {
  return STITCH_ICONS[stitch] || STITCH_ICONS['default'];
}

/** Builds the placeholder markup used everywhere a product photo would go. */
function patternCard(stitch) {
  return `<div class="pattern-card">${stitchIcon(stitch)}<span class="stitch-name">${stitch}</span></div>`;
}

/* ── Toasts ────────────────────────────────────────────────── */
function ensureToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}
function showToast(message) {
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 2400);
}

/* ── Cart drawer ───────────────────────────────────────────── */
function renderCartDrawer() {
  const lines = Cart.get();
  const itemsEl = document.getElementById('cartItems');
  const footEl = document.getElementById('cartDrawerFoot');
  if (!itemsEl) return;

  if (!lines.length) {
    itemsEl.innerHTML = `<div class="cart-empty">Your bag is empty.<br><a href="shop.html" class="btn-text" style="margin-top:1rem;display:inline-block;">Start shopping</a></div>`;
    if (footEl) footEl.style.display = 'none';
    return;
  }
  if (footEl) footEl.style.display = 'block';

  itemsEl.innerHTML = lines.map(l => `
    <div class="cart-line" data-line="${l.lineId}">
      <div class="cart-line-thumb">${patternCard(l.stitch)}</div>
      <div>
        <div class="cart-line-name">${l.name}</div>
        <div class="cart-line-meta">${l.color} &middot; ${l.size}</div>
        <div class="cart-line-qty">
          <div class="qty-stepper">
            <button data-qty-down aria-label="Decrease quantity">&minus;</button>
            <span>${l.qty}</span>
            <button data-qty-up aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-line-remove" data-remove>Remove</button>
      </div>
      <div class="cart-line-price">${Api.money(l.price * l.qty)}</div>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) subtotalEl.textContent = Api.money(Cart.subtotal());

  itemsEl.querySelectorAll('[data-line]').forEach(row => {
    const lineId = row.getAttribute('data-line');
    const line = lines.find(l => l.lineId === lineId);
    row.querySelector('[data-qty-up]').addEventListener('click', () => Cart.updateQty(lineId, line.qty + 1));
    row.querySelector('[data-qty-down]').addEventListener('click', () => Cart.updateQty(lineId, line.qty - 1));
    row.querySelector('[data-remove]').addEventListener('click', () => Cart.remove(lineId));
  });
}

/** The cart drawer is the only place account access lives now (the header
    icon is gone) — this keeps the "Sign In" / "Account" label next to
    "Your Bag" honest whether or not a session is already hydrated. */
function updateCartAccountLink() {
  const link = document.getElementById('cartAccountLink');
  if (!link) return;
  link.textContent = Api.getSession() ? 'Account' : 'Sign In';
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = Cart.count();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function openCartDrawer() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCartDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

/** Call this after Cart.add() anywhere in the site. */
function addToCartFlow(product, variant, qty) {
  Cart.add(product, variant, qty);
  showToast(`Added to bag — ${product.name}`);
  renderCartDrawer();
  openCartDrawer();
}

/* ── Search overlay ────────────────────────────────────────── */
async function wireSearch() {
  const overlay = document.getElementById('searchOverlay');
  if (!overlay) return;
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  let catalog = [];

  document.querySelectorAll('[data-open-search]').forEach(btn => btn.addEventListener('click', async () => {
    overlay.classList.add('open');
    input.focus();
    if (!catalog.length) catalog = await Api.getProducts();
  }));
  document.querySelectorAll('[data-close-search]').forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('open')));

  input?.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    const matches = catalog.filter(p =>
      p.name.toLowerCase().includes(q) || p.stitch.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    ).slice(0, 8);
    if (!matches.length) {
      results.innerHTML = `<div class="search-empty">No results for "${input.value}" — try a stitch name like Jaali or Bakhiya.</div>`;
      return;
    }
    results.innerHTML = matches.map(p => `
      <a class="search-result-row" href="product.html?slug=${p.slug}">
        <div class="search-result-thumb">${patternCard(p.stitch)}</div>
        <div>
          <div class="search-result-name">${p.name}</div>
          <div class="search-result-meta">${Api.money(p.price)}</div>
        </div>
      </a>
    `).join('');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.classList.remove('open');
  });
}

/* ── Mobile nav ────────────────────────────────────────────── */
function wireMobileNav() {
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('mobileNav');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  panel.querySelectorAll('[data-close-mobile-nav]').forEach(el => el.addEventListener('click', () => {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ── Scroll reveal ─────────────────────────────────────────── */
function wireReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

/* ── Shared product card (home carousel, shop grid, related products) ── */
function productCardHTML(p) {
  const tag = p.isNew ? '<span class="product-tag new">New</span>' : (p.compareAt ? '<span class="product-tag sale">Sale</span>' : '');
  return `
    <a href="product.html?slug=${p.slug}" class="product-card">
      <div class="product-media">
        ${tag}
        ${patternCard(p.stitch)}
      </div>
      <div class="product-info">
        <div class="stitch-label">${p.stitch} &middot; ${p.fabric}</div>
        <h3>${p.name}</h3>
        <div class="price">${p.compareAt ? `<span class="compare">${Api.money(p.compareAt)}</span>` : ''}${Api.money(p.price)}</div>
        <div class="product-card-actions">
          <button class="btn btn-icon-cart" data-add-to-cart="${p.id}" type="button" aria-label="Add to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h2l1 3"/><path d="M5 6L19 6 17 16 9 16Z"/><circle cx="10.5" cy="19.5" r="1.3"/><circle cx="15.5" cy="19.5" r="1.3"/><path d="M12 8.5v5M9.5 11h5"/></svg>
          </button>
          <button class="btn btn-primary btn-sm" data-buy-now="${p.id}" type="button">Buy Now</button>
        </div>
      </div>
    </a>
  `;
}

/** Wires the always-visible "Add to Cart"/"Buy Now" buttons within a container
    to act on the default variant (first color/size) — both stop the click from
    following the card's own link to the product page. Cart.add() enforces the
    per-item quantity cap on its own, so no cap check is needed here. */
function wireProductCardActions(container, products) {
  container.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const product = products.find(p => p.id === btn.getAttribute('data-add-to-cart'));
      if (!product) return;
      addToCartFlow(product, { color: product.colors[0], size: product.sizes[0] }, 1);
    });
  });
  container.querySelectorAll('[data-buy-now]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const product = products.find(p => p.id === btn.getAttribute('data-buy-now'));
      if (!product) return;
      Cart.add(product, { color: product.colors[0], size: product.sizes[0] }, 1);
      location.href = 'checkout.html';
    });
  });
}

/* ── Init shared chrome (runs once header/footer partials load) ── */
document.addEventListener('partials:loaded', () => {
  updateCartBadge();
  renderCartDrawer();
  updateCartAccountLink();
  Api.ready().then(updateCartAccountLink); // session may still be hydrating
  wireMobileNav();
  wireSearch();

  document.getElementById('cartBackdrop')?.addEventListener('click', closeCartDrawer);
  document.querySelectorAll('[data-open-cart]').forEach(btn => btn.addEventListener('click', openCartDrawer));
  document.querySelectorAll('[data-close-cart]').forEach(btn => btn.addEventListener('click', closeCartDrawer));

  // Highlight the current page's nav link (path AND category query param must match)
  const here = location.pathname.split('/').pop() || 'index.html';
  const hereCategory = new URLSearchParams(location.search).get('category') || '';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const [hrefPath, hrefQuery] = href.split('#')[0].split('?');
    const hrefCategory = new URLSearchParams(hrefQuery || '').get('category') || '';
    if (hrefPath === here && hrefCategory === hereCategory) a.classList.add('active');
  });

  window.addEventListener('cart:updated', () => {
    updateCartBadge();
    renderCartDrawer();
    updateCartAccountLink();
  });

  document.dispatchEvent(new Event('chrome:ready'));
});

document.addEventListener('DOMContentLoaded', wireReveal);
