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

/** LOCALES.flag es normalmente un emoji de bandera; para idiomas sin
 * bandera oficial en Unicode (como el catalán) es la ruta a una imagen. */
function flagHtml(flag) {
  return flag.includes("/")
    ? `<img src="${flag}" alt="" class="flag-img">`
    : flag;
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
    const dark = this.effective() === "dark";
    const iconHtml = dark ? ICONS.sun : ICONS.moon;
    const label = dark ? t("themeLight") : t("themeDark");
    const el = document.getElementById("themeIcon");
    if (el) el.innerHTML = iconHtml;
    const navIcon = document.getElementById("mainnavThemeIcon");
    const navLabel = document.getElementById("mainnavThemeLabel");
    if (navIcon) navIcon.innerHTML = iconHtml;
    if (navLabel) navLabel.textContent = label;
  },
};

/* El favicon sigue el modo oscuro del navegador/SO, no el tema de la web. */
(function watchBrowserFavicon() {
  const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const favicon = document.getElementById("favicon");
    if (favicon) favicon.href = mq && mq.matches ? "assets/favicon-dark.png" : "assets/favicon-light.png";
  };
  apply();
  if (mq && mq.addEventListener) mq.addEventListener("change", apply);
})();

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
  { pattern: /^\/brand\/([\w-]+)$/, render: (m) => renderBrand(m[1]) },
  { pattern: /^\/marcas$/, render: renderBrandsIndex },
  { pattern: /^\/product\/([\w-]+)$/, render: (m) => renderProduct(m[1]) },
  { pattern: /^\/cart$/, render: renderCart },
  { pattern: /^\/checkout$/, render: renderCheckout },
  { pattern: /^\/search$/, render: (m, q) => renderSearch(q) },
  { pattern: /^\/quienes-somos$/, render: renderAbout },
  { pattern: /^\/instalaciones$/, render: renderInstallations },
];

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
  const pct = hasOffer ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  const isOutlet = p.category === "outlet";
  return `
  <article class="pcard">
    <a href="#/product/${p.handle}">
      <div class="pcard__imgwrap">
        <div class="pcard__badges">
          ${hasOffer ? `<span class="badge badge--offer">-${pct}%</span>` : ""}
          ${isOutlet ? `<span class="badge badge--outlet">${t("badgeOutlet")}</span>` : ""}
        </div>
        ${lazyImg(p.images[0], p.title)}
      </div>
      <div class="pcard__body">
        <div class="pcard__vendor">${escapeHtml(p.vendor)}</div>
        <div class="pcard__title">${escapeHtml(p.title)}</div>
        <div class="pcard__rating"><span class="stars">${stars(p.rating)}</span> <span class="pcard__reviews">(${p.reviewsCount})</span></div>
      </div>
    </a>
    <div class="pcard__footer">
      <div class="pcard__price">
        <span class="now">${euros(p.price)}</span>
        ${hasOffer ? `<span class="was">${euros(p.compareAtPrice)}</span>` : ""}
      </div>
      <button class="pcard__addbtn" data-quickadd="${p.handle}" aria-label="${t("addToCart")}">${icon("cart")}</button>
    </div>
  </article>`;
}

function pdpPriceMarkup(variant) {
  const hasOffer = variant.compareAtPrice && variant.compareAtPrice > variant.price;
  const pct = hasOffer ? Math.round((1 - variant.price / variant.compareAtPrice) * 100) : 0;
  return `
    <span class="now">${euros(variant.price)}</span>
    ${hasOffer ? `<span class="was">${euros(variant.compareAtPrice)}</span><span class="badge badge--offer">-${pct}%</span>` : ""}`;
}

function brandLogo(b) {
  const href = `#/brand/${b.slug}`;
  return b.logo
    ? `<a class="ticker__logo" href="${href}" aria-label="${escapeHtml(b.name)}">${lazyImg(b.logo, b.name)}</a>`
    : `<a class="ticker__pill" href="${href}">${escapeHtml(b.name)}</a>`;
}

