/**
 * Bamboo Cinema Club — menu, carrello, checkout
 * Non inserire password o chiavi private in questo file.
 */

const CONFIG = {
  paypalMe: "https://www.paypal.me/florianoserafin",
  whatsappNumber: "393318563277",
  whatsappMessage: "Ciao Bamboo Cinema Club! Vorrei assistenza per un ordine dal menu digitale.",
  successPage: "success.html",
  cartKey: "bamboo-cart",
  orderKey: "bamboo-pending-order",
};

const PRODUCTS = [
  {
    id: "hot-dog",
    category: "food",
    name: "Hot Dog",
    description:
      "Include di base: maionese, ketchup, senape, crunchy chips e cetriolini.",
    note: "Scrivi nelle note dell’ordine se vuoi RIMUOVERE ingredienti (es. «Senza cetriolini»).",
    price: 5,
  },
  {
    id: "pop-corn",
    category: "food",
    name: "Pop Corn",
    description: "Pop Corn salati, caldi e croccanti.",
    note: "",
    price: 3,
  },
  {
    id: "birra-bionda",
    category: "drink",
    name: "Birra Bionda Non Filtrata",
    description: "0,5 L — fresca e non filtrata.",
    note: "",
    price: 5,
  },
  {
    id: "coca-cola",
    category: "drink",
    name: "Coca Cola",
    description: "0,33 L",
    note: "",
    price: 3,
  },
  {
    id: "the-limone",
    category: "drink",
    name: "The al Limone",
    description: "0,33 L",
    note: "",
    price: 3,
  },
  {
    id: "biglietto",
    category: "ingresso",
    name: "Biglietto Ingresso",
    description: "Ingresso alla proiezione.",
    note: "",
    price: 3,
  },
  {
    id: "formula-1",
    category: "ingresso",
    name: "Formula Risparmio 1",
    description: "Include: Biglietto Ingresso + Hot Dog + Birra Bionda 0,5 L.",
    note: "",
    price: 10,
  },
  {
    id: "formula-2",
    category: "ingresso",
    name: "Formula Risparmio 2",
    description:
      "Include: Pop Corn + una bevanda a scelta tra Coca Cola 0,33 L o The al Limone 0,33 L.",
    note: "Indica la bevanda scelta nelle note dell’ordine.",
    price: 5,
  },
];

const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** @type {{ id: string, qty: number }[]} */
let cart = loadCart();

function paypalUrlFor(price) {
  const base = CONFIG.paypalMe.replace(/\/$/, "");
  const amount = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return `${base}/${amount}EUR`;
}

function formatPrice(euros) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros);
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CONFIG.cartKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => productById[l.id] && l.qty > 0) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CONFIG.cartKey, JSON.stringify(cart));
}

function cartCount() {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

function cartTotal() {
  return cart.reduce((sum, line) => sum + productById[line.id].price * line.qty, 0);
}

function addToCart(productId) {
  const existing = cart.find((l) => l.id === productId);
  if (existing) existing.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  saveCart();
  renderCart();
  showToast(`${productById[productId].name} aggiunto al carrello`);
}

function setQty(productId, qty) {
  const line = cart.find((l) => l.id === productId);
  if (!line) return;
  if (qty <= 0) cart = cart.filter((l) => l.id !== productId);
  else line.qty = qty;
  saveCart();
  renderCart();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
  }, 1800);
}

function createProductElement(product) {
  const article = document.createElement("article");
  article.className = "product";
  article.dataset.productId = product.id;

  const info = document.createElement("div");
  info.className = "product-info";

  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.name;

  const desc = document.createElement("p");
  desc.className = "product-desc";
  desc.textContent = product.description;
  info.append(name, desc);

  if (product.note) {
    const note = document.createElement("p");
    note.className = "product-note";
    note.textContent = product.note;
    info.append(note);
  }

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = formatPrice(product.price);

  const add = document.createElement("button");
  add.type = "button";
  add.className = "btn-buy";
  add.textContent = "Aggiungi";
  add.setAttribute("aria-label", `Aggiungi ${product.name} al carrello`);
  add.addEventListener("click", () => addToCart(product.id));

  article.append(info, price, add);
  return article;
}

function renderMenu() {
  document.querySelectorAll(".product-list[data-category]").forEach((list) => {
    const items = PRODUCTS.filter((p) => p.category === list.dataset.category);
    list.replaceChildren(...items.map(createProductElement));
  });
}

function buildOrderMessage(order) {
  const lines = order.items.map(
    (item) => `• ${item.qty}× ${item.name} (${formatPrice(item.lineTotal)})`
  );
  const notes = order.notes?.trim() ? order.notes.trim() : "Nessuna";
  return [
    "🎬 Nuovo ordine — Bamboo Cinema Club",
    `Posto: ${order.seat}`,
    "",
    "Prodotti:",
    ...lines,
    "",
    `Totale: ${formatPrice(order.total)}`,
    `Note: ${notes}`,
    "",
    "Ho pagato / sto pagando con PayPal.",
  ].join("\n");
}

function whatsappUrl(text) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function setupWhatsApp() {
  const link = document.getElementById("whatsapp-link");
  if (!link) return;
  link.href = whatsappUrl(CONFIG.whatsappMessage);
}

function openCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (!drawer || !overlay) return;
  drawer.hidden = false;
  overlay.hidden = false;
  document.body.classList.add("cart-open");
  renderCart();
}

function closeCart() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (!drawer || !overlay) return;
  drawer.hidden = true;
  overlay.hidden = true;
  document.body.classList.remove("cart-open");
}

