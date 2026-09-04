/* ============================================================
   EMBROIDERY ANIMATION GALLERY — script.js
   One clearly-named init function per animation (initAnim01 …
   initAnim10), each only ever touching its own #stage-0X / #svg-0X
   — nothing is shared between them except the SVG_NS constant and
   the replay-button wiring at the very bottom of this file.
   ============================================================ */

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ============================================================
   01 — PAISLEY BLOOM
   ============================================================ */
function initAnim01() {
  const svg = document.getElementById('svg-01');
  svg.innerHTML = '';

  const outer = document.createElementNS(SVG_NS, 'path');
  outer.setAttribute('pathLength', '1');
  outer.setAttribute('class', 'a01-path-outer');
  outer.setAttribute('d', 'M100,20 C140,20 160,55 155,90 C150,125 125,140 115,165 C108,183 113,200 130,205 C115,215 92,210 88,190 C85,172 98,158 108,143 C118,128 115,105 95,98 C80,93 68,103 70,118 C58,108 60,88 80,82 C95,77 100,62 92,50 C97,38 100,28 100,20 Z');
  svg.appendChild(outer);

  const inner = document.createElementNS(SVG_NS, 'path');
  inner.setAttribute('pathLength', '1');
  inner.setAttribute('class', 'a01-path-inner');
  inner.setAttribute('d', 'M99,58 C112,60 119,73 112,85 C107,93 96,95 89,89');
  svg.appendChild(inner);

  [[100, 20, 2.8], [130, 205, 2.95], [89, 89, 3.6]].forEach(([cx, cy, delay]) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', cy === 89 ? 2.6 : 3.2);
    dot.setAttribute('class', 'a01-dot');
    dot.style.animationDelay = `${delay}s`;
    svg.appendChild(dot);
  });
}

/* ============================================================
   02 — FLORAL BUTA
   ============================================================ */
function initAnim02() {
  const svg = document.getElementById('svg-02');
  svg.innerHTML = '';

  const CENTER = { x: 100, y: 130 };
  const PETAL_COUNT = 6;
  const PETAL_LENGTH = 60;
  const PETAL_WIDTH = 13;
  const stepDelay = 0.28;

  const tipY = CENTER.y - PETAL_LENGTH;
  const midY = CENTER.y - PETAL_LENGTH * 0.55;
  const d = `M${CENTER.x},${CENTER.y} C${CENTER.x - PETAL_WIDTH},${midY + 15} ${CENTER.x - PETAL_WIDTH * 0.6},${midY - 10} ${CENTER.x},${tipY} ` +
             `C${CENTER.x + PETAL_WIDTH * 0.6},${midY - 10} ${CENTER.x + PETAL_WIDTH},${midY + 15} ${CENTER.x},${CENTER.y} Z`;

  for (let i = 0; i < PETAL_COUNT; i++) {
    const angle = (360 / PETAL_COUNT) * i;
    const petal = document.createElementNS(SVG_NS, 'path');
    petal.setAttribute('d', d);
    petal.setAttribute('pathLength', '1');
    petal.setAttribute('class', 'a02-petal');
    petal.setAttribute('transform', `rotate(${angle} ${CENTER.x} ${CENTER.y})`);
    petal.style.animationDelay = `${0.3 + i * stepDelay}s`;
    svg.appendChild(petal);
  }

  const flowerDrawEnd = 0.3 + PETAL_COUNT * stepDelay + 0.9;

  const knot = document.createElementNS(SVG_NS, 'circle');
  knot.setAttribute('cx', CENTER.x); knot.setAttribute('cy', CENTER.y); knot.setAttribute('r', 7);
  knot.setAttribute('class', 'a02-center-knot');
  knot.style.animationDelay = `${flowerDrawEnd}s`;
  svg.appendChild(knot);

  for (let i = 0; i < PETAL_COUNT; i++) {
    const angle = (360 / PETAL_COUNT) * i * (Math.PI / 180);
    const tipX = CENTER.x + Math.sin(angle) * PETAL_LENGTH;
    const tY = CENTER.y - Math.cos(angle) * PETAL_LENGTH;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', tipX); dot.setAttribute('cy', tY); dot.setAttribute('r', 2.6);
    dot.setAttribute('class', 'a02-tip-dot');
    dot.style.animationDelay = `${flowerDrawEnd + 0.15 + i * 0.08}s`;
    svg.appendChild(dot);
  }
}

/* ============================================================
   03 — JAALI LATTICE
   ============================================================ */
function initAnim03() {
  const svg = document.getElementById('svg-03');
  svg.innerHTML = '';

  const SIZE = 200, MARGIN = 24, LINE_COUNT = 6;

  const frame = document.createElementNS(SVG_NS, 'path');
  frame.setAttribute('d', `M${MARGIN},${MARGIN} L${SIZE - MARGIN},${MARGIN} L${SIZE - MARGIN},${SIZE - MARGIN} L${MARGIN},${SIZE - MARGIN} Z`);
  frame.setAttribute('pathLength', '1');
  frame.setAttribute('class', 'a03-frame');
  svg.appendChild(frame);

  const innerSize = SIZE - MARGIN * 2;
  const step = innerSize / (LINE_COUNT + 1);
  const frameEnd = 1.3;

  const indices = Array.from({ length: LINE_COUNT }, (_, i) => i + 1);
  const center = (LINE_COUNT + 1) / 2;
  const ordered = [...indices].sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  const orderRank = {};
  ordered.forEach((val, rank) => { orderRank[val] = rank; });

  indices.forEach((i) => {
    const pos = MARGIN + step * i;
    const delay = frameEnd + orderRank[i] * 0.12;

    const h = document.createElementNS(SVG_NS, 'line');
    h.setAttribute('x1', MARGIN); h.setAttribute('y1', pos);
    h.setAttribute('x2', SIZE - MARGIN); h.setAttribute('y2', pos);
    h.setAttribute('pathLength', '1'); h.setAttribute('class', 'a03-thread');
    h.style.animationDelay = `${delay}s`;
    svg.appendChild(h);

    const v = document.createElementNS(SVG_NS, 'line');
    v.setAttribute('x1', pos); v.setAttribute('y1', MARGIN);
    v.setAttribute('x2', pos); v.setAttribute('y2', SIZE - MARGIN);
    v.setAttribute('pathLength', '1'); v.setAttribute('class', 'a03-thread');
    v.style.animationDelay = `${delay + 0.06}s`;
    svg.appendChild(v);
  });

  const threadsEnd = frameEnd + (LINE_COUNT - 1) * 0.12 + 0.7;
  // One dot at a time: flatten every crossing into a single list, order it
  // by distance from the centre (so it still sweeps outward), then delay
  // each by its own index — no two dots share a timeslot the way grouping
  // purely by distance did (every crossing at the same radius used to pop
  // together).
  const crossings = [];
  indices.forEach((i) => indices.forEach((j) => {
    crossings.push({ x: MARGIN + step * i, y: MARGIN + step * j, dist: Math.hypot(i - center, j - center) });
  }));
  crossings.sort((a, b) => a.dist - b.dist);
  crossings.forEach((c, idx) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', c.x); dot.setAttribute('cy', c.y); dot.setAttribute('r', 1.6);
    dot.setAttribute('class', 'a03-knot');
    dot.style.animationDelay = `${threadsEnd + idx * 0.045}s`;
    svg.appendChild(dot);
  });
}

/* ============================================================
   04 — RUNNING STITCH BORDER
   (guide path already sits in the HTML; this reads its real
   length via getTotalLength so dash spacing stays literal-sized)
   ============================================================ */