function brandStrip() {
  // Solo las marcas historicas de la tienda se muestran en el ticker;
  // el resto viven en el indice completo de marcas (#/marcas).
  const featured = BRANDS.filter((b) => b.featured);
  const items = featured.map(brandLogo).join("")
    + `<a class="ticker__logo ticker__logo--all" href="#/marcas">${escapeHtml(t("storeHeroAllBrandsCta"))}</a>`;
  // El contenido se duplica para que la animación pueda hacer un
  // bucle perfecto de -50% sin salto visible al reiniciar.
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
function slidePanelMarkup(id, slides) {
  return `
  <div class="storehero__panel">
    <div class="storehero__track" id="${id}Track">
      ${slides.map((s, i) => `
        <a class="storehero__slide ${i === 0 ? "active" : ""}" href="${s.href}">
          <img class="storehero__slide-img" src="${s.image}" alt="" loading="lazy">
          <span class="storehero__badge ${s.badgeCls}">${s.badge}</span>
          <div class="storehero__info">
            <div class="storehero__eyebrow">${escapeHtml(s.eyebrow)}</div>
            <h2 class="storehero__title">${escapeHtml(s.title)}</h2>
            ${s.priceHtml || ""}
            <span class="btn ${s.ctaCls}">${s.cta}</span>
          </div>
        </a>`).join("")}
    </div>
    <div class="storehero__dots" id="${id}Dots">
      ${slides.map((_, i) => `<button class="storehero__dot ${i === 0 ? "active" : ""}" data-i="${i}" aria-label="${i + 1}"></button>`).join("")}
    </div>
  </div>`;
}

function storeHeroMarkup() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew);
  const bestseller = [...PRODUCTS].sort((a, b) => b.reviewsCount - a.reviewsCount)[0];
  const topBrand = BRANDS[0];
  const brandProduct = PRODUCTS.find((p) => p.vendor === topBrand.name) || PRODUCTS[0];

  const leftSlides = newArrivals.map((p) => ({
    href: `#/product/${p.handle}`, image: p.images[0],
    badge: t("storeHeroNewBadge"), badgeCls: "storehero__badge--new",
    eyebrow: p.vendor, title: p.title, priceHtml: "",
    cta: t("storeHeroNewCta"), ctaCls: "btn--outline",
  }));

  const rightSlides = [
    {
      href: `#/product/${bestseller.handle}`, image: bestseller.images[0],
      badge: t("storeHeroBestsellerBadge"), badgeCls: "storehero__badge--offer",
      eyebrow: bestseller.vendor, title: bestseller.title,
      priceHtml: `<div class="storehero__price"><span class="now">${euros(bestseller.price)}</span></div>`,
      cta: t("storeHeroBestsellerCta"), ctaCls: "btn--primary",
    },
    {
      href: "https://wa.me/34619406443", image: "assets/tienda-fachada.jpeg",
      badge: t("storeHeroContactBadge"), badgeCls: "storehero__badge--brand",
      eyebrow: "972 364 114", title: t("storeHeroContactTitle"), priceHtml: "",
      cta: t("storeHeroContactCta"), ctaCls: "btn--outline",
    },
    {
      href: "#/quienes-somos", image: "assets/tienda-fachada.jpeg",
      badge: t("storeHeroVisitBadge"), badgeCls: "storehero__badge--brand",
      eyebrow: t("storeHeroVisitEyebrow"), title: t("storeHeroVisitTitle"), priceHtml: "",
      cta: t("storeHeroVisitCta"), ctaCls: "btn--outline",
    },
    {
      href: `#/brand/${topBrand.slug}`, image: brandProduct.images[0],
      badge: t("storeHeroBrandBadge"), badgeCls: "storehero__badge--brand",
      eyebrow: t("storeHeroBrandEyebrow"), title: topBrand.name, priceHtml: "",
      cta: t("storeHeroBrandCta"), ctaCls: "btn--outline",
    },
    {
      href: "#/marcas", image: bestseller.images[0],
      badge: t("storeHeroBrandBadge"), badgeCls: "storehero__badge--brand",
      eyebrow: t("sectionBrands"), title: t("navBrands"), priceHtml: "",
      cta: t("storeHeroAllBrandsCta"), ctaCls: "btn--outline",
    },
  ];

  const mobileSlides = [...leftSlides, ...rightSlides];

  return `
  <section class="storehero">
    <div class="storehero__grid storehero__grid--desktop">
      ${slidePanelMarkup("storeHeroLeft", leftSlides)}
      ${slidePanelMarkup("storeHeroRight", rightSlides)}
    </div>
    <div class="storehero__grid storehero__grid--mobile">
      ${slidePanelMarkup("storeHeroMobile", mobileSlides)}
    </div>
    <div class="storehero__ctaWrap">
      <a class="storehero__ctaBtn" href="#/search">
        <span class="storehero__ctaBtn-text">${t("storeHeroCtaBtn")}</span>
        <span class="storehero__ctaBtn-arrow">${icon("arrowRight")}</span>
      </a>
      <button class="storehero__ctaBtn storehero__ctaBtn--outline" id="storeHeroCatBtn">
        <span class="storehero__ctaBtn-text">${t("storeHeroCatBtn")}</span>
        <span class="storehero__ctaBtn-arrow">${icon("arrowRight")}</span>
      </button>
    </div>
    <div class="storehero__brands">
      <span class="storehero__brandsLabel">${t("sectionBrands")}</span>
      ${brandStrip()}
    </div>
    <div class="storehero__scrollhint">
      <span class="storehero__scrollhint-circle">${icon("chevronDown")}</span>
      <span class="storehero__scrollhint-text">${t("scrollHint")}</span>
    </div>
  </section>`;
}