function renderCart() {
  const badge = document.getElementById("cart-badge");
  const empty = document.getElementById("cart-empty");
  const linesEl = document.getElementById("cart-lines");
  const form = document.getElementById("checkout-form");
  const totalEl = document.getElementById("cart-total");
  const payBtn = document.getElementById("pay-button");
  const count = cartCount();

  if (badge) {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  if (!linesEl || !empty || !form || !totalEl) return;

  if (cart.length === 0) {
    empty.hidden = false;
    linesEl.hidden = true;
    form.hidden = true;
    linesEl.replaceChildren();
    return;
  }

  empty.hidden = true;
  linesEl.hidden = false;
  form.hidden = false;

  linesEl.replaceChildren(
    ...cart.map((line) => {
      const product = productById[line.id];
      const li = document.createElement("li");
      li.className = "cart-line";

      const meta = document.createElement("div");
      meta.className = "cart-line-meta";
      const title = document.createElement("p");
      title.className = "cart-line-name";
      title.textContent = product.name;
      const sub = document.createElement("p");
      sub.className = "cart-line-sub";
      sub.textContent = `${formatPrice(product.price)} × ${line.qty} = ${formatPrice(product.price * line.qty)}`;
      meta.append(title, sub);

      const controls = document.createElement("div");
      controls.className = "cart-line-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "qty-btn";
      minus.setAttribute("aria-label", `Riduci ${product.name}`);
      minus.textContent = "−";
      minus.addEventListener("click", () => setQty(line.id, line.qty - 1));

      const qty = document.createElement("span");
      qty.className = "qty-value";
      qty.textContent = String(line.qty);

      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "qty-btn";
      plus.setAttribute("aria-label", `Aumenta ${product.name}`);
      plus.textContent = "+";
      plus.addEventListener("click", () => setQty(line.id, line.qty + 1));

      controls.append(minus, qty, plus);
      li.append(meta, controls);
      return li;
    })
  );

  const total = cartTotal();
  totalEl.textContent = formatPrice(total);
  if (payBtn) payBtn.textContent = `Continua · ${formatPrice(total)}`;
}

function setupCartUI() {
  document.getElementById("cart-open")?.addEventListener("click", openCart);
  document.getElementById("cart-close")?.addEventListener("click", closeCart);
  document.getElementById("cart-overlay")?.addEventListener("click", closeCart);

  document.getElementById("checkout-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cart.length === 0) return;

    const seat = document.getElementById("seat-input")?.value.trim() || "";
    const notes = document.getElementById("notes-input")?.value.trim() || "";

    if (!seat) {
      document.getElementById("seat-input")?.focus();
      showToast("Indica il posto a sedere");
      return;
    }

    const order = {
      seat,
      notes,
      total: cartTotal(),
      createdAt: new Date().toISOString(),
      items: cart.map((line) => {
        const product = productById[line.id];
        return {
          id: line.id,
          name: product.name,
          qty: line.qty,
          unitPrice: product.price,
          lineTotal: product.price * line.qty,
        };
      }),
    };

    sessionStorage.setItem(CONFIG.orderKey, JSON.stringify(order));
    localStorage.removeItem(CONFIG.cartKey);
    cart = [];
    window.location.href = CONFIG.successPage;
  });

  renderCart();
}

function showCategory(target) {
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("is-visible", isActive);
  });

  document.querySelectorAll(".category-btn").forEach((btn) => {
    const isActive = btn.dataset.target === target;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  const activePanel = document.querySelector(`[data-panel="${target}"]`);
  if (activePanel) {
    const nav = document.querySelector(".category-nav");
    const offset = nav ? nav.offsetHeight + 12 : 72;
    const top = activePanel.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
}

function setupCategoryNav() {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", () => showCategory(btn.dataset.target));
  });

  const hash = window.location.hash.replace("#", "");
  if (hash && document.querySelector(`[data-panel="${hash}"]`)) showCategory(hash);
}

function initSuccessPage() {
  const summary = document.getElementById("order-summary");
  const notify = document.getElementById("notify-whatsapp");
  const pay = document.getElementById("pay-paypal");
  const assist = document.getElementById("whatsapp-link");
  if (assist) assist.href = whatsappUrl(CONFIG.whatsappMessage);

  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem(CONFIG.orderKey) || "null");
  } catch {
    order = null;
  }

  if (!order) {
    if (summary) {
      summary.hidden = false;
      summary.innerHTML = `<p>Nessun ordine in corso. Torna al menu per comporre il carrello.</p>`;
    }
    return;
  }

  if (summary) {
    const list = order.items
      .map((item) => `<li>${item.qty}× ${escapeHtml(item.name)} — ${formatPrice(item.lineTotal)}</li>`)
      .join("");

    summary.hidden = false;
    summary.innerHTML = `
      <h2>Riepilogo ordine</h2>
      <p><strong>Posto:</strong> ${escapeHtml(order.seat)}</p>
      <ul>${list}</ul>
      <p><strong>Totale:</strong> ${formatPrice(order.total)}</p>
      <p><strong>Note:</strong> ${escapeHtml(order.notes || "Nessuna")}</p>
    `;
  }

  if (pay) {
    pay.hidden = false;
    pay.href = paypalUrlFor(order.total);
    pay.textContent = `1. Paga ${formatPrice(order.total)} con PayPal`;
  }

  if (notify) {
    notify.hidden = false;
    notify.href = whatsappUrl(buildOrderMessage(order));
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function init() {
  setupWhatsApp();

  if (document.getElementById("cart-drawer")) {
    renderMenu();
    setupCategoryNav();
    setupCartUI();
  }

  if (document.querySelector(".success-page")) {
    initSuccessPage();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