function initAnim04() {
  const svg = document.getElementById('svg-04');
  const guide = document.getElementById('a04-guide');
  const existing = svg.querySelector('.a04-stitch-line');
  if (existing) existing.remove();

  const stitch = document.createElementNS(SVG_NS, 'path');
  stitch.setAttribute('d', guide.getAttribute('d'));
  stitch.setAttribute('class', 'a04-stitch-line');
  svg.appendChild(stitch);

  const length = stitch.getTotalLength();
  stitch.setAttribute('stroke-dasharray', '10 7');
  stitch.setAttribute('stroke-dashoffset', length);

  stitch.animate(
    [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
    { duration: 2600, easing: 'cubic-bezier(0.45,0,0.4,1)', fill: 'forwards' }
  );
}

/* ============================================================
   05 — KNOT CLUSTER
   ============================================================ */
function initAnim05() {
  const svg = document.getElementById('svg-05');
  svg.innerHTML = '';

  const CENTER = { x: 100, y: 130 };
  const KNOT_COUNT = 22, TURNS = 2.4, MAX_RADIUS = 70, STEM_END = 1.7;
  const SPIRAL_SAMPLES = 100, SPIRAL_DRAW_TIME = 1.6;

  const stem = document.createElementNS(SVG_NS, 'path');
  stem.setAttribute('d', `M${CENTER.x},${CENTER.y + 90} C${CENTER.x - 10},${CENTER.y + 40} ${CENTER.x + 10},${CENTER.y + 10} ${CENTER.x},${CENTER.y}`);
  stem.setAttribute('pathLength', '1');
  stem.setAttribute('class', 'a05-stem');
  svg.appendChild(stem);

  // Faint guide so the coil actually reads as a spiral instead of scattered
  // dots — same radius/turns formula the knots below sample from.
  let guideD = '';
  for (let i = 0; i <= SPIRAL_SAMPLES; i++) {
    const t = i / SPIRAL_SAMPLES;
    const angle = t * TURNS * Math.PI * 2;
    const radius = t * MAX_RADIUS;
    const x = CENTER.x + Math.cos(angle) * radius;
    const y = CENTER.y + Math.sin(angle) * radius * 0.85;
    guideD += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  const guide = document.createElementNS(SVG_NS, 'path');
  guide.setAttribute('d', guideD.trim());
  guide.setAttribute('pathLength', '1');
  guide.setAttribute('class', 'a05-spiral-guide');
  guide.style.animationDelay = `${STEM_END}s`;
  svg.appendChild(guide);

  const KNOTS_START = STEM_END + SPIRAL_DRAW_TIME;
  for (let i = 0; i < KNOT_COUNT; i++) {
    const t = i / (KNOT_COUNT - 1);
    const angle = t * TURNS * Math.PI * 2;
    const radius = t * MAX_RADIUS;
    const x = CENTER.x + Math.cos(angle) * radius;
    const y = CENTER.y + Math.sin(angle) * radius * 0.85;

    const isMurri = i % 2 === 0;
    const knot = document.createElementNS(SVG_NS, isMurri ? 'ellipse' : 'circle');
    knot.setAttribute('class', 'a05-knot');
    knot.setAttribute('fill', isMurri ? 'var(--gold)' : 'var(--bone)');
    if (isMurri) {
      knot.setAttribute('cx', x); knot.setAttribute('cy', y);
      knot.setAttribute('rx', 3.4); knot.setAttribute('ry', 2.1);
      knot.setAttribute('transform', `rotate(${(angle * 180) / Math.PI} ${x} ${y})`);
    } else {
      knot.setAttribute('cx', x); knot.setAttribute('cy', y); knot.setAttribute('r', 2.3);
    }
    knot.style.animationDelay = `${KNOTS_START + i * 0.09}s`;
    svg.appendChild(knot);
  }
}

/* ============================================================
   06 — NEEDLE & THREAD
   (markup is static in the HTML. Toggling the .run class does
   NOT reliably restart an offset-path/offset-distance animation
   in Chromium even after a forced reflow — so replay instead
   clones the whole <svg> and swaps it in, which always starts
   clean, the same technique animation 01 uses.)
   ============================================================ */
function initAnim06() {
  const stage = document.getElementById('stage-06');
  const old = document.getElementById('svg-06');
  const clone = old.cloneNode(true);
  stage.replaceChild(clone, old);
}

/* ============================================================
   07 — VINE GROWTH
   ============================================================ */
function initAnim07() {
  const svg = document.getElementById('svg-07');
  svg.innerHTML = '';

  const STEM_D = 'M100,248 C80,210 112,190 96,160 C82,134 108,118 92,90 C80,68 104,52 96,24';
  const STEM_DRAW_TIME = 2.0;
  const LEAF_FRACTIONS = [0.18, 0.32, 0.46, 0.6, 0.74, 0.88];
  const LEAF_SIDE = [1, -1, 1, -1, 1, -1];

  const stem = document.createElementNS(SVG_NS, 'path');
  stem.setAttribute('d', STEM_D);
  stem.setAttribute('pathLength', '1');
  stem.setAttribute('class', 'a07-stem');
  svg.appendChild(stem);

  const totalLength = stem.getTotalLength();
  const leafD = 'M0,0 C6,-6 20,-5 26,0 C20,5 6,6 0,0 Z';

  function angleAt(fracLen) {
    const p1 = stem.getPointAtLength(Math.max(0, fracLen - 1));
    const p2 = stem.getPointAtLength(Math.min(totalLength, fracLen + 1));
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  }

  LEAF_FRACTIONS.forEach((frac, i) => {
    const side = LEAF_SIDE[i];
    const len = frac * totalLength;
    const point = stem.getPointAtLength(len);
    const tangent = angleAt(len);
    const leafAngle = tangent + (side === 1 ? -60 : 120);

    // Position/rotate via an attribute transform on a wrapper <g> — the CSS
    // unfurl animation below only ever touches the child path's CSS
    // transform, so the two never collide (SVG lets CSS transform silently
    // replace an element's own attribute transform rather than combine with
    // it, so positioning and animating the SAME element with both would
    // break — the same gotcha #09's chain links work around the same way).
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${leafAngle}) scale(${side === -1 ? '-1,1' : '1,1'})`);

    const leaf = document.createElementNS(SVG_NS, 'path');
    leaf.setAttribute('d', leafD);
    leaf.setAttribute('class', 'a07-leaf');
    leaf.style.animationDelay = `${STEM_DRAW_TIME + i * 0.28}s`;

    g.appendChild(leaf);
    svg.appendChild(g);

    const bud = document.createElementNS(SVG_NS, 'circle');
    bud.setAttribute('cx', point.x); bud.setAttribute('cy', point.y); bud.setAttribute('r', 1.8);
    bud.setAttribute('class', 'a07-bud');
    bud.style.animationDelay = `${STEM_DRAW_TIME + i * 0.28 + 0.1}s`;
    svg.appendChild(bud);
  });
}

/* ============================================================
   08 — MANDALA ROSETTE
   ============================================================ */
function initAnim08() {
  const svg = document.getElementById('svg-08');
  svg.innerHTML = '';

  const CENTER = { x: 100, y: 100 };
  const FOLD = 8;
  const segD = 'M100,100 L100,42 C111,50 116,63 109,74 C104,83 100,88 100,100 Z';

  for (let i = 0; i < FOLD; i++) {
    const seg = document.createElementNS(SVG_NS, 'path');
    seg.setAttribute('d', segD);
    seg.setAttribute('pathLength', '1');
    seg.setAttribute('class', 'a08-segment');
    seg.setAttribute('transform', `rotate(${(360 / FOLD) * i} ${CENTER.x} ${CENTER.y})`);
    seg.style.animationDelay = `${0.2 + i * 0.16}s`;
    svg.appendChild(seg);
  }

  const segmentsEnd = 0.2 + FOLD * 0.16 + 1.0;

  [30, 20].forEach((r, i) => {
    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('cx', CENTER.x); ring.setAttribute('cy', CENTER.y); ring.setAttribute('r', r);
    ring.setAttribute('pathLength', '1');
    ring.setAttribute('class', 'a08-ring');
    ring.style.animationDelay = `${segmentsEnd + i * 0.2}s`;
    svg.appendChild(ring);
  });

  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', CENTER.x); dot.setAttribute('cy', CENTER.y); dot.setAttribute('r', 5);
  dot.setAttribute('class', 'a08-center-dot');
  dot.style.animationDelay = `${segmentsEnd + 0.5}s`;
  svg.appendChild(dot);
}

/* ============================================================
   09 — CHAIN STITCH
   ============================================================ */
function initAnim09() {
  const svg = document.getElementById('svg-09');
  svg.innerHTML = '';

  const GUIDE_D = 'M14,120 C50,40 90,150 140,80 C180,26 230,140 280,70 C295,50 302,55 306,65';

  const guide = document.createElementNS(SVG_NS, 'path');
  guide.setAttribute('d', GUIDE_D);
  guide.setAttribute('class', 'a09-guide');
  svg.appendChild(guide);

  const totalLength = guide.getTotalLength();
  const LINK_COUNT = 16;
  const loopD = 'M-7,0 C-4,-5 4,-5 7,0 C4,5 -4,5 -7,0 Z'; // centered at local origin

  for (let i = 0; i < LINK_COUNT; i++) {
    const len = (i / (LINK_COUNT - 1)) * totalLength;
    const point = guide.getPointAtLength(len);
    const p1 = guide.getPointAtLength(Math.max(0, len - 2));
    const p2 = guide.getPointAtLength(Math.min(totalLength, len + 2));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    const rotate = angle + (i % 2 === 0 ? 12 : -12); // slight alternating twist, like real chain links

    // Position/rotate via an attribute transform on a wrapper <g> — the CSS
    // animation below only ever touches the child path's CSS transform, so
    // the two never collide (SVG lets CSS transform silently replace an
    // element's own attribute transform rather than combine with it, so
    // positioning and animating the SAME element with both would break).
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${rotate})`);

    const loop = document.createElementNS(SVG_NS, 'path');
    loop.setAttribute('d', loopD);
    loop.setAttribute('class', 'a09-loop');
    loop.style.animationDelay = `${0.2 + i * 0.13}s`;

    g.appendChild(loop);
    svg.appendChild(g);
  }
}

/* ============================================================
   10 — CROSS-STITCH FILL
   (fills a heart silhouette using the classic implicit heart
   inequality as a point-in-shape test against a grid of cells)
   ============================================================ */
function initAnim10() {
  const svg = document.getElementById('svg-10');
  svg.innerHTML = '';

  const CELL = 11;
  const START = 15, END = 185;
  const ARM = 3.6;
  const cells = [];

  for (let cy = START; cy <= END; cy += CELL) {
    for (let cx = START; cx <= END; cx += CELL) {
      const hx = (cx - 100) / 68;
      const hy = -((cy - 108) / 68); // flip: SVG y is down, heart formula expects y up
      const val = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
      if (val <= 0) cells.push({ cx, cy, dist: Math.hypot(cx - 100, cy - 105) });
    }
  }

  cells.sort((a, b) => a.dist - b.dist);

  cells.forEach((cell, i) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.style.animationDelay = `${i * 0.02}s`;

    const line1 = document.createElementNS(SVG_NS, 'line');
    line1.setAttribute('x1', cell.cx - ARM); line1.setAttribute('y1', cell.cy - ARM);
    line1.setAttribute('x2', cell.cx + ARM); line1.setAttribute('y2', cell.cy + ARM);
    line1.setAttribute('pathLength', '1'); line1.setAttribute('class', 'a10-cross');
    line1.style.animationDelay = `${i * 0.018}s`;

    const line2 = document.createElementNS(SVG_NS, 'line');
    line2.setAttribute('x1', cell.cx + ARM); line2.setAttribute('y1', cell.cy - ARM);
    line2.setAttribute('x2', cell.cx - ARM); line2.setAttribute('y2', cell.cy + ARM);
    line2.setAttribute('pathLength', '1'); line2.setAttribute('class', 'a10-cross');
    line2.style.animationDelay = `${i * 0.018 + 0.05}s`;

    svg.appendChild(line1);
    svg.appendChild(line2);
  });
}

