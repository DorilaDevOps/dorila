"use strict";

/* =====================================================================
   DORILA — Generador de fichas de producto estáticas.
   Lee js/productos.js (fuente única) y templates/ficha-producto.html,
   y escribe productos/<slug>.html por cada producto + sitemap.xml.

   Uso:   node tools/generate.js
   ===================================================================== */

var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var ROOT = path.resolve(__dirname, "..");
var BASE = "https://dorila.netlify.app";
var products = require("../js/productos.js");
var bySlug = {};
products.forEach(function(p){ bySlug[p.slug] = p; });

function escList(items){
  return (items || []).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("\n");
}

function sectionBotanica(title, items){
  if (!items || !items.length) return "";
  return '<section class="ficha-botanica"><h2>' + esc(title) + '</h2><ul>' + escList(items) + '</ul></section>';
}

/* Los ?v= de los <script> evitan que el navegador sirva un JS viejo.
   Se derivan del contenido de todo js/, así que nunca quedan desactualizados
   a mano y las fichas y las páginas raíz comparten la misma versión. */
var JS_VERSION;
try {
  var h = crypto.createHash("sha1");
  fs.readdirSync(path.join(ROOT, "js"))
    .filter(function(f){ return /\.js$/.test(f); })
    .sort()
    .forEach(function(f){ h.update(fs.readFileSync(path.join(ROOT, "js", f))); });
  JS_VERSION = h.digest("hex").slice(0, 8);
} catch (e) {
  console.error("Falta js/ para calcular la versión de los scripts");
  process.exit(1);
}

