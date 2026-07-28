/**
 * Bamboo Cinema Club — menu data & config
 *
 * I pulsanti Acquista aprono PayPal.me con l'importo del prodotto.
 * Sostituisci ancora whatsappNumber con il numero reale del locale.
 * Non inserire password, token o chiavi private in questo file.
 */

const CONFIG = {
  // PayPal.me — gli importi si aggiungono automaticamente (es. .../5EUR)
  paypalMe: "https://www.paypal.me/florianoserafin",
  // Sostituisci con il tuo numero (solo cifre, prefisso internazionale, senza +)
  // Esempio Italia: 393331234567
  whatsappNumber: "393318563277",
  whatsappMessage: "Ciao Bamboo Cinema Club! Vorrei assistenza per un ordine dal menu digitale.",
  successPage: "success.html",
};

/**
 * Prodotti del menu.
 * category: "food" | "drink" | "ingresso"
 */
const PRODUCTS = [
  {
    id: "hot-dog",
    category: "food",
    name: "Hot Dog",
    description:
      "Include di base: maionese, ketchup, senape, crunchy chips e cetriolini.",
    note: "Specifica nelle note dell'ordine se vuoi RIMUOVERE qualche ingrediente (es. «Senza cetriolini»).",
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
    note: "Indica la bevanda scelta nelle note dell'ordine PayPal.",
    price: 5,
  },
];

function paypalUrlFor(price) {
  const base = CONFIG.paypalMe.replace(/\/$/, "");
  return `${base}/${price}EUR`;
}

function formatPrice(euros) {
  return (
    new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(euros)
  );
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

  const buy = document.createElement("a");
  buy.className = "btn-buy";
  buy.href = paypalUrlFor(product.price);
  buy.target = "_blank";
  buy.rel = "noopener noreferrer";
  buy.textContent = "Acquista";
  buy.setAttribute(
    "aria-label",
    `Acquista ${product.name} a ${formatPrice(product.price)}`
  );

  article.append(info, price, buy);
  return article;
}

function renderMenu() {
  const lists = document.querySelectorAll(".product-list[data-category]");
  lists.forEach((list) => {
    const category = list.dataset.category;
    const items = PRODUCTS.filter((p) => p.category === category);
    list.replaceChildren(...items.map(createProductElement));
  });
}

function setupWhatsApp() {
  const link = document.getElementById("whatsapp-link");
  if (!link) return;

  const text = encodeURIComponent(CONFIG.whatsappMessage);
  link.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;
}

function showCategory(target) {
  const panels = document.querySelectorAll("[data-panel]");
  const buttons = document.querySelectorAll(".category-btn");

  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("is-visible", isActive);
  });

  buttons.forEach((btn) => {
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
  const buttons = document.querySelectorAll(".category-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showCategory(btn.dataset.target);
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (hash && document.querySelector(`[data-panel="${hash}"]`)) {
    showCategory(hash);
  }
}

function init() {
  renderMenu();
  setupWhatsApp();
  setupCategoryNav();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
