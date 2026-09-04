<div align="center">

# 🌿 DORILA

### Herbolaria artesanal · Plantas medicinales y remedios caseros en Uruguay

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Sin dependencias](https://img.shields.io/badge/Zero%20Dependencias-2e8b57?style=for-the-badge)]()

*Donde las plantas guardan historias.*

</div>

---

## 🌿 Sobre el proyecto

**DORILA** es una tienda web *single-page* (HTML + CSS + JS vanilla, sin
dependencias ni compiladores) de una herboristería artesanal uruguaya.
El sitio permite explorar hierbas medicinales, filtrarlas por categoría,
armar un carrito persistente, generar una orden de compra y enviarla por
WhatsApp. Incluye además páginas de **recetas y remedios caseros**, educación
herbolaria, testimonios y agradecimientos.

### ✨ Características

| Funcionalidad | Detalle |
|---|---|
| 🛒 **Carrito persistente** | Se guarda en `localStorage`, con cantidades, subtotal y badges |
| 📄 **Orden de compra** | Verificación previa, número de orden, PDF/imprimir y envío por WhatsApp |
| 🔎 **Catálogo buscable** | Búsqueda por nombre, uso o nombre científico + filtros por categoría |
| 🔁 **Buscar desde cualquier página** | El buscador del header guarda el término en `sessionStorage` (`dorila-search`) y lo prellena al llegar a la tienda |
| 🖼️ **Lazy loading** | Carga progresiva de imágenes con placeholder difuminado (`IntersectionObserver`) |
| 📱 **Mobile-first** | CSS reorganizado `min-width` progresivo con `clamp()` para tipografías fluidas |
| 🍵 **Recetas y remedios** | Página con técnicas de preparación, 8 recetas paso a paso y consejos de conservación |
| 🎓 **Educación herbolaria** | Página informativa sobre plantas y su uso seguro |
| 💬 **Testimonios** | Experiencias reales de clientes |
| 🙏 **Agradecimientos** | Página de agradecimiento posterior al envío del formulario |
| ♿ **Accesible** | `aria-*`, skip-link, focus visible, `prefers-reduced-motion`, carrusel con teclado/swipe |
| 🔍 **SEO** | Meta tags optimizados, Open Graph, Twitter Cards, JSON-LD (`LocalBusiness` + `WebSite`) |

---

## 📁 Estructura

```
dorila/
├── index.html        # Tienda (página principal): todo el CSS y JS embebido
├── recetas.html      # Recetas y remedios caseros con plantas medicinales
├── saber.html        # Cosas que deberías saber (educación herbolaria)
├── testimonios.html  # Testimonios de clientes
├── gracias.html      # Agradecimientos post-formulario
├── img/              # Imágenes y fotografías de productos
└── .gitignore        # Excluye documentos internos (Cremas.txt, etc.)
```

> 🌿 Por diseño, todo vive en archivos HTML autocontenidos: **cero paquetes,
> cero build**, portable a cualquier hosting estático.

---

## 🚀 Cómo ejecutarlo

```bash
# Opción 1: abrir directamente
start index.html

# Opción 2: servidor local (recomendado)
python -m http.server 8000
```

Abrí <http://localhost:8000> desde tu navegador.

---

## 🧰 Stack

- **HTML5** semántico (`header`, `nav`, `main`, `section`, `article`, `footer`)
- **CSS3** moderno: variables (tokens), `grid`, `clamp()`, `backdrop-filter`,
  `color-mix()`, media queries **mobile-first agrupadas**
- **JavaScript vanilla**: DOM, `IntersectionObserver`, `localStorage`,
  `sessionStorage`, `fetchpriority`, swipe táctil, accesibilidad
- **Fuentes**: Rye (display) + Lora (texto) vía Google Fonts

---

## 📷 Contacto

- **WhatsApp**: [`+598 94 872 605`](https://wa.me/59894872605)
- **Instagram**: [`@dorilanatural`](https://instagram.com/dorilanatural)
- **Email**: `hola@raizyhoja.uy`

---

<div align="center">
  <sub>© 2026 DORILA · Uruguay · Hecho con 🌿 y mucho té.</sub>
</div>
