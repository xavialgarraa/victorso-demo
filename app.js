/**
 * Victor So Professional — Demo prototype front-end
 * Vanilla JS, hash-router, estado de carrito en localStorage.
 * `PRODUCTS`, `CATEGORIES`, `BRANDS`, `TESTIMONIALS` vienen de data.js
 * (capa de datos de ejemplo a sustituir por Shopify Storefront API).
 * `ICONS`/`icon()` vienen de icons.js. `t()`/`I18n` vienen de i18n.js.
 */

const APP = document.getElementById("app");
const FREE_SHIPPING_THRESHOLD = 149;

/* ---------------------------------------------------------------------- */
/* Utilidades                                                             */
/* ---------------------------------------------------------------------- */

function euros(n) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function findProduct(handle) {
  return PRODUCTS.find((p) => p.handle === handle);
}

function findVariant(product, variantId) {
  return product.variants.find((v) => v.id === variantId) || product.variants[0];
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Observador de lazy-load para imágenes con data-src */
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.addEventListener("load", () => img.classList.add("loaded"));
      lazyObserver.unobserve(img);
    }
  });
}, { rootMargin: "200px" });

function mountLazyImages(root = document) {
  root.querySelectorAll("img[data-src]").forEach((img) => lazyObserver.observe(img));
}

function lazyImg(src, alt, cls = "") {
  return `<img class="lazy-img ${cls}" data-src="${src}" alt="${escapeHtml(alt)}" loading="lazy" width="600" height="600">`;
}

/** Revela secciones con .reveal al entrar en el viewport */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function initReveal(root = document) {
  root.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.innerHTML = `${icon("checkCircle")}<span>${escapeHtml(msg)}</span>`;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ---------------------------------------------------------------------- */
/* Modo claro / oscuro                                                     */
/* ---------------------------------------------------------------------- */

const Theme = {
  KEY: "vs_demo_theme",
  effective() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },
  toggle() {
    const next = this.effective() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(this.KEY, next);
    this.updateIcon();
  },
  updateIcon() {
    const el = document.getElementById("themeIcon");
    if (!el) return;
    el.innerHTML = this.effective() === "dark" ? ICONS.sun : ICONS.moon;
  },
};

/* ---------------------------------------------------------------------- */
/* Carrito (estado local, persistido en localStorage)                     */
/* ---------------------------------------------------------------------- */

const Cart = {
  KEY: "vs_demo_cart",
  items: [], // { variantId, productHandle, qty }

  load() {
    try { this.items = JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { this.items = []; }
  },
  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.items));
    updateCartCount();
  },
  add(productHandle, variantId, qty = 1) {
    const existing = this.items.find((i) => i.variantId === variantId);
    if (existing) existing.qty += qty;
    else this.items.push({ productHandle, variantId, qty });
    this.save();
  },
  setQty(variantId, qty) {
    const item = this.items.find((i) => i.variantId === variantId);
    if (!item) return;
    item.qty = Math.max(1, qty);
    this.save();
  },
  remove(variantId) {
    this.items = this.items.filter((i) => i.variantId !== variantId);
    this.save();
  },
  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },
  lines() {
    return this.items.map((i) => {
      const product = findProduct(i.productHandle);
      const variant = product ? findVariant(product, i.variantId) : null;
      return { ...i, product, variant };
    }).filter((l) => l.product && l.variant);
  },
  subtotal() {
    return this.lines().reduce((sum, l) => sum + l.variant.price * l.qty, 0);
  },
};
Cart.load();

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = Cart.count();
}

/* ---------------------------------------------------------------------- */
/* Router                                                                  */
/* ---------------------------------------------------------------------- */

const routes = [
  { pattern: /^\/$/, render: renderHome },
  { pattern: /^\/category\/([\w-]+)$/, render: (m, q) => renderCategory(m[1], q) },
  { pattern: /^\/product\/([\w-]+)$/, render: (m) => renderProduct(m[1]) },
  { pattern: /^\/cart$/, render: renderCart },
  { pattern: /^\/checkout$/, render: renderCheckout },
  { pattern: /^\/search$/, render: (m, q) => renderSearch(q) },
  { pattern: /^\/quienes-somos$/, render: renderAbout },
];

let scrollHeroCleanup = null;

function parseHash() {
  const raw = location.hash.slice(1) || "/";
  const [path, queryStr] = raw.split("?");
  const query = new URLSearchParams(queryStr || "");
  return { path, query };
}

function router() {
  const { path, query } = parseHash();
  const match = routes.find((r) => r.pattern.test(path));
  closeMobileMenu();
  if (scrollHeroCleanup) { scrollHeroCleanup(); scrollHeroCleanup = null; }
  if (!match) {
    APP.innerHTML = `<div class="section text-center"><h2>${t("notFound")}</h2><a class="btn btn--primary" href="#/">${t("backHome")}</a></div>`;
    return;
  }
  const m = path.match(match.pattern);
  match.render(m, query);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  updateCartCount();
  initReveal(APP);
}

window.addEventListener("hashchange", router);

/* ---------------------------------------------------------------------- */
/* Fragmentos reutilizables                                               */
/* ---------------------------------------------------------------------- */

