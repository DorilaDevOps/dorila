"use strict";

/* =====================================================================
   DORILA — Smoke test del carrito.
   Corre cart.js y app.js dentro de un DOM mínimo y verifica el flujo real
   de "Agregar al carrito" en las fichas, la resincronización del carrito en
   index.html y los invariantes de las fichas generadas. Sin dependencias.

   Uso:  node tools/check-cart.js   (o: npm test)
   ===================================================================== */

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.resolve(__dirname, "..");
var PRODUCTS = require(path.join(ROOT, "js", "productos.js"));
var KEY = "dorila-cart";

var passed = 0;
var failed = 0;

function check(name, actual, expected){
  /* textContent recibe números en el código real (app.js asigna unidades,
     no strings), así que los primitivos se comparan como texto. */
  var deep = (actual && typeof actual === "object") || (expected && typeof expected === "object");
  var a = deep ? JSON.stringify(actual) : String(actual);
  var e = deep ? JSON.stringify(expected) : String(expected);
  if (a === e){ passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + "\n         esperado: " + e + "\n         actual:   " + a); }
}
function ok(name, cond){
  if (cond){ passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name); }
}

/* ---------------- Reloj controlable ---------------- */
function makeTimers(){
  var queue = [], seq = 0;
  return {
    setTimeout: function(fn, ms){ queue.push({ id: ++seq, fn: fn, ms: ms }); return seq; },
    clearTimeout: function(t){ queue = queue.filter(function(x){ return x.id !== t; }); },
    flush: function(){ var q = queue; queue = []; q.forEach(function(t){ t.fn(); }); },
    pending: function(){ return queue.length; }
  };
}

/* ---------------- DOM mínimo ---------------- */
function El(tag, id){
  var el = {
    tagName: tag || "div", id: id || "", className: "", hidden: false,
    value: "", src: "", alt: "", href: "", loading: "",
    textContent: "", innerHTML: "", priority: "", fetchpriority: "",
    dataset: {}, style: {}, attrs: {}, children: [], handlers: {}, sub: {},
    classes: {}
  };
  el.classList = {
    add: function(){ for (var i = 0; i < arguments.length; i++) el.classes[arguments[i]] = true; },
    remove: function(){ for (var i = 0; i < arguments.length; i++) delete el.classes[arguments[i]]; },
    contains: function(c){ return !!el.classes[c]; },
    toggle: function(c, f){ if (f === undefined) f = !el.classes[c]; if (f) el.classes[c] = true; else delete el.classes[c]; }
  };
  el.setAttribute = function(k, v){ el.attrs[k] = String(v); };
  el.getAttribute = function(k){ return (k in el.attrs) ? el.attrs[k] : null; };
  el.removeAttribute = function(k){ delete el.attrs[k]; };
  el.appendChild = function(c){ el.children.push(c); return c; };
  el.replaceChildren = function(){
    el.children = [];
    for (var i = 0; i < arguments.length; i++){
      var child = arguments[i];
      if (child && child.tagName === "#fragment") el.children = el.children.concat(child.children);
      else if (child) el.children.push(child);
    }
  };
  el.addEventListener = function(t, f){ (el.handlers[t] = el.handlers[t] || []).push(f); };
  el.removeEventListener = function(){};
  el.querySelector = function(sel){
    if (!el.sub[sel]) el.sub[sel] = El("div", sel);
    return el.sub[sel];
  };
  el.querySelectorAll = function(){ return []; };
  el.closest = function(){ return null; };
  el.scrollIntoView = function(){};
  el.focus = function(){};
  el.getBoundingClientRect = function(){ return {}; };
  return el;
}

