/* ============================================================
   SHAHNISA — home.js
   Renders the "New Arrivals" carousel and wires the newsletter
   form. Independent of the header/footer partials, so it runs on
   DOMContentLoaded rather than waiting for 'chrome:ready'.
   ============================================================ */

async function renderNewArrivals() {
  const track = document.getElementById('arrivalsTrack');
  if (!track) return;

  let products;
  try {
    products = await Api.getNewArrivals(10);
  } catch (err) {
    console.error('Could not load new arrivals', err);
    track.innerHTML = `<p style="color:var(--rose-deep);">Couldn't load products. If you opened this page directly as a file, run a local server instead — see README.md.</p>`;
    return;
  }

  if (!products.length) {
    track.innerHTML = `<p style="color:var(--ink-muted);">New arrivals are on their way — check back soon.</p>`;
    return;
  }

  track.innerHTML = products.map(productCardHTML).join('');
  wireQuickAdd(track, products);

  const prevBtn = document.getElementById('arrivalsPrev');
  const nextBtn = document.getElementById('arrivalsNext');
  const scrollByCard = () => {
    const card = track.querySelector('.product-card');
    return card ? card.getBoundingClientRect().width + 24 : 280;
  };
  prevBtn?.addEventListener('click', () => track.scrollBy({ left: -scrollByCard(), behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => track.scrollBy({ left: scrollByCard(), behavior: 'smooth' }));
}

function wireNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const btn = form.querySelector('button');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Joining…';
    await Api.subscribeNewsletter(input.value.trim());
    showToast("You're on the list — welcome to Shahnisa.");
    form.reset();
    btn.disabled = false;
    btn.textContent = original;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNewArrivals();
  wireNewsletter();
});