function productCard(p) {
  const hasOffer = p.compareAtPrice && p.compareAtPrice > p.price;
  const isOutlet = p.category === "outlet";
  return `
  <article class="pcard">
    <a href="#/product/${p.handle}">
      <div class="pcard__imgwrap">
        <div class="pcard__badges">
          ${hasOffer ? `<span class="badge badge--offer">${t("badgeOffer")}</span>` : ""}
          ${isOutlet ? `<span class="badge badge--outlet">${t("badgeOutlet")}</span>` : ""}
        </div>
        ${lazyImg(p.images[0], p.title)}
      </div>
      <div class="pcard__body">
        <div class="pcard__vendor">${escapeHtml(p.vendor)}</div>
        <div class="pcard__title">${escapeHtml(p.title)}</div>
        <div class="pcard__rating"><span class="stars">${stars(p.rating)}</span> (${p.reviewsCount})</div>
        <div class="pcard__price">
          <span class="now">${euros(p.price)}</span>
          ${hasOffer ? `<span class="was">${euros(p.compareAtPrice)}</span>` : ""}
        </div>
      </div>
    </a>
    <button class="btn btn--dark btn--block pcard__addbtn" data-quickadd="${p.handle}">${t("addToCart")}</button>
  </article>`;
}

function brandLogo(b) {
  return b.logo
    ? `<span class="ticker__logo">${lazyImg(b.logo, b.name)}</span>`
    : `<span>${escapeHtml(b.name)}</span>`;
}

function brandStrip() {
  // El contenido se duplica para que la animación pueda hacer un
  // bucle perfecto de -50% sin salto visible al reiniciar.
  const items = BRANDS.map(brandLogo).join("");
  return `<div class="ticker"><div class="ticker__track">${items}${items}</div></div>`;
}

function testimonialsBlock() {
  return `<div class="testigrid">${TESTIMONIALS.map((tm) => `
    <div class="testi">
      <span class="stars">${stars(tm.rating)}</span>
      <p>“${escapeHtml(tm.text)}”</p>
      <div class="testi__author">${escapeHtml(tm.author)}</div>
      <div class="testi__role">${escapeHtml(tm.role)}</div>
    </div>`).join("")}</div>`;
}

/* ---------------------------------------------------------------------- */
/* Home + Hero de scroll (escenas fijas)                                   */
/* ---------------------------------------------------------------------- */

/**
 * `origin` = punto de la imagen hacia el que empuja la cámara al hacer
 * zoom (transform-origin). Se elige para que el travelling avance hacia
 * la zona de interés de cada plano (cabina, escenario, mesa) y no hacia
 * las zonas oscuras del centro.
 */
const HERO_SCENES = [
  { slug: "dj", eyebrowKey: "hero1Eyebrow", titleKey: "hero1Title", descKey: "hero1Desc", ctaKey: "heroCtaDj", image: "assets/hero/scene1-sala.png", origin: "50% 42%" },
  { slug: "sonido", eyebrowKey: "hero2Eyebrow", titleKey: "hero2Title", descKey: "hero2Desc", ctaKey: "navSonido", image: "assets/hero/scene2-escenario.png", origin: "50% 38%" },
  { slug: "dj", eyebrowKey: "hero3Eyebrow", titleKey: "hero3Title", descKey: "hero3Desc", ctaKey: "heroCtaDj", image: "assets/hero/scene3-mesa.png", origin: "50% 62%" },
];

function scrollHeroMarkup() {
  const scenesWithImg = HERO_SCENES.map((s) => ({ ...s, image: s.image || CATEGORIES.find((c) => c.slug === s.slug)?.image }));
  return `
  <section class="scrollhero" style="height:calc(${HERO_SCENES.length * 150}vh + 100vh)">
    <div class="scrollhero__stage">
      <div class="scrollhero__bg">
        ${typeof HERO_FRAMES !== "undefined" && HERO_FRAMES
          ? `<img src="${scenesWithImg[0].image}" alt="" class="active"><canvas class="scrollhero__canvas"></canvas>`
          : scenesWithImg.map((s, i) => `<img src="${s.image}" alt="" class="${i === 0 ? "active" : ""}" style="transform-origin:${s.origin || "50% 50%"}">`).join("")}
      </div>
      <div class="scrollhero__content">
        <div class="scrollhero__inner">
          ${scenesWithImg.map((s, i) => `
            <div class="scrollhero__scene ${i === 0 ? "active" : ""}" data-scene="${i}">
              <div class="scrollhero__eyebrow">${t(s.eyebrowKey)}</div>
              <h1 class="scrollhero__title">${t(s.titleKey)}</h1>
              <p class="scrollhero__desc">${t(s.descKey)}</p>
              <div class="scrollhero__actions">
                <a href="#/category/${s.slug}" class="btn btn--primary">${t(s.ctaKey)}</a>
                <a href="#/category/outlet" class="btn btn--outline">${t("heroCtaOutlet")}</a>
              </div>
            </div>`).join("")}
        </div>
      </div>
      <div class="scrollhero__progress">
        ${scenesWithImg.map((_, i) => `<span class="scrollhero__dot ${i === 0 ? "active" : ""}"></span>`).join("")}
      </div>
      <div class="scrollhero__scrollhint">${icon("chevronDown")}<span>${t("scrollHint")}</span></div>
    </div>
  </section>`;
}

/**
 * Cámara ligada al scroll ("dolly"): dentro de cada escena la imagen hace
 * un zoom continuo (te acercas al escenario) y en cada transición la
 * escena entrante aparece en un plano más abierto que el plano cerrado
 * de la saliente — se percibe como que la cámara "tira hacia atrás" y
 * vuelve a empujar hacia el siguiente punto de interés. Todo se calcula
 * por frame a partir de la posición real de scroll (scrub 1:1, sin
 * animaciones por tiempo), con requestAnimationFrame.
 */
/**
 * Motor de plano secuencia real: pinta en un <canvas> el fotograma del
 * vídeo que corresponde a la posición exacta del scroll (técnica tipo
 * Apple AirPods). Los frames se precargan de forma progresiva — primero
 * uno de cada seis para tener el recorrido completo enseguida, luego se
 * rellenan los huecos — y mientras un frame no está cargado se pinta el
 * más cercano disponible, así el scrub nunca se queda en negro.
 */