function makeEnv(opts){
  opts = opts || {};
  var store = opts.store || {};
  var timers = makeTimers();
  var byId = {};
  var docHandlers = {};
  var winHandlers = {};

  var doc = {
    hidden: false,
    currentScript: { getAttribute: function(){ return opts.scriptSrc || "../js/cart.js"; } },
    body: El("body"), documentElement: El("html"), head: El("head"),
    getElementById: function(id){ if (!byId[id]) byId[id] = El("div", id); return byId[id]; },
    querySelector: function(sel){
      var m = /^[.#](.+)$/.exec(sel);
      return doc.getElementById(m ? m[1] : sel);
    },
    querySelectorAll: function(){ return []; },
    createElement: function(t){ return El(t); },
    createDocumentFragment: function(){ return El("#fragment"); },
    createTextNode: function(t){ return { nodeValue: t }; },
    addEventListener: function(t, f){ (docHandlers[t] = docHandlers[t] || []).push(f); },
    removeEventListener: function(){}
  };
  doc.byId = byId;
  doc.fire = function(t, ev){ (docHandlers[t] || []).forEach(function(f){ f(ev || {}); }); };

  var localStorage = {
    getItem: function(k){ return (k in store) ? store[k] : null; },
    setItem: function(k, v){ store[k] = String(v); },
    removeItem: function(k){ delete store[k]; }
  };

  var win = {
    location: { pathname: opts.pathname || "/productos/lavanda.html", search: opts.search || "" },
    localStorage: localStorage,
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    scrollY: 0, innerWidth: 1280, innerHeight: 800,
    addEventListener: function(t, f){ (winHandlers[t] = winHandlers[t] || []).push(f); },
    removeEventListener: function(){},
    scrollTo: function(){}, print: function(){}, dispatchEvent: function(){},
    Image: function(){ this.onload = null; },
    IntersectionObserver: function(){ this.observe = function(){}; this.unobserve = function(){}; this.disconnect = function(){}; }
  };
  win.fire = function(t, ev){ (winHandlers[t] || []).forEach(function(f){ f(ev || {}); }); };

  var ctx = {
    document: doc, window: win, localStorage: localStorage,
    sessionStorage: localStorage,
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    JSON: JSON, Math: Math, Date: Date, console: console,
    parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN,
    encodeURIComponent: encodeURIComponent, URLSearchParams: URLSearchParams,
    Number: Number, String: String, Object: Object, Array: Array, RegExp: RegExp, Error: Error,
    Image: win.Image, IntersectionObserver: win.IntersectionObserver
  };
  win.window = win; win.document = doc; win.globalThis = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);

  return {
    ctx: ctx, doc: doc, win: win, store: store, timers: timers, byId: byId,
    run: function(file){
      vm.runInContext(fs.readFileSync(path.join(ROOT, "js", file), "utf8"), ctx, { filename: file });
    },
    read: function(){ try { return JSON.parse(store[KEY] || "{}"); } catch (e){ return {}; } }
  };
}

/* Un botón "Agregar al carrito" como el que emite el generador. */
function makeAddBtn(id){
  var btn = El("button", "addBtn");
  btn.setAttribute("data-add-cart", id);
  btn.textContent = "Agregar al carrito";
  return btn;
}
function clickOn(doc, btn){
  doc.fire("click", { target: { closest: function(sel){ return sel === "[data-add-cart]" ? btn : null; } } });
}

/* =====================================================================
   1. Ficha de producto: agregar al carrito
   ===================================================================== */
console.log("\n1. Ficha (js/cart.js) — agregar al carrito");
(function(){
  var env = makeEnv({ scriptSrc: "../js/cart.js?v=19e68a1c", pathname: "/productos/lavanda.html" });
  env.run("productos.js");
  env.run("cart.js");

  var btn = makeAddBtn("DOR-ARO-012");
  var badge = env.doc.querySelector(".cart-btn").querySelector(".cart-count");
  check("badge arranca en 0", badge.textContent, "0");

  clickOn(env.doc, btn);
  check("badge sube a 1", badge.textContent, "1");
  check("guarda en localStorage", env.read(), { "DOR-ARO-012": 1 });
  check("boton muestra confirmacion", btn.textContent, "¡Agregado! ✓");
  ok("boton queda en is-success", btn.classList.contains("is-success"));

  env.timers.flush();
  check("el boton vuelve a su texto original", btn.textContent, "Agregar al carrito");
  ok("el boton sale de is-success", !btn.classList.contains("is-success"));

  check("aria-label del badge unificado", env.doc.querySelector(".cart-btn").getAttribute("aria-label"), "Carrito, 1 producto");

  check("el icono de carrito apunta al carrito abierto",
        env.doc.querySelector(".cart-btn").href, "../index.html?open-cart=1");
})();

