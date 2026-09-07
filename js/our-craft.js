/* ============================================================
   SHAHNISA — our-craft.js
   Loops each of the 32 stitch-card animations (ported from
   assets/embroidery animations/) for as long as its card stays in view,
   same behaviour as the homepage's Stitches at Shahnisa cards
   (js/home.js's wireStitchCardReplay). Unlike the homepage, where each
   animation's total duration was hand-timed for 3 specific cards, this
   page has 32 different animations — so instead of a hardcoded duration
   table, each card's cycle length is measured directly off its own
   elements' computed animation-delay/-duration/-iteration-count the
   moment it's cloned in, which works for any animation regardless of
   how many elements or CSS animations it layers (e.g. Kapkapi's
   shimmer, which runs a second looping animation on top of the draw-in).
   ============================================================ */

const CRAFT_LOOP_PAUSE_MS = 800; // breathing room between loops

function craftAnimDurationMs(svgEl) {
  let maxEnd = 0;
  svgEl.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const delays = cs.animationDelay.split(',');
    const durs = cs.animationDuration.split(',');
    const iters = cs.animationIterationCount.split(',');
    const count = Math.max(delays.length, durs.length, iters.length);
    for (let i = 0; i < count; i++) {
      const delay = (parseFloat(delays[i % delays.length]) || 0) * 1000;
      const dur = (parseFloat(durs[i % durs.length]) || 0) * 1000;
      const iterRaw = (iters[i % iters.length] || '1').trim();
      const iter = iterRaw === 'infinite' ? 1 : (parseFloat(iterRaw) || 1); // treat an infinite pulse as one pass for looping purposes
      const end = delay + dur * iter;
      if (end > maxEnd) maxEnd = end;
    }
  });
  return maxEnd;
}

function wireCraftStitchLoop() {
  if (!('IntersectionObserver' in window)) return;
  document.querySelectorAll('.craft-stitch-wrap').forEach((wrap) => {
    let inView = false;
    let timer = null;

    function playOnce() {
      const oldSvg = wrap.querySelector('svg');
      if (!oldSvg) return null;
      const newSvg = oldSvg.cloneNode(true);
      wrap.replaceChild(newSvg, oldSvg);
      return newSvg;
    }

    function loop() {
      if (!inView) return;
      const svg = playOnce();
      const cycleMs = (svg ? craftAnimDurationMs(svg) : 3000) + CRAFT_LOOP_PAUSE_MS;
      timer = setTimeout(loop, cycleMs);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !inView) {
          inView = true;
          loop();
        } else if (!entry.isIntersecting && inView) {
          inView = false;
          clearTimeout(timer);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(wrap);
  });
}

document.addEventListener('DOMContentLoaded', wireCraftStitchLoop);