function slugify(text){
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function label(s){ return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function priceNum(p){
  var m = String(p.price || "").replace(/[^0-9.]/g, "");
  return m || "0";
}

var template;
try {
  template = fs.readFileSync(path.join(ROOT, "templates", "ficha-producto.html"), "utf8");
} catch (e) {
  console.error("Falta templates/ficha-producto.html");
  process.exit(1);
}

var pages = [];

products.forEach(function(p){
  var slug = p.slug || slugify(p.name);
  var url = BASE + "/productos/" + slug + ".html";
  var absImg = BASE + "/" + p.img;
  var imgLocal = "../" + p.img.replace(/^\.?\//, "");
  var img2Local = p.img2 ? ("../" + p.img2.replace(/^\.?\//, "")) : "";
  var cat = p.category || "hierbas";
  var gallery2 = "";
  if (p.img2){
    var t1 = imgLocal.replace(/\.webp$/, "-thumb.webp");
    var t2 = img2Local.replace(/\.webp$/, "-thumb.webp");
    gallery2 =
      '<div class="ficha-thumbs">' +
        '<button type="button" class="ficha-thumb is-active" data-img="' + imgLocal + '" aria-label="Imagen principal de ' + esc(p.name) + '"><img src="' + t1 + '" alt="" loading="lazy"></button>' +
        '<button type="button" class="ficha-thumb" data-img="' + img2Local + '" aria-label="Segunda imagen de ' + esc(p.name) + '"><img src="' + t2 + '" alt="" loading="lazy"></button>' +
      '</div>';
  }
  var title = p.name + " — " + (p.fichaBotanica ? "Ficha botánica" : label(p.categoriaLabel || cat)) + " | DORILA Uruguay";
  var descBase = p.desc || p.botanicalDesc || p.name;
  var desc = p.vendible ? descBase + " Envíos a todo el país desde Uruguay." : descBase + " Ficha informativa de DORILA.";
  var keywords = [p.name, p.scientific].concat(p.sinonimos || [], p.palabrasClave || [])
    .filter(Boolean).filter(function(x, i, arr){ return arr.indexOf(x) === i; }).join(", ");
  var props = (p.props || []).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("\n");
  var toxicidad = p.toxicidadLabel ? "Toxicidad: " + p.toxicidadLabel : "";
  var familia = p.familia ? "Familia: " + p.familia : "";
  var alerta = p.alertaTitulo
    ? '<div class="' + esc(p.alertClass || "alerta-toxica") + '" role="alert">' +
        '<strong>' + esc(p.alertaTitulo) + '</strong>' +
        '<p>' + esc(p.alertaCuerpo || p.alerta) + '</p>' +
        (p.alertaNota ? '<small>' + esc(p.alertaNota) + '</small>' : "") +
      '</div>'
    : "";
  var stockLabel = p.vendible ? "Disponible" : (p.toxicidad === "EXTREMA" ? "No disponible para venta" : "Sin stock");
  var descBotanica = p.fichaBotanica && p.botanicalDesc && p.botanicalDesc !== p.desc
    ? '<section class="ficha-botanica"><h2>Descripción botánica</h2><p>' + esc(p.botanicalDesc) + "</p></section>"
    : "";
  var usos = p.toxicidad === "EXTREMA" ? "" : sectionBotanica("Usos tradicionales registrados", p.usos);
  var preparacion = p.toxicidad === "EXTREMA" ? "" : sectionBotanica("Preparación tradicional", p.preparacion);
  var cta = p.vendible
    ? '<button class="btn btn-primary" type="button" data-add-cart="' + esc(p.id) + '">Agregar al carrito</button>'
    : '<button class="btn btn-disabled" type="button" disabled>' + esc(stockLabel) + "</button>";
  var price = p.price || (p.toxicidad === "EXTREMA" ? "No se comercializa" : "Ficha botánica informativa");
  var precauciones = p.precauciones ? "<strong>Precauciones:</strong> " + esc(p.precauciones) : "";

  var jsonldProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "image": absImg,
    "description": desc,
    "sku": p.id,
    "brand": { "@type": "Brand", "name": "DORILA" },
    "category": cat
  };
  if (p.vendible){
    jsonldProduct.offers = {
      "@type": "Offer",
      "url": url,
      "priceCurrency": "UYU",
      "price": priceNum(p),
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "DORILA" }
    };
  }

  var jsonldBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE + "/" },
      { "@type": "ListItem", "position": 2, "name": "Productos", "item": BASE + "/productos.html" },
      { "@type": "ListItem", "position": 3, "name": p.name, "item": url }
    ]
  }, null, 2);

  var related = (p.related || [])
    .map(function(rSlug){ return bySlug[rSlug]; })
    .filter(function(r){ return r && r.id !== p.id && r.toxicidad !== "EXTREMA" && (!p.vendible || r.vendible); })
    .slice(0, 4);
  if (!related.length){
    related = products.filter(function(r){
      return r.id !== p.id && r.category === p.category && r.toxicidad !== "EXTREMA" && (!p.vendible || r.vendible);
    }).slice(0, 4);
  }
  related = related.map(function(r){
    return '<a class="related-card" href="' + r.slug + '.html">' +
      '<img class="' + (r.imageClass || "") + '" src="../' + r.img.replace(/^\.?\//, "") + '" alt="' + esc(r.name) + ', producto de herboristería artesanal de DORILA" loading="lazy">' +
      '<span class="related-name">' + esc(r.name) + '</span>' +
      '<span class="related-price">' + esc(r.price || "Ficha botánica") + '</span>' +
      '</a>';
  }).join("\n");

  var html = template
    .replace(/\{\{JS_VERSION\}\}/g, JS_VERSION)
    .replace(/\{\{PAGE_TITLE\}\}/g, title)
    .replace(/\{\{PAGE_DESC\}\}/g, desc)
    .replace(/\{\{META_KEYWORDS\}\}/g, esc(keywords))
    .replace(/\{\{PAGE_URL\}\}/g, url)
    .replace(/\{\{OG_TITLE\}\}/g, title)
    .replace(/\{\{OG_DESC\}\}/g, desc)
    .replace(/\{\{OG_IMAGE\}\}/g, absImg)
    .replace(/\{\{IMAGE\}\}/g, imgLocal)
    .replace(/\{\{IMAGE_CLASS\}\}/g, p.imageClass || "")
    .replace(/\{\{IMAGE_2\}\}/g, img2Local)
    .replace(/\{\{IMAGE_2_GALLERY\}\}/g, gallery2)
    .replace(/\{\{ID\}\}/g, p.id)
    .replace(/\{\{NAME\}\}/g, p.name)
    .replace(/\{\{SCIENTIFIC\}\}/g, p.scientific)
    .replace(/\{\{CATEGORY\}\}/g, p.categoriaLabel || cat)
    .replace(/\{\{TOXICIDAD\}\}/g, toxicidad)
    .replace(/\{\{FAMILIA\}\}/g, familia)
    .replace(/\{\{ALERTA_BOTANICA\}\}/g, alerta)
    .replace(/\{\{STOCK_LABEL\}\}/g, stockLabel)
    .replace(/\{\{DESC\}\}/g, p.desc || p.botanicalDesc || "")
    .replace(/\{\{DESC_BOTANICA\}\}/g, descBotanica)
    .replace(/\{\{PROPS_TITLE\}\}/g, p.toxicidad === "EXTREMA" ? "Información de seguridad" : "Beneficios y propiedades")
    .replace(/\{\{PROPS\}\}/g, props)
    .replace(/\{\{USOS_BOTANICOS\}\}/g, usos)
    .replace(/\{\{PREPARACION_BOTANICA\}\}/g, preparacion)
    .replace(/\{\{PRICE\}\}/g, price)
    .replace(/\{\{CTA\}\}/g, cta)
    .replace(/\{\{PRECAUCIONES\}\}/g, precauciones)
    .replace(/\{\{RELATED\}\}/g, related)
    .replace(/\{\{JSONLD_PRODUCT\}\}/g, JSON.stringify(jsonldProduct, null, 2))
    .replace(/\{\{JSONLD_BREADCRUMB\}\}/g, jsonldBreadcrumb)
    .replace(/[ \t]+$/gm, "");

  var leftovers = html.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (leftovers){
    console.error("Token sin reemplazar en productos/" + slug + ".html: " + leftovers.join(", "));
    process.exit(1);
  }

  var dir = path.join(ROOT, "productos");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, slug + ".html"), html);

  pages.push({ slug: slug, page: BASE + "/productos/" + slug + ".html" });
  console.log("OK  productos/" + slug + ".html   <- " + p.name);
});

