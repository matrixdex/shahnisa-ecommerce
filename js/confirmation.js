/* ============================================================
   DASTKARI CHIKAN — confirmation.js
   Reads the last placed order (dummy backend, localStorage) and
   renders a thank-you summary. Redirects home if there's nothing
   to show (e.g. page opened directly with no order placed).
   ============================================================ */

function renderConfirmation(order) {
  const t = order.totals;
  const addr = order.shippingAddress;
  const placed = new Date(order.placedAt);
  const eta = new Date(order.placedAt);
  eta.setDate(eta.getDate() + (order.shippingMethod === 'express' ? 3 : 6));

  document.getElementById('confirmRoot').innerHTML = `
    <div class="confirm-hero reveal visible">
      <div class="confirm-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="eyebrow">Thank You</span>
      <h1 style="font-size:clamp(1.9rem,4vw,2.6rem);">Your order is confirmed</h1>
      <p style="color:var(--ink-muted); margin-top:0.75rem;">A confirmation would normally be emailed to <strong>${order.contact.email}</strong>. Expect delivery by <strong>${eta.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</strong>.</p>
      <div class="confirm-order-id">Order ${order.orderId} &middot; placed ${placed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
    </div>

    <div class="confirm-steps">
      <div class="confirm-step"><div class="num">1</div><h4>Order Received</h4><p>We've got it — your pieces are being pulled for packing.</p></div>
      <div class="confirm-step"><div class="num">2</div><h4>Packed &amp; Dispatched</h4><p>Hand-checked and packed with care in Lucknow.</p></div>
      <div class="confirm-step"><div class="num">3</div><h4>Delivered</h4><p>Arriving at your door by ${eta.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.</p></div>
    </div>

    <div class="checkout-layout" style="grid-template-columns: 1fr; gap:2rem;">
      <div class="order-summary" style="position:static;">
        <h2>Order Summary</h2>
        <div>
          ${order.items.map(l => `
            <div class="summary-line">
              <div class="summary-line-thumb">${patternCard(l.stitch)}<span class="qty-badge">${l.qty}</span></div>
              <div>
                <div class="summary-line-name">${l.name}</div>
                <div class="summary-line-meta">${l.color} &middot; ${l.size}</div>
              </div>
              <div class="summary-line-price">${Api.money(l.price * l.qty)}</div>
            </div>
          `).join('')}
        </div>
        <div class="summary-totals">
          <div class="row"><span>Subtotal</span><span>${Api.money(t.subtotal)}</span></div>
          ${t.discount ? `<div class="row discount"><span>Discount</span><span>&minus;${Api.money(t.discount)}</span></div>` : ''}
          <div class="row"><span>Shipping</span><span>${t.shippingCost === 0 ? 'Free' : Api.money(t.shippingCost)}</span></div>
          <div class="row"><span>Tax (GST 5%)</span><span>${Api.money(t.tax)}</span></div>
          <div class="row total"><span>Total Paid</span><span>${Api.money(t.total)}</span></div>
        </div>
      </div>

      <div>
        <h2 style="font-size:1.05rem; margin-bottom:1rem;">Shipping To</h2>
        <p style="font-size:0.92rem; color:var(--ink-soft); line-height:1.8;">
          ${addr.fullName}<br>
          ${addr.address1}${addr.address2 ? ', ' + addr.address2 : ''}<br>
          ${addr.city}, ${addr.state} ${addr.pincode}<br>
          ${addr.country}
        </p>
      </div>
    </div>

    <div class="text-center" style="margin-top:3rem;">
      <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const order = Api.getLastOrder();
  if (!order) {
    location.href = 'index.html';
    return;
  }
  renderConfirmation(order);
});
