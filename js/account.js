/* ============================================================
   DASTKARI CHIKAN — account.js
   Real Medusa customer auth (see api.js) plus an order-history
   view backed by the customer's real order history.
   ============================================================ */

let authMode = 'login';

function renderAuthGate() {
  const root = document.getElementById('accountRoot');
  root.innerHTML = `
    <div class="text-center" style="margin-bottom:2.5rem;">
      <span class="eyebrow">Welcome</span>
      <h1 style="font-size:clamp(1.8rem,3.5vw,2.4rem);">${authMode === 'login' ? 'Sign In' : 'Create an Account'}</h1>
    </div>
    <div class="auth-card">
      <div class="tab-row" style="justify-content:center;">
        <button class="tab-btn ${authMode === 'login' ? 'active' : ''}" data-mode="login">Sign In</button>
        <button class="tab-btn ${authMode === 'signup' ? 'active' : ''}" data-mode="signup">Sign Up</button>
      </div>
      <form id="authForm" novalidate>
        ${authMode === 'signup' ? `
          <div class="field" id="f-name">
            <label for="authName">Full name</label>
            <input type="text" id="authName" placeholder="Full name">
            <div class="field-error">Enter your name.</div>
          </div>` : ''}
        <div class="field" id="f-email">
          <label for="authEmail">Email</label>
          <input type="email" id="authEmail" placeholder="you@email.com">
          <div class="field-error">Enter a valid email address.</div>
        </div>
        <div class="field" id="f-password">
          <label for="authPassword">Password</label>
          <input type="password" id="authPassword" placeholder="At least 6 characters">
          <div class="field-error">Password must be at least 6 characters.</div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
        <div class="field-hint" style="text-align:center; margin-top:1rem;">Demo account system — any email/password combination works.</div>
      </form>
    </div>
  `;

  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => { authMode = btn.getAttribute('data-mode'); renderAuthGate(); });
  });

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;
    if (authMode === 'signup') {
      const nameOk = document.getElementById('authName').value.trim().length > 0;
      document.getElementById('f-name').classList.toggle('has-error', !nameOk);
      ok = ok && nameOk;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('authEmail').value.trim());
    const passOk = document.getElementById('authPassword').value.length >= 6;
    document.getElementById('f-email').classList.toggle('has-error', !emailOk);
    document.getElementById('f-password').classList.toggle('has-error', !passOk);
    if (!emailOk || !passOk) ok = false;
    if (!ok) return;

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    try {
      if (authMode === 'signup') {
        await Api.signup(document.getElementById('authName').value.trim(), email, password);
      } else {
        await Api.login(email, password);
      }
    } catch (err) {
      console.error('Auth failed', err);
      showToast(err.message || 'Something went wrong — please try again.');
      return;
    }
    showToast(authMode === 'signup' ? 'Account created — welcome!' : 'Welcome back!');
    await renderDashboard();
  });
}

async function renderDashboard() {
  const session = Api.getSession();
  let orders = [];
  try {
    orders = await Api.getOrderHistory();
  } catch (err) {
    console.error('Could not load order history', err);
  }
  const root = document.getElementById('accountRoot');

  root.innerHTML = `
    <div class="account-layout">
      <div class="account-nav">
        <button class="active" data-panel="orders">Order History</button>
        <button data-panel="details">Account Details</button>
        <button id="logoutBtn">Sign Out</button>
      </div>
      <div>
        <div id="panel-orders">
          <h2 style="margin-bottom:1.5rem;">Order History</h2>
          ${orders.length ? orders.map(o => `
            <div class="order-row">
              <div>
                <div class="order-row-id">${o.orderId}</div>
                <div class="order-row-date">${new Date(o.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &middot; ${o.items.length} item${o.items.length > 1 ? 's' : ''}</div>
              </div>
              <span class="order-status">Processing</span>
              <div class="price">${Api.money(o.totals.total)}</div>
            </div>
          `).join('') : `<p style="color:var(--ink-muted);">No orders yet — once you place one, it'll show up here.</p><a href="shop.html" class="btn btn-outline" style="margin-top:1.5rem;">Shop All</a>`}
        </div>
        <div id="panel-details" style="display:none;">
          <h2 style="margin-bottom:1.5rem;">Account Details</h2>
          <p style="font-size:0.92rem; color:var(--ink-soft);"><strong>Email:</strong> ${session.email}</p>
          ${session.name ? `<p style="font-size:0.92rem; color:var(--ink-soft); margin-top:0.5rem;"><strong>Name:</strong> ${session.name}</p>` : ''}
          <p style="font-size:0.8rem; color:var(--ink-muted); margin-top:1.5rem;">This is a demo account — details aren't sent anywhere or stored beyond this browser.</p>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.account-nav button[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.account-nav button[data-panel]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-orders').style.display = btn.getAttribute('data-panel') === 'orders' ? 'block' : 'none';
      document.getElementById('panel-details').style.display = btn.getAttribute('data-panel') === 'details' ? 'block' : 'none';
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Api.logout();
    authMode = 'login';
    showToast('Signed out');
    renderAuthGate();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await Api.ready();
  const session = Api.getSession();
  if (session) await renderDashboard();
  else renderAuthGate();
});
