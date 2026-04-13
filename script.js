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
    'request.html': 'shop',
    'links.html': 'links'
  };
  const active = map[path] || 'home';
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.dataset.nav === active) a.classList.add('active');
  });

  const CART_KEY = 'circuit_records_cart';
  const euro = new Intl.NumberFormat('en-EN', { style: 'currency', currency: 'EUR' });

  const stockByProduct = {
  tee: { M: 0, L: 10, XL: 10, XXL: 10 },
  bundle: { M: 4, L: 2, XL: 0, XXL: 0 }
};

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

  function getSelectedQty(productId) {
    const qtyInput = document.querySelector(`[data-qty-for="${productId}"]`);
    const qty = qtyInput ? Number(qtyInput.value) : 1;
    return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
  }

  function availableStock(productId, size) {
    if (!stockByProduct[productId]) return Infinity;
    return stockByProduct[productId][size] ?? 0;
  }

  function addToCart(product) {
    const cart = readCart();
    const existing = cart.find(item => item.id === product.id && item.size === product.size);
    const currentQty = existing ? existing.qty : 0;
    const maxStock = product.size ? availableStock(product.id, product.size) : Infinity;
    if (currentQty + product.qty > maxStock) {
      alert(`Only ${maxStock} available${product.size ? ` in size ${product.size}` : ''}.`);
      return;
    }
    if (existing) existing.qty += product.qty;
    else cart.push({ ...product });
    saveCart(cart);
    window.location.href = 'cart.html';
  }

  function markSizeField(select, hasError) {
    const wrapLabel = select?.closest('.shop-card')?.querySelector(`label[for="${select.id}"]`);
    if (hasError) {
      select.classList.add('size-select--error');
      if (wrapLabel) wrapLabel.classList.add('size-field--error');
    } else {
      select.classList.remove('size-select--error');
      if (wrapLabel) wrapLabel.classList.remove('size-field--error');
    }
  }

  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const requiresSize = btn.dataset.requiresSize === 'true';
      const sizeSelect = document.querySelector(`[data-size-for="${btn.dataset.id}"]`);
      const size = sizeSelect ? sizeSelect.value : '';
      const qty = getSelectedQty(btn.dataset.id);
      if (requiresSize && !size) {
        alert('Select a size first: M, L, XL or XXL.');
        if (sizeSelect) {
          markSizeField(sizeSelect, true);
          sizeSelect.focus();
        }
        return;
      }
      if (sizeSelect) markSizeField(sizeSelect, false);
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
        image: btn.dataset.image,
        size: size || null,
        qty
      });
    });
  });


  document.querySelectorAll('[data-size-for]').forEach(select => {
    select.addEventListener('change', () => markSizeField(select, false));
  });

  function updateStockNotes() {
    document.querySelectorAll('[data-stock-note]').forEach(note => {
      const productId = note.dataset.stockNote;
      const stock = stockByProduct[productId];
      if (!stock) return;
      const available = Object.entries(stock)
        .filter(([, qty]) => qty > 0)
        .map(([size, qty]) => `${size} (${qty})`)
        .join(', ');
      note.textContent = available ? `Available sizes / ${available}` : 'Sold out';
    });
  }

  updateStockNotes();


    window.requestOrder = function requestOrder(productName, sizeId = '', qtyId = '') {
    const to = 'orders@circuitrecords.it';
    const subject = 'Order Request — Circuit Records';

    let size = '';
    let quantity = '1';

    if (sizeId) {
      const sizeEl = document.getElementById(sizeId);
      if (sizeEl) size = sizeEl.value;
      if (!size) {
        alert('Select a size first.');
        if (sizeEl) {
          markSizeField(sizeEl, true);
          sizeEl.focus();
        }
        return;
      }
      if (sizeEl) markSizeField(sizeEl, false);
    }

    if (qtyId) {
      const qtyEl = document.getElementById(qtyId);
      if (qtyEl) quantity = qtyEl.value;
    }

    const body = `Hi,

I would like to request the following item:

Product: ${productName}
Size: ${size || 'N/A'}
Quantity: ${quantity}

Full name:
Shipping address:
City:
Postal code:
Country:

Notes:

Thank you.`;

    sessionStorage.setItem('circuit_request', JSON.stringify({
      to,
      subject,
      body,
      productName,
      size: size || 'N/A',
      quantity
    }));

    window.location.href = 'request.html';
  };
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
          ${item.size ? `<p class="cart-size">Size / ${item.size}</p>` : ''}
          <div class="qty-controls">
            <button data-minus="${item.id}" data-size="${item.size || ''}" type="button">−</button>
            <span>${item.qty}</span>
            <button data-plus="${item.id}" data-size="${item.size || ''}" type="button">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="margin:0 0 12px;font-size:18px;">${euro.format(item.price * item.qty)}</p>
          <button class="buy-btn" data-remove="${item.id}" data-size="${item.size || ''}" type="button">Remove</button>
        </div>
      </article>
    `).join('');

    itemsWrap.querySelectorAll('[data-minus]').forEach(btn => btn.addEventListener('click', () => {
      const cart = readCart().map(item => (item.id === btn.dataset.minus && String(item.size || '') === String(btn.dataset.size || '')) ? { ...item, qty: item.qty - 1 } : item).filter(item => item.qty > 0);
      saveCart(cart); renderCartPage();
    }));

    itemsWrap.querySelectorAll('[data-plus]').forEach(btn => btn.addEventListener('click', () => {
      const cart = readCart();
      const item = cart.find(entry => entry.id === btn.dataset.plus && String(entry.size || '') === String(btn.dataset.size || ''));
      const maxStock = item?.size ? availableStock(item.id, item.size) : Infinity;
      if (item && item.qty + 1 > maxStock) {
        alert(`Only ${maxStock} available${item.size ? ` in size ${item.size}` : ''}.`);
        return;
      }
      const updated = cart.map(entry => (entry.id === btn.dataset.plus && String(entry.size || '') === String(btn.dataset.size || '')) ? { ...entry, qty: entry.qty + 1 } : entry);
      saveCart(updated); renderCartPage();
    }));

    itemsWrap.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
      const cart = readCart().filter(item => !(item.id === btn.dataset.remove && String(item.size || '') === String(btn.dataset.size || '')));
      saveCart(cart); renderCartPage();
    }));

    renderSummary(summary);
  }

  const checkoutSummary = document.getElementById('checkout-summary');
  if (checkoutSummary) renderSummary(checkoutSummary);
  renderCartPage();
})();


document.querySelectorAll('[data-player]').forEach(player => {
  const audio = player.querySelector('[data-audio]');
  const playBtn = player.querySelector('[data-play]');
  const progress = player.querySelector('[data-progress]');
  const time = player.querySelector('[data-time]');
  const title = player.querySelector('[data-track-title]');
  const tabs = player.querySelectorAll('[data-track]');

  function formatTime(value) {
    if (!Number.isFinite(value)) return '0:00';
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function setActiveTab(tab) {
    tabs.forEach(item => item.classList.toggle('is-active', item === tab));
    const src = tab.dataset.src;
    const label = tab.dataset.title || '';
    if (title) title.textContent = label;
    const source = audio.querySelector('source');
    if (source) {
      source.src = src;
      audio.load();
      playBtn.textContent = 'Play';
      progress.style.width = '0%';
      time.textContent = '0:00';
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveTab(tab));
  });

  playBtn?.addEventListener('click', () => {
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        alert('Add the preview files in /audio to activate the custom player.');
      });
    } else {
      audio.pause();
    }
  });

  audio?.addEventListener('play', () => {
    if (playBtn) playBtn.textContent = 'Pause';
  });

  audio?.addEventListener('pause', () => {
    if (playBtn) playBtn.textContent = 'Play';
  });

  audio?.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (progress) progress.style.width = `${pct}%`;
    if (time) time.textContent = formatTime(audio.currentTime);
  });

  audio?.addEventListener('ended', () => {
    if (playBtn) playBtn.textContent = 'Play';
  });

  if (tabs[0]) setActiveTab(tabs[0]);
});


(function () {
  const requestSummary = document.getElementById('request-summary');
  if (!requestSummary) return;

  const raw = sessionStorage.getItem('circuit_request');
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    const gmailLink = document.getElementById('gmail-link');
    const yahooLink = document.getElementById('yahoo-link');
    const copyBtn = document.getElementById('copy-request');

    requestSummary.innerHTML = `
      <p><strong>Product</strong><br>${data.productName}</p>
      <p><strong>Size</strong><br>${data.size}</p>
      <p><strong>Quantity</strong><br>${data.quantity}</p>
      <p><strong>Email</strong><br>${data.to}</p>
    `;

    const subject = encodeURIComponent(data.subject);
    const gmailBody = encodeURIComponent(data.body);
    const yahooBody = encodeURIComponent(data.body.replace(/\n/g, '\r\n'));
    const to = encodeURIComponent(data.to);

    if (gmailLink) {
      gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${gmailBody}`;
    }

    if (yahooLink) {
      yahooLink.href = `https://compose.mail.yahoo.com/?to=${to}&subject=${subject}&body=${yahooBody}`;
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(data.body);
          copyBtn.textContent = 'Copied';
        } catch (e) {
          copyBtn.textContent = 'Copy failed';
        }
      });
    }
  } catch (e) {}
})();