/* =====================================================================
   2. Regresión: el botón no puede quedar pegado en "¡Agregado! ✓"
   ===================================================================== */
console.log("\n2. Ficha — el boton nunca queda pegado (varios clics seguidos)");
(function(){
  var env = makeEnv({ scriptSrc: "../js/cart.js?v=1" });
  env.run("productos.js");
  env.run("cart.js");

  var btn = makeAddBtn("DOR-ARO-012");
  clickOn(env.doc, btn);
  clickOn(env.doc, btn);
  clickOn(env.doc, btn);
  check("tres clics = 3 unidades", env.read(), { "DOR-ARO-012": 3 });

  env.timers.flush();
  check("vuelve a 'Agregar al carrito' (bug anterior: quedaba en '¡Agregado! ✓')",
        btn.textContent, "Agregar al carrito");

  clickOn(env.doc, btn);
  check("y sigue agregando despues de resetear", env.read(), { "DOR-ARO-012": 4 });
})();

/* =====================================================================
   3. Regresión: sin DORILA_PRODUCTS el clic no puede fallar en silencio
   ===================================================================== */
console.log("\n3. Ficha — el clic nunca se descarta en silencio");
(function(){
  var env = makeEnv({ scriptSrc: "../js/cart.js" });
  env.run("cart.js");   // sin productos.js a propósito

  var btn = makeAddBtn("DOR-ARO-012");
  clickOn(env.doc, btn);
  check("agrega igual sin catalogo cargado", env.read(), { "DOR-ARO-012": 1 });
  check("y da feedback visual", btn.textContent, "¡Agregado! ✓");
})();

/* =====================================================================
   3b. Regresión: EXTREMA y sin stock nunca entran al carrito
   ===================================================================== */
console.log("\n3b. Ficha — carrito rechaza ids no vendibles");
(function(){
  var env = makeEnv({
    scriptSrc: "../js/cart.js",
    store: (function(){
      var s = {};
      s[KEY] = JSON.stringify({ "DOR-TRA-020": 2, "DOR-TRA-001": 1, "DOR-ARO-012": 1 });
      return s;
    })()
  });
  env.run("productos.js");
  env.run("cart.js");

  check("sanitize elimina EXTREMA y sin stock", env.read(), { "DOR-ARO-012": 1 });

  var extrema = makeAddBtn("DOR-TRA-020");
  clickOn(env.doc, extrema);
  check("clic en EXTREMA no agrega", env.read(), { "DOR-ARO-012": 1 });
  check("EXTREMA no recibe feedback de agregado", extrema.textContent, "Agregar al carrito");

  var sinStock = makeAddBtn("DOR-TRA-001");
  clickOn(env.doc, sinStock);
  check("clic en sin stock no agrega", env.read(), { "DOR-ARO-012": 1 });
  check("sin stock no recibe feedback de agregado", sinStock.textContent, "Agregar al carrito");
})();

/* =====================================================================
   4. Ficha: la ruta raíz sobrevive al ?v= de cache-busting
   ===================================================================== */
console.log("\n4. Ficha — la ruta raiz se deduce bien con ?v=");
(function(){
  var conQuery = makeEnv({ scriptSrc: "../js/cart.js?v=abcdef12" });
  conQuery.run("cart.js");
  check("subcarpeta con ?v=", conQuery.doc.querySelector(".cart-btn").href, "../index.html?open-cart=1");

  var sinQuery = makeEnv({ scriptSrc: "js/cart.js", pathname: "/index.html" });
  sinQuery.run("cart.js");
  check("en el index no reescribe el href (ya abre el carrito)", sinQuery.doc.querySelector(".cart-btn").href, "");
})();