function initSlidePanel(id, intervalMs) {
  const track = document.getElementById(`${id}Track`);
  if (!track) return;
  const slides = [...track.children];
  const dots = [...document.querySelectorAll(`#${id}Dots .storehero__dot`)];
  let idx = 0;
  let timer = null;

  function show(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    slides.forEach((s, j) => s.classList.toggle("active", j === idx));
    dots.forEach((d, j) => d.classList.toggle("active", j === idx));
  }
  function next() { show(idx + 1); }
  function restart() {
    if (timer) clearInterval(timer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setInterval(next, intervalMs);
    }
  }

  dots.forEach((d) => d.addEventListener("click", () => { show(Number(d.dataset.i)); restart(); }));
  const panel = track.parentElement;
  panel.addEventListener("mouseenter", () => { if (timer) clearInterval(timer); });
  panel.addEventListener("mouseleave", restart);

  // Swipe táctil: arrastrar el dedo cambia de slide; si hubo arrastre real
  // se cancela el click siguiente para que no navegue al enlace de la slide.
  let touchStartX = 0, touchCurrentX = 0, touching = false, swiped = false;
  track.addEventListener("touchstart", (e) => {
    touchStartX = touchCurrentX = e.touches[0].clientX;
    touching = true;
    swiped = false;
    if (timer) clearInterval(timer);
  }, { passive: true });
  track.addEventListener("touchmove", (e) => {
    if (!touching) return;
    touchCurrentX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener("touchend", () => {
    if (!touching) return;
    touching = false;
    const delta = touchCurrentX - touchStartX;
    if (Math.abs(delta) > 40) {
      swiped = true;
      show(idx + (delta < 0 ? 1 : -1));
    }
    restart();
  });
  track.addEventListener("click", (e) => {
    if (swiped) { e.preventDefault(); swiped = false; }
  }, true);

  show(0);
  restart();
}

function initStoreHero() {
  initSlidePanel("storeHeroLeft", 6000);
  initSlidePanel("storeHeroRight", 6000);
  initSlidePanel("storeHeroMobile", 6000);
  document.getElementById("storeHeroCatBtn")?.addEventListener("click", () => {
    document.getElementById("categorySection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function discoverStripMarkup() {
  const items = [
    { href: "#/instalaciones", image: INSTALLATIONS[0].image, icon: "speaker",
      title: t("discoverInstallTitle"), text: t("discoverInstallText") },
    { href: "https://wa.me/34619406443", solid: true, icon: "chat",
      title: t("discoverContactTitle"), text: t("discoverContactText") },
    { href: "#/quienes-somos", image: "assets/tienda-fachada.jpeg", icon: "shield",
      title: t("discoverAboutTitle"), text: t("discoverAboutText") },
  ];
  return `
  <section class="section discover reveal">
    <div class="container">
      <div class="section__head"><h2>${t("discoverTitle")}</h2></div>
      <div class="discover__grid">
        ${items.map((it) => `
          <a class="discover__card ${it.solid ? "discover__card--solid" : ""}" href="${it.href}"
             ${it.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}
             ${it.image ? `style="background-image:url('${it.image}')"` : ""}>
            <span class="discover__icon">${icon(it.icon)}</span>
            <div class="discover__info">
              <h3>${escapeHtml(it.title)}</h3>
              <p>${escapeHtml(it.text)}</p>
              <span class="discover__link">${t("discoverLink")} ${icon("arrowRight")}</span>
            </div>
          </a>`).join("")}
      </div>
    </div>
  </section>`;
}

function renderHome() {
  const featured = PRODUCTS.filter((p) => p.compareAtPrice).slice(0, 4);
  const bestsellers = [...PRODUCTS].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 8);

  APP.innerHTML = `
  ${storeHeroMarkup()}

  <section class="section reveal" id="categorySection">
    <div class="container">
      <div class="section__head"><h2>${t("sectionCategories")}</h2></div>
      <div class="catgrid">
        ${CATEGORIES.map((c) => `
          <a class="catcard" href="#/category/${c.slug}">
            ${icon(c.icon, "catcard__icon")}
            ${lazyImg(c.image, c.title)}
            <span class="catcard__label">${escapeHtml(c.title)}</span>
          </a>`).join("")}
      </div>
    </div>
  </section>

  ${discoverStripMarkup()}

  <div class="shipband">${icon("truck")}<span>${t("shipBanner")}</span></div>

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

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("sectionTestimonials")}</h2></div>
      ${testimonialsBlock()}
    </div>
  </section>
  `;
  bindQuickAdd();
  mountLazyImages(APP);
  initStoreHero();
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

function renderBrand(slug) {
  const brand = BRANDS.find((b) => b.slug === slug);
  if (!brand) { location.hash = "#/"; return; }
  const count = PRODUCTS.filter((p) => p.vendor === brand.name).length;
  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${escapeHtml(brand.name)}</div>
  <section class="section brand-page">
    <div class="container brand-page__inner">
      ${brand.logo ? `<div class="brand-page__logo">${lazyImg(brand.logo, brand.name)}</div>` : ""}
      <h1 class="section-title-lg">${escapeHtml(brand.name)}</h1>
      <p class="visit-text">${escapeHtml(brand.description)}</p>
      <div class="brand-page__actions">
        ${brand.website ? `<a class="btn btn--outline" href="${brand.website}" target="_blank" rel="noopener">${t("brandVisitSite")} ${icon("arrowRight")}</a>` : ""}
        ${count > 0
          ? `<a class="btn btn--primary" href="#/search?brand=${encodeURIComponent(brand.name)}">${t("brandSeeProducts", count)}</a>`
          : `<a class="btn btn--primary" href="#/search">${t("storeHeroCtaBtn")}</a>`}
      </div>
    </div>
  </section>`;
  mountLazyImages(APP);
}

function renderBrandsIndex() {
  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${t("navBrands")}</div>
  <section class="section">
    <div class="container">
      <h1 class="section-title-lg">${t("navBrands")}</h1>
      <p class="visit-text">${t("brandsIndexLede")}</p>
      <div class="brandsindex__grid">
        ${BRANDS.map((b) => `
          <a class="brandsindex__card ${b.logo ? "" : "brandsindex__card--text"}" href="#/brand/${b.slug}">
            ${b.logo
              ? `<span class="brandsindex__logo">${lazyImg(b.logo, b.name)}</span><span class="brandsindex__name">${escapeHtml(b.name)}</span>`
              : `<span class="brandsindex__name brandsindex__name--big">${escapeHtml(b.name)}</span>`}
          </a>`).join("")}
      </div>
    </div>
  </section>`;
  mountLazyImages(APP);
}

function renderSearch(query) {
  const term = (query.get("q") || "").toLowerCase().trim();
  const brands = query.getAll("brand");
  const baseProducts = term
    ? PRODUCTS.filter((p) => (p.title + " " + p.vendor + " " + p.tags.join(" ")).toLowerCase().includes(term))
    : PRODUCTS;
  const title = term ? `“${term}”` : brands.length ? brands.join(", ") : t("sectionBestsellers");
  renderListing({
    title,
    baseProducts,
    query,
    basePath: `/search`,
  });
}

const PER_PAGE_OPTIONS = [12, 24, 48];

function paginationMarkup(current, total, perPage) {
  const perPageField = `
    <label class="per-page">${t("perPageLabel")}
      <select id="perPageSelect">
        ${PER_PAGE_OPTIONS.map((n) => `<option value="${n}" ${n === perPage ? "selected" : ""}>${n}</option>`).join("")}
      </select>
    </label>`;
  if (total <= 1) return `<div class="pagination pagination--single">${perPageField}</div>`;

  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return `
  <div class="pagination">
    <button type="button" class="pagination__nav" data-page="${current - 1}" ${current === 1 ? "disabled" : ""} aria-label="${t("pagePrev")}">${icon("chevronLeft")}</button>
    ${pages.map((p) => p === "…"
      ? `<span class="pagination__ellipsis">…</span>`
      : `<button type="button" class="pagination__num ${p === current ? "active" : ""}" data-page="${p}">${p}</button>`
    ).join("")}
    <button type="button" class="pagination__nav" data-page="${current + 1}" ${current === total ? "disabled" : ""} aria-label="${t("pageNext")}">${icon("chevronRight")}</button>
    ${perPageField}
  </div>`;
}

function renderListing({ title, baseProducts, query, basePath }) {
  const allBrands = [...new Set(baseProducts.map((p) => p.vendor))].sort();
  const selectedBrands = query.getAll("brand");
  const minPrice = query.get("min") || "";
  const maxPrice = query.get("max") || "";
  const sort = query.get("sort") || "relevance";
  const onlyOffers = query.get("offers") === "1";
  const view = query.get("view") === "list" ? "list" : "grid";
  const perPage = PER_PAGE_OPTIONS.includes(Number(query.get("perPage"))) ? Number(query.get("perPage")) : PER_PAGE_OPTIONS[0];

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

  const totalProducts = products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));
  const page = Math.min(totalPages, Math.max(1, parseInt(query.get("page") || "1", 10) || 1));
  const pageProducts = products.slice((page - 1) * perPage, page * perPage);

  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${escapeHtml(title)}</div>
  <section class="section listing">
    <div class="container">
      <div class="section__head"><h2>${escapeHtml(title)}</h2></div>
      <div class="listing__toolbar">
        <button class="btn btn--outline filter-toggle" id="filterToggle">${icon("filter")}<span>${t("filters")}</span></button>
        <span class="listing__count">${t("results", totalProducts)}</span>
        <div class="view-toggle" role="group">
          <button type="button" class="view-toggle__btn ${view === "grid" ? "active" : ""}" data-view="grid" aria-label="${t("viewGrid")}">${icon("gridView")}</button>
          <button type="button" class="view-toggle__btn ${view === "list" ? "active" : ""}" data-view="list" aria-label="${t("viewList")}">${icon("listView")}</button>
        </div>
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
          ${pageProducts.length
            ? `<div class="prodgrid ${view === "list" ? "prodgrid--list" : ""}">${pageProducts.map(productCard).join("")}</div>`
            : `<div class="empty-state"><p>${t("noResults")}</p></div>`}
          ${totalProducts ? paginationMarkup(page, totalPages, perPage) : ""}
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
    if (next.view && next.view !== "grid") p.set("view", next.view);
    if (next.perPage && next.perPage !== PER_PAGE_OPTIONS[0]) p.set("perPage", next.perPage);
    if (next.page && next.page > 1) p.set("page", next.page);
    if (query.get("q")) p.set("q", query.get("q"));
    const qs = p.toString();
    location.hash = `#${basePath}${qs ? "?" + qs : ""}`;
  }

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    pushQuery({ brands: selectedBrands, min: minPrice, max: maxPrice, sort: e.target.value, offers: onlyOffers, view, perPage, page: 1 });
  });

  document.querySelectorAll(".view-toggle__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      pushQuery({ brands: selectedBrands, min: minPrice, max: maxPrice, sort, offers: onlyOffers, view: btn.dataset.view, perPage, page });
    });
  });

  document.getElementById("perPageSelect")?.addEventListener("change", (e) => {
    pushQuery({ brands: selectedBrands, min: minPrice, max: maxPrice, sort, offers: onlyOffers, view, perPage: Number(e.target.value), page: 1 });
  });

  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pushQuery({ brands: selectedBrands, min: minPrice, max: maxPrice, sort, offers: onlyOffers, view, perPage, page: Number(btn.dataset.page) });
    });
  });

  document.getElementById("applyFilters").addEventListener("click", () => {
    const brands = [...document.querySelectorAll('input[name="brand"]:checked')].map((i) => i.value);
    const min = document.getElementById("minPrice").value;
    const max = document.getElementById("maxPrice").value;
    const offers = document.getElementById("onlyOffers").checked;
    pushQuery({ brands, min, max, sort, offers, view, perPage, page: 1 });
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

      <div class="pdp__price" id="pdpPrice">${pdpPriceMarkup(currentVariant)}</div>

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
    document.getElementById("pdpPrice").innerHTML = pdpPriceMarkup(currentVariant);
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
      <p class="visit-text">${t("aboutLede")}</p>
    </div>
  </section>

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("aboutVisitTitle")}</h2></div>
      <div class="visit-grid">
        <div class="visit-photo">${lazyImg("assets/tienda-fachada.jpeg", "Fachada de la tienda Victor So Professional")}</div>
        <div class="visit-map">
          <iframe src="https://www.google.com/maps?q=41.7040354,2.8498664&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
      </div>
      <p class="visit-text">${t("aboutVisitText")}</p>
      <a class="btn btn--primary" href="https://maps.app.goo.gl/rCt2WshcWTawViw28" target="_blank" rel="noopener">${icon("pin")} ${t("aboutVisitCta")}</a>
    </div>
  </section>

  <section class="section section--muted reveal">
    <div class="container">
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

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("aboutInstallTitle")}</h2></div>
      <p class="visit-text">${t("aboutInstallIntro")}</p>
      <a class="btn btn--primary" href="#/instalaciones">${icon("arrowRight")} ${t("aboutInstallCta")}</a>
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