/* ============================================================================
   THE 32 STITCHES — Lucknowi Chikankari
   ============================================================================
   Everything below animates the 32 named stitches from our-craft.html, grouped
   into the same four families the site uses (flat / raised & embossed / jaali
   / decorative & finishing). Three are EXACT reuses of a technique above, per
   the brief (Zanzeera = chain stitch, Jaali = the lattice, Murri/Phanda = the
   knot spiral) — everything else is a new animation, but several lean on a
   small set of shared generator functions (drawStrokePath, popShape,
   popShapeAt, drawLatticeGrid, drawVineWithLeaves) so near-identical stitch
   families (the five jaali variants, the two leaf-border stitches, the three
   knot stitches) don't each carry a hand-rolled copy of the same drawing
   code. Every DOM node still gets its own scoped class + animationDelay,
   same pattern as initAnim01–10 above.

   Card ids follow `stitch-NN` / `svg-sNN`, keyed into STITCH_INITS as 'sNN'.
   ============================================================================ */

/* ---- tiny DOM helper --------------------------------------------------- */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

/* ---- shared generator: a stroke that draws itself in ------------------- */
// Reused by nearly every flat/finishing stitch below. Relies on the shared
// .stitch-line / @keyframes stitch-draw rule in style.css (stroke-dasharray:1
// + pathLength="1", same dash-reveal trick as motif-01/03/05/07/08's paths).
function drawStrokePath(container, d, opts = {}) {
  const { color = 'var(--gold)', width = 1.6, dur = 1.4, delay = 0, opacity = 1, extraClass = '' } = opts;
  const p = svgEl('path', { d, pathLength: '1', class: `stitch-line ${extraClass}`.trim() });
  p.style.stroke = color;
  p.style.strokeWidth = width;
  p.style.opacity = opacity;
  p.style.setProperty('--dur', `${dur}s`);
  p.style.animationDelay = `${delay}s`;
  container.appendChild(p);
  return p;
}

/* ---- shared generator: a shape that pops/knots into place --------------- */
function popShape(container, tag, attrs, opts = {}) {
  const { color = 'var(--bone)', dur = 0.45, delay = 0, cls = 'stitch-dot' } = opts;
  const el = svgEl(tag, attrs);
  el.classList.add(cls);
  el.style.fill = color;
  el.style.setProperty('--dur', `${dur}s`);
  el.style.animationDelay = `${delay}s`;
  container.appendChild(el);
  return el;
}

// Same as popShape, but for a shape that ALSO needs an attribute transform
// (translate/rotate/scale) for its position — wrapped in its own <g> so the
// CSS pop/scale animation on the child never collides with the positioning
// transform on the parent (the exact bug fixed in Vine Growth's leaves: a
// CSS `transform` on an SVG element silently replaces its attribute
// `transform` rather than combining with it).
function popShapeAt(container, tag, attrs, transform, opts = {}) {
  const { color = 'var(--gold)', dur = 0.5, delay = 0, cls = 'stitch-shape', stroke = null, strokeWidth = 1.4 } = opts;
  const g = svgEl('g', { transform });
  const el = svgEl(tag, attrs);
  el.classList.add(cls);
  if (stroke) { el.style.stroke = stroke; el.style.fill = 'none'; el.style.strokeWidth = strokeWidth; }
  else { el.style.fill = color; }
  el.style.setProperty('--dur', `${dur}s`);
  el.style.animationDelay = `${delay}s`;
  g.appendChild(el);
  container.appendChild(g);
  return g;
}

