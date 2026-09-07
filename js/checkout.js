/* ============================================================
   SHAHNISA — checkout.js
   Single-page checkout. Shipping methods, tax and totals come
   from the real Medusa cart (see api.js). "Pay Online" is real
   Razorpay Standard Checkout (see Api.placeOrder); "Cash on
   Delivery" skips it entirely.
   ============================================================ */

let selectedShipping = 'standard';
let selectedPayment = 'online';
let shippingOptionsList = [];

function renderEmptyCheckout() {
  document.getElementById('checkoutContainer').innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 8h16l-1.4 11a2 2 0 01-2 1.8H7.4a2 2 0 01-2-1.8L4 8z"/><path d="M8 8V6a4 4 0 018 0v2"/></svg>
      <h3>Your bag is empty</h3>
      <p>Add something beautiful before checking out.</p>
      <a href="shop.html" class="btn btn-primary">Shop All</a>
    </div>`;
}

function renderSummary(totals) {
  const lines = Cart.get();
  const linesEl = document.getElementById('summaryLines');
  linesEl.innerHTML = lines.map(l => `
    <div class="summary-line">
      <div class="summary-line-thumb">${lineThumb(l)}<span class="qty-badge">${l.qty}</span></div>
      <div>
        <div class="summary-line-name">${l.name}</div>
        <div class="summary-line-meta">${l.color} &middot; ${l.size}</div>
      </div>
      <div class="summary-line-price">${Api.money(l.price * l.qty)}</div>
    </div>
  `).join('');

  const t = totals;
  const totalsEl = document.getElementById('summaryTotals');
  totalsEl.innerHTML = `
    <div class="row"><span>Subtotal</span><span>${Api.money(t.subtotal)}</span></div>
    ${t.discount ? `<div class="row discount"><span>Discount</span><span>&minus;${Api.money(t.discount)}</span></div>` : ''}
    <div class="row"><span>Shipping</span><span>${t.shippingCost === 0 ? 'Free' : Api.money(t.shippingCost)}</span></div>
    <div class="row"><span>Tax (GST 5%)</span><span>${Api.money(t.tax)}</span></div>
    <div class="row total"><span>Total</span><span>${Api.money(t.total)}</span></div>
  `;
}

function renderShippingMethods() {
  const el = document.getElementById('shippingMethods');
  el.innerHTML = shippingOptionsList.map(m => `
    <label class="radio-card ${selectedShipping === m.code ? 'selected' : ''}" data-ship="${m.code}">
      <div class="radio-card-left">
        <input type="radio" name="shipping" value="${m.code}" ${selectedShipping === m.code ? 'checked' : ''}>
        <div><div class="label">${m.label}</div><div class="sub">${m.sub}</div></div>
      </div>
      <div class="amount">${Api.money(m.cost)}</div>
    </label>
  `).join('');
  el.querySelectorAll('[data-ship]').forEach(card => {
    card.addEventListener('click', async () => {
      selectedShipping = card.getAttribute('data-ship');
      renderShippingMethods();
      await applyShippingAndRefresh();
    });
  });
}

async function applyShippingAndRefresh() {
  try {
    const totals = await Api.selectShippingMethod(selectedShipping);
    renderSummary(totals);
  } catch (err) {
    console.error('Could not select shipping method', err);
    showToast('Could not update shipping — please try again.');
  }
}

function renderPaymentFields() {
  const el = document.getElementById('paymentFields');
  if (selectedPayment === 'online') {
    el.innerHTML = `<p style="font-size:0.88rem; color:var(--ink-muted);">Clicking "Place Order" opens a secure Razorpay window — pay by card, UPI, netbanking or wallet there.</p>`;
  } else {
    el.innerHTML = `<p style="font-size:0.88rem; color:var(--ink-muted);">Pay in cash when your order is delivered. A small COD handling fee may apply in a live store.</p>`;
  }
}

function wirePaymentTabs() {
  document.querySelectorAll('#paymentTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#paymentTabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPayment = btn.getAttribute('data-pay');
      renderPaymentFields();
    });
  });
}

function wirePromo() {
  document.getElementById('promoApply').addEventListener('click', async () => {
    const code = document.getElementById('promoInput').value.trim().toUpperCase();
    if (!code) return;
    const applied = await Api.applyPromoCode(code);
    showToast(applied ? `Code applied — ${code}` : 'That code is not valid');
    renderSummary(await Api.getCartTotals());
  });
}

/* ── Validation helpers ── */
function markField(id, valid) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('has-error', !valid);
}
function required(id) {
  const val = document.getElementById(id.replace('f-', ''))?.value.trim();
  return !!val;
}

function validateForm() {
  let ok = true;
  const checks = [
    ['f-email', () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('email').value.trim())],
    ['f-phone', () => /^\d{10}$/.test(document.getElementById('phone').value.trim())],
    ['f-name', () => document.getElementById('fullName').value.trim().length > 0],
    ['f-address1', () => required('f-address1')],
    ['f-city', () => required('f-city')],
    ['f-state', () => required('f-state')],
    ['f-pincode', () => /^\d{6}$/.test(document.getElementById('pincode').value.trim())]
  ];

  checks.forEach(([id, test]) => {
    const valid = test();
    markField(id, valid);
    if (!valid) ok = false;
  });

  if (!ok) {
    document.querySelector('.field.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return ok;
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing your order…';

  const lines = Cart.get();
  const totals = await Api.getCartTotals();

  const orderPayload = {
    items: lines,
    contact: { email: document.getElementById('email').value.trim(), phone: document.getElementById('phone').value.trim() },
    shippingAddress: {
      fullName: document.getElementById('fullName').value.trim(),
      address1: document.getElementById('address1').value.trim(),
      address2: document.getElementById('address2').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      pincode: document.getElementById('pincode').value.trim(),
      country: document.getElementById('country').value
    },
    shippingMethod: selectedShipping,
    paymentMethod: selectedPayment,
    totals
  };

  try {
    const order = await Api.placeOrder(orderPayload);
    Cart.clear();
    location.href = `order-confirmation.html?order=${order.orderId}`;
  } catch (err) {
    console.error('Could not place order', err);
    showToast(err.message || 'Could not place your order — please try again.');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await Api.ready();
  if (!Cart.get().length) { renderEmptyCheckout(); return; }

  // Signed-in customers land here (from Buy Now or the cart drawer) with
  // their email already known — fill it in rather than making them retype
  // it, same as any real checkout would.
  const session = Api.getSession();
  const emailField = document.getElementById('email');
  if (session?.email && emailField && !emailField.value) emailField.value = session.email;

  shippingOptionsList = await Api.getShippingMethods();
  await applyShippingAndRefresh();
  renderShippingMethods();
  renderPaymentFields();
  wirePaymentTabs();
  wirePromo();
  document.getElementById('checkoutForm').addEventListener('submit', handleSubmit);
});
