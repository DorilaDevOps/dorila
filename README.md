<div align="center">

# 🌿 DORILA

### Herbolaria artesanal · Plantas medicinales y remedios caseros en Uruguay

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)]()

*Donde las plantas guardan historias.*

</div>

---

## 🌿 Sobre el proyecto

**DORILA** es una tienda web estática (HTML + CSS + JS vanilla) de una
herboristería artesanal uruguaya. El sitio permite explorar hierbas
medicinales, filtrarlas por categoría, armar un carrito persistente,
generar una orden de compra y enviarla por WhatsApp. Incluye además páginas
de **recetas y remedios caseros**, educación herbolaria y agradecimientos.

> ⚙️ **Cómo se genera**: 6 páginas base escritas a mano (`index`, `productos`,
> `historia`, `saber`, `recetas`, `gracias`) + `404.html` + **36 fichas de producto**
> generadas automáticamente desde `templates/ficha-producto.html` y `js/productos.js`
> con `tools/generate.js`. Las imágenes se optimizan a WebP con
> `tools/images.js` (sharp).

### ✨ Características

| Funcionalidad | Detalle |
|---|---|
| 🛒 **Carrito persistente** | Se guarda en `localStorage`, con cantidades, subtotal y badges; se agrega desde la grilla, el modal de planta y cada ficha de producto |
| 📄 **Orden de compra** | Verificación en dos pasos (revisión → orden), número de orden, envío por WhatsApp (vacía el carrito) y PDF/imprimir |
| 🔎 **Catálogo buscable** | Página `productos.html` con los 36 productos, búsqueda por nombre, uso o nombre científico, filtros por categoría e índice estático para SEO |
| 🪴 **Modal de producto** | Vista rápida con categoría, precio, propiedades, productos relacionados y acceso a la ficha completa |
| 🧩 **Categorías** | Tarjetas con filtro directo, iconos y badge destacado; 2 columnas en móvil y 3 desde 640px |
| 🔁 **Buscar desde cualquier página** | El buscador del header guarda el término en `sessionStorage` (`dorila-search`) y lo prellena al llegar a la tienda |
| 🖼️ **Lazy loading** | Carga progresiva de imágenes con placeholder difuminado (`IntersectionObserver`) |
| 📱 **Mobile-first** | CSS con `min-width` progresivo y `clamp()`; la grilla de categorías se mantiene en 2 columnas en móvil y pasa a 3 desde 640px |
| 🧭 **Footer editorial** | Cuatro bloques con namespace propio, 2/2/4 columnas compactas, disclaimer destacado, modales legales y crédito a Kikiriya-DevOps |
| 🍵 **Recetas y remedios** | Página con técnicas de preparación, recetas paso a paso y consejos de conservación |
| 🌿 **Recetas de persona a persona** | Envío en dos pasos, moderación privada con checklist, publicación solo tras aprobación y sin exponer datos personales |
| 🎓 **Educación herbolaria** | Página informativa sobre plantas y su uso seguro |
| 💬 **Testimonios** | Carrusel de experiencias reales en la página principal |
| 🙏 **Agradecimientos** | Página de agradecimiento posterior al envío del formulario |
| ♿ **Accesible** | `aria-*`, skip-link, focus visible, `prefers-reduced-motion`, carrusel con teclado/swipe y tarjetas de categoría operables con Enter/Espacio |
| 🔍 **SEO** | Meta tags optimizados, Open Graph, Twitter Cards, JSON-LD (`LocalBusiness`, `WebSite`, `ItemList` y `BreadcrumbList`), sitemap con las 36 fichas y página 404 `noindex` |
| ⚡ **Velocidad** | Imágenes WebP + thumbs, fuentes recortadas, `defer`, revalidación por ETag tras cada deploy |

---

## 📁 Estructura

```
dorila/
├── index.html        # Tienda (página principal)
├── productos.html    # Catálogo completo + búsqueda y filtros
├── historia.html     # Nuestra historia
├── recetas.html      # Recetas y remedios caseros
├── saber.html        # Cosas que deberías saber (educación herbolaria)
├── gracias.html      # Agradecimientos post-formulario
├── 404.html          # Página no encontrada (noindex)
├── asset/            # CSS por áreas: base, home, pages, carousel, ficha
├── img/              # Fotografías (WebP optimizado + fuentes jpg/png)
├── js/               # shell, cart, app, ficha, productos, testimonios…
├── productos/        # 36 fichas de producto (generadas)
├── templates/        # Plantilla de ficha de producto
├── tools/            # generate.js (fichas) e images.js (WebP + thumbs)
├── netlify.toml      # Deploy + headers de caché inmutable
└── .gitignore        # Excluye documentos internos (Cremas.txt, etc.)
```

---

## 🚀 Cómo ejecutarlo

```bash
# Opción 1: abrir directamente
start index.html

# Opción 2: servidor local (recomendado)
python -m http.server 8000
```

Abrí <http://localhost:8000> desde tu navegador.

### 🔧 Regenerar fichas o imágenes

```bash
npm install          # una vez: instala sharp (solo dev)
npm run images       # regenera WebP + thumbs desde las fuentes de img/
npm run generate     # regenera las 36 fichas de producto
npm run build        # images + generate + tests
```