/* ---- shared generator: a curved stem with leaves along it --------------- */
// Generalizes initAnim07 (Vine Growth) so it can be reused, at different
// scales/densities, for both Ghas Patti's grass-leaf rows and Dhania Patti's
// fine trailing-vine border.
function drawVineWithLeaves(container, opts) {
  const { stemD, leafFractions, leafSides, leafScale = 1, stemColor = 'var(--gold-deep)',
          stemWidth = 1.6, stemDur = 1.8, stemDelay = 0.15, leafGap = 0.22, budR = 1.6 } = opts;

  const stem = drawStrokePath(container, stemD, { color: stemColor, width: stemWidth, dur: stemDur, delay: stemDelay });
  const totalLength = stem.getTotalLength();
  const s = leafScale;
  const leafD = `M0,0 C${6*s},${-6*s} ${20*s},${-5*s} ${26*s},0 C${20*s},${5*s} ${6*s},${6*s} 0,0 Z`;
  const stemEnd = stemDelay + stemDur;

  leafFractions.forEach((frac, i) => {
    const side = leafSides[i % leafSides.length];
    const len = frac * totalLength;
    const point = stem.getPointAtLength(len);
    const p1 = stem.getPointAtLength(Math.max(0, len - 1));
    const p2 = stem.getPointAtLength(Math.min(totalLength, len + 1));
    const tangent = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    const leafAngle = tangent + (side === 1 ? -60 : 120);
    const transform = `translate(${point.x} ${point.y}) rotate(${leafAngle}) scale(${side === -1 ? '-1,1' : '1,1'})`;
    const delay = stemEnd + i * leafGap;
    popShapeAt(container, 'path', { d: leafD }, transform, { color: 'var(--gold)', dur: 0.55, delay, cls: 'stitch-shape' });
    popShape(container, 'circle', { cx: point.x, cy: point.y, r: budR }, { color: 'var(--bone)', dur: 0.4, delay: delay + 0.1 });
  });

  return { totalLength, stemEnd };
}

/* ---- shared generator: a knot spiral (Murri / Phanda / Dhum) ----------- */
// Generalizes initAnim05 (Knot Cluster) — same faint spiral guide + outward
// coil of knots, but the knot shape/size/count is parameterized so the three
// closely-related raised stitches can each get an accurate, distinct look
// from one function instead of three near-duplicates.
function drawKnotSpiral(container, opts = {}) {
  const {
    center = { x: 100, y: 130 }, knotCount = 18, turns = 2.2, maxRadius = 65,
    stemD = null, stemEnd = 1.5, spiralDrawTime = 1.4,
    knotKind = 'murri', knotSize = 3.2, knotGap = 0.1,
  } = opts;

  if (stemD) drawStrokePath(container, stemD, { color: 'var(--gold-deep)', width: 1, dur: stemEnd, opacity: 0.5, delay: 0.1 });

  let guideD = '';
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const angle = t * turns * Math.PI * 2;
    const radius = t * maxRadius;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius * 0.85;
    guideD += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  drawStrokePath(container, guideD.trim(), { color: 'var(--gold-deep)', width: 0.8, dur: spiralDrawTime, opacity: 0.35, delay: stemEnd });

  const knotsStart = stemEnd + spiralDrawTime;
  for (let i = 0; i < knotCount; i++) {
    const t = i / (knotCount - 1);
    const angle = t * turns * Math.PI * 2;
    const radius = t * maxRadius;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius * 0.85;
    const delay = knotsStart + i * knotGap;

    if (knotKind === 'murri') {
      // rice-grain: an ellipse, alternating gold/bone
      popShapeAt(container, 'ellipse', { cx: 0, cy: 0, rx: knotSize, ry: knotSize * 0.62 },
        `translate(${x} ${y}) rotate(${(angle * 180) / Math.PI})`,
        { color: i % 2 === 0 ? 'var(--gold)' : 'var(--bone)', dur: 0.5, delay, cls: 'stitch-shape' });
    } else {
      // phanda/dhum: a plain round knot, sized per stitch
      popShape(container, 'circle', { cx: x, cy: y, r: knotSize }, { color: i % 3 === 0 ? 'var(--bone)' : 'var(--gold)', dur: 0.45, delay });
    }
  }
  return { knotsStart };
}

/* ---- shared generator: the jaali trellis grid --------------------------- */
// Generalizes initAnim03 (Jaali Lattice): frame first, then threads drawn
// from the centre outward, then knots at the crossings. Parameterized by
// bounding box, line count/spacing axis and rotation, so the five trellis
// variants (Jaali, Madrazi, Sidhaul, Hathkadi, Bank Jaali) share one
// implementation instead of five copies that would drift out of sync.
function drawLatticeGrid(container, opts = {}) {
  const {
    x0 = 24, y0 = 24, x1 = 176, y1 = 176, lineCount = 6, angle = 0,
    axis = 'both', drawFrame = true, drawKnots = true,
    frameDelay = 0.2, frameDur = 1.0, threadDur = 0.5, threadStagger = 0.11,
  } = opts;

  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const g = angle ? svgEl('g', { transform: `rotate(${angle} ${cx} ${cy})` }) : container;
  if (angle) container.appendChild(g);

  if (drawFrame) drawStrokePath(g, `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`, { width: 1.5, dur: frameDur, delay: frameDelay });

  const w = x1 - x0, h = y1 - y0;
  const stepX = w / (lineCount + 1), stepY = h / (lineCount + 1);
  const indices = Array.from({ length: lineCount }, (_, i) => i + 1);
  const center = (lineCount + 1) / 2;
  const ordered = [...indices].sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  const rank = {}; ordered.forEach((v, r) => { rank[v] = r; });
  const frameEnd = drawFrame ? frameDelay + frameDur : frameDelay;

  indices.forEach((i) => {
    const delay = frameEnd + rank[i] * threadStagger;
    if (axis === 'both' || axis === 'horizontal') {
      drawStrokePath(g, `M${x0},${y0 + stepY * i} L${x1},${y0 + stepY * i}`, { color: 'var(--gold-deep)', width: 1, dur: threadDur, delay, opacity: 0.75 });
    }
    if (axis === 'both' || axis === 'vertical') {
      drawStrokePath(g, `M${x0 + stepX * i},${y0} L${x0 + stepX * i},${y1}`, { color: 'var(--gold-deep)', width: 1, dur: threadDur, delay: delay + 0.06, opacity: 0.75 });
    }
  });

  const threadsEnd = frameEnd + (lineCount - 1) * threadStagger + threadDur;
  if (drawKnots) {
    // Same one-at-a-time reveal as motif-03: flatten every crossing, order
    // by distance from centre for an outward sweep, then give each its own
    // delay slot so dots never share a timeslot (that's what made rings of
    // equidistant dots pop together and read as "dropping" onto the grid).
    const crossings = [];
    indices.forEach((i) => indices.forEach((j) => {
      crossings.push({ cx: x0 + stepX * i, cy: y0 + stepY * j, dist: Math.hypot(i - center, j - center) });
    }));
    crossings.sort((a, b) => a.dist - b.dist);
    const knotStagger = Math.min(0.05, 1.2 / crossings.length);
    crossings.forEach((c, idx) => {
      popShape(g, 'circle', { cx: c.cx, cy: c.cy, r: 1.6 }, { dur: 0.28, delay: threadsEnd + idx * knotStagger, cls: 'stitch-lattice-dot' });
    });
  }
  return { frameEnd, threadsEnd };
}

/* ============================================================
   FLAT STITCHES (family one)
   ============================================================ */

// 01 — Tepchi: the literal running stitch — EXACT same technique as motif-04
function initStitch01() {
  const svg = document.getElementById('svg-s01');
  const guide = document.getElementById('a-s01-guide');
  svg.querySelectorAll('.stitch-dash-line').forEach((n) => n.remove());
  const stitch = svgEl('path', { d: guide.getAttribute('d'), class: 'stitch-dash-line' });
  svg.appendChild(stitch);
  const length = stitch.getTotalLength();
  stitch.setAttribute('stroke-dasharray', '9 6');
  stitch.setAttribute('stroke-dashoffset', length);
  stitch.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { duration: 2200, easing: 'cubic-bezier(0.45,0,0.4,1)', fill: 'forwards' });
}

