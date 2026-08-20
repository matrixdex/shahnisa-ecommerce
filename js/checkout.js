/* ============================================================
   DASTKARI CHIKAN — checkout.js
   Single-page checkout. Everything here is a front-end
   simulation — see api.js for what a real integration replaces.
   ============================================================ */

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', sub: '5–7 business days', cost: 99 },
  { id: 'express', label: 'Express Shipping', sub: '2–3 business days', cost: 249 }
];
const FREE_SHIPPING_THRESHOLD = 3500;
const TAX_RATE = 0.05;
const PROMO_CODES = { 'DASTKARI10': 0.10 };

let selectedShipping = 'standard';
let appliedDiscountRate = 0;
let selectedPayment = 'card';

function renderEmptyCheckout() {
  document.getElementById('checkoutContainer').innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 8h16l-1.4 11a2 2 0 01-2 1.8H7.4a2 2 0 01-2-1.8L4 8z"/><path d="M8 8V6a4 4 0 018 0v2"/></svg>
      <h3>Your bag is empty</h3>
      <p>Add something beautiful before checking out.</p>
      <a href="shop.html" class="btn btn-primary">Shop All</a>
    </div>`;
}

function computeTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (SHIPPING_METHODS.find(m => m.id === selectedShipping)?.cost || 0);
  const discount = Math.round(subtotal * appliedDiscountRate);
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  const total = subtotal - discount + shippingCost + tax;
  return { subtotal, shippingCost, discount, tax, total };
}

function renderSummary() {
  const lines = Cart.get();
  const linesEl = document.getElementById('summaryLines');
  linesEl.innerHTML = lines.map(l => `
    <div class="summary-line">
      <div class="summary-line-thumb">${patternCard(l.stitch)}<span class="qty-badge">${l.qty}</span></div>
      <div>
        <div class="summary-line-name">${l.name}</div>
        <div class="summary-line-meta">${l.color} &middot; ${l.size}</div>
      </div>
      <div class="summary-line-price">${Api.money(l.price * l.qty)}</div>
    </div>
  `).join('');

  const t = computeTotals(lines);
  const totalsEl = document.getElementById('summaryTotals');
  totalsEl.innerHTML = `
    <div class="row"><span>Subtotal</span><span>${Api.money(t.subtotal)}</span></div>
    ${t.discount ? `<div class="row discount"><span>Discount</span><span>&minus;${Api.money(t.discount)}</span></div>` : ''}
    <div class="row"><span>Shipping</span><span>${t.shippingCost === 0 ? 'Free' : Api.money(t.shippingCost)}</span></div>
    <div class="row"><span>Tax (GST 5%)</span><span>${Api.money(t.tax)}</span></div>
    <div class="row total"><span>Total</span><span>${Api.money(t.total)}</span></div>
  `;
  return t;
}

function renderShippingMethods() {
  const lines = Cart.get();
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const freeEligible = subtotal >= FREE_SHIPPING_THRESHOLD;
  const el = document.getElementById('shippingMethods');
  el.innerHTML = SHIPPING_METHODS.map(m => `
    <label class="radio-card ${selectedShipping === m.id ? 'selected' : ''}" data-ship="${m.id}">
      <div class="radio-card-left">
        <input type="radio" name="shipping" value="${m.id}" ${selectedShipping === m.id ? 'checked' : ''}>
        <div><div class="label">${m.label}</div><div class="sub">${m.sub}</div></div>
      </div>
      <div class="amount">${freeEligible && m.id === 'standard' ? 'Free' : Api.money(m.cost)}</div>
    </label>
  `).join('');
  el.querySelectorAll('[data-ship]').forEach(card => {
    card.addEventListener('click', () => {
      selectedShipping = card.getAttribute('data-ship');
      renderShippingMethods();
      renderSummary();
    });
  });
}

function renderPaymentFields() {
  const el = document.getElementById('paymentFields');
  if (selectedPayment === 'card') {
    el.innerHTML = `
      <div class="field" id="f-cardName">
        <label for="cardName">Name on card</label>
        <input type="text" id="cardName" placeholder="As shown on card">
        <div class="field-error">Enter the name on the card.</div>
      </div>
      <div class="field" id="f-cardNumber">
        <label for="cardNumber">Card number</label>
        <input type="text" id="cardNumber" placeholder="0000 0000 0000 0000" maxlength="19">
        <div class="field-error">Enter a valid card number.</div>
      </div>
      <div class="field-row">
        <div class="field" id="f-cardExpiry">
          <label for="cardExpiry">Expiry</label>
          <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5">
          <div class="field-error">Enter expiry as MM/YY.</div>
        </div>
        <div class="field" id="f-cardCvv">
          <label for="cardCvv">CVV</label>
          <input type="text" id="cardCvv" placeholder="123" maxlength="4">
          <div class="field-error">Enter a valid CVV.</div>
        </div>
      </div>
      <div class="field-hint">Demo field only — nothing is transmitted or stored.</div>
    `;
  } else if (selectedPayment === 'upi') {
    el.innerHTML = `
      <div class="field" id="f-upiId">
        <label for="upiId">UPI ID</label>
        <input type="text" id="upiId" placeholder="yourname@bank">
        <div class="field-error">Enter a valid UPI ID.</div>
      </div>
      <div class="field-hint">Demo field only — you would be redirected to your UPI app in production.</div>
    `;
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
  document.getElementById('promoApply').addEventListener('click', () => {
    const code = document.getElementById('promoInput').value.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      appliedDiscountRate = PROMO_CODES[code];
      showToast(`Code applied — ${PROMO_CODES[code] * 100}% off`);
    } else {
      appliedDiscountRate = 0;
      showToast('That code is not valid');
    }
    renderSummary();
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

  if (selectedPayment === 'card') {
    checks.push(
      ['f-cardName', () => required('f-cardName')],
      ['f-cardNumber', () => document.getElementById('cardNumber').value.replace(/\s/g, '').length >= 12],
      ['f-cardExpiry', () => /^\d{2}\/\d{2}$/.test(document.getElementById('cardExpiry').value.trim())],
      ['f-cardCvv', () => /^\d{3,4}$/.test(document.getElementById('cardCvv').value.trim())]
    );
  } else if (selectedPayment === 'upi') {
    checks.push(['f-upiId', () => /^[\w.-]+@[\w.-]+$/.test(document.getElementById('upiId').value.trim())]);
  }

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
  const totals = computeTotals(lines);

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

  const order = await Api.placeOrder(orderPayload);
  Cart.clear();
  location.href = `order-confirmation.html?order=${order.orderId}`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Cart.get().length) { renderEmptyCheckout(); return; }
  renderSummary();
  renderShippingMethods();
  renderPaymentFields();
  wirePaymentTabs();
  wirePromo();
  document.getElementById('checkoutForm').addEventListener('submit', handleSubmit);
});
