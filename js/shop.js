/* ============================================================
   DASTKARI CHIKAN — shop.js
   Catalog page: facets, sorting, pagination. Filter state lives
   in the URL query string, so filtered views are shareable/
   bookmarkable — same as a real Shopify collection page.
   ============================================================ */

const COLOR_HEX = {
  'Ivory': '#f1ead9',
  'Sage': '#b7c4a0',
  'Blush': '#e8c3bf',
  'Mint': '#bcd9c8',
  'Powder Blue': '#b9d0e0'
};
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const PRICE_BANDS = [
  { id: 'under-3000', label: 'Under ₹3,000', min: null, max: 3000 },
  { id: '3000-6000', label: '₹3,000 – ₹6,000', min: 3000, max: 6000 },
  { id: '6000-10000', label: '₹6,000 – ₹10,000', min: 6000, max: 10000 },
  { id: 'over-10000', label: 'Over ₹10,000', min: 10000, max: null }
];
const PAGE_SIZE = 9;

let ALL_PRODUCTS = [];
let COLLECTIONS = [];
let state = {};
let currentPage = 1;

function readStateFromURL() {
  const params = new URLSearchParams(location.search);
  return {
    category: params.get('category') || '',
    collection: params.get('collection') || '',
    color: params.get('color') || '',
    size: params.get('size') || '',
    price: params.get('price') || '',
    sort: params.get('sort') || 'featured',
    search: params.get('search') || ''
  };
}

function writeStateToURL() {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  history.replaceState(null, '', qs ? `shop.html?${qs}` : 'shop.html');
}

function activeFilters() {
  const f = { sort: state.sort === 'featured' ? undefined : state.sort };
  if (state.category) f.category = state.category;
  if (state.collection) f.collection = state.collection;
  if (state.color) f.color = state.color;
  if (state.size) f.size = state.size;
  if (state.search) f.search = state.search;
  if (state.price) {
    const band = PRICE_BANDS.find(b => b.id === state.price);
    if (band) { if (band.min != null) f.minPrice = band.min; if (band.max != null) f.maxPrice = band.max; }
  }
  return f;
}

function updateHeaderCopy() {
  const eyebrow = document.getElementById('shopEyebrow');
  const title = document.getElementById('shopTitle');
  const desc = document.getElementById('shopDesc');
  const crumb = document.getElementById('crumbLabel');

  if (state.collection) {
    const col = COLLECTIONS.find(c => c.id === state.collection);
    if (col) {
      eyebrow.textContent = 'Shop By Stitch';
      title.textContent = col.name;
      desc.textContent = col.description;
      crumb.textContent = col.name;
      return;
    }
  }
  if (state.category) {
    eyebrow.textContent = 'Shop By Category';
    title.textContent = state.category;
    desc.textContent = `Every ${state.category.toLowerCase()} piece in the Dastkari Chikan edit.`;
    crumb.textContent = state.category;
    return;
  }
  eyebrow.textContent = 'The Full Edit';
  title.textContent = 'All Products';
  desc.textContent = 'Every hand-embroidered piece, in one place.';
  crumb.textContent = 'Shop All';
}

function renderFacets() {
  // Category counts
  const catCounts = {};
  ALL_PRODUCTS.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
  const catEl = document.getElementById('facetCategory');
  catEl.innerHTML = Object.keys(catCounts).sort().map(cat => `
    <button data-facet="category" data-value="${cat}" class="${state.category === cat ? 'active' : ''}">
      <span>${cat}</span><span class="count">${catCounts[cat]}</span>
    </button>
  `).join('');

  // Collection counts
  const colCounts = {};
  ALL_PRODUCTS.forEach(p => { colCounts[p.collection] = (colCounts[p.collection] || 0) + 1; });
  const colEl = document.getElementById('facetCollection');
  colEl.innerHTML = COLLECTIONS.map(c => `
    <button data-facet="collection" data-value="${c.id}" class="${state.collection === c.id ? 'active' : ''}">
      <span>${c.name}</span><span class="count">${colCounts[c.id] || 0}</span>
    </button>
  `).join('');

  // Colors
  const colors = [...new Set(ALL_PRODUCTS.flatMap(p => p.colors))];
  const colorEl = document.getElementById('facetColor');
  colorEl.innerHTML = colors.map(c => `
    <button class="color-swatch ${state.color === c ? 'active' : ''}" data-facet="color" data-value="${c}"
      style="background:${COLOR_HEX[c] || '#ccc'};" title="${c}" aria-label="${c}"></button>
  `).join('');

  // Sizes
  const sizes = [...new Set(ALL_PRODUCTS.flatMap(p => p.sizes))].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
  const sizeEl = document.getElementById('facetSize');
  sizeEl.innerHTML = sizes.map(s => `
    <button class="size-chip ${state.size === s ? 'active' : ''}" data-facet="size" data-value="${s}">${s}</button>
  `).join('');

  // Price bands
  const priceEl = document.getElementById('facetPrice');
  priceEl.innerHTML = PRICE_BANDS.map(b => `
    <button data-facet="price" data-value="${b.id}" class="${state.price === b.id ? 'active' : ''}"><span>${b.label}</span></button>
  `).join('');

  document.querySelectorAll('[data-facet]').forEach(btn => {
    btn.addEventListener('click', () => {
      const facet = btn.getAttribute('data-facet');
      const value = btn.getAttribute('data-value');
      state[facet] = state[facet] === value ? '' : value;
      currentPage = 1;
      writeStateToURL();
      refresh();
    });
  });

  renderActiveChips();
}