// 02 — Bakhiya: shadow-work herringbone worked from the reverse — a spine
// with X-crossed herringbone ticks laid down in alternating pairs along it.
function initStitch02() {
  const svg = document.getElementById('svg-s02');
  svg.innerHTML = '';
  const spineD = 'M10,80 C60,60 100,100 150,80 C200,60 250,100 310,80';
  const spine = drawStrokePath(svg, spineD, { color: 'var(--gold-deep)', width: 0.8, dur: 1.4, opacity: 0.4 });
  const total = spine.getTotalLength();
  const TICKS = 14;
  for (let i = 0; i < TICKS; i++) {
    const len = (i / (TICKS - 1)) * total;
    const p = spine.getPointAtLength(len);
    const delay = 1.4 + i * 0.09;
    drawStrokePath(svg, `M${p.x - 9},${p.y - 12} L${p.x + 9},${p.y + 12}`, { width: 1.6, dur: 0.28, delay });
    drawStrokePath(svg, `M${p.x + 9},${p.y - 12} L${p.x - 9},${p.y + 12}`, { color: 'var(--gold-deep)', width: 1.6, dur: 0.28, delay: delay + 0.1 });
  }
}

// 03 — Khatau: a motif is embroidered separately, then laid over and
// stitched onto the fabric — an outline draws, a filled "applied" patch
// fades in on top, then small tacking stitches ring its edge.
function initStitch03() {
  const svg = document.getElementById('svg-s03');
  svg.innerHTML = '';
  const petalD = 'M100,50 C130,55 145,85 130,115 C118,138 100,150 100,150 C100,150 82,138 70,115 C55,85 70,55 100,50 Z';
  const outline = drawStrokePath(svg, petalD, { width: 1.6, dur: 1.3, delay: 0.1 });
  const fill = svgEl('path', { d: petalD, class: 'stitch-fade' });
  fill.style.fill = 'var(--gold)'; fill.style.opacity = '0';
  fill.style.setProperty('--dur', '0.6s'); fill.style.animationDelay = '1.5s';
  fill.style.fillOpacity = '0.18';
  svg.appendChild(fill);
  const total = outline.getTotalLength();
  const TACKS = 16;
  for (let i = 0; i < TACKS; i++) {
    const len = (i / TACKS) * total;
    const p = outline.getPointAtLength(len);
    popShape(svg, 'circle', { cx: p.x, cy: p.y, r: 1.6 }, { delay: 2.2 + i * 0.05 });
  }
}

// 04 — Pechni: a tightly twisted outline — small alternating diagonal ticks
// along a curve, suggesting a coiled/twisted thread rather than a flat line.
function initStitch04() {
  const svg = document.getElementById('svg-s04');
  svg.innerHTML = '';
  const guideD = 'M10,80 C60,30 100,130 150,80 C200,30 240,130 310,80';
  const guide = drawStrokePath(svg, guideD, { color: 'var(--gold-deep)', width: 0.6, dur: 0.01, opacity: 0.18, delay: 0 });
  const total = guide.getTotalLength();
  const TWISTS = 36;
  for (let i = 0; i < TWISTS; i++) {
    const len = (i / (TWISTS - 1)) * total;
    const p = guide.getPointAtLength(len);
    const p2 = guide.getPointAtLength(Math.min(total, len + 1));
    const tangent = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
    const twist = tangent + (i % 2 === 0 ? 55 : -55);
    const rad = (twist * Math.PI) / 180;
    const hx = Math.cos(rad) * 6, hy = Math.sin(rad) * 6;
    drawStrokePath(svg, `M${p.x - hx},${p.y - hy} L${p.x + hx},${p.y + hy}`, { width: 1.8, dur: 0.22, delay: i * 0.045 });
  }
}

// 05 — Rahet: a solid double-back stitch, most often doubled as "dohra
// bakhiya" — two overlapping lines drawn one after the other for a firm,
// continuous outline.
function initStitch05() {
  const svg = document.getElementById('svg-s05');
  svg.innerHTML = '';
  const lineD = 'M10,90 C60,50 100,130 150,90 C200,50 240,130 310,90';
  drawStrokePath(svg, lineD, { width: 2.2, dur: 1.5, delay: 0.1 });
  drawStrokePath(svg, lineD, { color: 'var(--gold-deep)', width: 1, dur: 1.5, delay: 1.55, opacity: 0.6 });
}

// 06 — Banjkali: interlocking twisted stitch along a border — small
// figure-eight links, alternating over/under, worked one at a time.
function initStitch06() {
  const svg = document.getElementById('svg-s06');
  svg.innerHTML = '';
  const guideD = 'M14,80 C50,50 80,110 116,80 C152,50 182,110 218,80 C254,50 284,110 306,85';
  const guide = drawStrokePath(svg, guideD, { color: 'var(--bone)', width: 0.5, dur: 0.01, opacity: 0.1 });
  const total = guide.getTotalLength();
  const LINKS = 12;
  const linkD = 'M-8,0 C-8,-6 -1,-6 0,0 C1,-6 8,-6 8,0 C8,6 1,6 0,0 C-1,6 -8,6 -8,0 Z';
  for (let i = 0; i < LINKS; i++) {
    const len = (i / (LINKS - 1)) * total;
    const p = guide.getPointAtLength(len);
    const p2 = guide.getPointAtLength(Math.min(total, len + 1));
    const tangent = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
    popShapeAt(svg, 'path', { d: linkD }, `translate(${p.x} ${p.y}) rotate(${tangent + (i % 2 === 0 ? 20 : -20)})`,
      { stroke: 'var(--gold)', strokeWidth: 1.5, dur: 0.4, delay: i * 0.17, cls: 'stitch-shape' });
  }
}

// 07 — Keel Kangan: a stem-stitch outline for a bangle-shaped border — a
// closed loop draws, with small diagonal stem-stitch ticks along it.
function initStitch07() {
  const svg = document.getElementById('svg-s07');
  svg.innerHTML = '';
  const ringD = 'M100,40 C140,40 168,68 168,100 C168,132 140,160 100,160 C60,160 32,132 32,100 C32,68 60,40 100,40 Z';
  const ring = drawStrokePath(svg, ringD, { color: 'var(--gold-deep)', width: 0.7, dur: 0.01, opacity: 0.25 });
  const total = ring.getTotalLength();
  const TICKS = 30;
  for (let i = 0; i < TICKS; i++) {
    const len = (i / TICKS) * total;
    const p = ring.getPointAtLength(len);
    const p2 = ring.getPointAtLength((len + 1) % total);
    const tangent = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
    const rad = ((tangent + 60) * Math.PI) / 180;
    const hx = Math.cos(rad) * 5, hy = Math.sin(rad) * 5;
    drawStrokePath(svg, `M${p.x - hx},${p.y - hy} L${p.x + hx},${p.y + hy}`, { width: 1.6, dur: 0.22, delay: i * 0.045 });
  }
}

// 08 — Ghas Patti: "grass leaf" — graduated V-shaped stitches worked in rows
// along a spine to fill a petal or leaf, reusing the vine/leaf generator at
// a fine scale with V-ticks instead of full leaf blades.
function initStitch08() {
  const svg = document.getElementById('svg-s08');
  svg.innerHTML = '';
  const spineD = 'M100,235 C95,190 105,150 100,110 C96,75 104,45 100,20';
  const spine = drawStrokePath(svg, spineD, { color: 'var(--gold-deep)', width: 1, dur: 1.5, delay: 0.1, opacity: 0.5 });
  const total = spine.getTotalLength();
  const ROWS = 16;
  const stemEnd = 1.6;
  for (let i = 0; i < ROWS; i++) {
    const frac = i / (ROWS - 1);
    const len = frac * total;
    const p = spine.getPointAtLength(len);
    const p2 = spine.getPointAtLength(Math.min(total, len + 1));
    const tangent = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
    const bladeLen = 14 + (1 - Math.abs(frac - 0.5) * 2) * 16; // longer mid-leaf, tapering at both ends
    [1, -1].forEach((side) => {
      const rad = ((tangent + side * 68) * Math.PI) / 180;
      const tipX = p.x + Math.cos(rad) * bladeLen, tipY = p.y + Math.sin(rad) * bladeLen;
      drawStrokePath(svg, `M${p.x},${p.y} L${tipX},${tipY}`, { width: 1.5, dur: 0.3, delay: stemEnd + i * 0.09 + (side === -1 ? 0.05 : 0) });
    });
  }
}