var mainPages = ["", "productos.html", "historia.html", "saber.html", "recetas.html", "gracias.html"];
var sitemap = ['<?xml version="1.0" encoding="UTF-8"?>'];
sitemap.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
mainPages.forEach(function(m){ sitemap.push("  <url><loc>" + BASE + "/" + m + "</loc></url>"); });
pages.forEach(function(pg){ sitemap.push("  <url><loc>" + pg.page + "</loc></url>"); });
sitemap.push("</urlset>");
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap.join("\n") + "\n");

/* Redirecciones de slugs históricos. No se agregan al sitemap: solo apuntan
   a la ficha canónica para no perder enlaces entrantes. */
var REDIRECTS = { "hierba-de-san-juan": "hiperico" };
Object.keys(REDIRECTS).forEach(function(from){
  var to = REDIRECTS[from];
  var target = "./" + to + ".html";
  var redirect =
    '<!DOCTYPE html>\n' +
    '<html lang="es">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>Redirección a ' + to + ' | DORILA</title>\n' +
    '  <link rel="canonical" href="' + BASE + '/productos/' + to + '.html">\n' +
    '  <meta http-equiv="refresh" content="0; url=' + target + '">\n' +
    '</head>\n' +
    '<body>\n' +
    '  <p>Esta ficha cambió de nombre. <a href="' + target + '">Continuar a ' + to + '</a>.</p>\n' +
    '  <script>location.replace(' + JSON.stringify(target) + ');</script>\n' +
    '</body>\n' +
    '</html>\n';
  fs.writeFileSync(path.join(ROOT, "productos", from + ".html"), redirect, "utf8");
  console.log("OK  productos/" + from + ".html  -> " + to + ".html");
});

/* Las páginas raíz son editadas a mano, pero el ?v= de sus <script> se
   reescribe acá para que nunca queden con la versión vieja de un JS. */
var ROOT_PAGES = ["index.html", "productos.html", "404.html", "historia.html", "saber.html", "recetas.html", "gracias.html", "admin-recetas.html"];
var catalogoItems = products.map(function(p, i){
  return '    {\n      "@type": "ListItem",\n      "position": ' + (i + 1) + ',\n      "name": ' + JSON.stringify(p.name) + ',\n      "url": "' + BASE + '/productos/' + p.slug + '.html"\n    }';
}).join(",\n");
var catalogoIndex = products.map(function(p){
  return '            <li><a href="productos/' + p.slug + '.html">' + esc(p.name) + "</a></li>";
}).join("\n");
var stamped = 0;
ROOT_PAGES.forEach(function(file){
  var p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  var before = fs.readFileSync(p, "utf8");
  var after = before;
  if (file === "productos.html"){
    after = after
      .replace(/\{\{CATALOGO_TOTAL\}\}/g, String(products.length))
      .replace(/\{\{CATALOGO_JSONLD_ITEMS\}\}/g, catalogoItems)
      .replace(/\{\{CATALOGO_INDEX\}\}/g, catalogoIndex)
      .replace(/("numberOfItems":\s*)\d+/, function(_, prefix){ return prefix + products.length; })
      .replace(/("@type":\s*"ItemList"[\s\S]*?"itemListElement":\s*\[)[\s\S]*?(\r?\n  \]\r?\n\})/, function(_, open, close){ return open + "\n" + catalogoItems + close; })
      .replace(/(<ul class="catalog-index-list">\r?\n)[\s\S]*?(\r?\n      <\/ul>)/, function(_, open, close){ return open + catalogoIndex + close; });
  }
  after = after.replace(/Nombre, uso o nombre científico…/g, "Nombre, sinónimo, uso o nombre científico…");
  after = after.replace(/(<script src="js\/[^"?]+)(?:\?v=[^"]*)?(")/g, "$1?v=" + JS_VERSION + "$2");
  if (after !== before){
    fs.writeFileSync(p, after);
    stamped++;
    console.log("OK  " + file + "  (?v=" + JS_VERSION + ")");
  }
});

console.log("\nGeneradas " + pages.length + " fichas.");
console.log("Sitemap: " + pages.length + " productos + " + mainPages.length + " páginas.");
console.log("JS ?v=" + JS_VERSION + " | páginas raíz reescritas: " + stamped);