function renderInstallations() {
  const waHref = `https://wa.me/34619406443?text=${encodeURIComponent(t("installWaText"))}`;
  APP.innerHTML = `
  <div class="breadcrumb"><a href="#/">${t("breadcrumbHome")}</a> / ${t("navInstalaciones")}</div>
  <section class="section">
    <div class="container">
      <h1 class="section-title-lg">${t("aboutInstallTitle")}</h1>
      <p class="visit-text">${t("aboutInstallIntro")}</p>
      <a class="btn btn--primary" href="${waHref}" target="_blank" rel="noopener">${icon("chat")} ${t("installCta")}</a>
    </div>
  </section>

  <section class="section section--muted reveal">
    <div class="container">
      <div class="install-grid">
        ${INSTALLATIONS.map((ins) => `
          <article class="install-card">
            ${lazyImg(ins.image, ins.title)}
            <div class="install-card__body">
              <h3>${escapeHtml(ins.title)}</h3>
              <div class="install-card__loc">${icon("pin")} ${escapeHtml(ins.location)}</div>
              <p>${escapeHtml(ins.description)}</p>
            </div>
          </article>`).join("")}
      </div>
    </div>
  </section>

  <section class="section reveal">
    <div class="container">
      <div class="section__head"><h2>${t("installTiktokTitle")}</h2></div>
      <div class="tiktok-embed-wrap">
        <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@emilio.victorso" data-unique-id="emilio.victorso" data-embed-type="creator" style="max-width:780px;min-width:288px;">
          <section></section>
        </blockquote>
      </div>
    </div>
  </section>
  `;
  mountLazyImages(APP);
  loadTiktokEmbed();
}