/* ============================================================
   RAISED & EMBOSSED STITCHES (family two)
   ============================================================ */

// 09 — Murri: rice-grain knots along the outward spiral — EXACT technique
// from Knot Cluster (motif-05), murri knots only.
function initStitch09() {
  const svg = document.getElementById('svg-s09');
  svg.innerHTML = '';
  const stemD = 'M100,220 C90,180 110,150 100,130';
  drawKnotSpiral(svg, { stemD, stemEnd: 1.2, knotCount: 20, turns: 2.3, maxRadius: 68, knotKind: 'murri', knotSize: 3.4, knotGap: 0.09 });
}

// 10 — Phanda: the same spiral technique, sized down — a smaller, more
// delicate millet-shaped knot, most often clustered at a flower's centre.
function initStitch10() {
  const svg = document.getElementById('svg-s10');
  svg.innerHTML = '';
  const stemD = 'M100,220 C90,180 110,150 100,130';
  drawKnotSpiral(svg, { stemD, stemEnd: 1.0, knotCount: 26, turns: 2.6, maxRadius: 55, knotKind: 'phanda', knotSize: 1.9, knotGap: 0.07 });
}

// 11 — Dhum (Gol Murri): a rounder, fuller knot — same spiral again, fewer
// and larger circles for a denser floral centre.
function initStitch11() {
  const svg = document.getElementById('svg-s11');
  svg.innerHTML = '';
  const stemD = 'M100,220 C90,180 110,150 100,130';
  drawKnotSpiral(svg, { stemD, stemEnd: 1.0, knotCount: 14, turns: 1.8, maxRadius: 60, knotKind: 'phanda', knotSize: 4.4, knotGap: 0.12 });
}

// 12 — Muthra: tiny pearl-like stitches beaded along a border.
function initStitch12() {
  const svg = document.getElementById('svg-s12');
  svg.innerHTML = '';
  const guideD = 'M10,90 C60,40 100,140 150,90 C200,40 250,140 310,90';
  const guide = drawStrokePath(svg, guideD, { color: 'var(--bone)', width: 0.5, dur: 0.01, opacity: 0.12 });
  const total = guide.getTotalLength();
  const BEADS = 34;
  for (let i = 0; i < BEADS; i++) {
    const p = guide.getPointAtLength((i / (BEADS - 1)) * total);
    popShape(svg, 'circle', { cx: p.x, cy: p.y, r: 2.4 }, { color: i % 4 === 0 ? 'var(--gold)' : 'var(--bone)', dur: 0.35, delay: i * 0.055 });
  }
}

// 13 — Zanzeera: the chain stitch itself. EXACT reuse — same loop-along-a-
// curve technique as motif-09, applied to this card's own guide curve.
function initStitch13() {
  const svg = document.getElementById('svg-s13');
  svg.innerHTML = '';
  const guideD = 'M14,100 C50,40 90,150 140,80 C180,26 230,140 280,70 C295,50 302,55 306,65';
  const guide = svgEl('path', { d: guideD });
  const total = guide.getTotalLength();
  const LINKS = 16;
  const loopD = 'M-7,0 C-4,-5 4,-5 7,0 C4,5 -4,5 -7,0 Z';
  for (let i = 0; i < LINKS; i++) {
    const len = (i / (LINKS - 1)) * total;
    const p = guide.getPointAtLength(len);
    const p1 = guide.getPointAtLength(Math.max(0, len - 2));
    const p2 = guide.getPointAtLength(Math.min(total, len + 2));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    const rotate = angle + (i % 2 === 0 ? 12 : -12);
    popShapeAt(svg, 'path', { d: loopD }, `translate(${p.x} ${p.y}) rotate(${rotate})`, { stroke: 'var(--gold)', strokeWidth: 1.6, dur: 0.4, delay: 0.2 + i * 0.13, cls: 'stitch-shape' });
  }
}

// 14 — Hool: a detached eyelet — a small hole opens, then satin ticks rim it
// like a sunburst, forming a flower's centre.
function initStitch14() {
  const svg = document.getElementById('svg-s14');
  svg.innerHTML = '';
  const CENTER = { x: 100, y: 100 }, R = 12, TICKS = 20;
  popShape(svg, 'circle', { cx: CENTER.x, cy: CENTER.y, r: R * 0.4 }, { color: 'var(--ink)', dur: 0.5, delay: 0.1, cls: 'stitch-shape' });
  for (let i = 0; i < TICKS; i++) {
    const angle = (360 / TICKS) * i * (Math.PI / 180);
    const x1 = CENTER.x + Math.cos(angle) * R * 0.5, y1 = CENTER.y + Math.sin(angle) * R * 0.5;
    const x2 = CENTER.x + Math.cos(angle) * R * 1.6, y2 = CENTER.y + Math.sin(angle) * R * 1.6;
    drawStrokePath(svg, `M${x1},${y1} L${x2},${y2}`, { width: 1.8, dur: 0.25, delay: 0.65 + i * 0.045 });
  }
}

// 15 — Bijli (Lightning): a sharp zigzag stitch, drawn as one continuous bolt.
function initStitch15() {
  const svg = document.getElementById('svg-s15');
  svg.innerHTML = '';
  const boltD = 'M20,30 L70,80 L45,90 L110,140 L88,100 L160,150 L135,95 L220,130 L195,80 L300,120';
  drawStrokePath(svg, boltD, { width: 2.4, dur: 1.6, delay: 0.15 });
}

// 16 — Kapkapi: a quivering, closely-set stitch that catches the light — a
// dense row of short ticks placed in quick succession, then a shimmer pulse.
function initStitch16() {
  const svg = document.getElementById('svg-s16');
  svg.innerHTML = '';
  const guideD = 'M14,80 C80,50 140,110 200,80 C240,60 270,90 306,75';
  const guide = drawStrokePath(svg, guideD, { color: 'var(--bone)', width: 0.5, dur: 0.01, opacity: 0.1 });
  const total = guide.getTotalLength();
  const TICKS = 46;
  // Each tick's own draw must finish before the next one starts, or several
  // end up mid-stroke at once and read as a band lighting up together
  // rather than individual stitches — so the stagger has to be >= the draw
  // duration, not a fraction of it.
  const TICK_DUR = 0.08, TICK_STAGGER = 0.085;
  const ticks = [];
  for (let i = 0; i < TICKS; i++) {
    const p = guide.getPointAtLength((i / (TICKS - 1)) * total);
    const p2 = guide.getPointAtLength(Math.min(total, (i / (TICKS - 1)) * total + 1));
    const tangent = Math.atan2(p2.y - p.y, p2.x - p.x) * (180 / Math.PI);
    const rad = ((tangent + 90) * Math.PI) / 180;
    const hx = Math.cos(rad) * 5, hy = Math.sin(rad) * 5;
    const tick = drawStrokePath(svg, `M${p.x - hx},${p.y - hy} L${p.x + hx},${p.y + hy}`, { width: 1.6, dur: TICK_DUR, delay: i * TICK_STAGGER });
    ticks.push(tick);
  }
  // Shimmer only kicks in once every stitch has finished being made.
  const shimmerStart = (TICKS - 1) * TICK_STAGGER + TICK_DUR + 0.25;
  ticks.forEach((t, i) => {
    t.classList.add('stitch-shimmer');
    t.style.animationDelay = `${i * TICK_STAGGER}s, ${shimmerStart + i * 0.02}s`;
  });
}

/* ============================================================
   JAALI — OPEN TRELLIS WORK (family three)
   ============================================================ */

