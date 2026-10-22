/* ============================================================
   SHAHNISA — home.js
   Renders the "New Arrivals" carousel, wires the newsletter form, and
   drives the page's motion: the hero light, the sewing thread, the
   stitch loops, the reverse/front flip and the quote rotator.
   Independent of the header/footer partials, so it runs on
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
  wireProductCardActions(track, products);
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

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Loops each stitch animation for as long as its card stays in view: clone the
   <svg> (a fresh node restarts every child's CSS animation from its own
   delay), then wait out the longest delay+duration — measured off the
   elements themselves, not hardcoded — plus a short pause. */
const STITCH_LOOP_PAUSE_MS = 900;

function stitchAnimDurationMs(svg) {
  let end = 0;
  svg.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const delays = cs.animationDelay.split(',');
    const durs = cs.animationDuration.split(',');
    for (let i = 0; i < Math.max(delays.length, durs.length); i++) {
      const t = (parseFloat(delays[i % delays.length]) || 0) * 1000 + (parseFloat(durs[i % durs.length]) || 0) * 1000;
      if (t > end) end = t;
    }
  });
  return end;
}

function wireStitchLoops() {
  if (!('IntersectionObserver' in window) || REDUCED_MOTION) return;
  document.querySelectorAll('.loop').forEach((wrap) => {
    let inView = false;
    let timer = null;
    function playOnce() {
      const old = wrap.querySelector('svg');
      if (!old) return null;
      const fresh = old.cloneNode(true);
      wrap.replaceChild(fresh, old);
      return fresh;
    }
    function loop() {
      if (!inView) return;
      const svg = playOnce();
      timer = setTimeout(loop, (svg ? stitchAnimDurationMs(svg) : 3000) + STITCH_LOOP_PAUSE_MS);
    }
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !inView) { inView = true; loop(); }
        else if (!entry.isIntersecting && inView) { inView = false; clearTimeout(timer); }
      });
    }, { threshold: 0.35 }).observe(wrap);
  });
}

/* The thread: a dashed line that sews itself down the left edge with the scroll. */
function wireThread() {
  const thread = document.getElementById('thread');
  if (!thread) return;
  let queued = false;
  function sew() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    thread.style.setProperty('--p', (max > 0 ? (scrollY / max) * 100 : 0) + '%');
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(sew); } }, { passive: true });
  sew();
}

/* Hero light: lit for as long as the hero is on screen, off once the user has
   scrolled below it. A mouse steers it; touch screens (no cursor) get a slow drift. */
function wireHeroLight() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  let mouse = false;
  let heroOn = true;
  const spot = document.getElementById('heroSpot');
  const glow = document.getElementById('heroGlow');
  // transform only: the compositor moves these, nothing is repainted per mouse move
  const setL = (x, y) => {
    spot.style.transform = `translate3d(${x - 280}px, ${y - 280}px, 0)`;
    glow.style.transform = `translate3d(${x - 360}px, ${y - 360}px, 0)`;
  };
  hero.classList.add('lit');
  new IntersectionObserver((entries) => {
    heroOn = entries[0].isIntersecting;
    hero.classList.toggle('lit', heroOn);
  }).observe(hero);
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse = true;
    const r = hero.getBoundingClientRect();
    setL(e.clientX - r.left, e.clientY - r.top);
  }, { passive: true });
  if (REDUCED_MOTION) return;
  (function drift(t) {
    if (heroOn && !mouse) {
      const r = hero.getBoundingClientRect();
      setL(r.width * (0.5 + 0.32 * Math.sin(t / 2600)), r.height * (0.42 + 0.26 * Math.sin(t / 1900 + 1)));
    }
    requestAnimationFrame(drift);
  })(0);
}

/* Bakhiya: stitched on the reverse, flipped over, then drawn on the front where
   the thread throws its soft shadow — on a loop while the card is in view. */
function wireBakhiyaFlip() {
  const stage = document.getElementById('stage');
  const flipper = document.getElementById('flipper');
  const rev = document.getElementById('artRev');
  const front = document.getElementById('artFr');
  if (!stage || !flipper) return;
  if (REDUCED_MOTION) { flipper.classList.add('flip'); front.classList.add('shade'); return; }
  let timers = [];
  let running = false;
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  function blank(art) {
    const old = art.querySelector('svg');
    art.replaceChild(old.cloneNode(true), old);
    art.classList.add('hold'); // paused before its first frame, so nothing is drawn yet
  }
  function cycle() {
    blank(rev); blank(front);
    front.classList.remove('shade');
    flipper.classList.remove('flip');
    at(500, () => rev.classList.remove('hold'));                   // draw on the reverse
    at(4600, () => flipper.classList.add('flip'));                 // flip
    at(6300, () => { front.classList.add('shade'); front.classList.remove('hold'); }); // draw on the front
    at(11000, () => blank(rev));                                   // reverse is hidden: reset it
    at(12000, () => flipper.classList.remove('flip'));             // flip back
    at(14200, cycle);
  }
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !running) { running = true; cycle(); }
      else if (!entry.isIntersecting && running) { running = false; timers.forEach(clearTimeout); timers = []; }
    });
  }, { threshold: 0.4 }).observe(stage);
}

function wireQuotes() {
  const quotes = document.querySelectorAll('#voice blockquote');
  const dots = document.querySelectorAll('#dots button');
  if (!quotes.length) return;
  let i = 0;
  let timer = null;
  function show(n) {
    i = n;
    quotes.forEach((q, k) => q.classList.toggle('on', k === n));
    dots.forEach((d, k) => d.classList.toggle('on', k === n));
  }
  function auto() {
    clearInterval(timer);
    if (!REDUCED_MOTION) timer = setInterval(() => show((i + 1) % quotes.length), 6500);
  }
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); auto(); }));
  auto();
}

document.addEventListener('DOMContentLoaded', () => {
  renderNewArrivals();
  wireNewsletter();
  wireStitchLoops();
  wireThread();
  wireHeroLight();
  wireBakhiyaFlip();
  wireQuotes();
});
