/**
 * CAPA DE DATOS DE DEMOSTRACIÓN
 * ------------------------------------------------------------------
 * Este archivo simula la respuesta de la Shopify Storefront API.
 * Cada objeto de `PRODUCTS` usa los mismos campos que expondría
 * Shopify (title, handle, vendor, tags, images, variants, price,
 * compareAtPrice, metafields...) para que, al conectar la tienda
 * real, baste con sustituir `PRODUCTS` por el resultado de una
 * query GraphQL a Shopify sin tocar el resto del front-end.
 *
 * Ejemplo de sustitución futura:
 *   const PRODUCTS = await storefrontClient.query(PRODUCTS_QUERY);
 *
 * Algunas fotos de producto se han sustituido por imágenes reales
 * extraídas del catálogo público de victorso.com (misma tienda,
 * fines de maquetación) para que la demo se vea más fiel; el resto
 * sigue usando placeholders de picsum.photos.
 * ------------------------------------------------------------------
 */

/**
 * Secuencia de fotogramas del plano secuencia (scrub sobre canvas).
 * Se rellena tras extraer los frames del vídeo con ffmpeg, p. ej.:
 *   const HERO_FRAMES = { path: "assets/hero/frames/", count: 96, ext: "webp" };
 * Mientras sea null, el hero usa el sistema de 3 imágenes con zoom.
 */
const HERO_FRAMES = { path: "assets/hero/frames/", count: 96, ext: "webp" };

