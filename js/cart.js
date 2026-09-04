/* =====================================================================
   DORILA — Carrito compartido.
   Muestra el badge del carrito en cualquier página, limpia ids huérfanos
   y desde páginas que no son el index redirige al carrito abierto.

   Cargar antes de </body>, DESPUÉS de js/productos.js:
     <script src="js/productos.js"></script>
     <script src="js/cart.js"></script>
   En fichas (subcarpeta productos/):
     <script src="../js/productos.js"></script>
     <script src="../js/cart.js"></script>
   La ruta raíz se deduce del propio src de este script.
   ===================================================================== */
(function(){
  "use strict";

  var src = "";
  if (document.currentScript){ src = document.currentScript.getAttribute("src") || ""; }
  var segments = src.split("/");
  segments.pop();
  var jsDir = segments.join("/") + "/";
  var root = jsDir.replace(/(^|\/)js\/?$/, "$1");

  var path = window.location.pathname.replace(/\/+$/, "");
  var basename = path.split("/").pop();
  var isIndex = path === "" || basename === "index.html" || basename === "";

  function readCart(){
    try {
      var data = JSON.parse(window.localStorage.getItem("dorila-cart") || "{}");
      return data && typeof data === "object" ? data : {};
    } catch (err) { return {}; }
  }

  function totalUnits(cart){
    var n = 0;
    for (var k in cart) n += cart[k];
    return n;
  }

  function sanitize(cart){
    var products = window.DORILA_PRODUCTS;
    if (!products || !products.length) return cart;
    var clean = {};
    products.forEach(function(p){
      if (cart[p.id]) clean[p.id] = cart[p.id];
    });
    return clean;
  }

  var cart = sanitize(readCart());
  try { window.localStorage.setItem("dorila-cart", JSON.stringify(cart)); } catch (err) {}

  function updateBadge(){
    var count = totalUnits(cart);
    var btn = document.querySelector(".cart-btn");
    if (!btn) return;
    var badge = btn.querySelector(".cart-count");
    if (!badge){
      badge = document.createElement("span");
      badge.className = "cart-count";
      badge.setAttribute("aria-hidden", "true");
      btn.appendChild(badge);
    }
    badge.textContent = count;
    btn.setAttribute("aria-label", "Ver carrito de compras, " + count + " producto" + (count === 1 ? "" : "s"));
  }

  function injectStyleIfNeeded(){
    var hasRule = Array.prototype.some.call(document.querySelectorAll("style"), function(s){
      return /\bcart-count\b/.test(s.textContent);
    });
    if (hasRule) return;
    var style = document.createElement("style");
    style.textContent =
      ".cart-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;}" +
      ".cart-count{position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 4px;" +
      "border-radius:999px;background:#7A3419;color:#fff;font-size:11px;font-weight:800;" +
      "line-height:18px;text-align:center;}";
    document.head.appendChild(style);
  }

  function wire(){
    var btn = document.querySelector(".cart-btn");
    if (!btn) return;
    if (!isIndex){
      btn.href = root + "index.html?open-cart=1";
    }
  }

  injectStyleIfNeeded();
  updateBadge();
  wire();

  window.addEventListener("storage", function(e){
    if (e.key && e.key !== "dorila-cart") return;
    cart = sanitize(readCart());
    updateBadge();
  });

  window.addEventListener("pageshow", function(){
    cart = sanitize(readCart());
    updateBadge();
  });
})();