function initScrollHeroCanvas(cfg, sceneCount) {
  const section = document.querySelector(".scrollhero");
  if (!section) return;
  const stage = section.querySelector(".scrollhero__stage");
  const canvas = section.querySelector(".scrollhero__canvas");
  const poster = section.querySelector(".scrollhero__bg img");
  const scenes = [...section.querySelectorAll(".scrollhero__scene")];
  const dots = [...section.querySelectorAll(".scrollhero__dot")];
  const ctx = canvas.getContext("2d");
  const frames = new Array(cfg.count).fill(null);
  let targetIdx = 0;
  let drawnIdx = -1;
  let ticking = false;

  const frameSrc = (i) => `${cfg.path}frame-${String(i + 1).padStart(4, "0")}.${cfg.ext}`;

  // Orden de precarga: pasada gruesa (1 de cada 6), media (1 de cada 2), fina
  const order = [];
  const seen = new Set();
  [6, 2, 1].forEach((step) => {
    for (let i = 0; i < cfg.count; i += step) {
      if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
  });
  let cursor = 0;
  const CONCURRENCY = 4;
  function pump() {
    while (cursor < order.length) {
      const inFlight = order.slice(0, cursor).filter((i) => frames[i] === "loading").length;
      if (inFlight >= CONCURRENCY) return;
      const i = order[cursor++];
      const im = new Image();
      frames[i] = "loading";
      im.onload = () => {
        frames[i] = im;
        if (poster && poster.style.opacity !== "0" ) { poster.style.opacity = "0"; }
        if (Math.abs(i - targetIdx) < 6) draw();
        pump();
      };
      im.onerror = () => { frames[i] = null; pump(); };
      im.src = frameSrc(i);
      if (cursor <= CONCURRENCY) continue;
      return;
    }
  }

  function nearestLoaded(target) {
    if (frames[target] instanceof Image) return frames[target];
    for (let d = 1; d < cfg.count; d++) {
      const a = frames[target - d], b = frames[target + d];
      if (a instanceof Image) return a;
      if (b instanceof Image) return b;
    }
    return null;
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
    drawnIdx = -1;
    draw();
  }

  function draw() {
    const img = nearestLoaded(targetIdx);
    if (!img || drawnIdx === targetIdx) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih);
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    drawnIdx = targetIdx;
  }

  function update() {
    ticking = false;
    // si el canvas se dimensionó con la ventana oculta (ancho 0), recupéralo
    if (canvas.width === 0 && stage.clientWidth > 0) { resize(); return; }
    const rect = section.getBoundingClientRect();
    const total = rect.height - stage.offsetHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const p = total > 0 ? scrolled / total : 0;
    targetIdx = Math.min(cfg.count - 1, Math.max(0, Math.round(p * (cfg.count - 1))));
    draw();
    const idx = Math.min(sceneCount - 1, Math.max(0, Math.floor(p * sceneCount)));
    scenes.forEach((s2, i) => s2.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    stage.classList.toggle("at-end", p > 0.96);
  }
  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  const ro = new ResizeObserver(() => resize());
  ro.observe(stage);
  resize();
  update();
  pump();
  scrollHeroCleanup = () => {
    window.removeEventListener("scroll", onScroll);
    ro.disconnect();
  };
}

function initScrollHero(sceneCount) {
  if (typeof HERO_FRAMES !== "undefined" && HERO_FRAMES) {
    initScrollHeroCanvas(HERO_FRAMES, sceneCount);
    return;
  }
  const section = document.querySelector(".scrollhero");
  if (!section) return;
  const stage = section.querySelector(".scrollhero__stage");
  const bgImgs = [...section.querySelectorAll(".scrollhero__bg img")];
  const scenes = [...section.querySelectorAll(".scrollhero__scene")];
  const dots = [...section.querySelectorAll(".scrollhero__dot")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;

  const seg = 1 / sceneCount;      // porción de scroll que ocupa cada escena
  const FADE_W = seg * 0.18;       // semiancho del crossfade en cada frontera
  const ZOOM_FROM = 1.04;          // plano de entrada (más abierto = "tirón atrás")
  const ZOOM_TO = 1.3;             // plano final del empuje hacia dentro

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function update() {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const total = rect.height - stage.offsetHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const p = total > 0 ? scrolled / total : 0;

    bgImgs.forEach((img, i) => {
      const start = i * seg;
      const end = (i + 1) * seg;
      // crossfade solapado centrado en cada frontera de escena
      const oIn = i === 0 ? 1 : clamp01((p - (start - FADE_W)) / (FADE_W * 2));
      const oOut = i === sceneCount - 1 ? 1 : clamp01(((end + FADE_W) - p) / (FADE_W * 2));
      // el zoom arranca en cuanto la escena empieza a aparecer, así la
      // cámara nunca se detiene durante el fundido
      const tz = clamp01((p - (start - FADE_W)) / (seg + FADE_W * 2));
      img.style.opacity = Math.min(oIn, oOut).toFixed(3);
      img.style.transform = reduceMotion
        ? "none"
        : `scale(${(ZOOM_FROM + (ZOOM_TO - ZOOM_FROM) * easeInOut(tz)).toFixed(4)}) translateZ(0)`;
    });

    const idx = Math.min(sceneCount - 1, Math.max(0, Math.floor(p / seg)));
    scenes.forEach((s, i) => s.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    stage.classList.toggle("at-end", p > 0.96);
  }
  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
  scrollHeroCleanup = () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

function renderHome() {
  const featured = PRODUCTS.filter((p) => p.compareAtPrice).slice(0, 4);
  const bestsellers = [...PRODUCTS].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 8);

  APP.innerHTML = `
  ${scrollHeroMarkup()}

  <div class="shipband">${icon("truck")}<span>${t("shipBanner")}</span></div>

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("sectionCategories")}</h2></div>
      <div class="catgrid">
        ${CATEGORIES.map((c) => `
          <a class="catcard" href="#/category/${c.slug}">
            <span class="catcard__icon">${c.icon}</span>
            ${lazyImg(c.image, c.title)}
            <span class="catcard__label">${escapeHtml(c.title)}</span>
          </a>`).join("")}
      </div>
    </div>
  </section>

  <section class="section section--muted reveal">
    <div class="container">
      <div class="section__head">
        <h2>${t("sectionOffers")}</h2>
        <a href="#/category/outlet">${t("sectionOffersLink")} ${icon("arrowRight")}</a>
      </div>
      <div class="prodgrid">${featured.map(productCard).join("")}</div>
    </div>
  </section>

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("sectionBestsellers")}</h2></div>
      <div class="prodgrid">${bestsellers.map(productCard).join("")}</div>
    </div>
  </section>

  <section class="section section--muted reveal">
    <div class="container">
      <div class="section__head"><h2>${t("sectionBrands")}</h2></div>
      ${brandStrip()}
    </div>
  </section>

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("sectionTestimonials")}</h2></div>
      ${testimonialsBlock()}
    </div>
  </section>
  `;
  bindQuickAdd();
  mountLazyImages(APP);
  initScrollHero(HERO_SCENES.length);
}

/* ---------------------------------------------------------------------- */
/* Listado / categoría                                                    */
/* ---------------------------------------------------------------------- */

function renderCategory(slug, query) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  renderListing({
    title: cat ? cat.title : "Categoría",
    baseProducts: PRODUCTS.filter((p) => p.category === slug),
    query,
    basePath: `/category/${slug}`,
  });
}

function renderSearch(query) {
  const term = (query.get("q") || "").toLowerCase().trim();
  const baseProducts = term
    ? PRODUCTS.filter((p) => (p.title + " " + p.vendor + " " + p.tags.join(" ")).toLowerCase().includes(term))
    : PRODUCTS;
  renderListing({
    title: term ? `“${term}”` : t("sectionBestsellers"),
    baseProducts,
    query,
    basePath: `/search`,
  });
}

function renderListing({ title, baseProducts, query, basePath }) {
  const allBrands = [...new Set(baseProducts.map((p) => p.vendor))].sort();
  const selectedBrands = query.getAll("brand");
  const minPrice = query.get("min") || "";
  const maxPrice = query.get("max") || "";
  const sort = query.get("sort") || "relevance";
  const onlyOffers = query.get("offers") === "1";

  let products = baseProducts.filter((p) => {
    if (selectedBrands.length && !selectedBrands.includes(p.vendor)) return false;
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    if (onlyOffers && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
    return true;
  });

  switch (sort) {
    case "price-asc": products.sort((a, b) => a.price - b.price); break;
    case "price-desc": products.sort((a, b) => b.price - a.price); break;
    case "rating": products.sort((a, b) => b.rating - a.rating); break;
    case "newest": products.sort((a, b) => b.id.localeCompare(a.id)); break;
    default: break;
  }

  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${escapeHtml(title)}</div>
  <section class="section listing">
    <div class="container">
      <div class="section__head"><h2>${escapeHtml(title)}</h2></div>
      <div class="listing__toolbar">
        <button class="btn btn--outline filter-toggle" id="filterToggle">${icon("filter")}<span>${t("filters")}</span></button>
        <span class="listing__count">${t("results", products.length)}</span>
        <select class="sort-select" id="sortSelect">
          <option value="relevance" ${sort === "relevance" ? "selected" : ""}>${t("sortRelevance")}</option>
          <option value="price-asc" ${sort === "price-asc" ? "selected" : ""}>${t("sortPriceAsc")}</option>
          <option value="price-desc" ${sort === "price-desc" ? "selected" : ""}>${t("sortPriceDesc")}</option>
          <option value="rating" ${sort === "rating" ? "selected" : ""}>${t("sortRating")}</option>
          <option value="newest" ${sort === "newest" ? "selected" : ""}>${t("sortNewest")}</option>
        </select>
      </div>

      <div class="listing__body">
        <aside class="filters" id="filtersPanel">
          <div class="filters__head">
            <h3 class="mt-0">${t("filters")}</h3>
            <button class="filters__close" id="filtersClose">${icon("close")}</button>
          </div>
          <div class="filter-group">
            <h4>${t("brand")}</h4>
            ${allBrands.map((b) => `
              <label><input type="checkbox" name="brand" value="${escapeHtml(b)}" ${selectedBrands.includes(b) ? "checked" : ""}> ${escapeHtml(b)}</label>
            `).join("")}
          </div>
          <div class="filter-group">
            <h4>${t("price")}</h4>
            <div class="price-inputs">
              <input type="number" id="minPrice" placeholder="Mín" value="${minPrice}">
              <span>—</span>
              <input type="number" id="maxPrice" placeholder="Máx" value="${maxPrice}">
            </div>
          </div>
          <div class="filter-group">
            <label><input type="checkbox" id="onlyOffers" ${onlyOffers ? "checked" : ""}> ${t("onlyOffers")}</label>
          </div>
          <button class="btn btn--primary btn--block" id="applyFilters">${t("applyFilters")}</button>
        </aside>

        <div>
          ${products.length
            ? `<div class="prodgrid">${products.map(productCard).join("")}</div>`
            : `<div class="empty-state"><p>${t("noResults")}</p></div>`}
        </div>
      </div>
    </div>
  </section>
  `;

  function pushQuery(next) {
    const p = new URLSearchParams();
    if (next.brands?.length) next.brands.forEach((b) => p.append("brand", b));
    if (next.min) p.set("min", next.min);
    if (next.max) p.set("max", next.max);
    if (next.sort && next.sort !== "relevance") p.set("sort", next.sort);
    if (next.offers) p.set("offers", "1");
    if (query.get("q")) p.set("q", query.get("q"));
    const qs = p.toString();
    location.hash = `#${basePath}${qs ? "?" + qs : ""}`;
  }

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    pushQuery({ brands: selectedBrands, min: minPrice, max: maxPrice, sort: e.target.value, offers: onlyOffers });
  });

  document.getElementById("applyFilters").addEventListener("click", () => {
    const brands = [...document.querySelectorAll('input[name="brand"]:checked')].map((i) => i.value);
    const min = document.getElementById("minPrice").value;
    const max = document.getElementById("maxPrice").value;
    const offers = document.getElementById("onlyOffers").checked;
    pushQuery({ brands, min, max, sort, offers });
  });

  const filterToggle = document.getElementById("filterToggle");
  const filtersPanel = document.getElementById("filtersPanel");
  const filtersClose = document.getElementById("filtersClose");
  const overlay = document.getElementById("overlay");
  filterToggle?.addEventListener("click", () => { filtersPanel.classList.add("open"); overlay.classList.add("open"); });
  filtersClose?.addEventListener("click", () => { filtersPanel.classList.remove("open"); overlay.classList.remove("open"); });
  overlay.addEventListener("click", () => { filtersPanel.classList.remove("open"); overlay.classList.remove("open"); closeMobileMenu(); });

  bindQuickAdd();
  mountLazyImages(APP);
}