const CATEGORIES = [
  { slug: "dj", title: "Equipos DJ", icon: "sliders", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/6/7/8/1200x1200_q100_png9_cr0_fix1/CDJ-1500X_prm_angle_260611.jpg" },
  { slug: "sonido", title: "Sonido Profesional", icon: "speaker", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/0/5/1200x1200_q100_png9_cr0_fix1/001_ART-915-A-front.jpg" },
  { slug: "estudio", title: "Material de Estudio", icon: "mic", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/7/6/1200x1200_q100_png9_cr0_fix1/controlador-ableton-live-akai-apc64.jpg" },
  { slug: "auriculares", title: "Auriculares", icon: "headphones", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/1/2/1200x1200_q100_png9_cr0_fix1/sennheiser-hd400-1-jpg.jpg" },
  { slug: "cables", title: "Cables", icon: "plug", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/3/0/1200x1200_q100_png9_cr0_fix1/11.jpg" },
  { slug: "flightcases", title: "Flight-Cases y Bolsas", icon: "suitcase", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/6/8/0/1200x1200_q100_png9_cr0_fix1/AlphaTheta-DJC-AN-BAG-2.jpg" },
  { slug: "outlet", title: "Outlet", icon: "tag", image: "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/8/1200x1200_q100_png9_cr0_fix1/alphatheta-euphonia1.jpg" },
];

/** Logos reales extraídos del catálogo público de victorso.com; Walkasse
 * no tiene logo propio publicado ahí, así que se muestra como texto. */
const BRANDS = [
  { name: "Pioneer DJ", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/165x83_q100_png9_cr0_fix1/pioneer-dj.png" },
  { name: "AlphaTheta", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosmarcas2/165x83_q100_png9_cr0_fix1/AlphaTheta_logo_Horizontal_k.jpg" },
  { name: "Walkasse", logo: null },
  { name: "RCF", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosMarcas/165x83_q100_png9_cr0_fix1/logo_rcf.jpg" },
  { name: "Yamaha", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosMarcas/165x83_q100_png9_cr0_fix1/285_Victorso.jpg" },
  { name: "QSC", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosMarcas/165x83_q100_png9_cr0_fix1/qsc_logo.jpg" },
  { name: "Rode", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosMarcas/165x83_q100_png9_cr0_fix1/rode_logo.png" },
  { name: "Focusrite", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosMarcas/165x83_q100_png9_cr0_fix1/focusrite_logo.jpg" },
  { name: "Sennheiser", logo: "https://cloudflare.shopincdn.ovh/victorso/cache/images/imagenes/logosmarcas2/165x83_q100_png9_cr0_fix1/senheiser.png" },
];

/** Genera un array de variantes con precio derivado del precio base */
function buildVariants(base, options) {
  return options.map((opt, i) => ({
    id: `${base.id}-v${i + 1}`,
    title: opt.title,
    price: opt.price ?? base.price,
    compareAtPrice: opt.compareAtPrice ?? base.compareAtPrice ?? null,
    sku: `${base.id.toUpperCase()}-${i + 1}`,
    available: opt.available !== false,
  }));
}

const RAW_PRODUCTS = [
  {
    id: "cdj3000", handle: "pioneer-dj-cdj-3000", title: "Pioneer DJ CDJ-3000 Reproductor Multimedia",
    vendor: "Pioneer DJ", category: "dj", price: 2299, compareAtPrice: null,
    tags: ["dj", "reproductor", "profesional", "Pioneer DJ"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/6/7/8/1200x1200_q100_png9_cr0_fix1/CDJ-1500X_prm_angle_260611.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/6/7/8/1200x1200_q100_png9_cr0_fix1/CDJ-1500X_prm_angle_260611.jpg"],
    optionName: "Formato",
    options: [{ title: "Unidad individual" }, { title: "Pack x2 (ahorra 150€)", price: 4448 }],
    rating: 4.9, reviewsCount: 128,
    description: "El estándar de la industria en cabinas profesionales. Pantalla táctil de alta resolución, control de tempo de alta precisión y compatibilidad con rekordbox y Serato.",
    specs: [
      ["Pantalla", "9\" táctil a color"],
      ["Formatos soportados", "MP3, AAC, WAV, AIFF, FLAC"],
      ["Conectividad", "USB, LAN, Wi-Fi"],
      ["Rango de Pitch", "±6/±10/±16/±100%"],
      ["Peso", "5.5 kg"],
      ["Dimensiones", "360 x 415 x 107 mm"],
    ],
  },
  {
    id: "djm-a9", handle: "pioneer-dj-djm-a9", title: "Pioneer DJ DJM-A9 Mezclador de 4 Canales",
    vendor: "Pioneer DJ", category: "dj", price: 2599, compareAtPrice: 2799,
    tags: ["dj", "mezclador", "profesional", "Pioneer DJ", "oferta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/1/6/1200x1200_q100_png9_cr0_fix1/1.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/1/6/1200x1200_q100_png9_cr0_fix1/1.jpg"],
    optionName: "Formato", options: [{ title: "Unidad individual" }],
    rating: 4.8, reviewsCount: 76,
    description: "Mezclador insignia con conversores A/D de 64 bits y sonido de calidad estudio para las cabinas más exigentes.",
    specs: [
      ["Canales", "4"],
      ["Conversión", "64-bit A/D"],
      ["Ecualizador", "3 bandas + Isolator"],
      ["Efectos", "Beat FX + Sound Color FX"],
      ["Peso", "6.4 kg"],
    ],
  },
  {
    id: "omnis-duo", handle: "alphatheta-omnis-duo", title: "AlphaTheta OMNIS-DUO Sistema Todo en Uno",
    vendor: "AlphaTheta", category: "dj", price: 1899, compareAtPrice: null,
    tags: ["dj", "todo-en-uno", "AlphaTheta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/6/1200x1200_q100_png9_cr0_fix1/alphatheta-omnis-duo.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/6/1200x1200_q100_png9_cr0_fix1/alphatheta-omnis-duo.jpg"],
    optionName: "Color",
    options: [{ title: "Negro" }, { title: "Blanco" }],
    rating: 4.7, reviewsCount: 41,
    description: "Sistema portátil todo en uno con altavoces integrados, batería recargable y streaming de música. Ideal para movilidad.",
    specs: [
      ["Batería", "Hasta 8 horas"],
      ["Altavoces", "2 x 60W integrados"],
      ["Conectividad", "Bluetooth, USB, Wi-Fi"],
      ["Streaming", "Compatible con Beatport, SoundCloud"],
      ["Peso", "12.8 kg"],
    ],
  },
  {
    id: "xdj-rx3", handle: "pioneer-dj-xdj-rx3", title: "Pioneer DJ XDJ-RX3 Controlador Standalone",
    vendor: "Pioneer DJ", category: "dj", price: 1799, compareAtPrice: null,
    tags: ["dj", "controlador", "Pioneer DJ"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/4/6/1200x1200_q100_png9_cr0_fix1/OPUS-QUAD_prm_top_230130.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/4/6/1200x1200_q100_png9_cr0_fix1/OPUS-QUAD_prm_top_230130.jpg"],
    optionName: "Formato", options: [{ title: "Unidad individual" }],
    rating: 4.8, reviewsCount: 63,
    description: "Controlador standalone de 2 canales con gran pantalla táctil, no requiere ordenador para actuar.",
    specs: [
      ["Canales", "2"],
      ["Pantalla", "10.1\" táctil"],
      ["Entradas", "USB, micro x2, línea/phono"],
      ["Software", "rekordbox (incluido)"],
      ["Peso", "6.4 kg"],
    ],
  },
  {
    id: "wego4", handle: "alphatheta-wego4", title: "AlphaTheta WeGO4 Altavoz Portátil DJ",
    vendor: "AlphaTheta", category: "dj", price: 449, compareAtPrice: null,
    tags: ["dj", "altavoz-portatil", "AlphaTheta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/7/1200x1200_q100_png9_cr0_fix1/alphatheta-wave-eight.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/7/1200x1200_q100_png9_cr0_fix1/alphatheta-wave-eight.jpg"],
    optionName: "Color",
    options: [{ title: "Negro" }, { title: "Rojo" }],
    rating: 4.5, reviewsCount: 29,
    description: "Altavoz portátil con batería para sesiones DJ en cualquier lugar, resistente a salpicaduras.",
    specs: [
      ["Potencia", "100W"],
      ["Batería", "Hasta 10 horas"],
      ["Resistencia", "IPX4 (salpicaduras)"],
      ["Conectividad", "Bluetooth 5.0"],
      ["Peso", "4.9 kg"],
    ],
  },
  {
    id: "art315a", handle: "rcf-art-315-a", title: "RCF ART 315-A Altavoz Activo 15\"",
    vendor: "RCF", category: "sonido", price: 699, compareAtPrice: null,
    tags: ["sonido", "altavoz-activo", "RCF"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/0/5/1200x1200_q100_png9_cr0_fix1/001_ART-915-A-front.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/0/5/1200x1200_q100_png9_cr0_fix1/001_ART-915-A-front.jpg"],
    optionName: "Formato",
    options: [{ title: "Unidad" }, { title: "Pareja (ahorra 40€)", price: 1358 }],
    rating: 4.6, reviewsCount: 54,
    description: "Altavoz activo de 15\" con amplificación clase D, ideal para eventos medianos y refuerzo sonoro.",
    specs: [
      ["Potencia", "800W pico"],
      ["Woofer", "15\""],
      ["SPL Máximo", "128 dB"],
      ["Entradas", "XLR/Jack combo"],
      ["Peso", "16.4 kg"],
    ],
  },
  {
    id: "dxr12", handle: "yamaha-dxr12-mkii", title: "Yamaha DXR12 MkII Altavoz Activo",
    vendor: "Yamaha", category: "sonido", price: 799, compareAtPrice: 899,
    tags: ["sonido", "altavoz-activo", "Yamaha", "oferta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/4/1/3/1200x1200_q100_png9_cr0_fix1/Alto_TS412-Angle-Right.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/4/1/3/1200x1200_q100_png9_cr0_fix1/Alto_TS412-Angle-Right.jpg"],
    optionName: "Formato", options: [{ title: "Unidad" }],
    rating: 4.7, reviewsCount: 88,
    description: "Referencia en sonorización profesional, con procesado DSP integrado y respuesta de frecuencia optimizada.",
    specs: [
      ["Potencia", "1100W"],
      ["Woofer", "12\""],
      ["DSP", "Sí, con presets"],
      ["SPL Máximo", "132 dB"],
      ["Peso", "18.7 kg"],
    ],
  },
  {
    id: "k12-2", handle: "qsc-k12-2", title: "QSC K12.2 Altavoz Activo",
    vendor: "QSC", category: "sonido", price: 899, compareAtPrice: null,
    tags: ["sonido", "altavoz-activo", "QSC"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/5/7/1200x1200_q100_png9_cr0_fix1/COM-3737_D82_S1ProPlus_01_Tilted_Hero_IJ_RGB-2000px.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/5/7/1200x1200_q100_png9_cr0_fix1/COM-3737_D82_S1ProPlus_01_Tilted_Hero_IJ_RGB-2000px.jpg"],
    optionName: "Formato", options: [{ title: "Unidad" }],
    rating: 4.8, reviewsCount: 47,
    description: "Altavoz activo de gama alta con control DSP vía app y diseño ultraligero para giras.",
    specs: [
      ["Potencia", "2000W pico"],
      ["Woofer", "12\""],
      ["Control", "App QSC (iOS/Android)"],
      ["SPL Máximo", "132 dB"],
      ["Peso", "14.5 kg"],
    ],
  },
  {
    id: "sub8004", handle: "rcf-sub-8004-as", title: "RCF SUB 8004-AS Subwoofer Activo",
    vendor: "RCF", category: "sonido", price: 1199, compareAtPrice: null,
    tags: ["sonido", "subwoofer", "RCF"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/4/1/0/1200x1200_q100_png9_cr0_fix1/Alto-ts318s.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/4/1/0/1200x1200_q100_png9_cr0_fix1/Alto-ts318s.jpg"],
    optionName: "Formato", options: [{ title: "Unidad" }],
    rating: 4.7, reviewsCount: 22,
    description: "Subwoofer activo de 18\" con gran presión sonora, imprescindible para refuerzo de graves en directo.",
    specs: [
      ["Potencia", "1400W pico"],
      ["Altavoz", "18\""],
      ["SPL Máximo", "133 dB"],
      ["Preset", "Cardioide seleccionable"],
      ["Peso", "36 kg"],
    ],
  },
  {
    id: "nt1", handle: "rode-nt1", title: "Rode NT1 Micrófono de Condensador",
    vendor: "Rode", category: "estudio", price: 249, compareAtPrice: null,
    tags: ["estudio", "microfono", "Rode"],
    images: ["https://picsum.photos/seed/nt1-a/900/900", "https://picsum.photos/seed/nt1-b/900/900"],
    optionName: "Formato",
    options: [{ title: "Solo micrófono" }, { title: "Kit con interfaz", price: 349 }],
    rating: 4.9, reviewsCount: 61,
    description: "Micrófono de condensador de estudio con el ruido propio más bajo de su categoría, ideal para voces e instrumentos.",
    specs: [
      ["Patrón polar", "Cardioide"],
      ["Ruido propio", "4.5 dBA"],
      ["Conexión", "XLR"],
      ["Incluye", "Araña antivibración, funda"],
      ["Peso", "326 g"],
    ],
  },
  {
    id: "scarlett2i2", handle: "focusrite-scarlett-2i2", title: "Focusrite Scarlett 2i2 Interfaz de Audio",
    vendor: "Focusrite", category: "estudio", price: 179, compareAtPrice: null,
    tags: ["estudio", "interfaz-audio", "Focusrite"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/0/1/1/1200x1200_q100_png9_cr0_fix1/MOSC0034-Focusrite_Scarlett_4i4_4th_Gen_Elevated__89814.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/0/1/1/1200x1200_q100_png9_cr0_fix1/focusrite-scarlett-4i4-gen-4.jpg"],
    optionName: "Generación",
    options: [{ title: "3ª Generación" }, { title: "4ª Generación", price: 219 }],
    rating: 4.8, reviewsCount: 152,
    description: "La interfaz de audio más popular del mundo para home studio, con preamplificadores de micrófono galardonados.",
    specs: [
      ["Entradas", "2 combo XLR/Jack"],
      ["Salidas", "2 línea + auriculares"],
      ["Resolución", "24-bit / 192kHz"],
      ["Conexión", "USB-C"],
      ["Peso", "0.6 kg"],
    ],
  },
  {
    id: "hdjcue1-mon", handle: "alphatheta-hdj-cue1-monitores", title: "AlphaTheta VM-70 Monitores de Estudio (par)",
    vendor: "AlphaTheta", category: "estudio", price: 349, compareAtPrice: null,
    tags: ["estudio", "monitores", "AlphaTheta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/3/6/7/1200x1200_q100_png9_cr0_fix1/pioneer-dj-vm-50-BONA.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/3/6/7/1200x1200_q100_png9_cr0_fix1/pioneer-dj-vm-50-BONA.jpg"],
    optionName: "Formato", options: [{ title: "Par (2 unidades)" }],
    rating: 4.6, reviewsCount: 18,
    description: "Monitores de estudio activos de campo cercano, diseñados junto a ingenieros de sonido profesionales.",
    specs: [
      ["Potencia", "2 x 45W"],
      ["Woofer", "5.25\""],
      ["Respuesta", "45Hz - 40kHz"],
      ["Entradas", "XLR, RCA, Jack"],
      ["Peso (par)", "8.4 kg"],
    ],
  },
  {
    id: "hdjx10", handle: "pioneer-dj-hdj-x10", title: "Pioneer DJ HDJ-X10 Auriculares DJ Profesionales",
    vendor: "Pioneer DJ", category: "auriculares", price: 279, compareAtPrice: null,
    tags: ["auriculares", "dj", "Pioneer DJ"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/3/4/4/4/1200x1200_q100_png9_cr0_fix1/VAAKGK181DJ.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/3/4/4/4/1200x1200_q100_png9_cr0_fix1/VAAKGK181DJ.jpg"],
    optionName: "Color",
    options: [{ title: "Negro" }, { title: "Plata" }, { title: "Azul" }],
    rating: 4.8, reviewsCount: 94,
    description: "Auriculares de referencia profesional con driver de 50mm y aislamiento acústico superior para cabina.",
    specs: [
      ["Driver", "50 mm"],
      ["Impedancia", "32 Ω"],
      ["Respuesta", "5Hz - 30kHz"],
      ["Plegable", "Sí, giro 90°"],
      ["Peso", "310 g"],
    ],
  },
  {
    id: "hdjcue1", handle: "alphatheta-hdj-cue1", title: "AlphaTheta HDJ-CUE1 Auriculares DJ",
    vendor: "AlphaTheta", category: "auriculares", price: 89, compareAtPrice: 109,
    tags: ["auriculares", "dj", "AlphaTheta", "oferta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/1/2/1200x1200_q100_png9_cr0_fix1/sennheiser-hd400-1-jpg.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/1/2/1200x1200_q100_png9_cr0_fix1/sennheiser-hd400-1-jpg.jpg"],
    optionName: "Color",
    options: [{ title: "Negro" }, { title: "Blanco" }],
    rating: 4.4, reviewsCount: 37,
    description: "Auriculares DJ compactos y plegables con gran relación calidad-precio para empezar a mezclar.",
    specs: [
      ["Driver", "40 mm"],
      ["Impedancia", "40 Ω"],
      ["Cable", "Desmontable, 1.5 m"],
      ["Plegable", "Sí"],
      ["Peso", "220 g"],
    ],
  },
  {
    id: "hd25", handle: "sennheiser-hd25", title: "Sennheiser HD 25 Auriculares DJ",
    vendor: "Sennheiser", category: "auriculares", price: 119, compareAtPrice: null,
    tags: ["auriculares", "dj", "Sennheiser"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/2/4/1/0/1200x1200_q100_png9_cr0_fix1/SennheiserHD25AuricularDJ-600da90bb4452.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/2/4/1/0/1200x1200_q100_png9_cr0_fix1/SennheiserHD25AuricularDJ-600da90bb4452.jpg"],
    optionName: "Color", options: [{ title: "Negro" }],
    rating: 4.9, reviewsCount: 210,
    description: "El clásico indestructible de cabina. Ligero, robusto y con un sonido cerrado muy fiable para mezclar.",
    specs: [
      ["Driver", "38 mm"],
      ["Impedancia", "70 Ω"],
      ["Peso", "140 g"],
      ["Cable", "1.5 m espiral"],
      ["Garantía", "2 años"],
    ],
  },
  {
    id: "cable-xlr", handle: "cable-xlr-profesional", title: "Cable XLR Profesional Macho-Hembra",
    vendor: "Victor So Pro", category: "cables", price: 19.9, compareAtPrice: null,
    tags: ["cables", "xlr"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/3/3/1200x1200_q100_png9_cr0_fix1/1.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/3/3/1200x1200_q100_png9_cr0_fix1/1.jpg"],
    optionName: "Longitud",
    options: [{ title: "3 metros", price: 14.9 }, { title: "6 metros", price: 19.9 }, { title: "10 metros", price: 27.9 }],
    rating: 4.7, reviewsCount: 65,
    description: "Cable XLR balanceado de calidad profesional, apantallado para eliminar ruidos e interferencias.",
    specs: [
      ["Conectores", "XLR macho/hembra"],
      ["Apantallamiento", "Trenzado de cobre"],
      ["Uso", "Micrófonos, línea balanceada"],
      ["Color", "Negro"],
    ],
  },
  {
    id: "cable-jack", handle: "cable-jack-jack", title: "Cable Jack 6.3mm TS Instrumento",
    vendor: "Victor So Pro", category: "cables", price: 12.9, compareAtPrice: null,
    tags: ["cables", "jack"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/3/1/1200x1200_q100_png9_cr0_fix1/1.webp", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/3/1/1200x1200_q100_png9_cr0_fix1/1.webp"],
    optionName: "Longitud",
    options: [{ title: "3 metros", price: 12.9 }, { title: "6 metros", price: 17.9 }],
    rating: 4.5, reviewsCount: 33,
    description: "Cable Jack-Jack mono de bajo ruido, ideal para conexión de línea y equipos DJ.",
    specs: [
      ["Conectores", "Jack 6.3mm TS"],
      ["Tipo", "Mono, no balanceado"],
      ["Uso", "Línea, instrumentos"],
      ["Color", "Negro"],
    ],
  },
  {
    id: "wpro-cdj", handle: "walkasse-wpro-cdj", title: "Walkasse WPRO-CDJ Flight Case Profesional",
    vendor: "Walkasse", category: "flightcases", price: 349, compareAtPrice: null,
    tags: ["flightcases", "proteccion", "Walkasse"],
    images: ["https://cloudflare.shopincdn.ovh/database_images_urls/9e/55/e5/9e55e510ee67ccb84f08fb0cecbcf150a40b8d80_226_226.jpg", "https://cloudflare.shopincdn.ovh/database_images_urls/9e/55/e5/9e55e510ee67ccb84f08fb0cecbcf150a40b8d80_226_226.jpg"],
    optionName: "Modelo compatible",
    options: [{ title: "CDJ-2000NXS2" }, { title: "CDJ-3000", price: 369 }],
    rating: 4.8, reviewsCount: 26,
    description: "Flight case de aluminio con espuma de corte a medida, protección total para transporte y giras.",
    specs: [
      ["Material", "Aluminio + contrachapado"],
      ["Interior", "Espuma troquelada"],
      ["Cierres", "Mariposa reforzados"],
      ["Peso", "6.2 kg"],
    ],
  },
  {
    id: "bag-controller", handle: "walkasse-bolsa-controller", title: "Walkasse Bolsa para Controlador DJ",
    vendor: "Walkasse", category: "flightcases", price: 89, compareAtPrice: null,
    tags: ["flightcases", "bolsas", "Walkasse"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/6/8/0/1200x1200_q100_png9_cr0_fix1/AlphaTheta-DJC-AN-BAG-2.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/6/8/0/1200x1200_q100_png9_cr0_fix1/AlphaTheta-DJC-AN-BAG-2.jpg"],
    optionName: "Talla",
    options: [{ title: "M (controladores compactos)" }, { title: "L (controladores grandes)", price: 109 }],
    rating: 4.6, reviewsCount: 19,
    description: "Bolsa acolchada resistente al agua con asa y correa de transporte, protección diaria para tu controlador.",
    specs: [
      ["Material", "Nylon 600D"],
      ["Acolchado", "10 mm EVA"],
      ["Bolsillos", "2 exteriores"],
      ["Resistencia", "Repelente al agua"],
    ],
  },
  {
    id: "ddjflx4-outlet", handle: "pioneer-dj-ddj-flx4-outlet", title: "Pioneer DJ DDJ-FLX4 Controlador (Outlet - Caja Abierta)",
    vendor: "Pioneer DJ", category: "outlet", price: 279, compareAtPrice: 349,
    tags: ["outlet", "dj", "Pioneer DJ", "oferta"],
    images: ["https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/8/1200x1200_q100_png9_cr0_fix1/alphatheta-euphonia1.jpg", "https://cloudflare.shopincdn.ovh/victorso/cache/images/_product_catalogue_/4/5/6/8/1200x1200_q100_png9_cr0_fix1/alphatheta-euphonia1.jpg"],
    optionName: "Formato", options: [{ title: "Unidad individual" }],
    rating: 4.5, reviewsCount: 14,
    description: "Unidad de exposición en perfecto estado, caja abierta, con todos los accesorios y garantía completa.",
    specs: [
      ["Estado", "Caja abierta / exposición"],
      ["Garantía", "2 años"],
      ["Canales", "2"],
      ["Software", "rekordbox + Serato"],
    ],
  },
];

const REVIEW_AUTHORS = ["Marc R.", "Laura G.", "Iván P.", "Sofía M.", "David T.", "Elena C.", "Jordi V.", "Nuria S."];
const REVIEW_TEXTS = [
  "Justo lo que necesitaba, calidad profesional y envío rapidísimo.",
  "Muy buen sonido, se nota que es material de nivel profesional.",
  "Llegó perfectamente embalado y antes de lo esperado.",
  "Relación calidad-precio excelente, lo recomiendo sin duda.",
  "Atención al cliente estupenda, resolvieron mis dudas antes de comprar.",
  "Se nota la diferencia frente a equipos de gama más baja.",
  "Segunda compra en la tienda, siempre cumplen lo que prometen.",
  "Ideal para uso profesional en cabina, muy satisfecho.",
];

function seededReviews(product) {
  const count = Math.min(4, Math.max(2, Math.round(product.reviewsCount / 30)));
  return Array.from({ length: count }).map((_, i) => ({
    author: REVIEW_AUTHORS[(product.id.length + i) % REVIEW_AUTHORS.length],
    rating: Math.max(3, Math.min(5, Math.round(product.rating) - (i % 2))),
    text: REVIEW_TEXTS[(product.id.length + i * 3) % REVIEW_TEXTS.length],
    date: new Date(2026, (i * 2 + 1) % 12, ((product.id.length * (i + 1)) % 27) + 1).toLocaleDateString("es-ES"),
  }));
}

/** Mapeo de nuestra `category` (interna, usada para rutas /category/:slug)
 * al `productType` que expondría Shopify — son dos campos distintos en
 * Storefront API (productType es libre; las categorías reales de la
 * tienda serían Collections, no un campo del producto). */
const CATEGORY_TO_PRODUCT_TYPE = {
  dj: "Equipos DJ", sonido: "Sonido Profesional", estudio: "Material de Estudio",
  auriculares: "Auriculares", cables: "Cables", flightcases: "Flight-Cases y Bolsas", outlet: "Outlet",
};

/** PRODUCTS: forma final consumida por app.js, análoga a Shopify Storefront API.
 * `available` se mantiene como nombre interno (así queda el resto del código),
 * pero se añade `availableForSale` — el nombre real del campo en Storefront API —
 * para que la migración futura sea un simple find&replace. */
const PRODUCTS = RAW_PRODUCTS.map((p) => {
  const variants = buildVariants(p, p.options).map((v) => ({ ...v, availableForSale: v.available }));
  const withReviews = {
    ...p,
    variants,
    productType: CATEGORY_TO_PRODUCT_TYPE[p.category] || p.category,
    currencyCode: "EUR",
  };
  return { ...withReviews, reviews: seededReviews(withReviews) };
});

const TESTIMONIALS = [
  { author: "Àlex Ferrer", role: "DJ residente, Sala Nexus", text: "Compro todo mi material aquí desde hace años. Asesoramiento real de gente que sabe de cabina.", rating: 5 },
  { author: "Cristina Boix", role: "Técnica de sonido freelance", text: "Envíos rápidos y equipos siempre originales con garantía. Mi tienda de confianza para giras.", rating: 5 },
  { author: "Marc Oliveras", role: "Productor musical", text: "El material de estudio que venden es de primer nivel y los precios muy competitivos.", rating: 4 },
];
