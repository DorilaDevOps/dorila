/* =====================================================================
   DORILA — Carrito compartido.
   Muestra el badge del carrito en cualquier página, limpia ids huérfanos
   y desde páginas que no son el index redirige al carrito abierto.

   Cargar antes de </body>, DESPUÉS de js/productos.js:
     <script src="js/productos.js?v=1"></script>
     <script src="js/cart.js?v=1"></script>
   En fichas (subcarpeta productos/):
     <script src="../js/productos.js?v=1"></script>
     <script src="../js/cart.js?v=1"></script>
   El ?v= lo escribe tools/generate.js; la ruta raíz se deduce del propio
   src de este script.
   ===================================================================== */
(function(){
  "use strict";

  var src = "";
  if (document.currentScript){ src = document.currentScript.getAttribute("src") || ""; }
  src = src.split("?")[0].split("#")[0];
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

  function maxQty(p){
    if (!p || p.stock === undefined || p.stock === null || p.stock === "") return Infinity;
    var n = parseInt(p.stock, 10);
    return isNaN(n) ? Infinity : Math.max(0, n);
  }

  function sanitize(cart){
    var products = window.DORILA_PRODUCTS;
    if (!products || !products.length) return cart;
    var clean = {};
    products.forEach(function(p){
      var n = parseInt(cart[p.id], 10);
      var top = maxQty(p);
      if (p.vendible && n > 0 && top > 0) clean[p.id] = Math.min(n, top);
    });
    return clean;
  }

  var ADD_LABEL = "Agregar al carrito";
  var cart = sanitize(readCart());
  var feedbackTimer = null;
  var feedbackBtn = null;
  try { window.localStorage.setItem("dorila-cart", JSON.stringify(cart)); } catch (err) {}

  function cartAriaLabel(count){
    return "Carrito, " + count + " producto" + (count === 1 ? "" : "s");
  }

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
    btn.setAttribute("aria-label", cartAriaLabel(count));
  }

  function wire(){
    var btn = document.querySelector(".cart-btn");
    if (!btn) return;
    if (!isIndex){
      btn.href = root + "index.html?open-cart=1";
    }
  }

  updateBadge();
  wire();

  function resetFeedback(){
    if (!feedbackBtn) return;
    feedbackBtn.classList.remove("is-success");
    feedbackBtn.textContent = ADD_LABEL;
    feedbackBtn = null;
  }

  function showFeedback(btn){
    if (feedbackTimer){ clearTimeout(feedbackTimer); feedbackTimer = null; }
    if (feedbackBtn && feedbackBtn !== btn) resetFeedback();
    feedbackBtn = btn;
    btn.classList.add("is-success");
    btn.textContent = "¡Agregado! ✓";
    feedbackTimer = setTimeout(function(){
      feedbackTimer = null;
      resetFeedback();
    }, 1400);
  }

  document.addEventListener("click", function(e){
    var btn = e.target && e.target.closest ? e.target.closest("[data-add-cart]") : null;
    if (!btn) return;
    var id = btn.getAttribute("data-add-cart");
    if (!id) return;
    /* El id lo emite tools/generate.js desde js/productos.js, la misma fuente de
       verdad. Si DORILA_PRODUCTS aún no cargó se acepta igual: abortar en silencio
       dejaba el botón sin ningún feedback. */
    var products = window.DORILA_PRODUCTS;
    var top = Infinity;
    if (products && products.length){
      var found = products.filter(function(p){ return p.id === id; })[0];
      if (!found || !found.vendible) return;
      top = maxQty(found);
      if (top <= 0) return;
    }
    cart[id] = Math.min((cart[id] || 0) + 1, top);
    try { window.localStorage.setItem("dorila-cart", JSON.stringify(cart)); } catch (err) {}
    updateBadge();
    showFeedback(btn);
  });

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