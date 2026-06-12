/* ===== SNEAKER COURT — Main JavaScript ===== */

// ========== UTILS ==========
function formatPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

function getUrlParam(n) {
  return new URLSearchParams(window.location.search).get(n);
}

function showToast(msg) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ========== CART (localStorage key: sneakercourt_cart) ==========
function getCart() {
  try { return JSON.parse(localStorage.getItem('sneakercourt_cart')) || []; }
  catch { return []; }
}

function saveCart(c) {
  localStorage.setItem('sneakercourt_cart', JSON.stringify(c));
  updateCartBadge();
}

function addToCart(id, size) {
  if (!size) { showToast('Выберите размер'); return; }
  const sneaker = SNEAKERS.find(s => s.id === id);
  if (!sneaker) return;
  const cart = getCart();
  const key = id + '_' + size;
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key: key,
      id: id,
      name: sneaker.name,
      brand: sneaker.brand,
      image: sneaker.image,
      colorway: sneaker.colorway,
      price: sneaker.price,
      size: size,
      qty: 1
    });
  }
  saveCart(cart);
  showToast(sneaker.name + ' добавлены в корзину');
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  if (typeof renderCartPage === 'function') renderCartPage();
}

function updateQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  saveCart(cart);
  if (typeof renderCartPage === 'function') renderCartPage();
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = getCartCount();
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ========== USER AUTH (localStorage key: sneakercourt_user) ==========
function getUser() {
  try { return JSON.parse(localStorage.getItem('sneakercourt_user')); }
  catch { return null; }
}

function saveUser(u) {
  localStorage.setItem('sneakercourt_user', JSON.stringify(u));
}

function login(phone) {
  const user = { phone: phone, name: 'Пользователь', email: '', registeredAt: new Date().toISOString() };
  saveUser(user);
  showToast('Вы вошли в аккаунт');
  if (typeof renderProfilePage === 'function') renderProfilePage();
}

function logout() {
  localStorage.removeItem('sneakercourt_user');
  showToast('Вы вышли из аккаунта');
  if (typeof renderProfilePage === 'function') renderProfilePage();
}

function isLoggedIn() {
  return !!getUser();
}

// ========== ORDERS (localStorage key: sneakercourt_orders) ==========
function getOrders() {
  try { return JSON.parse(localStorage.getItem('sneakercourt_orders')) || []; }
  catch { return []; }
}

function saveOrders(o) {
  localStorage.setItem('sneakercourt_orders', JSON.stringify(o));
}

function createOrder() {
  const cart = getCart();
  if (!cart.length) { showToast('Корзина пуста'); return; }
  const user = getUser();
  const order = {
    id: 'SC-' + Date.now().toString().slice(-6),
    date: new Date().toLocaleDateString('ru-RU'),
    items: [...cart],
    total: getCartTotal(),
    status: 'Обработка',
    userName: user ? user.name : 'Гость',
    userPhone: user ? user.phone : ''
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  saveCart([]);
  showToast('Заказ ' + order.id + ' оформлен!');
  if (typeof renderCartPage === 'function') renderCartPage();
}

// ========== HEADER SCROLL EFFECT ==========
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate:not(.visible)').forEach(el => observer.observe(el));
}

// ========== RENDER BENTO GRID (index.html) ==========
function renderBentoGrid() {
  const grid = document.getElementById('bentoGrid');
  if (!grid) return;

  grid.innerHTML = SNEAKERS.map((s, idx) => {
    const isLarge = (idx === 0 || idx === 5);
    let badgeHtml = '';
    if (s.isNew) badgeHtml = '<div class="bento-badge new">NEW</div>';
    else if (s.isHit) badgeHtml = '<div class="bento-badge hit">HIT</div>';

    return `<div class="bento-card${isLarge ? ' large' : ''} animate animate-delay-${(idx % 4) + 1}" onclick="location.href='product.html?id=${s.id}'">
      <div class="bento-image">
        ${badgeHtml}
        <img src="${s.image}" alt="${s.name}" loading="lazy" style="object-fit:cover;width:100%;height:100%;">
      </div>
      <div class="bento-info">
        <div class="bento-brand">${s.brand}</div>
        <div class="bento-name">${s.name}</div>
        <div class="bento-colorway">${s.colorway}</div>
        <span class="bento-price">${formatPrice(s.price)}</span>
        ${s.oldPrice ? '<span class="bento-price-old">' + formatPrice(s.oldPrice) + '</span>' : ''}
      </div>
    </div>`;
  }).join('');
}