/* ---------------------------------------------------------------------- */
/* Ficha de producto                                                       */
/* ---------------------------------------------------------------------- */

function renderProduct(handle) {
  const p = findProduct(handle);
  if (!p) {
    APP.innerHTML = `<div class="section text-center"><h2>${t("productNotFound")}</h2><a class="btn btn--primary" href="#/">${t("backHome")}</a></div>`;
    return;
  }
  const cat = CATEGORIES.find((c) => c.slug === p.category);
  let currentVariant = p.variants[0];
  let currentImg = 0;
  let qty = 1;

  const related = PRODUCTS.filter((x) => x.category === p.category && x.handle !== p.handle).slice(0, 4);

  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / <a href="#/category/${p.category}">${escapeHtml(cat ? cat.title : p.category)}</a> / ${escapeHtml(p.title)}</div>
  <div class="pdp">
    <div class="pdp__gallery">
      <div class="pdp__gallery-main" id="galleryMain">${lazyImg(p.images[0], p.title)}</div>
      <div class="pdp__thumbs" id="galleryThumbs">
        ${p.images.map((img, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}">${lazyImg(img, p.title + " miniatura " + (i + 1))}</button>`).join("")}
      </div>
    </div>

    <div class="pdp__info">
      <div class="pdp__vendor">${escapeHtml(p.vendor)}</div>
      <h1 class="pdp__title">${escapeHtml(p.title)}</h1>
      <div class="pdp__rating"><span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} · ${t("reviewsOf", p.reviewsCount)}</div>

      <div class="pdp__price" id="pdpPrice">
        <span class="now">${euros(currentVariant.price)}</span>
        ${currentVariant.compareAtPrice ? `<span class="was">${euros(currentVariant.compareAtPrice)}</span>` : ""}
      </div>

      <p class="pdp__desc">${escapeHtml(p.description)}</p>

      <div class="option-select">
        <label for="variantSelect">${escapeHtml(p.optionName)}</label>
        <select id="variantSelect">
          ${p.variants.map((v) => `<option value="${v.id}" ${!v.available ? "disabled" : ""}>${escapeHtml(v.title)} — ${euros(v.price)}${!v.available ? " (agotado)" : ""}</option>`).join("")}
        </select>
      </div>

      <div class="qty-row">
        <span style="font-weight:700;font-size:.85rem">${t("quantity")}</span>
        <div class="qty-stepper">
          <button id="qtyMinus" aria-label="Restar">${icon("minus")}</button>
          <span id="qtyValue">1</span>
          <button id="qtyPlus" aria-label="Sumar">${icon("plus")}</button>
        </div>
      </div>

      <p class="stock-msg in" id="stockMsg">${icon("checkCircle")}<span>${t("inStock")}</span></p>

      <div class="pdp__actions">
        <button class="btn btn--primary" id="addToCartBtn">${t("addToCart")} — <span id="addPriceLabel">${euros(currentVariant.price)}</span></button>
        <a class="btn btn--dark" href="#/cart" id="buyNowBtn">${t("buyNow")}</a>
      </div>

      <div class="pdp__perks">
        <div>${icon("truck")}<span>${t("perkShip")}</span></div>
        <div>${icon("shield")}<span>${t("perkWarranty")}</span></div>
        <div>${icon("returnArrow")}<span>${t("perkReturn")}</span></div>
        <div>${icon("card")}<span>${t("perkSecure")}</span></div>
      </div>
    </div>

    <div class="pdp__tabs">
      <div class="tabs__nav">
        <button class="active" data-tab="specs">${t("tabSpecs")}</button>
        <button data-tab="reviews">${t("tabReviews")} (${p.reviewsCount})</button>
        <button data-tab="shipping">${t("tabShipping")}</button>
      </div>
      <div class="tabs__panel active" data-panel="specs">
        <table class="spectable">
          ${p.specs.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("")}
        </table>
      </div>
      <div class="tabs__panel" data-panel="reviews">
        <div class="reviews-summary">
          <div class="reviews-summary__score">${p.rating.toFixed(1)}</div>
          <div>
            <div class="stars">${stars(p.rating)}</div>
            <div style="font-size:.8rem;color:var(--text-soft)">${t("reviewsOf", p.reviewsCount)}</div>
          </div>
        </div>
        ${p.reviews.map((r) => `
          <div class="review">
            <div class="review__head">
              <span class="review__author">${escapeHtml(r.author)}</span>
              <span class="review__date">${r.date}</span>
            </div>
            <div class="stars" style="font-size:.8rem">${stars(r.rating)}</div>
            <p>${escapeHtml(r.text)}</p>
          </div>`).join("")}
      </div>
      <div class="tabs__panel" data-panel="shipping">
        <p class="pdp__desc">${t("shippingTabText")}</p>
      </div>
    </div>

    ${related.length ? `
    <div class="related">
      <div class="section__head"><h2>${t("relatedProducts")}</h2></div>
      <div class="prodgrid">${related.map(productCard).join("")}</div>
    </div>` : ""}
  </div>
  `;

  // Galería
  document.querySelectorAll("#galleryThumbs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentImg = Number(btn.dataset.i);
      document.querySelectorAll("#galleryThumbs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("galleryMain").innerHTML = lazyImg(p.images[currentImg], p.title);
      mountLazyImages(document.getElementById("galleryMain"));
      document.querySelector("#galleryMain img").src = p.images[currentImg];
      document.querySelector("#galleryMain img").classList.add("loaded");
    });
  });

  // Variantes
  const variantSelect = document.getElementById("variantSelect");
  variantSelect.addEventListener("change", () => {
    currentVariant = findVariant(p, variantSelect.value);
    document.getElementById("pdpPrice").innerHTML = `
      <span class="now">${euros(currentVariant.price)}</span>
      ${currentVariant.compareAtPrice ? `<span class="was">${euros(currentVariant.compareAtPrice)}</span>` : ""}`;
    document.getElementById("addPriceLabel").textContent = euros(currentVariant.price);
    const stockMsg = document.getElementById("stockMsg");
    const addBtn = document.getElementById("addToCartBtn");
    if (currentVariant.available) {
      stockMsg.innerHTML = `${icon("checkCircle")}<span>${t("inStock")}</span>`;
      stockMsg.className = "stock-msg in";
      addBtn.disabled = false;
    } else {
      stockMsg.innerHTML = `${icon("close")}<span>${t("outOfStock")}</span>`;
      stockMsg.className = "stock-msg out";
      addBtn.disabled = true;
    }
  });

  // Cantidad
  document.getElementById("qtyMinus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    document.getElementById("qtyValue").textContent = qty;
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    qty += 1;
    document.getElementById("qtyValue").textContent = qty;
  });

  // Añadir al carrito
  document.getElementById("addToCartBtn").addEventListener("click", () => {
    Cart.add(p.handle, currentVariant.id, qty);
    toast(t("toastAdded", p.title));
  });

  // Tabs
  document.querySelectorAll(".tabs__nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs__nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tabs__panel").forEach((p2) => p2.classList.remove("active"));
      btn.classList.add("active");
      document.querySelector(`.tabs__panel[data-panel="${btn.dataset.tab}"]`).classList.add("active");
    });
  });

  bindQuickAdd();
  mountLazyImages(APP);
}

/* ---------------------------------------------------------------------- */
/* Quiénes somos                                                           */
/* ---------------------------------------------------------------------- */

function renderAbout() {
  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${t("breadcrumbAbout")}</div>
  <section class="section about-page">
    <div class="container">
      <h1 class="section-title-lg">${t("aboutTitle")}</h1>
      <div class="about-page__grid">
        <div class="about-page__text">
          <p>${t("aboutP1")}</p>
          <p>${t("aboutP2")}</p>
          <p>${t("aboutP3")}</p>
        </div>
        <div class="about-page__stats">
          <div class="about-stat"><span class="about-stat__num">1987</span><span>${t("aboutStatYear")}</span></div>
          <div class="about-stat"><span class="about-stat__num">+35</span><span>${t("aboutStatExp")}</span></div>
          <div class="about-stat"><span class="about-stat__num">100%</span><span>${t("aboutStatWarranty")}</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--muted reveal">
    <div class="container">
      <div class="section__head"><h2>${t("aboutBrands")}</h2></div>
      ${brandStrip()}
    </div>
  </section>

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("sectionTestimonials")}</h2></div>
      ${testimonialsBlock()}
    </div>
  </section>
  `;
  mountLazyImages(APP);
}

/* ---------------------------------------------------------------------- */
/* Carrito                                                                 */
/* ---------------------------------------------------------------------- */

function renderCart() {
  const lines = Cart.lines();
  const subtotal = Cart.subtotal();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 5.9;
  const total = subtotal + shipping;
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${t("breadcrumbCart")}</div>
  <section class="section">
    <div class="container">
      <h1 class="section-title-lg">${t("cartTitle")}</h1>
      ${lines.length === 0 ? `
        <div class="empty-state">
          <p>${t("cartEmpty")}</p>
          <a class="btn btn--primary" href="#/category/dj">${t("cartEmptyCta")}</a>
        </div>
      ` : `
      <div class="cart-page">
        <div>
          ${lines.map((l) => `
            <div class="cart-item" data-variant="${l.variant.id}">
              ${lazyImg(l.product.images[0], l.product.title)}
              <div class="cart-item__info">
                <div class="cart-item__title">${escapeHtml(l.product.title)}</div>
                <div class="cart-item__variant">${escapeHtml(l.product.optionName)}: ${escapeHtml(l.variant.title)}</div>
                <div class="cart-item__price">${euros(l.variant.price)}</div>
              </div>
              <div class="cart-item__right">
                <div class="qty-stepper">
                  <button class="cart-qty-minus" aria-label="Restar">${icon("minus")}</button>
                  <span>${l.qty}</span>
                  <button class="cart-qty-plus" aria-label="Sumar">${icon("plus")}</button>
                </div>
                <button class="cart-item__remove">${t("remove")}</button>
              </div>
            </div>
          `).join("")}
        </div>

        <aside class="cart-summary">
          <h3>${t("orderSummary")}</h3>
          <div class="shipping-progress">
            <p>${remaining > 0 ? t("shippingProgress", euros(remaining)) : t("shippingReached")}</p>
            <div class="shipping-progress__bar"><div class="shipping-progress__fill" style="width:${progressPct}%"></div></div>
          </div>
          <div class="cart-summary__row"><span>${t("subtotal")}</span><span>${euros(subtotal)}</span></div>
          <div class="cart-summary__row"><span>${t("shipping")}</span><span>${shipping === 0 ? t("free") : euros(shipping)}</span></div>
          <div class="cart-summary__row total"><span>${t("total")}</span><span>${euros(total)}</span></div>
          <a href="#/checkout" class="btn btn--primary btn--block">${t("checkoutCta")}</a>
          <a href="#/" class="btn btn--outline btn--block" style="margin-top:10px">${t("continueShopping")}</a>
        </aside>
      </div>
      `}
    </div>
  </section>
  `;

  document.querySelectorAll(".cart-qty-plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const variantId = btn.closest(".cart-item").dataset.variant;
      const item = Cart.items.find((i) => i.variantId === variantId);
      Cart.setQty(variantId, item.qty + 1);
      renderCart();
    });
  });
  document.querySelectorAll(".cart-qty-minus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const variantId = btn.closest(".cart-item").dataset.variant;
      const item = Cart.items.find((i) => i.variantId === variantId);
      if (item.qty <= 1) return;
      Cart.setQty(variantId, item.qty - 1);
      renderCart();
    });
  });
  document.querySelectorAll(".cart-item__remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const variantId = btn.closest(".cart-item").dataset.variant;
      Cart.remove(variantId);
      toast(t("toastRemoved"));
      renderCart();
    });
  });

  mountLazyImages(APP);
}

/* ---------------------------------------------------------------------- */
/* Checkout (mock visual)                                                  */
/* ---------------------------------------------------------------------- */

function renderCheckout() {
  const lines = Cart.lines();
  const subtotal = Cart.subtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 5.9;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    APP.innerHTML = `<div class="section text-center"><h2>${t("cartEmpty")}</h2><a class="btn btn--primary" href="#/">${t("backHome")}</a></div>`;
    return;
  }

  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / <a href="#/cart">${t("breadcrumbCart")}</a> / ${t("breadcrumbCheckout")}</div>
  <section class="section">
    <div class="container">
      <div class="mock-note">${icon("shield")}<span>${t("mockNote")}</span></div>
      <div class="checkout-steps"><span>${t("step1")}</span> → <span class="active">${t("step2")}</span> → <span>${t("step3")}</span></div>

      <div class="checkout">
        <div>
          <h2>${t("checkoutTitle")}</h2>
          <div class="form-grid">
            <div class="form-field"><label>${t("formName")}</label><input type="text" placeholder="${t("formName")}"></div>
            <div class="form-field"><label>${t("formSurname")}</label><input type="text" placeholder="${t("formSurname")}"></div>
            <div class="form-field full"><label>${t("formAddress")}</label><input type="text" placeholder="${t("formAddress")}"></div>
            <div class="form-field"><label>${t("formZip")}</label><input type="text" placeholder="28001"></div>
            <div class="form-field"><label>${t("formCity")}</label><input type="text" placeholder="Madrid"></div>
            <div class="form-field"><label>${t("formProvince")}</label><input type="text" placeholder="Madrid"></div>
            <div class="form-field"><label>${t("formPhone")}</label><input type="tel" placeholder="600 000 000"></div>
            <div class="form-field full"><label>${t("formEmail")}</label><input type="email" placeholder="tu@email.com"></div>
          </div>

          <h2 style="margin-top:28px">${t("paymentTitle")}</h2>
          <div class="pay-methods" id="payMethods">
            <label class="pay-method selected"><input type="radio" name="pay" checked>${icon("card")}<span>${t("payCard")}</span></label>
            <label class="pay-method"><input type="radio" name="pay">${icon("paypal")}<span>${t("payPaypal")}</span></label>
            <label class="pay-method"><input type="radio" name="pay">${icon("bizum")}<span>${t("payBizum")}</span></label>
            <label class="pay-method"><input type="radio" name="pay">${icon("bank")}<span>${t("payTransfer")}</span></label>
          </div>

          <button class="btn btn--primary btn--block" id="placeOrderBtn">${t("confirmOrder")} — ${euros(total)}</button>
        </div>

        <aside class="order-summary">
          <h3 class="mt-0">${t("orderSummary")}</h3>
          ${lines.map((l) => `
            <div class="order-summary__item">
              <span>${l.qty} × ${escapeHtml(l.product.title)} (${escapeHtml(l.variant.title)})</span>
              <span>${euros(l.variant.price * l.qty)}</span>
            </div>
          `).join("")}
          <div class="cart-summary__row" style="margin-top:12px"><span>${t("subtotal")}</span><span>${euros(subtotal)}</span></div>
          <div class="cart-summary__row"><span>${t("shipping")}</span><span>${shipping === 0 ? t("free") : euros(shipping)}</span></div>
          <div class="cart-summary__row total"><span>${t("total")}</span><span>${euros(total)}</span></div>
        </aside>
      </div>
    </div>
  </section>
  `;

  document.querySelectorAll(".pay-method").forEach((label) => {
    label.addEventListener("click", () => {
      document.querySelectorAll(".pay-method").forEach((l) => l.classList.remove("selected"));
      label.classList.add("selected");
      label.querySelector("input").checked = true;
    });
  });

  document.getElementById("placeOrderBtn").addEventListener("click", () => {
    toast(t("toastOrder"));
  });
}

/* ---------------------------------------------------------------------- */
/* Interacciones globales (header, menú, quick-add, chrome i18n/tema)      */
/* ---------------------------------------------------------------------- */

function bindQuickAdd() {
  document.querySelectorAll("[data-quickadd]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const p = findProduct(btn.dataset.quickadd);
      if (!p) return;
      Cart.add(p.handle, p.variants[0].id, 1);
      toast(t("toastAdded", p.title));
    });
  });
}

