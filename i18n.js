/**
 * Capa de idiomas de la interfaz (demo).
 * En la tienda real (Shopify Markets) cada idioma tendría su propia
 * URL (/es/, /en/...) y el contenido de producto vendría traducido
 * desde el CMS; aquí se traduce la interfaz (UI) al vuelo como
 * muestra visual de cómo se comportaría el selector de idioma.
 */

const LOCALES = {
  es: { label: "Español", flag: "ES", urlHint: "victorso.com/es" },
  en: { label: "English", flag: "EN", urlHint: "victorso.com/en" },
  fr: { label: "Français", flag: "FR", urlHint: "victorso.com/fr" },
  pt: { label: "Português", flag: "PT", urlHint: "victorso.com/pt" },
};

const I18N = {
  es: {
    shipBanner: "Envío gratis a toda la Península en pedidos superiores a 149€",
    shipBar: "Envío gratis Península desde",
    searchPlaceholder: "Buscar productos, marcas...",
    navHome: "Inicio", navDj: "Equipos DJ", navSonido: "Sonido", navEstudio: "Material Estudio",
    navAuriculares: "Auriculares", navCables: "Cables", navFlightcases: "Flight-Cases y Bolsas",
    navOutlet: "Outlet", navAbout: "Quiénes somos",
    heroEyebrow: "Distribuidor oficial · Envío 24/48h",
    heroCtaDj: "Ver Equipos DJ", heroCtaOutlet: "Ver Outlet",
    scrollHint: "Sigue bajando",
    hero1Title: "Bienvenido a tu próxima cabina", hero1Desc: "Entra en la sala: sonido, luz y equipo profesional que hacen vibrar la pista. Sigue bajando.",
    hero2Title: "Sonido profesional para cualquier evento", hero2Desc: "Altavoces activos, subwoofers y sistemas PA listos para salir de gira.",
    hero3Title: "La mesa que marca el ritmo", hero3Desc: "CDJs y mezcladores de nivel profesional, la misma tecnología que usan los DJs de referencia.",
    hero4Title: "Outlet: mismo material, mejor precio", hero4Desc: "Unidades de exposición y caja abierta con la garantía oficial completa.",
    badgeOffer: "Oferta", badgeOutlet: "Outlet", remove: "Eliminar",
    sectionCategories: "Compra por categoría",
    sectionOffers: "Ofertas destacadas", sectionOffersLink: "Ver todo el outlet",
    sectionBestsellers: "Los más valorados",
    sectionBrands: "Marcas destacadas",
    sectionTestimonials: "Lo que dicen nuestros clientes",
    addToCart: "Añadir al carrito", buyNow: "Comprar ahora",
    inStock: "En stock — envío en 24/48h", outOfStock: "Agotado temporalmente",
    quantity: "Cantidad", reviewsOf: (n) => `${n} reseñas`,
    perkShip: "Envío gratis en pedidos +149€ a Península",
    perkWarranty: "Garantía oficial del fabricante",
    perkReturn: "Devolución gratuita en 30 días",
    perkSecure: "Pago seguro: tarjeta, PayPal, Bizum o transferencia",
    tabSpecs: "Especificaciones técnicas", tabReviews: "Reseñas", tabShipping: "Envío y devoluciones",
    shippingTabText: "Envío gratuito a la Península en pedidos superiores a 149€. Pedidos inferiores: 5,90€. Plazo de entrega estimado de 24 a 48h laborables. Devoluciones gratuitas durante 30 días naturales desde la recepción del pedido, en su embalaje original.",
    relatedProducts: "También te puede interesar",
    cartTitle: "Tu carrito", cartEmpty: "Tu carrito está vacío.", cartEmptyCta: "Ver productos",
    orderSummary: "Resumen del pedido", subtotal: "Subtotal", shipping: "Envío", total: "Total",
    free: "Gratis", checkoutCta: "Tramitar pedido", continueShopping: "Seguir comprando",
    shippingProgress: (n) => `Añade <strong>${n}</strong> más para conseguir envío gratis`,
    shippingReached: "¡Tu pedido tiene envío gratis!",
    checkoutTitle: "Datos de envío", paymentTitle: "Método de pago",
    step1: "1. Carrito", step2: "2. Datos y pago", step3: "3. Confirmación",
    mockNote: "Esto es un prototipo visual. El proceso de pago no es funcional ni se realizará ningún cargo real — se sustituirá por el checkout real de Shopify.",
    confirmOrder: "Confirmar pedido",
    filters: "Filtros", results: (n) => `${n} producto${n === 1 ? "" : "s"}`,
    sortLabel: "Ordenar", sortRelevance: "Relevancia", sortPriceAsc: "Precio: menor a mayor",
    sortPriceDesc: "Precio: mayor a menor", sortRating: "Mejor valorados", sortNewest: "Novedades",
    brand: "Marca", price: "Precio (€)", onlyOffers: "Solo ofertas", applyFilters: "Aplicar filtros",
    noResults: "No se han encontrado productos con estos filtros.",
    footerAbout: "Empresa fundada en 1987, especializada en equipos de sonido, DJ, iluminación y material audiovisual de calidad profesional.",
    footerShop: "Tienda", footerSupport: "Atención al cliente", footerContact: "Contacto directo",
    footerShipping: "Envíos y plazos de entrega", footerReturns: "Devoluciones y garantía",
    footerFaq: "Preguntas frecuentes", footerContactLink: "Contacto",
    footerRights: "Todos los derechos reservados.",
    footerBadge: "Vista previa — datos de demostración",
    toastAdded: (t) => `Añadido al carrito: ${t}`,
    toastRemoved: "Producto eliminado del carrito",
    toastOrder: "Pedido de demostración confirmado (no se ha realizado ningún cargo real)",
    toastLang: (hint) => `Selector de idioma preparado para ${hint} (demo visual)`,
    breadcrumbHome: "Inicio", breadcrumbCart: "Carrito", breadcrumbCheckout: "Checkout", breadcrumbAbout: "Quiénes somos",
    aboutTitle: "Quiénes somos",
    aboutP1: "Victor So Professional es una empresa fundada en 1987 para dar respuesta a la creciente demanda de audio de calidad en la Costa Brava. Con los años hemos ido ampliando nuestro campo de actividad hacia la iluminación espectacular, los audiovisuales y las instalaciones de antenas y fibra óptica.",
    aboutP2: "Uno de nuestros objetivos fundamentales, que se mantiene desde el primer día, es ofrecer productos de calidad, realizar instalaciones fiables y duraderas en el tiempo, y mantener siempre el equilibrio entre calidad y precio.",
    aboutP3: "Hoy seguimos siendo una tienda especializada y de trato cercano: asesoramos a técnicos de sonido, DJs y estudios profesionales para que encuentren el equipo que mejor se adapta a su proyecto.",
    aboutStatYear: "Año de fundación", aboutStatExp: "Años de experiencia", aboutStatWarranty: "Garantía oficial",
    aboutBrands: "Marcas con las que trabajamos",
    formName: "Nombre", formSurname: "Apellidos", formAddress: "Dirección", formZip: "Código postal",
    formCity: "Ciudad", formProvince: "Provincia", formPhone: "Teléfono", formEmail: "Email",
    payCard: "Tarjeta de crédito / débito", payPaypal: "PayPal", payBizum: "Bizum", payTransfer: "Transferencia bancaria",
    productNotFound: "Producto no encontrado", categoryLabel: "Categoría", backHome: "Volver al inicio",
    notFound: "Página no encontrada",
  },
  en: {
    shipBanner: "Free shipping across mainland Spain on orders over €149",
    shipBar: "Free shipping mainland Spain from",
    searchPlaceholder: "Search products, brands...",
    navHome: "Home", navDj: "DJ Equipment", navSonido: "Sound", navEstudio: "Studio Gear",
    navAuriculares: "Headphones", navCables: "Cables", navFlightcases: "Flight Cases & Bags",
    navOutlet: "Outlet", navAbout: "About us",
    heroEyebrow: "Official distributor · 24/48h shipping",
    heroCtaDj: "Shop DJ Equipment", heroCtaOutlet: "Shop Outlet",
    scrollHint: "Keep scrolling",
    hero1Title: "Welcome to your next booth", hero1Desc: "Step inside: pro sound, light and gear that make the floor move. Keep scrolling.",
    hero2Title: "Professional sound for any event", hero2Desc: "Active speakers, subwoofers and PA systems ready to hit the road.",
    hero3Title: "The deck that sets the tempo", hero3Desc: "Professional-grade CDJs and mixers — the same gear top DJs rely on.",
    hero4Title: "Outlet: same gear, better price", hero4Desc: "Display and open-box units with the full official warranty.",
    badgeOffer: "Deal", badgeOutlet: "Outlet", remove: "Remove",
    sectionCategories: "Shop by category",
    sectionOffers: "Featured deals", sectionOffersLink: "See all outlet",
    sectionBestsellers: "Top rated",
    sectionBrands: "Featured brands",
    sectionTestimonials: "What our customers say",
    addToCart: "Add to cart", buyNow: "Buy now",
    inStock: "In stock — ships in 24/48h", outOfStock: "Temporarily out of stock",
    quantity: "Quantity", reviewsOf: (n) => `${n} reviews`,
    perkShip: "Free shipping on orders over €149 (mainland Spain)",
    perkWarranty: "Official manufacturer warranty",
    perkReturn: "Free returns within 30 days",
    perkSecure: "Secure payment: card, PayPal, Bizum or transfer",
    tabSpecs: "Technical specs", tabReviews: "Reviews", tabShipping: "Shipping & returns",
    shippingTabText: "Free shipping across mainland Spain on orders over €149. Orders below: €5.90. Estimated delivery 24 to 48 business hours. Free returns within 30 calendar days of receipt, in original packaging.",
    relatedProducts: "You might also like",
    cartTitle: "Your cart", cartEmpty: "Your cart is empty.", cartEmptyCta: "Browse products",
    orderSummary: "Order summary", subtotal: "Subtotal", shipping: "Shipping", total: "Total",
    free: "Free", checkoutCta: "Checkout", continueShopping: "Continue shopping",
    shippingProgress: (n) => `Add <strong>${n}</strong> more to get free shipping`,
    shippingReached: "Your order qualifies for free shipping!",
    checkoutTitle: "Shipping details", paymentTitle: "Payment method",
    step1: "1. Cart", step2: "2. Details & payment", step3: "3. Confirmation",
    mockNote: "This is a visual prototype. The payment process is not functional and no real charge will be made — it will be replaced by Shopify's real checkout.",
    confirmOrder: "Confirm order",
    filters: "Filters", results: (n) => `${n} product${n === 1 ? "" : "s"}`,
    sortLabel: "Sort", sortRelevance: "Relevance", sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low", sortRating: "Top rated", sortNewest: "Newest",
    brand: "Brand", price: "Price (€)", onlyOffers: "Deals only", applyFilters: "Apply filters",
    noResults: "No products found matching these filters.",
    footerAbout: "Founded in 1987, specialized in professional-grade sound, DJ, lighting and audiovisual equipment.",
    footerShop: "Shop", footerSupport: "Customer service", footerContact: "Direct contact",
    footerShipping: "Shipping & delivery times", footerReturns: "Returns & warranty",
    footerFaq: "FAQ", footerContactLink: "Contact",
    footerRights: "All rights reserved.",
    footerBadge: "Preview — demo data",
    toastAdded: (t) => `Added to cart: ${t}`,
    toastRemoved: "Item removed from cart",
    toastOrder: "Demo order confirmed (no real charge was made)",
    toastLang: (hint) => `Language switcher ready for ${hint} (visual demo)`,
    breadcrumbHome: "Home", breadcrumbCart: "Cart", breadcrumbCheckout: "Checkout", breadcrumbAbout: "About us",
    aboutTitle: "About us",
    aboutP1: "Victor So Professional was founded in 1987 to meet the growing demand for quality audio on the Costa Brava. Over the years we've expanded into stage lighting, audiovisual equipment and antenna/fiber installations.",
    aboutP2: "One of our core goals, unchanged since day one, is to offer quality products, deliver reliable and long-lasting installations, and keep a fair balance between quality and price.",
    aboutP3: "Today we remain a specialized shop with a personal touch: we advise sound technicians, DJs and professional studios so they find the gear that best fits their project.",
    aboutStatYear: "Founded in", aboutStatExp: "Years of experience", aboutStatWarranty: "Official warranty",
    aboutBrands: "Brands we work with",
    formName: "First name", formSurname: "Last name", formAddress: "Address", formZip: "ZIP code",
    formCity: "City", formProvince: "Province", formPhone: "Phone", formEmail: "Email",
    payCard: "Credit / debit card", payPaypal: "PayPal", payBizum: "Bizum", payTransfer: "Bank transfer",
    productNotFound: "Product not found", categoryLabel: "Category", backHome: "Back to home",
    notFound: "Page not found",
  },
};
// FR/PT: en la demo reutilizan el diccionario EN (fallback) — en producción
// cada mercado de Shopify tendría su propia traducción completa.
I18N.fr = I18N.en;
I18N.pt = I18N.en;

const I18N_KEY = "vs_demo_locale";

const I18n = {
  current: localStorage.getItem(I18N_KEY) || "es",
  set(locale) {
    if (!I18N[locale]) return;
    this.current = locale;
    localStorage.setItem(I18N_KEY, locale);
    document.documentElement.setAttribute("lang", locale);
  },
};
I18n.set(I18n.current);

function t(key, ...args) {
  const dict = I18N[I18n.current] || I18N.es;
  const val = dict[key];
  if (typeof val === "function") return val(...args);
  return val ?? key;
}
