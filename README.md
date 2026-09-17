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

> ⚙️ **Cómo se genera**: 5 páginas base escritas a mano (`index`, `historia`,
> `saber`, `recetas`, `gracias`) + **36 fichas de producto** generadas
> automáticamente desde `templates/ficha-producto.html` y `js/productos.js`
> con `tools/generate.js`. Las imágenes se optimizan a WebP con
> `tools/images.js` (sharp).

### ✨ Características

| Funcionalidad | Detalle |
|---|---|
| 🛒 **Carrito persistente** | Se guarda en `localStorage`, con cantidades, subtotal y badges |
| 📄 **Orden de compra** | Verificación previa, número de orden, PDF/imprimir y envío por WhatsApp |
| 🔎 **Catálogo buscable** | Búsqueda por nombre, uso o nombre científico + filtros por categoría |
| 🔁 **Buscar desde cualquier página** | El buscador del header guarda el término en `sessionStorage` (`dorila-search`) y lo prellena al llegar a la tienda |
| 🖼️ **Lazy loading** | Carga progresiva de imágenes con placeholder difuminado (`IntersectionObserver`) |
| 📱 **Mobile-first** | CSS reorganizado `min-width` progresivo con `clamp()` para tipografías fluidas |
| 🍵 **Recetas y remedios** | Página con técnicas de preparación, recetas paso a paso y consejos de conservación |
| 🎓 **Educación herbolaria** | Página informativa sobre plantas y su uso seguro |
| 💬 **Testimonios** | Carrusel de experiencias reales en la página principal |
| 🙏 **Agradecimientos** | Página de agradecimiento posterior al envío del formulario |
| ♿ **Accesible** | `aria-*`, skip-link, focus visible, `prefers-reduced-motion`, carrusel con teclado/swipe |
| 🔍 **SEO** | Meta tags optimizados, Open Graph, Twitter Cards, JSON-LD (`LocalBusiness` + `WebSite`) |
| ⚡ **Velocidad** | Imágenes WebP + thumbs, fuentes recortadas, `defer`, caché inmutable por tipo de asset |

---

## 📁 Estructura

```
dorila/
├── index.html        # Tienda (página principal)
├── historia.html     # Nuestra historia
├── recetas.html      # Recetas y remedios caseros
├── saber.html        # Cosas que deberías saber (educación herbolaria)
├── gracias.html      # Agradecimientos post-formulario
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
npm run build        # images + generate
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

---

## 📷 Contacto

- **WhatsApp**: [`+598 94 872 605`](https://wa.me/59894872605)
- **Instagram**: [`@dorilanatural`](https://instagram.com/dorilanatural)
- **Email**: `hola@raizyhoja.uy`

---

<div align="center">
  <sub>© 2026 DORILA · Uruguay · Hecho con 🌿 y mucho té.</sub>
</div>
