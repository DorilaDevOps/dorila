"use strict";

/* =====================================================================
   DORILA — Generador de fichas de producto estáticas.
   Lee js/productos.js (fuente única) y templates/ficha-producto.html,
   y escribe productos/<slug>.html por cada producto + sitemap.xml.

   Uso:   node tools/generate.js
   ===================================================================== */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var BASE = "https://dorila.netlify.app";
var products = require("../js/productos.js");

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
  var slug = slugify(p.name);
  var url = BASE + "/productos/" + slug + ".html";
  var absImg = BASE + "/" + p.img;
  var imgLocal = "../" + p.img.replace(/^\.?\//, "");
  var cat = p.category || "hierbas";
  var title = p.name + " — " + label(cat) + " | DORILA Uruguay";
  var desc = (p.desc || p.name) + " Envíos a todo el país desde Uruguay.";
  var waLink = "https://wa.me/59894872605?text=" + encodeURIComponent("Hola DORILA, quiero pedir " + p.name + " (" + p.id + ")");
  var props = (p.props || []).map(function(x){ return "<li>" + esc(x) + "</li>"; }).join("\n");

  var jsonldProduct = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "image": absImg,
    "description": desc,
    "sku": p.id,
    "brand": { "@type": "Brand", "name": "DORILA" },
    "category": cat,
    "offers": {
      "@type": "Offer",
      "url": url,
      "priceCurrency": "UYU",
      "price": priceNum(p),
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "DORILA" }
    }
  }, null, 2);

  var jsonldBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE + "/" },
      { "@type": "ListItem", "position": 2, "name": "Productos", "item": BASE + "/#productos" },
      { "@type": "ListItem", "position": 3, "name": p.name, "item": url }
    ]
  }, null, 2);

  var related = products
    .filter(function(r){ return r.id !== p.id && r.category === p.category; })
    .slice(0, 4)
    .map(function(r){
      var s = slugify(r.name);
      return '<a class="related-card" href="productos/' + s + '.html">' +
        '<img src="../' + r.img.replace(/^\.?\//, "") + '" alt="' + esc(r.name) + ', producto de herboristería artesanal de DORILA" loading="lazy">' +
        '<span class="related-name">' + esc(r.name) + '</span>' +
        '<span class="related-price">' + esc(r.price) + '</span>' +
        '</a>';
    })
    .join("\n");

  var html = template
    .replace(/\{\{PAGE_TITLE\}\}/g, title)
    .replace(/\{\{PAGE_DESC\}\}/g, desc)
    .replace(/\{\{PAGE_URL\}\}/g, url)
    .replace(/\{\{OG_TITLE\}\}/g, title)
    .replace(/\{\{OG_DESC\}\}/g, desc)
    .replace(/\{\{OG_IMAGE\}\}/g, absImg)
    .replace(/\{\{IMAGE\}\}/g, imgLocal)
    .replace(/\{\{WA_LINK\}\}/g, waLink)
    .replace(/\{\{NAME\}\}/g, p.name)
    .replace(/\{\{SCIENTIFIC\}\}/g, p.scientific)
    .replace(/\{\{CATEGORY\}\}/g, cat)
    .replace(/\{\{DESC\}\}/g, p.desc)
    .replace(/\{\{PROPS\}\}/g, props)
    .replace(/\{\{PRICE\}\}/g, p.price)
    .replace(/\{\{RELATED\}\}/g, related)
    .replace(/\{\{JSONLD_PRODUCT\}\}/g, jsonldProduct)
    .replace(/\{\{JSONLD_BREADCRUMB\}\}/g, jsonldBreadcrumb);

  var dir = path.join(ROOT, "productos");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, slug + ".html"), html);

  pages.push({ slug: slug, page: BASE + "/productos/" + slug + ".html" });
  console.log("OK  productos/" + slug + ".html   <- " + p.name);
});

var mainPages = ["", "testimonios.html", "saber.html", "recetas.html", "gracias.html"];
var sitemap = ['<?xml version="1.0" encoding="UTF-8"?>'];
sitemap.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
mainPages.forEach(function(m){ sitemap.push("  <url><loc>" + BASE + "/" + m + "</loc></url>"); });
pages.forEach(function(pg){ sitemap.push("  <url><loc>" + pg.page + "</loc></url>"); });
sitemap.push("</urlset>");
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap.join("\n") + "\n");

console.log("\nGeneradas " + pages.length + " fichas.");
console.log("Sitemap: " + pages.length + " productos + " + mainPages.length + " páginas.");