/** El script de embed de TikTok solo procesa los <blockquote> presentes
 * en el DOM cuando se ejecuta; como esta es una SPA que reinyecta HTML,
 * hay que quitar y volver a añadir el script cada vez para forzar que
 * vuelva a escanear y renderice el feed (siempre el contenido más reciente). */
function loadTiktokEmbed() {
  document.getElementById("tiktok-embed-script")?.remove();
  const s = document.createElement("script");
  s.id = "tiktok-embed-script";
  s.async = true;
  s.src = "https://www.tiktok.com/embed.js";
  document.body.appendChild(s);
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
      <div class="checkout-steps"><span data-step="1">${t("step1")}</span><i class="checkout-steps__sep"></i><span class="active" data-step="2">${t("step2")}</span><i class="checkout-steps__sep"></i><span data-step="3">${t("step3")}</span></div>

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
  // que el hueco reservado para el menú móvil fijo debe ser solo su altura.
  const header = document.querySelector(".header");
  const h = header?.offsetHeight || 0;
  document.documentElement.style.setProperty("--header-offset", h + "px");
  // Al cargar la página (scroll 0) la topbar SÍ ocupa espacio visible, así
  // que el hero necesita reservar topbar + header para llenar justo el
  // resto del viewport y que las marcas queden pegadas al fold.
  const topbar = document.querySelector(".topbar");
  const chromeH = h + (topbar?.offsetHeight || 0);
  document.documentElement.style.setProperty("--topchrome-offset", chromeH + "px");
}

