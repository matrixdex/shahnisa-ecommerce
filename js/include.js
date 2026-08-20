/* ============================================================
   DASTKARI CHIKAN — include.js
   Minimal client-side include system so header/footer/cart-drawer
   markup lives in one place (partials/) instead of being copy-
   pasted into every page. Requires the site to be served over
   http (see README) — fetch() of local files is blocked by the
   browser when a page is opened directly as a file:// URL.
   ============================================================ */

/* If opened as file://, every fetch() on this page (partials, the
   product catalog) will fail silently in most browsers. Say so
   loudly instead of leaving the page looking broken/empty. */
if (location.protocol === 'file:') {
  document.addEventListener('DOMContentLoaded', () => {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:sticky;top:0;z-index:9999;background:#a6524b;color:#fff;text-align:center;padding:0.9rem 1.25rem;font:600 13px/1.6 "Work Sans",sans-serif;';
    banner.innerHTML = `This page was opened directly as a file, so nothing can load (no products, no header/footer). Run a local server from the project folder instead — for example: <code style="background:rgba(255,255,255,0.22);padding:2px 7px;border-radius:3px;">python3 -m http.server 8000</code> — then open <code style="background:rgba(255,255,255,0.22);padding:2px 7px;border-radius:3px;">http://localhost:8000</code>. See README.md for other options.`;
    document.body.prepend(banner);
  });
}

(async function () {
  const nodes = Array.from(document.querySelectorAll('[data-include]'));
  await Promise.all(nodes.map(async (node) => {
    try {
      const res = await fetch(node.getAttribute('data-include'));
      node.innerHTML = await res.text();
    } catch (err) {
      node.innerHTML = '<!-- include failed: run this site through a local server, not file:// -->';
      console.error('Could not load partial', node.getAttribute('data-include'), err);
    }
  }));
  document.dispatchEvent(new Event('partials:loaded'));
})();
