/**
 * Bamboo Cinema Club — menu, carrello, checkout
 * Non inserire password o chiavi private in questo file.
 */

const CONFIG = {
  paypalMe: "https://www.paypal.me/florianoserafin",
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
      "Include di base: maionese, ketchup, senape, crunchy chips e cetriolini. Disponibile anche VEGAN (specificare VEGAN nelle note).",
    note: "Scrivi nelle note dell’ordine se vuoi RIMUOVERE ingredienti (es. «Senza cetriolini») o se vuoi la versione VEGAN.",
    price: 5,
  },
  {
    id: "pop-corn",
    category: "food",
    name: "Pop Corn",
    description: "Pop Corn salati.",
    note: "",
    price: 3,
  },
  {
    id: "formula-2",
    category: "food",
    name: "Formula Risparmio 2",
    description:
      "Include: Pop Corn + una bevanda a scelta tra Coca Cola lattina 33 cl o The al Limone lattina 33 cl.",
    note: "Indica la bevanda scelta nelle modifiche food.",
    price: 5,
  },
  {
    id: "birra-bionda",
    category: "drink",
    name: "Birra media Non Filtrata 50 cl",
    description: "50 cl — bionda non filtrata.",
    note: "",
    price: 5,
  },
  {
    id: "coca-cola",
    category: "drink",
    name: "Coca Cola lattina 33 cl",
    description: "Lattina 33 cl",
    note: "",
    price: 3,
  },
  {
    id: "the-limone",
    category: "drink",
    name: "The al Limone lattina 33 cl",
    description: "Lattina 33 cl",
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
    description:
      "Include: Biglietto Ingresso + Hot Dog + Birra media Non Filtrata 50 cl. Hot Dog disponibile anche VEGAN (specificare VEGAN nelle note).",
    note: "Se vuoi l’Hot Dog vegan, scrivi VEGAN nelle note.",
    price: 10,
  },
];

const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

/** @type {{ id: string, qty: number }[]} */
let cart = loadCart();

function paypalUrlFor(price) {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "https://www.paypal.com/paypalme/florianoserafin";
  }
  // Formato ufficiale: apre la schermata di pagamento con importo già compilato
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `https://www.paypal.com/paypalme/florianoserafin/${formatted}EUR`;
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

const NO_SEAT_PRODUCTS = new Set(["biglietto"]);

function cartNeedsSeat() {
  // Solo biglietto ingresso: niente fila/posto. Food/drink/formule sì.
  return cart.some((line) => !NO_SEAT_PRODUCTS.has(line.id));
}

function buildPaypalNote(order) {
  const items = order.items
    .map((i) => `${i.qty}x ${i.name} (${formatPrice(i.lineTotal)})`)
    .join(", ");
  const ingredients = order.ingredients?.trim() || "nessuna";
  const total = formatPrice(Number(order.total) || 0);
  const lines = [
    `RECAP ORDINE Bamboo Cinema Club`,
    `Importo: ${total}`,
  ];
  if (order.needsSeat) {
    lines.push(`Posizione: FILA ${order.fila || "-"} posto ${order.posto || "-"}`);
    lines.push(`Modifiche food: ${ingredients}`);
  } else {
    lines.push(`Solo biglietto ingresso (senza fila/posto)`);
  }
  lines.push(`Prodotti: ${items}`);
  return lines.join("\n");
}

function readSeatFields() {
  const filaRaw = document.getElementById("fila-input")?.value.trim().toUpperCase() || "";
  const postoRaw = document.getElementById("posto-input")?.value.trim() || "";
  const fila = filaRaw.replace(/[^A-Z]/g, "").slice(0, 1);
  const posto = postoRaw.replace(/\D/g, "");
  return { fila, posto };
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

function openCheckout() {
  if (cart.length === 0) {
    showToast("Aggiungi almeno un prodotto");
    return;
  }
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (!drawer || !overlay) return;
  drawer.hidden = false;
  overlay.hidden = false;
  document.body.classList.add("cart-open");
  renderCart();
  if (cartNeedsSeat()) document.getElementById("fila-input")?.focus();
  else document.getElementById("pay-button")?.focus();
}

function closeCheckout() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  if (!drawer || !overlay) return;
  drawer.hidden = true;
  overlay.hidden = true;
  document.body.classList.remove("cart-open");
}