function renderActiveChips() {
  const chipsEl = document.getElementById('activeChips');
  const labels = {
    category: state.category,
    collection: state.collection && (COLLECTIONS.find(c => c.id === state.collection)?.name || state.collection),
    color: state.color,
    size: state.size,
    price: state.price && PRICE_BANDS.find(b => b.id === state.price)?.label
  };
  const chips = Object.entries(labels).filter(([, v]) => v);
  chipsEl.innerHTML = chips.map(([key, label]) => `
    <span class="active-chip">${label}<button data-remove-chip="${key}" aria-label="Remove filter">&times;</button></span>
  `).join('');
  chipsEl.querySelectorAll('[data-remove-chip]').forEach(btn => {
    btn.addEventListener('click', () => {
      state[btn.getAttribute('data-remove-chip')] = '';
      currentPage = 1;
      writeStateToURL();
      refresh();
    });
  });
}

async function refresh() {
  updateHeaderCopy();
  const filters = activeFilters();
  const products = await Api.getProducts(filters);
  renderFacets();

  const countEl = document.getElementById('resultCount');
  countEl.textContent = `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`;

  const grid = document.getElementById('productGrid');
  const emptyEl = document.getElementById('emptyState');
  const pageEl = document.getElementById('pagination');

  if (!products.length) {
    grid.innerHTML = '';
    pageEl.innerHTML = '';
    emptyEl.style.display = 'block';
    emptyEl.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <h3>No pieces match those filters</h3>
        <p>Try clearing a filter or two.</p>
        <button class="btn btn-outline" id="emptyClear">Clear all filters</button>
      </div>`;
    document.getElementById('emptyClear').addEventListener('click', clearAll);
    return;
  }
  emptyEl.style.display = 'none';

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, totalPages);
  const pageItems = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  grid.innerHTML = pageItems.map(productCardHTML).join('');
  wireQuickAdd(grid, pageItems);

  if (totalPages > 1) {
    let html = `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&larr;</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button data-page="${i}" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">&rarr;</button>`;
    pageEl.innerHTML = html;
    pageEl.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = Number(btn.getAttribute('data-page'));
        refresh();
        window.scrollTo({ top: document.querySelector('.shop-main').offsetTop - 120, behavior: 'smooth' });
      });
    });
  } else {
    pageEl.innerHTML = '';
  }
}

function clearAll() {
  state = { category: '', collection: '', color: '', size: '', price: '', sort: 'featured', search: '' };
  currentPage = 1;
  writeStateToURL();
  refresh();
}

function wireMobileFilters() {
  const facets = document.getElementById('facets');
  const backdrop = document.getElementById('facetsBackdrop');
  document.getElementById('openFilters')?.addEventListener('click', () => {
    facets.classList.add('open');
    backdrop.classList.add('open');
  });
  const close = () => { facets.classList.remove('open'); backdrop.classList.remove('open'); };
  document.getElementById('closeFilters')?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
}

document.addEventListener('DOMContentLoaded', async () => {
  state = readStateFromURL();
  document.getElementById('sortSelect').value = state.sort || 'featured';
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    writeStateToURL();
    refresh();
  });
  document.getElementById('clearFilters').addEventListener('click', clearAll);
  wireMobileFilters();

  try {
    ALL_PRODUCTS = await Api.getProducts();
    COLLECTIONS = await Api.getCollections();
  } catch (err) {
    console.error('Could not load catalog', err);
    document.getElementById('resultCount').textContent = '';
    document.getElementById('productGrid').innerHTML = '';
    const emptyEl = document.getElementById('emptyState');
    emptyEl.style.display = 'block';
    emptyEl.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
        <h3>Couldn't load the catalog</h3>
        <p>If you opened this page directly as a file, run a local server instead — see README.md.</p>
      </div>`;
    return;
  }
  refresh();
});