// 17 — Jaali: the classic trellis. EXACT reuse of the Jaali Lattice
// technique (motif-03), same frame → threads → knots build order.
function initStitch17() {
  const svg = document.getElementById('svg-s17');
  svg.innerHTML = '';
  drawLatticeGrid(svg, { lineCount: 6 });
}

// 18 — Bulbul Chashm: "nightingale's eye" — small round eyelets instead of
// straight threads, opening from the centre outward.
function initStitch18() {
  const svg = document.getElementById('svg-s18');
  svg.innerHTML = '';
  const SIZE = 200, MARGIN = 34, COUNT = 4;
  const step = (SIZE - MARGIN * 2) / (COUNT - 1);
  const center = (COUNT - 1) / 2;
  const cells = [];
  for (let j = 0; j < COUNT; j++) for (let i = 0; i < COUNT; i++) cells.push({ x: MARGIN + step * i, y: MARGIN + step * j, d: Math.hypot(i - center, j - center) });
  cells.sort((a, b) => a.d - b.d);
  cells.forEach((c, idx) => {
    drawStrokePath(svg, `M${c.x - 5},${c.y} a5,4 0 1,0 10,0 a5,4 0 1,0 -10,0`, { width: 1.3, dur: 0.45, delay: idx * 0.1 });
  });
}

// 19 — Madrazi: a denser trellis — same lattice generator, more lines.
function initStitch19() {
  const svg = document.getElementById('svg-s19');
  svg.innerHTML = '';
  drawLatticeGrid(svg, { lineCount: 9, threadStagger: 0.07, threadDur: 0.35 });
}

// 20 — Sidhaul Jaali: a straight-line variation used for geometric fills —
// same generator, fewer/wider lines, no diagonal.
function initStitch20() {
  const svg = document.getElementById('svg-s20');
  svg.innerHTML = '';
  drawLatticeGrid(svg, { lineCount: 4, threadDur: 0.6, threadStagger: 0.16 });
}

// 21 — Hathkadi: a narrow-band straight-line jaali for borders and cuffs —
// same generator, vertical rungs only inside a wide, short frame.
function initStitch21() {
  const svg = document.getElementById('svg-s21');
  svg.innerHTML = '';
  drawLatticeGrid(svg, { x0: 20, y0: 50, x1: 300, y1: 110, lineCount: 10, axis: 'vertical', drawKnots: false, threadDur: 0.3, threadStagger: 0.06 });
}

// 22 — Bank Jaali: an angled, diagonal variation opened on the bias for a
// basket-woven look — same generator, whole grid rotated 45°.
function initStitch22() {
  const svg = document.getElementById('svg-s22');
  svg.innerHTML = '';
  drawLatticeGrid(svg, { lineCount: 7, angle: 45, threadStagger: 0.08, threadDur: 0.4 });
}

// 23 — Phool Jaali: trellis opened within the exact shape of a flower or
// petal outline — the lattice is clipped to a drawn petal silhouette.
function initStitch23() {
  const svg = document.getElementById('svg-s23');
  svg.innerHTML = '';
  const petalD = 'M100,26 C138,30 158,62 152,98 C147,130 122,152 100,174 C78,152 53,130 48,98 C42,62 62,30 100,26 Z';
  drawStrokePath(svg, petalD, { width: 1.7, dur: 1.4, delay: 0.1 });

  const clipId = 'phool-clip-' + Math.random().toString(36).slice(2, 8);
  const defs = svgEl('defs');
  const clip = svgEl('clipPath', { id: clipId });
  clip.appendChild(svgEl('path', { d: petalD }));
  defs.appendChild(clip);
  svg.appendChild(defs);

  const g = svgEl('g', { 'clip-path': `url(#${clipId})` });
  svg.appendChild(g);
  drawLatticeGrid(g, { x0: 40, y0: 40, x1: 160, y1: 160, lineCount: 7, drawFrame: false, drawKnots: false, frameDelay: 1.6, threadDur: 0.4, threadStagger: 0.05 });
}

// 24 — Taj Mahal: an elaborate, architecturally symmetric trellis pattern —
// a domed arch outline, lattice filling the window, flanking finials either
// side for the monument's symmetry.
function initStitch24() {
  const svg = document.getElementById('svg-s24');
  svg.innerHTML = '';
  const archD = 'M60,220 L60,120 C60,80 76,50 100,50 C124,50 140,80 140,120 L140,220 Z';
  drawStrokePath(svg, archD, { width: 1.7, dur: 1.5, delay: 0.1 });

  const clipId = 'taj-clip-' + Math.random().toString(36).slice(2, 8);
  const defs = svgEl('defs');
  const clip = svgEl('clipPath', { id: clipId });
  clip.appendChild(svgEl('path', { d: archD }));
  defs.appendChild(clip);
  svg.appendChild(defs);
  const g = svgEl('g', { 'clip-path': `url(#${clipId})` });
  svg.appendChild(g);
  drawLatticeGrid(g, { x0: 55, y0: 55, x1: 145, y1: 215, lineCount: 5, drawFrame: false, drawKnots: false, frameDelay: 1.7, threadDur: 0.35, threadStagger: 0.06 });

  [[30, 220], [170, 220]].forEach(([x, y], i) => {
    drawStrokePath(svg, `M${x},${y} L${x},${y - 60}`, { width: 1.4, dur: 0.6, delay: 2.4 + i * 0.15 });
    popShape(svg, 'circle', { cx: x, cy: y - 63, r: 3 }, { delay: 3.0 + i * 0.15 });
  });
}

/* ============================================================
   DECORATIVE & FINISHING STITCHES (family four)
   ============================================================ */

// 25 — Turpai: a fine hemming stitch that finishes a raw edge as what reads
// like one unbroken thread — a solid line with tiny whip-ticks catching the
// edge at intervals.
function initStitch25() {
  const svg = document.getElementById('svg-s25');
  svg.innerHTML = '';
  const hemD = 'M14,110 L306,110';
  const hem = drawStrokePath(svg, hemD, { width: 1.8, dur: 1.3, delay: 0.1 });
  const total = hem.getTotalLength();
  const TICKS = 24;
  for (let i = 0; i < TICKS; i++) {
    const p = hem.getPointAtLength((i / (TICKS - 1)) * total);
    drawStrokePath(svg, `M${p.x},${p.y} L${p.x + 6},${p.y - 14}`, { width: 1.2, dur: 0.2, delay: 1.4 + i * 0.05 });
  }
}

// 26 — Darzdari: the family of decorative seam stitches — represented as a
// scalloped run of small diamonds marching along a seam.
function initStitch26() {
  const svg = document.getElementById('svg-s26');
  svg.innerHTML = '';
  const seamD = 'M14,80 L306,80';
  drawStrokePath(svg, seamD, { color: 'var(--bone)', width: 0.6, dur: 0.01, opacity: 0.15 });
  const DIAMONDS = 14;
  for (let i = 0; i < DIAMONDS; i++) {
    const x = 14 + (292 / (DIAMONDS - 1)) * i;
    const d = `M${x},${80 - 10} L${x + 8},80 L${x},${80 + 10} L${x - 8},80 Z`;
    drawStrokePath(svg, d, { width: 1.5, dur: 0.35, delay: i * 0.13 });
  }
}