function renderCart() {
  const badgeNav = document.getElementById("cart-badge-nav");
  const bar = document.getElementById("cart-bar");
  const barCount = document.getElementById("cart-bar-count");
  const barTotal = document.getElementById("cart-bar-total");
  const linesEl = document.getElementById("cart-lines");
  const totalEl = document.getElementById("cart-total");
  const payBtn = document.getElementById("pay-button");
  const count = cartCount();
  const total = cartTotal();

  if (badgeNav) {
    badgeNav.textContent = String(count);
    badgeNav.hidden = count === 0;
  }

  if (bar) bar.hidden = count === 0;
  if (barCount) {
    barCount.textContent = count === 1 ? "1 prodotto" : `${count} prodotti`;
  }
  if (barTotal) barTotal.textContent = formatPrice(total);

  if (!linesEl || !totalEl) return;

  if (cart.length === 0) {
    closeCheckout();
    linesEl.replaceChildren();
    return;
  }

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

  totalEl.textContent = formatPrice(total);
  if (payBtn) payBtn.textContent = `Invia ordine · ${formatPrice(total)}`;

  const needsSeat = cartNeedsSeat();
  const seatFields = document.getElementById("seat-fields");
  const ingredientsField = document.getElementById("ingredients-field");
  const warningSeat = document.getElementById("checkout-warning-seat");
  const warningTicket = document.getElementById("checkout-warning-ticket");
  const filaInput = document.getElementById("fila-input");
  const postoInput = document.getElementById("posto-input");

  if (seatFields) seatFields.hidden = !needsSeat;
  if (ingredientsField) ingredientsField.hidden = !needsSeat;
  if (warningSeat) warningSeat.hidden = !needsSeat;
  if (warningTicket) warningTicket.hidden = needsSeat;
  if (filaInput) filaInput.required = needsSeat;
  if (postoInput) postoInput.required = needsSeat;
}

function setupCartUI() {
  document.getElementById("finalize-order")?.addEventListener("click", openCheckout);
  document.getElementById("cart-open-nav")?.addEventListener("click", openCheckout);
  document.getElementById("cart-close")?.addEventListener("click", closeCheckout);
  document.getElementById("cart-overlay")?.addEventListener("click", closeCheckout);

  document.getElementById("checkout-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cart.length === 0) return;

    const needsSeat = cartNeedsSeat();
    const { fila, posto } = readSeatFields();
    const ingredients = needsSeat
      ? document.getElementById("ingredients-input")?.value.trim() || ""
      : "";

    if (needsSeat) {
      if (!fila) {
        document.getElementById("fila-input")?.focus();
        showToast("Indica la fila con una lettera (es. FILA B)");
        return;
      }
      if (!posto) {
        document.getElementById("posto-input")?.focus();
        showToast("Indica il posto (es. posto 12)");
        return;
      }
    }

    const seat = needsSeat ? `FILA ${fila} posto ${posto}` : "Solo biglietto";
    const order = {
      seat,
      fila: needsSeat ? fila : "",
      posto: needsSeat ? posto : "",
      needsSeat,
      ingredients,
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
  const pay = document.getElementById("pay-paypal");
  const noteBox = document.getElementById("paypal-note-box");
  const noteText = document.getElementById("paypal-note-text");
  const copyBtn = document.getElementById("copy-paypal-note");

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

  const total = Number(order.total) || 0;
  const paypalNote = buildPaypalNote(order);
  const paypalHref = paypalUrlFor(total);

  if (summary) {
    const list = order.items
      .map((item) => `<li>${item.qty}× ${escapeHtml(item.name)} — ${formatPrice(item.lineTotal)}</li>`)
      .join("");

    summary.hidden = false;
    summary.innerHTML = `
      <h2>Riepilogo ordine</h2>
      ${
        order.needsSeat
          ? `<p><strong>Posizione:</strong> FILA ${escapeHtml(order.fila || "-")} posto ${escapeHtml(order.posto || "-")}</p>`
          : `<p><strong>Posizione:</strong> non richiesta (solo biglietto)</p>`
      }
      <ul>${list}</ul>
      <p><strong>Totale da pagare:</strong> ${formatPrice(total)}</p>
      ${
        order.needsSeat
          ? `<p><strong>Modifiche ingredienti:</strong> ${escapeHtml(order.ingredients || "Nessuna")}</p>`
          : ""
      }
    `;
  }

  const alertEl = document.getElementById("success-alert");
  if (alertEl) {
    alertEl.innerHTML = order.needsSeat
      ? `L’importo del carrello è già impostato su PayPal. Seleziona <strong>Amici e parenti</strong>. <strong>Copia/incolla la nota</strong> (es. FILA B posto 12 + modifiche), altrimenti l’ordine non è valido.`
      : `L’importo del biglietto è già impostato su PayPal. Seleziona <strong>Amici e parenti</strong> e <strong>incolla la nota</strong>. Per il solo biglietto non serve fila e posto.`;
  }

  if (noteBox && noteText) {
    noteBox.hidden = false;
    noteText.textContent = paypalNote;
  }

  copyBtn?.addEventListener("click", async () => {
    const ok = await copyText(paypalNote);
    showToast(ok ? "Nota copiata: incollala su PayPal" : "Copia manualmente la nota");
  });

  if (pay) {
    pay.hidden = false;
    pay.removeAttribute("target");
    pay.rel = "noopener noreferrer";
    pay.href = paypalHref;
    pay.textContent = `Paga ${formatPrice(total)} con PayPal`;
    pay.addEventListener("click", async (event) => {
      event.preventDefault();
      const ok = await copyText(paypalNote);
      showToast(
        ok
          ? "Nota copiata. Su PayPal: Amici e parenti + Aggiungi nota → Incolla"
          : "Copia la nota. Su PayPal scegli Amici e parenti"
      );
      // Stessa finestra: apre il pagamento con importo già impostato
      window.setTimeout(() => {
        window.location.href = paypalHref;
      }, ok ? 350 : 600);
    });
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
