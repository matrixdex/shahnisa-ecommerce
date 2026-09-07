/* ============================================================
   SHAHNISA — product.js
   Renders a single product from ?slug=... — one template, driven
   entirely by data/products.json via Api.getProductBySlug.
   ============================================================ */

const GALLERY_VIEWS = ['Front', 'Embroidery Detail', 'Back', 'Styled'];
const COLOR_HEX_PDP = {
  'Ivory': '#f1ead9', 'Sage': '#b7c4a0', 'Blush': '#e8c3bf', 'Mint': '#bcd9c8', 'Powder Blue': '#b9d0e0'
};

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;
let currentQty = 1;

/** Medusa only stores color names, not swatch colors — the curated map
    covers this catalog's known shades; anything else falls back to trying
    the name itself as a CSS color keyword (works for plain names like
    "Black"/"Navy") rather than a flat, uninformative gray. */
function swatchColor(name) {
  if (COLOR_HEX_PDP[name]) return COLOR_HEX_PDP[name];
  const asKeyword = name.toLowerCase().replace(/\s+/g, '');
  const probe = new Option().style;
  probe.color = '';
  probe.color = asKeyword;
  return probe.color ? asKeyword : '#ccc';
}

function starString(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function renderNotFound() {
  document.getElementById('pdpRoot').innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <h3>We couldn't find that piece</h3>
      <p>It may have sold out or the link may be out of date.</p>
      <a href="shop.html" class="btn btn-outline">Back to Shop All</a>
    </div>`;
}

function renderPDP(p) {
  document.title = `${p.name} — Shahnisa`;
  document.getElementById('pageDesc')?.setAttribute('content', p.description.slice(0, 155));
  document.getElementById('breadcrumb').innerHTML = `
    <a href="index.html">Home</a><span class="sep">/</span>
    <a href="shop.html?category=${encodeURIComponent(p.category)}">${p.category}</a><span class="sep">/</span>
    <span class="current">${p.name}</span>`;

  selectedColor = p.colors[0];
  selectedSize = null;
  currentQty = 1;

  const tag = p.isNew ? '<span class="product-tag new">New</span>' : (p.compareAt ? '<span class="product-tag sale">Sale</span>' : '');

  document.getElementById('pdpRoot').innerHTML = `
    <div class="pdp">
      <div class="pdp-gallery">
        <div class="pdp-gallery-main" id="galleryMain">${p.images.length ? `<img class="product-photo" id="galleryMainImg" src="${p.images[0]}" alt="${p.name}">` : patternCard(p.stitch)}${tag}</div>
        <div class="pdp-thumbs" id="galleryThumbs">
          ${p.images.length ? p.images.map((src, i) => `
            <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-src="${src}"><img class="product-photo" src="${src}" alt="${p.name} ${i + 1}"></div>
          `).join('') : GALLERY_VIEWS.map((v, i) => `
            <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-view="${v}">${patternCard(p.stitch)}</div>
          `).join('')}
        </div>
      </div>

      <div class="pdp-info">
        <div class="stitch-label">${p.stitch} &middot; ${p.fabric}</div>
        ${p.collectionTitle ? `<span class="eyebrow">${p.collectionTitle}</span>` : ''}
        <h1>${p.name}</h1>
        <div class="rating-row">
          <span class="stars">${starString(p.rating)}</span>
          <span>${p.rating} (${p.reviews} reviews)</span>
        </div>
        <div class="pdp-price price" id="pdpPrice">${p.compareAt ? `<span class="compare">${Api.money(p.compareAt)}</span>` : ''}<span id="pdpPriceValue">${Api.money(p.price)}</span></div>

        <div class="variant-group">
          <div class="variant-label"><span>Colour</span><span class="selected-value" id="selColor">${p.colors[0]}</span></div>
          <div class="facet-colors" id="colorOptions">
            ${p.colors.map(c => `<button class="color-swatch ${c === p.colors[0] ? 'active' : ''}" data-color="${c}" style="background:${swatchColor(c)}" title="${c}" aria-label="${c}"></button>`).join('')}
          </div>
        </div>

        <div class="variant-group">
          <div class="variant-label"><span>Size</span><a href="#sizeGuide" class="size-guide-link">Size guide</a></div>
          <div class="facet-sizes" id="sizeOptions">
            ${p.sizes.map(s => `<button class="size-chip" data-size="${s}">${s}</button>`).join('')}
          </div>
          <div class="field-error" id="sizeError" style="display:none; margin-top:0.5rem;">Please select a size to continue.</div>
        </div>

        <div class="qty-row">
          <div class="qty-stepper lg" id="pdpQty">
            <button id="qtyDown" aria-label="Decrease quantity">&minus;</button>
            <span id="qtyValue">1</span>
            <button id="qtyUp" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div class="pdp-actions">
          <button class="btn btn-primary btn-block" id="addToBagBtn">Add to Bag — <span id="addToBagPrice">${Api.money(p.price)}</span></button>
          <button class="btn btn-outline btn-block" id="buyNowBtn">Buy It Now</button>
        </div>

        <div class="trust-row">
          <div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>Secure checkout, encrypted end to end</div>
          <div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h13v9H3zM16 11h3l2 3v3h-5z"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/></svg>Free shipping across India on orders over ₹3,500</div>
          <div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12a8 8 0 0114-5M20 12a8 8 0 01-14 5"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>7-day easy returns on unworn pieces</div>
          <div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/></svg>Cash on delivery available</div>
        </div>

        <div class="accordion" id="pdpAccordion">
          <div class="accordion-item open" data-acc>
            <button class="accordion-trigger" data-acc-trigger>Description<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="accordion-panel" data-acc-panel><div class="accordion-panel-inner">${p.description}</div></div>
          </div>
          <div class="accordion-item" data-acc>
            <button class="accordion-trigger" data-acc-trigger>Fabric &amp; Care<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="accordion-panel" data-acc-panel><div class="accordion-panel-inner">${p.care}</div></div>
          </div>
          <div class="accordion-item" data-acc>
            <button class="accordion-trigger" data-acc-trigger>The Artisan's Note<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="accordion-panel" data-acc-panel><div class="accordion-panel-inner">${p.artisanNote}</div></div>
          </div>
          <div class="accordion-item" id="sizeGuide" data-acc>
            <button class="accordion-trigger" data-acc-trigger>Size &amp; Fit<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="accordion-panel" data-acc-panel><div class="accordion-panel-inner">Runs true to size — if between sizes, we recommend sizing up for a relaxed fit. Available in ${p.sizes.join(', ')}.</div></div>
          </div>
          <div class="accordion-item" data-acc>
            <button class="accordion-trigger" data-acc-trigger>Shipping &amp; Returns<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
            <div class="accordion-panel" data-acc-panel><div class="accordion-panel-inner">Dispatched within 2–4 business days. Free shipping across India on orders over ₹3,500. Unworn pieces with tags attached can be returned within 7 days of delivery for a full refund.</div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  wirePDPInteractions(p);
  initAccordion();
}

/** Finds the variant matching the currently selected color/size (falling
    back to the product's base price if no size has been picked yet, or no
    exact match exists) and updates the price display + Add to Bag label. */
function updatePriceDisplay(p) {
  const match = (p.variants || []).find(v =>
    (!p.colors.length || v.color === selectedColor) &&
    (!p.sizes.length || v.size === selectedSize)
  );
  const price = (match && match.price != null) ? match.price : p.price;
  document.getElementById('pdpPriceValue').textContent = Api.money(price);
  document.getElementById('addToBagPrice').textContent = Api.money(price);
}

function wirePDPInteractions(p) {
  document.querySelectorAll('#galleryThumbs .pdp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('#galleryThumbs .pdp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const src = thumb.getAttribute('data-src');
      const mainImg = document.getElementById('galleryMainImg');
      if (src && mainImg) mainImg.src = src;
    });
  });

  document.querySelectorAll('#colorOptions .color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('#colorOptions .color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      selectedColor = sw.getAttribute('data-color');
      document.getElementById('selColor').textContent = selectedColor;
      updatePriceDisplay(p);
    });
  });

  document.querySelectorAll('#sizeOptions .size-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#sizeOptions .size-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedSize = chip.getAttribute('data-size');
      document.getElementById('sizeError').style.display = 'none';
      updatePriceDisplay(p);
    });
  });

  document.getElementById('qtyUp').addEventListener('click', () => {
    if (currentQty >= Api.MAX_QTY_PER_ITEM) {
      showToast(`Only ${Api.MAX_QTY_PER_ITEM} of this item can be added to your bag.`);
      return;
    }
    currentQty += 1;
    document.getElementById('qtyValue').textContent = currentQty;
  });
  document.getElementById('qtyDown').addEventListener('click', () => {
    currentQty = Math.max(1, currentQty - 1);
    document.getElementById('qtyValue').textContent = currentQty;
  });

  function validate() {
    if (p.sizes.length && !selectedSize) {
      document.getElementById('sizeError').style.display = 'block';
      document.getElementById('sizeError').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  document.getElementById('addToBagBtn').addEventListener('click', () => {
    if (!validate()) return;
    addToCartFlow(p, { color: selectedColor, size: selectedSize }, currentQty);
  });

  document.getElementById('buyNowBtn').addEventListener('click', async () => {
    if (!validate()) return;
    const btn = document.getElementById('buyNowBtn');
    btn.disabled = true;
    btn.textContent = 'Preparing checkout…';
    try {
      await Cart.add(p, { color: selectedColor, size: selectedSize }, currentQty);
      location.href = 'checkout.html';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Buy It Now';
    }
  });
}

function initAccordion() {
  document.querySelectorAll('#pdpAccordion [data-acc]').forEach(item => {
    const trigger = item.querySelector('[data-acc-trigger]');
    const panel = item.querySelector('[data-acc-panel]');
    if (item.classList.contains('open')) panel.style.maxHeight = panel.scrollHeight + 'px';
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('#pdpAccordion [data-acc]').forEach(other => {
        other.classList.remove('open');
        other.querySelector('[data-acc-panel]').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

async function renderRelated(product) {
  let related;
  try {
    related = await Api.getRelated(product, 4);
  } catch (err) {
    console.error('Could not load related products', err);
    return;
  }
  if (!related.length) return;
  document.getElementById('relatedSection').style.display = 'block';
  const grid = document.getElementById('relatedGrid');
  grid.innerHTML = related.map(productCardHTML).join('');
  wireProductCardActions(grid, related);
}

function renderLoadError() {
  document.getElementById('pdpRoot').innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
      <h3>Couldn't load this product</h3>
      <p>If you opened this page directly as a file, run a local server instead — see README.md.</p>
      <a href="shop.html" class="btn btn-outline">Back to Shop All</a>
    </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { renderNotFound(); return; }
  let product;
  try {
    product = await Api.getProductBySlug(slug);
  } catch (err) {
    console.error('Could not load product', err);
    renderLoadError();
    return;
  }
  if (!product) { renderNotFound(); return; }
  currentProduct = product;
  renderPDP(product);
  renderRelated(product);
  wireReveal();
});