// 27 — Chanapatti: "gram leaf" — small rounded leaf shapes fill a leaf
// silhouette row by row, tighter and fuller than ghas patti (reuses the
// point-in-shape fill technique from Cross-Stitch, with leaf marks and an
// oval boundary instead of X's and a heart).
function initStitch27() {
  const svg = document.getElementById('svg-s27');
  svg.innerHTML = '';
  const CELL = 15, CENTER = { x: 100, y: 100 };
  const cells = [];
  for (let cy = 30; cy <= 170; cy += CELL) {
    for (let cx = 40; cx <= 160; cx += CELL) {
      const nx = (cx - CENTER.x) / 62, ny = (cy - CENTER.y) / 78;
      if (nx * nx + ny * ny <= 1) cells.push({ cx, cy, dist: Math.hypot(cx - CENTER.x, cy - CENTER.y) });
    }
  }
  cells.sort((a, b) => a.dist - b.dist);
  const leafD = 'M-5,4 C-5,-2 0,-6 5,-6 C4,0 2,5 -5,4 Z';
  cells.forEach((c, i) => {
    popShapeAt(svg, 'path', { d: leafD }, `translate(${c.cx} ${c.cy}) rotate(${(i * 47) % 360})`, { color: i % 5 === 0 ? 'var(--gold-deep)' : 'var(--gold)', dur: 0.3, delay: i * 0.02, cls: 'stitch-shape' });
  });
}

// 28 — Dhania Patti: "coriander leaf" — a fine leaf border for delicate
// trailing vines. Reuses the vine/leaf generator at a finer scale and higher
// density than Ghas Patti's grass rows.
function initStitch28() {
  const svg = document.getElementById('svg-s28');
  svg.innerHTML = '';
  const stemD = 'M100,248 C82,205 114,185 96,150 C80,118 110,95 92,60 C78,34 106,20 98,4';
  const fractions = [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.94];
  const sides = [1, -1, 1, -1, 1, -1, 1, -1];
  drawVineWithLeaves(svg, { stemD, leafFractions: fractions, leafSides: sides, leafScale: 0.55, stemDur: 1.9, leafGap: 0.16, budR: 1.2 });
}

// 29 — Rozan: a rose-inspired decorative stitch worked in small clustered
// florets — reuses the Floral Buta petal-bloom technique, at a small scale,
// three times over for a cluster.
function initStitch29() {
  const svg = document.getElementById('svg-s29');
  svg.innerHTML = '';
  const clusters = [{ x: 82, y: 90, delay: 0 }, { x: 128, y: 78, delay: 0.9 }, { x: 108, y: 130, delay: 1.8 }];
  clusters.forEach(({ x, y, delay }) => {
    const PETALS = 5, LEN = 20, WIDTH = 6;
    const tipY = y - LEN, midY = y - LEN * 0.55;
    const d = `M${x},${y} C${x - WIDTH},${midY + 5} ${x - WIDTH * 0.6},${midY - 3} ${x},${tipY} C${x + WIDTH * 0.6},${midY - 3} ${x + WIDTH},${midY + 5} ${x},${y} Z`;
    for (let i = 0; i < PETALS; i++) {
      popShapeAt(svg, 'path', { d }, `rotate(${(360 / PETALS) * i} ${x} ${y})`, { color: 'var(--gold)', dur: 0.35, delay: delay + i * 0.1, cls: 'stitch-shape' });
    }
    popShape(svg, 'circle', { cx: x, cy: y, r: 3 }, { color: 'var(--gold-deep)', delay: delay + PETALS * 0.1 + 0.1 });
  });
}

// 30 — Meharki: a combination stitch layering two or more techniques for a
// richly detailed finish — a small lattice patch, with murri knots tied
// along its lower edge.
function initStitch30() {
  const svg = document.getElementById('svg-s30');
  svg.innerHTML = '';
  const { threadsEnd } = drawLatticeGrid(svg, { x0: 50, y0: 30, x1: 150, y1: 120, lineCount: 4, drawKnots: false, threadDur: 0.4, threadStagger: 0.1 });
  const KNOTS = 7;
  for (let i = 0; i < KNOTS; i++) {
    const x = 50 + (100 / (KNOTS - 1)) * i;
    popShapeAt(svg, 'ellipse', { cx: 0, cy: 0, rx: 3.6, ry: 2.2 }, `translate(${x} 132)`, { color: 'var(--gold)', dur: 0.4, delay: threadsEnd + 0.2 + i * 0.12, cls: 'stitch-shape' });
  }
}

// 31 — Baalda: a dense, textured combination stitch adding weight to
// statement motifs — a cross-stitch-filled disc, ringed after with a drawn
// border for extra body.
function initStitch31() {
  const svg = document.getElementById('svg-s31');
  svg.innerHTML = '';
  const CENTER = { x: 100, y: 100 }, R = 55, CELL = 13, ARM = 3.4;
  const cells = [];
  for (let cy = CENTER.y - R; cy <= CENTER.y + R; cy += CELL) {
    for (let cx = CENTER.x - R; cx <= CENTER.x + R; cx += CELL) {
      if (Math.hypot(cx - CENTER.x, cy - CENTER.y) <= R) cells.push({ cx, cy, dist: Math.hypot(cx - CENTER.x, cy - CENTER.y) });
    }
  }
  cells.sort((a, b) => a.dist - b.dist);
  cells.forEach((c, i) => {
    drawStrokePath(svg, `M${c.cx - ARM},${c.cy - ARM} L${c.cx + ARM},${c.cy + ARM}`, { width: 1.8, dur: 0.16, delay: i * 0.016 });
    drawStrokePath(svg, `M${c.cx + ARM},${c.cy - ARM} L${c.cx - ARM},${c.cy + ARM}`, { color: 'var(--gold-deep)', width: 1.8, dur: 0.16, delay: i * 0.016 + 0.04 });
  });
  const fillEnd = cells.length * 0.016 + 0.3;
  drawStrokePath(svg, `M${CENTER.x - R - 6},${CENTER.y} a${R + 6},${R + 6} 0 1,0 ${(R + 6) * 2},0 a${R + 6},${R + 6} 0 1,0 -${(R + 6) * 2},0`, { width: 2, dur: 1.2, delay: fillEnd });
}

// 32 — Jora: a paired stitch, worked in twos, used to finish and reinforce
// borders — twin short ticks marching along the line together.
function initStitch32() {
  const svg = document.getElementById('svg-s32');
  svg.innerHTML = '';
  const lineD = 'M14,80 L306,80';
  drawStrokePath(svg, lineD, { color: 'var(--bone)', width: 0.6, dur: 0.01, opacity: 0.15 });
  const PAIRS = 16;
  for (let i = 0; i < PAIRS; i++) {
    const x = 14 + (292 / (PAIRS - 1)) * i;
    drawStrokePath(svg, `M${x - 3},${80 - 11} L${x - 3},${80 + 11}`, { width: 1.8, dur: 0.22, delay: i * 0.1 });
    drawStrokePath(svg, `M${x + 3},${80 - 11} L${x + 3},${80 + 11}`, { width: 1.8, dur: 0.22, delay: i * 0.1 + 0.06 });
  }
}

/* ============================================================
   Init everything on load, wire the replay buttons
   ============================================================ */
const ANIM_INITS = {
  '01': initAnim01, '02': initAnim02, '03': initAnim03, '04': initAnim04, '05': initAnim05,
  '06': initAnim06, '07': initAnim07, '08': initAnim08, '09': initAnim09, '10': initAnim10
};

const STITCH_INITS = {
  s01: initStitch01, s02: initStitch02, s03: initStitch03, s04: initStitch04,
  s05: initStitch05, s06: initStitch06, s07: initStitch07, s08: initStitch08,
  s09: initStitch09, s10: initStitch10, s11: initStitch11, s12: initStitch12,
  s13: initStitch13, s14: initStitch14, s15: initStitch15, s16: initStitch16,
  s17: initStitch17, s18: initStitch18, s19: initStitch19, s20: initStitch20,
  s21: initStitch21, s22: initStitch22, s23: initStitch23, s24: initStitch24,
  s25: initStitch25, s26: initStitch26, s27: initStitch27, s28: initStitch28,
  s29: initStitch29, s30: initStitch30, s31: initStitch31, s32: initStitch32,
};

const ALL_INITS = { ...ANIM_INITS, ...STITCH_INITS };

document.addEventListener('DOMContentLoaded', () => {
  Object.values(ALL_INITS).forEach((fn) => fn());

  document.querySelectorAll('.replay-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-target');
      ALL_INITS[key]?.();
    });
  });
});
