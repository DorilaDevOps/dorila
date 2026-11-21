"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var passed = 0;
var failed = 0;

function ok(name, condition){
  if (condition){ passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name); }
}

function read(rel){
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

["index.html", "productos.html"].forEach(function(page){
  var html = read(page);
  ok(page + " usa dialog nativo", /<dialog class="modal modal-plant" id="plantModal" aria-labelledby="modalTitle">/.test(html));
  ok(page + " no tiene scrim manual de planta", !/id="plantModal"[\s\S]{0,200}modal-scrim/.test(html));
  ok(page + " no ofrece Ver ficha", !/Ver ficha/.test(html));
  ok(page + " no usa modalImg2Btn", !/modalImg2Btn|modalImg2/.test(html));
  [
    "modalImg", "modalThumbs", "modalCat", "modalTitle", "modalScientific",
    "modalSynonyms", "modalAlert", "modalStock", "modalPrice", "modalDesc",
    "modalPropsSection", "modalProps", "modalUsosSection", "modalUsos",
    "modalPreparacionSection", "modalPreparacion", "modalPrecaucionesSection",
    "modalPrecauciones", "modalFamilia", "modalTox", "modalAddBtn",
    "modalRelatedWrap", "modalRelated", "modalClose"
  ].forEach(function(id){
    ok(page + " expone #" + id, html.indexOf('id="' + id + '"') !== -1);
  });
});

var app = read("js/app.js");
ok("app.js abre con showModal", /modal\.showModal\(\)/.test(app));
ok("app.js cierra con close", /modal\.close\(\)/.test(app));
ok("app.js restaura foco al cerrar", /addEventListener\("close"/.test(app) && /\.focus\(\{ preventScroll: true \}\)/.test(app));
ok("app.js bloquea el carrito del modal sin stock",
  /function hasStock[\s\S]*?Number\(p\.stock\) > 0/.test(app) &&
  /addBtn\.hidden = !disponible/.test(app) &&
  /addBtn\.disabled = !disponible/.test(app) &&
  /if \(!hasStock\(findProduct\(this\.dataset\.id\)\)\) return/.test(app));
ok("app.js no usa Escape manual del modal", !/modal\.classList\.contains\("is-open"\)/.test(app));
ok("app.js renderiza sinónimos", /p\.sinonimos/.test(app));
ok("app.js normaliza búsqueda con slugify", /function slugify/.test(app) && /searchScore/.test(app));
ok("app.js renderiza alerta con textContent", /title\.textContent = p\.alertaTitulo/.test(app) && /body\.textContent = p\.alertaCuerpo/.test(app));
ok("app.js no inserta Ver ficha", !/Ver ficha/.test(app));
ok("app.js mantiene related no EXTREMA", /r\.toxicidad !== "EXTREMA"/.test(app));
ok("app.js mantiene deep links", /get\("p"\)/.test(app) && /get\("categoria"\)/.test(app));

var baseCss = read("asset/base.css");
ok("CSS define ::backdrop", /dialog\.modal-plant::backdrop/.test(baseCss));
ok("CSS usa 100dvh", /100dvh/.test(baseCss));
ok("CSS tiene bottom-sheet móvil", /@media \(max-width: 640px\)[\s\S]*?margin:auto 0 0/.test(baseCss));
ok("CSS tiñe mandalas con color fijo", /\.mandala-tratamientos\{ --mandala-filter: sepia\(1\)/.test(baseCss));

var products = require(path.join(ROOT, "js", "productos.js"));
var canon = require(path.join(ROOT, "data", "plantas.json"));
ok("productos usan IDs DOR", products.every(function(p){ return /^DOR-[A-Z]{3}-\d{3}$/.test(p.id); }));
ok("catálogo no vende productos sin stock", products.every(function(p){ return !p.vendible || Number(p.stock) > 0; }));
ok("catálogo no conserva cons-*", !products.some(function(p){ return /^cons-/.test(p.id); }));
ok("catálogo no expone idBotanico", !products.some(function(p){ return "idBotanico" in p; }));
ok("canonical no expone idBotanico", !canon.some(function(p){ return "idBotanico" in p; }));
ok("productos exponen sinónimos", products.some(function(p){ return (p.sinonimos || []).length > 0; }));
ok("productos exponen alerta estructurada", products.some(function(p){ return !!p.alertaTitulo; }));

var hiperico = products.filter(function(p){ return p.slug === "hiperico"; })[0];
ok("Hipérico existe con slug hiperico", !!hiperico && hiperico.name === "Hipérico");
ok("Hipérico conserva DOR-DES-009", !!hiperico && hiperico.id === "DOR-DES-009");
ok("Hipérico indexa Yerba de San Juan", !!hiperico && (hiperico.sinonimos || []).indexOf("Yerba de San Juan") !== -1);
ok("Hipérico indexa Hierba de San Juan", !!hiperico && (hiperico.sinonimos || []).indexOf("Hierba de San Juan") !== -1);
ok("slug viejo de Hipérico no está en catálogo", !products.some(function(p){ return p.slug === "hierba-de-san-juan"; }));
var catalogoHtml = read("productos.html");
ok("catálogo estático usa ficha canónica de Hipérico", !/productos\/hierba-de-san-juan\.html/.test(catalogoHtml) && /productos\/hiperico\.html/.test(catalogoHtml));
ok("catálogo estático anuncia el total actual", catalogoHtml.indexOf('"numberOfItems": ' + products.length) !== -1);

var fichaHiperico = read("productos/hiperico.html");
ok("ficha canónica de Hipérico existe", /<h1 id="ficha-title">Hipérico<\/h1>/.test(fichaHiperico));
ok("ficha de Hipérico incluye keywords", /name="keywords"[^>]*Hipérico/.test(fichaHiperico));
ok("ficha de Hipérico enlaza el catálogo canónico", /href="\/productos\/"/.test(fichaHiperico) && !/href="\.\.\/productos\.html"/.test(fichaHiperico));
ok("ficha de Hipérico versiona los estilos", /asset\/base\.css\?v=[0-9a-f]{8}/.test(fichaHiperico));
var redirect = read("productos/hierba-de-san-juan.html");
ok("redirect apunta a hiperico", /url=\.\/hiperico\.html/.test(redirect) && /location\.replace\(".\/hiperico\.html"\)/.test(redirect));
var sitemap = read("sitemap.xml");
ok("sitemap incluye hiperico", /\/productos\/hiperico\.html/.test(sitemap));
ok("sitemap excluye redirect", !/\/productos\/hierba-de-san-juan\.html/.test(sitemap));

var extrema = products.filter(function(p){ return p.toxicidad === "EXTREMA"; })[0];
var fichaExtrema = read("productos/" + extrema.slug + ".html");
ok("ficha EXTREMA muestra título de alerta", fichaExtrema.indexOf(extrema.alertaTitulo) !== -1);
ok("ficha EXTREMA usa clase de alerta", /class="alerta-toxica-extrema" role="alert"/.test(fichaExtrema));
ok("ficha EXTREMA no ofrece venta", !/data-add-cart=/.test(fichaExtrema));
ok("texto repetido eliminado", !/Ficha botánica informativa\. Sin stock para venta\./.test(canon.map(function(p){ return JSON.stringify(p); }).join("\n")));

console.log("\n" + "=".repeat(58));
console.log(passed + " ok, " + failed + " fallo(s)");
console.log("=".repeat(58));
process.exit(failed ? 1 : 0);