// ========== RENDER CATALOG GRID ==========
function renderCatalogGrid(sneakers) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  const list = sneakers || SNEAKERS;

  if (!list.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h2>Ничего не найдено</h2><p>Попробуйте изменить параметры фильтра</p></div>';
    return;
  }

  grid.innerHTML = list.map(s => {
    let badgeHtml = '';
    if (s.isNew) badgeHtml = '<div class="bento-badge new" style="position:absolute;top:12px;left:12px;">NEW</div>';
    else if (s.isHit) badgeHtml = '<div class="bento-badge hit" style="position:absolute;top:12px;left:12px;">HIT</div>';

    return `<div class="product-card animate" onclick="location.href='product.html?id=${s.id}'">
      <div class="product-card-image">
        ${badgeHtml}
        <img src="${s.image}" alt="${s.name}" loading="lazy" style="object-fit:cover;width:100%;height:100%;">
      </div>
      <div class="product-card-body">
        <div class="product-card-brand">${s.brand}</div>
        <div class="product-card-name">${s.name}</div>
        <div class="product-card-colorway">${s.colorway}</div>
        <div class="product-card-footer">
          <span class="product-card-price">${formatPrice(s.price)}</span>
          <button class="product-card-btn" onclick="event.stopPropagation();addToCart(${s.id}, ${s.sizes[Math.floor(s.sizes.length / 2)]})">+</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Re-init animations for new elements
  initScrollAnimations();
}

// ========== FILTER LOGIC ==========
function openFilters() {
  const panel = document.getElementById('filterPanel');
  const overlay = document.getElementById('filterOverlay');
  if (panel) panel.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeFilters() {
  const panel = document.getElementById('filterPanel');
  const overlay = document.getElementById('filterOverlay');
  if (panel) panel.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function applyFilters() {
  let filtered = [...SNEAKERS];

  // Brand filter
  const brandSelect = document.getElementById('filterBrand');
  if (brandSelect && brandSelect.value && brandSelect.value !== 'Все') {
    filtered = filtered.filter(s => s.brand === brandSelect.value);
  }

  // Model search
  const modelInput = document.getElementById('filterModel');
  if (modelInput && modelInput.value.trim()) {
    const q = modelInput.value.trim().toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q) ||
      s.colorway.toLowerCase().includes(q)
    );
  }

  // Price range
  const priceFrom = document.getElementById('filterPriceFrom');
  const priceTo = document.getElementById('filterPriceTo');
  const pf = priceFrom ? parseInt(priceFrom.value) || 0 : 0;
  const pt = priceTo ? parseInt(priceTo.value) || Infinity : Infinity;
  filtered = filtered.filter(s => s.price >= pf && s.price <= pt);

  // Size filter
  const activeSizes = [...document.querySelectorAll('.filter-chip.active')].map(el => parseInt(el.textContent));
  if (activeSizes.length) {
    filtered = filtered.filter(s => s.sizes.some(sz => activeSizes.includes(sz)));
  }

  renderCatalogGrid(filtered);
}

function resetFilters() {
  const brandSelect = document.getElementById('filterBrand');
  if (brandSelect) brandSelect.value = 'Все';
  const modelInput = document.getElementById('filterModel');
  if (modelInput) modelInput.value = '';
  const priceFrom = document.getElementById('filterPriceFrom');
  if (priceFrom) priceFrom.value = '';
  const priceTo = document.getElementById('filterPriceTo');
  if (priceTo) priceTo.value = '';
  document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
  applyFilters();
}

function initCatalogSearch() {
  const searchInput = document.getElementById('catalogSearch');
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    let filtered = [...SNEAKERS];
    if (q) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.colorway.toLowerCase().includes(q)
      );
    }
    // Also apply other filters
    const brandSelect = document.getElementById('filterBrand');
    if (brandSelect && brandSelect.value && brandSelect.value !== 'Все') {
      filtered = filtered.filter(s => s.brand === brandSelect.value);
    }
    renderCatalogGrid(filtered);
  });
}

// ========== RENDER PRODUCT PAGE ==========
let selectedSize = null;

function renderProductPage() {
  const id = parseInt(getUrlParam('id'));
  const sneaker = SNEAKERS.find(s => s.id === id);
  if (!sneaker) {
    document.querySelector('.product-page').innerHTML = '<div class="empty-state"><h2>Товар не найден</h2><p>Вернитесь в каталог</p><a href="catalog.html" class="btn btn-primary">Каталог</a></div>';
    return;
  }

  document.title = sneaker.name + ' — SneakerCourt';
  selectedSize = null;

  // Breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (bc) {
    bc.innerHTML = `<a href="index.html">Главная</a><span class="sep">›</span><a href="catalog.html">Каталог</a><span class="sep">›</span><span>${sneaker.name}</span>`;
  }

  // Gallery
  const gallery = document.getElementById('productGallery');
  if (gallery) {
    gallery.innerHTML = `<img src="${sneaker.image}" alt="${sneaker.name}">`;
  }

  // Details
  const details = document.getElementById('productDetails');
  if (details) {
    details.innerHTML = `
      <div class="brand-tag">${sneaker.brand}</div>
      <h1>${sneaker.name}</h1>
      <div class="colorway">${sneaker.colorway}</div>
      <div class="price">${formatPrice(sneaker.price)}</div>
      <div class="size-selector">
        <label>Выберите размер</label>
        <div class="size-grid" id="sizeGrid">
          ${SIZES.map(sz => {
            const available = sneaker.sizes.includes(sz);
            return `<button class="size-btn${!available ? ' disabled' : ''}" ${!available ? 'disabled' : ''} onclick="selectSize(this, ${sz})">${sz}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-lg" onclick="addToCartFromPage(${sneaker.id})">В корзину</button>
        <button class="btn btn-outline btn-lg" onclick="showToast('Добавлено в избранное')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    `;
  }

  // Tabs
  const tabHistory = document.getElementById('tabHistory');
  if (tabHistory) tabHistory.innerHTML = `<p>${sneaker.history}</p>`;

  const tabTech = document.getElementById('tabTech');
  if (tabTech) tabTech.innerHTML = `<p>${sneaker.technologies}</p>`;

  const tabSpecs = document.getElementById('tabSpecs');
  if (tabSpecs) {
    tabSpecs.innerHTML = `<div class="specs-list">${Object.entries(sneaker.specifications).map(([k, v]) =>
      `<div class="spec-item"><span class="spec-label">${k}</span><span class="spec-value">${v}</span></div>`
    ).join('')}</div>`;
  }
}

function selectSize(btn, size) {
  document.querySelectorAll('#sizeGrid .size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedSize = size;
}

function addToCartFromPage(id) {
  if (!selectedSize) { showToast('Выберите размер'); return; }
  addToCart(id, selectedSize);
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
  btn.classList.add('active');
}

// ========== RENDER CART PAGE ==========
function renderCartPage() {
  const content = document.getElementById('cartContent');
  if (!content) return;

  const cart = getCart();

  if (!cart.length) {
    content.innerHTML = `<div class="empty-state">
      <h2>Корзина пуста</h2>
      <p>Добавьте кроссовки из каталога</p>
      <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
    </div>`;
    return;
  }

  const total = getCartTotal();
  const count = getCartCount();

  content.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${cart.map((item, idx) => `
          <div class="cart-item">
            <div class="cart-item-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-meta">${item.colorway} · Размер: ${item.size}</div>
              <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
            </div>
            <div class="cart-item-actions">
              <div class="cart-qty">
                <button onclick="updateQty(${idx}, -1)">−</button>
                <span>${item.qty}</span>
                <button onclick="updateQty(${idx}, 1)">+</button>
              </div>
              <button class="cart-remove" onclick="removeFromCart(${idx})">Удалить</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary">
        <h3>Итого</h3>
        <div class="summary-row"><span>Товаров</span><span>${count} шт.</span></div>
        <div class="summary-row"><span>Доставка</span><span>Бесплатно</span></div>
        <div class="summary-row total"><span>К оплате</span><span>${formatPrice(total)}</span></div>
        <button class="btn btn-primary btn-lg" onclick="createOrder()">Оформить заказ</button>
      </div>
    </div>`;
}

// ========== RENDER PROFILE PAGE ==========
function renderProfilePage() {
  const content = document.getElementById('profileContent');
  if (!content) return;

  const user = getUser();

  if (!user) {
    content.innerHTML = `
      <div class="auth-section" style="max-width:440px;margin:0 auto;padding:120px 40px 80px;">
        <div class="auth-card">
          <h2>Вход в аккаунт</h2>
          <p>Введите номер телефона для входа</p>
          <form onsubmit="handleLogin(event)">
            <div class="form-group">
              <label>Телефон</label>
              <input type="tel" id="loginPhone" placeholder="+7 (___) ___-__-__" required>
            </div>
            <div class="form-group">
              <label>Имя</label>
              <input type="text" id="loginName" placeholder="Ваше имя">
            </div>
            <button type="submit" class="btn btn-primary btn-lg">Войти</button>
          </form>
        </div>
      </div>`;
    return;
  }

  const orders = getOrders();
  const initial = user.name ? user.name[0].toUpperCase() : '?';

  content.innerHTML = `
    <div class="profile-section">
      <div class="profile-card">
        <div class="profile-avatar">${initial}</div>
        <h2>${user.name || 'Пользователь'}</h2>
        <div class="email">${user.phone}${user.email ? ' · ' + user.email : ''}</div>

        <div class="form-group">
          <label>Имя</label>
          <input type="text" id="editName" value="${user.name || ''}" placeholder="Ваше имя">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="editEmail" value="${user.email || ''}" placeholder="your@email.com">
        </div>
        <button class="btn btn-dark" onclick="saveProfile()" style="margin-bottom:20px;">Сохранить</button>

        <div style="border-top:1px solid var(--border);padding-top:24px;margin-top:8px;">
          <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">История заказов</h3>
          ${orders.length ? orders.map(o => `
            <div style="padding:12px 0;border-bottom:1px solid var(--border);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${o.id}</strong>
                <span class="status-badge pending">${o.status}</span>
              </div>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${o.date} · ${formatPrice(o.total)}</div>
            </div>
          `).join('') : '<p style="color:var(--text-light);">Заказов пока нет</p>'}
        </div>

        <button class="btn btn-ghost" onclick="logout()" style="margin-top:20px;color:#e74c3c;">Выйти из аккаунта</button>
      </div>
    </div>`;
}

function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value;
  const name = document.getElementById('loginName').value || 'Пользователь';
  if (!phone) return;
  const user = { phone, name, email: '', registeredAt: new Date().toISOString() };
  saveUser(user);
  showToast('Вы вошли в аккаунт');
  renderProfilePage();
}

function saveProfile() {
  const user = getUser();
  if (!user) return;
  const nameInput = document.getElementById('editName');
  const emailInput = document.getElementById('editEmail');
  if (nameInput) user.name = nameInput.value;
  if (emailInput) user.email = emailInput.value;
  saveUser(user);
  showToast('Профиль обновлён');
  renderProfilePage();
}

// ========== RENDER ADMIN PAGE ==========
function renderAdminPage() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  const orders = getOrders();
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const clients = [...new Set(orders.map(o => o.userPhone))].length;

  content.innerHTML = `
    <div class="admin-section">
      <div class="admin-header">
        <div class="admin-title">Панель управления</div>
      </div>

      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-label">Товары</div>
          <div class="stat-value">${SNEAKERS.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Заказы</div>
          <div class="stat-value">${orders.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Выручка</div>
          <div class="stat-value">${formatPrice(revenue)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Клиенты</div>
          <div class="stat-value">${clients}</div>
        </div>
      </div>

      <div class="admin-header" style="margin-top:16px;">
        <div class="admin-title" style="font-size:20px;">Заказы</div>
      </div>

      ${orders.length ? `
        <div class="admin-table">
          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Дата</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>${o.id}</strong></td>
                  <td>${o.date}</td>
                  <td>${o.userName}</td>
                  <td>${formatPrice(o.total)}</td>
                  <td>
                    <select style="padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;" onchange="updateOrderStatus('${o.id}',this.value)">
                      <option${o.status === 'Обработка' ? ' selected' : ''}>Обработка</option>
                      <option${o.status === 'Отправлен' ? ' selected' : ''}>Отправлен</option>
                      <option${o.status === 'Доставлен' ? ' selected' : ''}>Доставлен</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color:var(--text-light);padding:20px;">Заказов пока нет</p>'}
    </div>`;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    saveOrders(orders);
    showToast('Статус обновлён');
  }
}

// ========== INIT APP ==========
function initApp() {
  updateCartBadge();
  initHeaderScroll();

  // Search on catalog page
  initCatalogSearch();

  // URL search param for catalog
  const searchParam = getUrlParam('search');
  if (searchParam) {
    const searchInput = document.getElementById('catalogSearch');
    if (searchInput) {
      searchInput.value = searchParam;
      searchInput.dispatchEvent(new Event('input'));
    }
  }

  // Brand param for catalog
  const brandParam = getUrlParam('brand');
  if (brandParam) {
    const brandSelect = document.getElementById('filterBrand');
    if (brandSelect) {
      brandSelect.value = brandParam;
      applyFilters();
    }
  }
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Page-specific renders
  if (document.getElementById('bentoGrid')) renderBentoGrid();
  if (document.getElementById('catalogGrid')) renderCatalogGrid();
  if (document.getElementById('productGallery')) renderProductPage();
  if (document.getElementById('cartContent')) renderCartPage();
  if (document.getElementById('profileContent')) renderProfilePage();
  if (document.getElementById('adminContent')) renderAdminPage();

  // Init scroll animations
  initScrollAnimations();

  // Bottom Navigation - highlight active page
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const pageMap = {
      'index.html': 'home',
      '': 'home',
      'catalog.html': 'catalog',
      'product.html': 'catalog',
      'cart.html': 'cart',
      'profile.html': 'profile',
      'admin.html': 'profile'
  };

  bottomNavItems.forEach(item => {
      const page = item.dataset.page;
      if (pageMap[currentPage] === page) {
          item.classList.add('active');
      }
  });

  // Update cart badge in bottom nav
  function updateBottomNavBadge() {
      const badge = document.getElementById('cart-badge');
      if (!badge) return;
      try {
          const cart = JSON.parse(localStorage.getItem('sneakercourt_cart') || '[]');
          const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
          if (count > 0) {
              badge.textContent = count > 99 ? '99+' : count;
              badge.style.display = 'flex';
          } else {
              badge.style.display = 'none';
          }
      } catch(e) {
          badge.style.display = 'none';
      }
  }
  updateBottomNavBadge();

  // Re-update bottom nav badge when cart changes
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      if (key === 'sneakercourt_cart') updateBottomNavBadge();
  };
});
