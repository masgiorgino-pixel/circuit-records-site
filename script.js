(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'home',
    'releases.html': 'releases',
    'release-circuit-01.html': 'releases',
    'artists.html': 'artists',
    'artist-sbume.html': 'artists',
    'shop.html': 'shop',
    'cart.html': 'shop',
    'checkout.html': 'shop',
    'links.html': 'links'
  };
  const active = map[path] || 'home';
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.dataset.nav === active) a.classList.add('active');
  });

  const CART_KEY = 'circuit_records_cart';
  const euro = new Intl.NumberFormat('en-EN', { style: 'currency', currency: 'EUR' });

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function addToCart(product) {
    const cart = readCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });
    saveCart(cart);
    window.location.href = 'cart.html';
  }

  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
        image: btn.dataset.image
      });
    });
  });

  function renderSummary(target) {
    const cart = readCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = cart.length ? 7 : 0;
    const total = subtotal + shipping;
    target.innerHTML = `
      <div class="summary-line"><span>Items</span><span>${euro.format(subtotal)}</span></div>
      <div class="summary-line"><span>Shipping</span><span>${euro.format(shipping)}</span></div>
      <div class="summary-line total"><span>Total</span><span>${euro.format(total)}</span></div>
    `;
  }

  function renderCartPage() {
    const itemsWrap = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    if (!itemsWrap || !summary) return;

    const cart = readCart();
    if (!cart.length) {
      itemsWrap.innerHTML = `<article class="card"><p class="empty-state">Your cart is empty. Go back to the shop and add the records or merch you want to order.</p><a href="shop.html" class="btn" style="margin-top:22px;">Back to shop</a></article>`;
      summary.innerHTML = '<p class="empty-state">No items yet.</p>';
      return;
    }

    itemsWrap.innerHTML = cart.map(item => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h2 style="margin:0;font-size:18px;text-transform:uppercase;">${item.name}</h2>
          <p class="meta" style="margin-top:8px;">${euro.format(item.price)}</p>
          <div class="qty-controls">
            <button data-minus="${item.id}" type="button">−</button>
            <span>${item.qty}</span>
            <button data-plus="${item.id}" type="button">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="margin:0 0 12px;font-size:18px;">${euro.format(item.price * item.qty)}</p>
          <button class="buy-btn" data-remove="${item.id}" type="button">Remove</button>
        </div>
      </article>
    `).join('');

    itemsWrap.querySelectorAll('[data-minus]').forEach(btn => btn.addEventListener('click', () => {
      const cart = readCart().map(item => item.id === btn.dataset.minus ? { ...item, qty: item.qty - 1 } : item).filter(item => item.qty > 0);
      saveCart(cart); renderCartPage();
    }));

    itemsWrap.querySelectorAll('[data-plus]').forEach(btn => btn.addEventListener('click', () => {
      const cart = readCart().map(item => item.id === btn.dataset.plus ? { ...item, qty: item.qty + 1 } : item);
      saveCart(cart); renderCartPage();
    }));

    itemsWrap.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
      const cart = readCart().filter(item => item.id !== btn.dataset.remove);
      saveCart(cart); renderCartPage();
    }));

    renderSummary(summary);
  }

  const checkoutSummary = document.getElementById('checkout-summary');
  if (checkoutSummary) renderSummary(checkoutSummary);
  renderCartPage();
})();