function closeMobileMenu() {
  const nav = document.getElementById("mainNav");
  if (!nav || !nav.classList.contains("open")) return;
  nav.classList.remove("open");
  nav.classList.add("closing");
  setTimeout(() => nav.classList.remove("closing"), 220);
  document.getElementById("overlay")?.classList.remove("open");
  document.getElementById("burgerBtn")?.classList.remove("open");
  document.body.classList.remove("nav-open");
}

function updateHeaderOffset() {
  // Solo .header es sticky (la topbar se desplaza fuera de vista), así
  // que el hueco reservado para el hero fijo debe ser solo su altura.
  const header = document.querySelector(".header");
  const h = header?.offsetHeight || 0;
  document.documentElement.style.setProperty("--header-offset", h + "px");
}

const NAV_LINKS = [
  { key: "navHome", href: "#/" },
  { key: "navDj", href: "#/category/dj" },
  { key: "navSonido", href: "#/category/sonido" },
  { key: "navEstudio", href: "#/category/estudio" },
  { key: "navAuriculares", href: "#/category/auriculares" },
  { key: "navCables", href: "#/category/cables" },
  { key: "navFlightcases", href: "#/category/flightcases" },
  { key: "navOutlet", href: "#/category/outlet", cls: "mainnav__outlet" },
  { key: "navAbout", href: "#/quienes-somos" },
];