/* =====================================================================
   5. index.html: el carrito se resincroniza
   ===================================================================== */
console.log("\n5. index (js/app.js) — resincronizacion del carrito");
(function(){
  var env = makeEnv({
    pathname: "/index.html", search: "?open-cart=1",
    store: (function(){ var s = {}; s[KEY] = '{"DOR-DIG-013":2,"ghost-999":5}'; return s; })()
  });
  env.run("productos.js");
  env.run("cart.js");
  env.run("app.js");

  check("lee el carrito que dejo la ficha", env.read(), { "DOR-DIG-013": 2 });
  check("badge con 2 unidades", env.byId.cartCount.textContent, "2");
  check("el carrito abierto suma 2", env.byId.cartItemCount.textContent, "2");
  check("subtotal de 2 manzanillas", env.byId.cartSubtotal.textContent, "$360");

  function clickCartBtn(){ (env.byId.cartBtn.handlers.click || []).forEach(function(f){ f({ target: env.byId.cartBtn }); }); }

  /* Otra pestaña agrega: bfcache / storage / visibilitychange */
  env.store[KEY] = '{"DOR-DIG-056":3}';
  env.win.fire("pageshow");
  check("pageshow (atras/adelante) lee el cambio externo", env.byId.cartCount.textContent, "3");

  env.store[KEY] = '{"DOR-DIG-056":3,"DOR-TRA-005":1}';
  env.win.fire("storage", { key: KEY });
  check("storage (otra pestana) lee el cambio externo", env.byId.cartCount.textContent, "4");

  env.store[KEY] = '{"DOR-DIG-056":7}';
  env.doc.hidden = false;
  env.doc.fire("visibilitychange");
  check("visibilitychange (volver al tab) lee el cambio externo", env.byId.cartCount.textContent, "7");

  /* Al abrir el carrito tiene que re-leer, no mostrar la copia vieja */
  env.store[KEY] = '{"DOR-DIG-056":7,"DOR-DIG-010":2}';
  clickCartBtn();
  check("abrir el carrito re-lee localStorage", env.byId.cartItemCount.textContent, "9");
  check("el drawer queda abierto", env.byId.cartPage.classList.contains("is-open"), true);
})();

/* =====================================================================
   6. Invariantes de las fichas generadas
   ===================================================================== */