const NAV_LINKS = [
  { key: "navHome", href: "#/" },
  { key: "navBrands", href: "#/marcas", cls: "mainnav__brands", icon: "star" },
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
    .map((l) => `<a href="${l.href}" class="${l.cls || ""}">${l.icon ? icon(l.icon) + " " : ""}${t(l.key)}</a>`).join("") + `
    <div class="mainnav__utils">
      <select class="mainnav__lang-select" id="mainnavLangSelect" aria-label="Idioma">
        ${Object.entries(LOCALES).map(([code, l]) => `
          <option value="${code}" ${code === I18n.current ? "selected" : ""}>${escapeHtml(l.label)}</option>`).join("")}
      </select>
      <button class="mainnav__theme" id="mainnavTheme">
        <span class="icon" id="mainnavThemeIcon"></span>
        <span id="mainnavThemeLabel"></span>
      </button>
    </div>`;
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
  document.getElementById("mainnavLangSelect").addEventListener("change", (e) => {
    const code = e.target.value;
    I18n.set(code);
    applyChrome();
    router();
    toast(t("toastLang", LOCALES[code].urlHint));
  });
  document.getElementById("mainnavTheme").addEventListener("click", () => Theme.toggle());

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
  document.getElementById("footerLinkInstall").textContent = t("navInstalaciones");
  document.getElementById("footerLinkShipping").textContent = t("footerShipping");
  document.getElementById("footerLinkReturns").textContent = t("footerReturns");
  document.getElementById("footerLinkFaq").textContent = t("footerFaq");
  document.getElementById("footerLinkContact").textContent = t("footerContactLink");
  document.getElementById("footerContactTitle").textContent = t("footerContact");
  document.getElementById("footerRightsText").textContent = `© 2026 Victor So Professional. ${t("footerRights")}`;
  document.getElementById("footerHoursText").textContent = t("footerHours");
  document.getElementById("footerLocationLink").lastChild.textContent = " " + t("footerLocation");
  document.getElementById("footerBadgeText").textContent = t("footerBadge");
  document.getElementById("langBtnLabel").innerHTML = flagHtml(LOCALES[I18n.current].flag);

  const langMenu = document.getElementById("langMenu");
  langMenu.innerHTML = Object.entries(LOCALES).map(([code, l]) => `
    <li role="option" data-lang="${code}" class="${code === I18n.current ? "active" : ""}">
      <span class="lang-select__flag">${flagHtml(l.flag)}</span>
      <span class="lang-select__name">${escapeHtml(l.label)}</span>
      <span class="lang-select__hint">${escapeHtml(l.urlHint)}</span>
    </li>`).join("");
  langMenu.querySelectorAll("li[data-lang]").forEach((li) => {
    li.addEventListener("click", () => {
      const code = li.dataset.lang;
      I18n.set(code);
      applyChrome();
      router();
      langMenu.classList.remove("open");
      toast(t("toastLang", LOCALES[code].urlHint));
    });
  });

  Theme.updateIcon();
}