function applyChrome() {
  document.getElementById("mainNav").innerHTML = NAV_LINKS
    .map((l) => `<a href="${l.href}" class="${l.cls || ""}">${t(l.key)}</a>`).join("");
  document.getElementById("mainNav").querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const nav = document.getElementById("mainNav");
      if (nav.classList.contains("open")) {
        e.preventDefault();
        const href = a.getAttribute("href");
        closeMobileMenu();
        setTimeout(() => { location.hash = href; }, 220);
      }
    });
  });

  document.getElementById("searchInput").placeholder = t("searchPlaceholder");
  document.getElementById("topbarShipText").innerHTML = `${t("shipBar")} <strong>149€</strong>`;
  document.getElementById("footerAboutText").textContent = t("footerAbout");
  document.getElementById("footerShopTitle").textContent = t("footerShop");
  document.getElementById("footerLinkDj").textContent = t("navDj");
  document.getElementById("footerLinkSonido").textContent = t("navSonido");
  document.getElementById("footerLinkEstudio").textContent = t("navEstudio");
  document.getElementById("footerLinkOutlet").textContent = t("navOutlet");
  document.getElementById("footerSupportTitle").textContent = t("footerSupport");
  document.getElementById("footerLinkAbout").textContent = t("navAbout");
  document.getElementById("footerLinkShipping").textContent = t("footerShipping");
  document.getElementById("footerLinkReturns").textContent = t("footerReturns");
  document.getElementById("footerLinkFaq").textContent = t("footerFaq");
  document.getElementById("footerLinkContact").textContent = t("footerContactLink");
  document.getElementById("footerContactTitle").textContent = t("footerContact");
  document.getElementById("footerRightsText").textContent = `© 2026 Victor So Professional. ${t("footerRights")}`;
  document.getElementById("footerBadgeText").textContent = t("footerBadge");
  document.getElementById("langBtnLabel").textContent = LOCALES[I18n.current].flag;

  const langMenu = document.getElementById("langMenu");
  langMenu.innerHTML = Object.entries(LOCALES).map(([code, l]) => `
    <li role="option" data-lang="${code}" class="${code === I18n.current ? "active" : ""}">
      <span>${escapeHtml(l.label)}</span><span>${escapeHtml(l.urlHint)}</span>
    </li>`).join("");
  langMenu.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const code = li.dataset.lang;
      I18n.set(code);
      applyChrome();
      router();
      langMenu.classList.remove("open");
      toast(t("toastLang", LOCALES[code].urlHint));
    });
  });
}