console.log("\n6. Fichas generadas — catálogo, carrito y seguridad");
(function(){
  var dir = path.join(ROOT, "productos");
  var REDIRECTS = { "hierba-de-san-juan.html": "hiperico.html" };
  var files = fs.readdirSync(dir).filter(function(f){ return /\.html$/.test(f); });
  var fichas = files.filter(function(f){ return !REDIRECTS[f]; });
  var byId = {}, byFile = {};
  PRODUCTS.forEach(function(p){ byId[p.id] = p; byFile[p.slug + ".html"] = p; });

  check("generadas " + PRODUCTS.length + " fichas", fichas.length, PRODUCTS.length);

  var sinProducto = [], sinBoton = [], botonInvalido = [], idInvalido = [];
  var sinCartJs = [], sinVersion = [], tokens = [], sinAlertaExtrema = [];
  var usosExtrema = [], relatedExtrema = [], sinDisabled = [];

  fichas.forEach(function(f){
    var html = fs.readFileSync(path.join(dir, f), "utf8");
    var p = byFile[f];
    if (!p){ sinProducto.push(f); return; }

    var m = /data-add-cart="([^"]+)"/.exec(html);
    if (p.vendible){
      if (!m) sinBoton.push(f);
      else if (m[1] !== p.id) idInvalido.push(f + " -> " + m[1]);
    } else {
      if (m) botonInvalido.push(f + " -> " + m[1]);
      if (!/class="btn btn-disabled"[^>]*disabled/.test(html)) sinDisabled.push(f);
    }
    if (m && !byId[m[1]]) idInvalido.push(f + " -> " + m[1]);

    if (p.toxicidad === "EXTREMA"){
      if (!/class="alerta-toxica-extrema"/.test(html)) sinAlertaExtrema.push(f);
      if (/Usos tradicionales registrados|Preparación tradicional/.test(html)) usosExtrema.push(f);
    }

    if (!/<script src="\.\.\/js\/cart\.js\?v=[0-9a-f]{8}"/.test(html)) sinVersion.push(f);
    if (!/js\/cart\.js/.test(html)) sinCartJs.push(f);
    if (/\{\{[A-Z0-9_]+\}\}/.test(html)) tokens.push(f);

    var relatedIndex = html.indexOf('<section class="related wrap"');
    if (relatedIndex !== -1){
      var links = html.slice(relatedIndex).match(/href="([^"]+\.html)"/g) || [];
      links.forEach(function(link){
        var slug = /href="([^"]+)\.html"/.exec(link)[1];
        var related = byFile[slug + ".html"];
        if (related && related.toxicidad === "EXTREMA") relatedExtrema.push(f + " -> " + slug);
      });
    }
  });

  check("todas las fichas corresponden al catálogo", sinProducto, []);
  check("vendibles con boton data-add-cart", sinBoton, []);
  check("no vendibles sin boton de carrito", botonInvalido, []);
  check("ids de carrito validos", idInvalido, []);
  check("no vendibles con CTA deshabilitado", sinDisabled, []);
  check("EXTREMA con alerta roja", sinAlertaExtrema, []);
  check("EXTREMA sin usos ni preparacion", usosExtrema, []);
  check("relacionados nunca son EXTREMA", relatedExtrema, []);
  check("todas cargan js/cart.js", sinCartJs, []);
  check("todas con ?v= de cache-busting", sinVersion, []);
  check("ningun token sin reemplazar", tokens, []);
  var redirectHtml = fs.readFileSync(path.join(dir, "hierba-de-san-juan.html"), "utf8");
  ok("redirect histórico apunta a hiperico",
    /url=\.\/hiperico\.html/.test(redirectHtml) && /location\.replace\(".\/hiperico\.html"\)/.test(redirectHtml));

  var index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  ok("index.html carga js/cart.js con ?v=", /<script src="js\/cart\.js\?v=[0-9a-f]{8}"/.test(index));
  ok("index.html carga js/app.js con ?v=", /<script src="js\/app\.js\?v=[0-9a-f]{8}"/.test(index));
  ok("index.html carga CSS con ?v=", /<link rel="stylesheet" href="asset\/base\.css\?v=[0-9a-f]{8}"/.test(index));

  var catalogo = fs.readFileSync(path.join(ROOT, "productos.html"), "utf8");
  var itemListAt = catalogo.indexOf('"@type": "ItemList"');
  var itemList = itemListAt === -1 ? "" : catalogo.slice(itemListAt, catalogo.indexOf("</script>", itemListAt));
  check("productos.html anuncia el total del catálogo",
    Number((/"numberOfItems":\s*(\d+)/.exec(catalogo) || [0, -1])[1]), PRODUCTS.length);
  check("indice estatico con todas las fichas",
    (catalogo.match(/href="productos\/[^"]+\.html"/g) || []).length, PRODUCTS.length);
  check("JSON-LD ItemList con todos los productos",
    (itemList.match(/"@type": "ListItem"/g) || []).length, PRODUCTS.length);
  ok("productos.html sin tokens", !/\{\{[A-Z0-9_]+\}\}/.test(catalogo));
  ok("catalogo tiene productos vendibles", PRODUCTS.some(function(p){ return p.vendible; }));
  check("EXTREMA nunca es vendible",
    PRODUCTS.filter(function(p){ return p.toxicidad === "EXTREMA" && p.vendible; }), []);
})();

/* =====================================================================
   Resultado
   ===================================================================== */
console.log("\n" + "=".repeat(58));
console.log(passed + " ok, " + failed + " fallo(s)");
console.log("=".repeat(58));
process.exit(failed ? 1 : 0);