---

## 🧰 Stack

- **HTML5** semántico (`header`, `nav`, `main`, `section`, `article`, `footer`)
- **CSS3** moderno: variables (tokens), `grid`, `clamp()`, `backdrop-filter`,
  `color-mix()`, media queries **mobile-first agrupadas**, `pages.css` unifica
  el CSS que antes repetía `<style>` inline en las 4 páginas base
- **JavaScript vanilla**: DOM, `IntersectionObserver`, `localStorage`,
  `sessionStorage`, `fetchpriority`, swipe táctil, accesibilidad
- **Fuentes**: Rye (display) + Montserrat (texto) vía Google Fonts
- **Build ligero**: sharp (dev) para imágenes; sin bundlers en producción

### 🧭 Footer editorial

El footer vive bajo el namespace `.dorila-footer*` en `asset/base.css` y se replica
en 7 páginas raíz + `templates/ficha-producto.html` (de ahí se generan las 36
fichas). Es **mobile-first**: 1 columna en móvil, 2 desde 640px y 4 desde 1000px.
Organiza Identidad, Explorar, DORILA y Comunidad; deja los enlaces legales en una
franja separada con modales y mantiene siempre visible el disclaimer con un
tratamiento sutil de borde y sombra. El crédito a
[Kikiriya-DevOps](https://kikiriya-devops.netlify.app/) también está cubierto por
`npm test`.

### ✅ Verificación responsive

Además de `npm test` (carrito, recetas, contraste WCAG AA y consistencia del
footer), el footer se validó con Chrome headless en 360px, 768px y 1280px:
sin scroll horizontal, 2/2/4 columnas, eyebrow y wordmark en la misma fila en
mobile/tablet, 3 iconos, 6 enlaces de navegación y disclaimer + crédito visibles
en los tres anchos.

---

## 📷 Contacto

- **WhatsApp**: [`+598 94 872 605`](https://wa.me/59894872605)
- **Instagram**: [`@dorilanatural`](https://instagram.com/dorilanatural)
- **Email**: `hola@raizyhoja.uy`

---

<div align="center">
  <sub>© 2026 DORILA · Uruguay · Hecho con 🌿 y mucho té.</sub><br>
  <sub>Un proyecto desarrollado con dedicación por <a href="https://kikiriya-devops.netlify.app/">Kikiriya-DevOps</a>.</sub>
</div>

---

## 🌿 Recetas de persona a persona

La sección pública vive en `recetas.html#recetas-comunidad` y también tiene
un teaser en `index.html`. Las recetas se envían desde un formulario en dos
pasos, pasan por moderación editorial y solo se publican después de aprobar
el checklist de seguridad.

### Arquitectura

- **Netlify Functions** en `netlify/functions/`:
  - `recetas-submit.js` — recibe envíos y valida en el servidor.
  - `recetas-public.js` — devuelve únicamente recetas publicadas.
  - `recetas-admin.js` — listado y cambios de moderación con token.
- **Netlify Blobs** (store `dorila-recetas`) para persistencia compartida.
  Las Functions usan compatibilidad Lambda, así que `_lib/recetas-store.js`
  llama `connectLambda(event)` antes de `getStore()`.
- **Datos semilla** en `js/recetas_.js`: permiten que la sección tenga
  contenido inicial y sirven como respaldo si la API no responde.
- **Panel privado** en `admin-recetas.html` (noindex, no enlazado desde el
  sitio): checklist de 5 puntos, notas internas, historial y descarga de una
  copia estática `recetas_.js`.

### Variables de entorno

```bash
# En Netlify: Site configuration → Environment variables
ADMIN_TOKEN="un-token-largo-y-secreto"
```

El token se guarda solo en `sessionStorage` del navegador y se envía como
`Authorization: Bearer`. Nunca se incluye en el repositorio.

### Desarrollo local

```bash
npm install
npx netlify dev
```

`netlify dev` levanta el sitio y las Functions con Blobs local. Abrí
`http://localhost:8888`; el panel está en `/admin-recetas.html`.

### Flujo de moderación

`pending → review → approved → published`

- `review → changes` o `approved/review/pending → rejected` requieren un
  motivo en las notas internas.
- `published → changes` despublica la receta.
- `rejected → review` permite reabrir el caso.
- Para publicar, los 5 puntos del checklist deben estar completos.

### Verificación

```bash
npm test          # carrito + recetas + contraste WCAG AA
npm run generate  # reestampa ?v= y regenera fichas/sitemap
```

### Accesibilidad visual

Los paneles público y de administración centralizan sus colores en tokens de
`asset/comunidad.css` y `asset/admin-recetas.css`. Los tokens `--cr-*` viven en
`:root` para que también los reciban los diálogos del formulario.
`tools/check-contraste.js` verifica automáticamente texto normal (mínimo 4.5:1),
bordes y foco de controles (mínimo 3:1), placeholders, campos deshabilitados,
mensajes de error, referencias de tokens y ausencia de colores literales en los
diálogos.

> Esta primera versión no acepta fotografías: solo texto. El modelo de datos
> ya contempla una futura ampliación sin cambiar los contratos públicos.
