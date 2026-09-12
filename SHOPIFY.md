# Conexión a Shopify — guía de migración

Este prototipo usa `data.js` como stand-in de la Shopify Storefront API.
Los objetos de `PRODUCTS`, `CATEGORIES` y `BRANDS` ya están modelados con
los mismos nombres de campo que devolvería Shopify, para que conectar la
tienda real sea sustituir de dónde vienen los datos, no reescribir el front-end.

## Qué ya está listo

- `RAW_PRODUCTS` en `data.js`: cada producto tiene `handle`, `vendor`, `tags`,
  `images`, `variants` (con `sku`, `price`, `compareAtPrice`, `availableForSale`),
  `productType` y `currencyCode` — mismos nombres que Storefront API.
- `CATEGORIES`: pensadas como Collections de Shopify (`slug` ≈ `handle` de la collection).
- El checkout (`#/checkout`) es una simulación visual — no mueve dinero real
  (ver `mockNote` en `i18n.js`). Se sustituiría por el Cart API / Checkout de Shopify.

## Paso 1 — Credenciales

Se necesita una **Storefront API access token** (pública, de solo lectura),
no la Admin API. Se genera en el admin de Shopify:
`Settings → Apps and sales channels → Develop apps → tu app → API credentials`.

Esta token es segura para exponer en el cliente (a diferencia de una Admin
API key), así que sí puede vivir en un sitio 100% estático como este,
directamente en el JS del front-end.

## Paso 2 — Sustituir `RAW_PRODUCTS` por una query real

```js
const SHOPIFY_DOMAIN = "tu-tienda.myshopify.com";
const STOREFRONT_TOKEN = "•••"; // token pública Storefront API

async function fetchProducts() {
  const query = `
    query Products {
      products(first: 50) {
        edges {
          node {
            id
            handle
            title
            vendor
            productType
            tags
            descriptionHtml
            images(first: 5) { edges { node { url altText } } }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  availableForSale
                  price { amount currencyCode }
                  compareAtPrice { amount }
                }
              }
            }
          }
        }
      }
    }`;
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const { data } = await res.json();
  return data.products.edges.map(({ node }) => normalizeShopifyProduct(node));
}
```

`normalizeShopifyProduct` tendría que aplanar la forma GraphQL (edges/node,
`price.amount`) a la forma plana que ya usa `app.js` (ver tabla abajo).

## Paso 3 — Tabla de mapeo de campos

| Campo actual (`data.js`)     | Campo real en Storefront API                          |
|-------------------------------|--------------------------------------------------------|
| `id`                          | `product.id` (formato `gid://shopify/Product/123`)     |
| `handle`                      | `product.handle`                                        |
| `title`                       | `product.title`                                          |
| `vendor`                      | `product.vendor`                                         |
| `tags`                        | `product.tags`                                           |
| `category` (interno, rutas)   | sin equivalente directo — usar Collections o `productType` |
| `productType`                 | `product.productType`                                    |
| `description`                 | `product.description` (o `descriptionHtml` si se quiere HTML) |
| `images: [url, ...]`          | `product.images.edges[].node.url`                        |
| `price`, `compareAtPrice`     | `variant.price.amount`, `variant.compareAtPrice.amount`  |
| `variants[].id`                | `variant.id` (GID)                                       |
| `variants[].sku`               | `variant.sku`                                             |
| `variants[].available`         | `variant.availableForSale`                                |
| `currencyCode`                 | `variant.price.currencyCode`                              |

## Paso 4 — Carrito y checkout

El carrito actual (`Cart` en `app.js`) guarda `{ variantId, qty }` en
`localStorage` — ya es compatible con el modelo de Shopify. Al conectar
la API real, sustituir el botón "Tramitar pedido" por una mutación
`cartCreate` / `cartLinesAdd` y redirigir a `cart.checkoutUrl` que
devuelve Shopify, en vez de la página `#/checkout` simulada.

## Lo que NO cambia

Todo el resto del front-end (router, render de páginas, filtros, tema
claro/oscuro, i18n, diseño) es independiente de la fuente de datos y no
necesita tocarse.