function initChrome() {
  // Si ya estás en el inicio, el navegador no dispara "hashchange" al
  // clicar el logo (el hash no cambia), así que el router nunca se
  // vuelve a ejecutar y la página se queda tal cual estaba scrolleada.
  document.querySelector("a.logo")?.addEventListener("click", () => {
    if (location.hash === "#/" || location.hash === "") {
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    }
  });

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

  document.getElementById("loginBtn").addEventListener("click", () => toast(t("loginComingSoon")));

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    searchSuggest.classList.remove("open");
    location.hash = `#/search?q=${encodeURIComponent(q)}`;
  });

  const searchInputEl = document.getElementById("searchInput");
  const searchSuggest = document.getElementById("searchSuggest");
  const renderSearchSuggest = () => {
    const term = searchInputEl.value.trim().toLowerCase();
    if (!term) { searchSuggest.classList.remove("open"); searchSuggest.innerHTML = ""; return; }
    const matches = PRODUCTS.filter((p) =>
      (p.title + " " + p.vendor + " " + p.tags.join(" ")).toLowerCase().includes(term)
    ).slice(0, 6);
    searchSuggest.innerHTML = (matches.length
      ? matches.map((p) => `
        <a class="search-suggest__item" href="#/product/${p.handle}">
          <img src="${p.images[0]}" alt="">
          <span class="search-suggest__title">${escapeHtml(p.title)}</span>
          <span class="search-suggest__price">${euros(p.price)}</span>
        </a>`).join("")
      : `<div class="search-suggest__empty">${t("searchNoMatches")}</div>`)
      + `<a class="search-suggest__all" href="#/search?q=${encodeURIComponent(term)}">${t("searchSeeAll")}</a>`;
    searchSuggest.classList.add("open");
  };
  searchInputEl.addEventListener("input", renderSearchSuggest);
  searchInputEl.addEventListener("focus", () => { if (searchInputEl.value.trim()) renderSearchSuggest(); });
  searchSuggest.addEventListener("click", () => searchSuggest.classList.remove("open"));
  document.addEventListener("click", (e) => {
    if (!document.getElementById("searchForm").contains(e.target)) searchSuggest.classList.remove("open");
  });

  applyChrome();
  Theme.updateIcon();
  updateCartCount();
  updateHeaderOffset();
  window.addEventListener("resize", updateHeaderOffset);
  // Las tipografías web (Space Grotesk/Inter) pueden cargar después de esta
  // primera medición y cambiar ligeramente la altura del header; sin este
  // recálculo el hueco reservado para el hero se queda desajustado.
  if (document.fonts?.ready) document.fonts.ready.then(updateHeaderOffset);
}

initChrome();
router();