function initChrome() {
  const burger = document.getElementById("burgerBtn");
  const nav = document.getElementById("mainNav");
  const overlay = document.getElementById("overlay");
  burger.addEventListener("click", () => {
    const willOpen = !nav.classList.contains("open");
    if (willOpen) {
      // Usa la posición real del header (puede no estar aún "pegado"
      // arriba si se abre nada más cargar, con la topbar aún visible).
      nav.style.top = document.querySelector(".header").getBoundingClientRect().bottom + "px";
    }
    nav.classList.toggle("open", willOpen);
    burger.classList.toggle("open", willOpen);
    document.body.classList.toggle("nav-open", willOpen);
    burger.setAttribute("aria-label", willOpen ? "Cerrar menú" : "Abrir menú");
  });
  overlay.addEventListener("click", closeMobileMenu);

  const langBtn = document.getElementById("langBtn");
  const langMenu = document.getElementById("langMenu");
  langBtn.addEventListener("click", () => {
    langMenu.classList.toggle("open");
    langBtn.setAttribute("aria-expanded", langMenu.classList.contains("open"));
  });
  document.addEventListener("click", (e) => {
    if (!document.getElementById("langSelect").contains(e.target)) langMenu.classList.remove("open");
  });

  document.getElementById("themeToggle").addEventListener("click", () => Theme.toggle());
  Theme.updateIcon();

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    location.hash = `#/search?q=${encodeURIComponent(q)}`;
  });

  applyChrome();
  updateCartCount();
  updateHeaderOffset();
  window.addEventListener("resize", updateHeaderOffset);
}

initChrome();
router();
