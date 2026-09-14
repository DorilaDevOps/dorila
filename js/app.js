/* ===========================================================
   DORILA — app.js
   Lógica específica de la página principal: renderizado de
   productos, filtros, modal de planta, carrito, verificación,
   orden de compra y formulario de contacto.
   Cargar en index.html después de productos.js y cart.js.
   =========================================================== */
(function(){
  "use strict";

  /* --- 1. DATOS --- */
  var PRODUCTS = window.DORILA_PRODUCTS || [];

  /* --- 2. IMÁGENES lazy --- */
  function buildLazyImg(fullUrl, alt){
    var thumb = fullUrl.replace(/\.webp$/, "-thumb.webp");
    var img = document.createElement("img");
    img.className = "lazy-img";
    img.src = thumb;
    img.setAttribute("data-src", fullUrl);
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.fetchpriority = "low";
    img.width = 600; img.height = 600;
    return img;
  }
  function mediaLoad(img){
    var full = img.getAttribute("data-src");
    if (!full) return;
    var loader = new Image();
    loader.onload = function(){ img.src = full; img.classList.add("is-loaded"); };
    loader.src = full;
    img.removeAttribute("data-src");
  }
  var lazyObserver = null;
  if ("IntersectionObserver" in window){
    lazyObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        mediaLoad(entry.target);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "200px 0px" });
  }
  function initLazyLoading(){
    document.querySelectorAll("img[data-src]").forEach(function(img){
      if (lazyObserver) lazyObserver.observe(img); else mediaLoad(img);
    });
  }

  /* --- 3. MODAL DE PLANTA --- */
  function setModalMedia(p){
    var img = document.getElementById("modalImg");
    img.className = "lazy-img";
    img.alt = p.name;
    img.setAttribute("data-src", p.img);
    mediaLoad(img);

    var btn  = document.getElementById("modalImg2Btn");
    var thumb = document.getElementById("modalImg2");
    if (btn && thumb && p.img2){
      btn.hidden = false;
      thumb.src = p.img2.replace(/\.webp$/, "-thumb.webp");
      thumb.alt = p.name + ", segunda imagen";
      btn.dataset.img   = p.img2;
      btn.dataset.other = p.img;
    } else if (btn){
      btn.hidden = true;
    }
  }

  (function(){
    var btn = document.getElementById("modalImg2Btn");
    if (!btn) return;
    btn.addEventListener("click", function(){
      var main = document.getElementById("modalImg");
      var cur  = main.getAttribute("data-src") || btn.dataset.other;
      var next = cur === btn.dataset.img ? btn.dataset.other : btn.dataset.img;
      main.className = "";
      main.src = next;
      main.setAttribute("data-src", next);
      main.alt = btn.dataset.other ? btn.getAttribute("aria-label") : main.alt;
    });
  })();

  /* --- 4. RENDERIZADO Y FILTROS --- */
  var grid         = document.getElementById("productGrid");
  var cartCountEl  = document.getElementById("cartCount");
  var cartBtn      = document.getElementById("cartBtn");

  /* Grupos de categorías: "Todas" + 2 agrupaciones */
  var GROUP_DEFS = [
    { key: "herbolaria", label: "Herbolaria", cats: ["descanso","digestivo","tratamientos","aromaterapia","aceites","masajes","unguentos","tinturas"] },
    { key: "cosmetica",  label: "Cosm\u00E9tica",  cats: ["belleza","cremas","jabones","locion"] }
  ];
  var GROUP_CATS = {};
  var GROUP_LOOKUP = {};
  GROUP_DEFS.forEach(function(g){
    GROUP_CATS[g.key] = g.cats;
    g.cats.forEach(function(c){ GROUP_LOOKUP[c] = g.key; });
  });
  function groupFor(cat){ return cat ? (GROUP_LOOKUP[cat] || cat) : ""; }

  function slugify(text){
    return String(text).toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function cardForProduct(p){
    var slug = slugify(p.name);
    var card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = p.id;
    card.dataset.category = p.category;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", p.name + ", más información");

    var media = document.createElement("div");
    media.className = "product-media";
    media.appendChild(buildLazyImg(p.img, p.name + ", hierba medicinal de DORILA"));

    var body = document.createElement("div");
    body.className = "product-body";
    body.innerHTML =
      "<h3>" + p.name + "</h3>" +
      "<p>" + p.desc + "</p>" +
      "<div class=\"product-footer\">" +
        "<span class=\"product-price\">" + p.price + "</span>" +
        "<button class=\"add-btn\" type=\"button\" aria-label=\"Agregar " + p.name + " al carrito\">" +
          "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 5v14M5 12h14\"/></svg>" +
        "</button>" +
      "</div>" +
      "<a class=\"card-link\" href=\"productos/" + slug + ".html\">Ver ficha completa</a>";

    body.querySelector(".add-btn").addEventListener("click", function(e){
      e.stopPropagation();
      addToCart(p.id);
      this.innerHTML = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 6L9 17l-5-5\"/></svg>";
      var self = this;
      setTimeout(function(){
        self.innerHTML = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 5v14M5 12h14\"/></svg>";
      }, 1200);
    });

    var cardLink = body.querySelector(".card-link");
    if (cardLink) cardLink.addEventListener("click", function(e){ e.stopPropagation(); });

    function openModal(){
      var modal = document.getElementById("plantModal");
      setModalMedia(p);
      document.getElementById("modalId").textContent = p.id;
      document.getElementById("plantModalName").textContent = p.name;
      document.getElementById("modalScientific").textContent = p.scientific;
      document.getElementById("modalDesc").textContent = p.desc;
      var propsList = document.getElementById("modalProps");
      propsList.innerHTML = "";
      p.props.forEach(function(prop){
        var li = document.createElement("li");
        li.innerHTML = "<svg aria-hidden=\"true\" focusable=\"false\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 6L9 17l-5-5\"/></svg>";
        li.appendChild(document.createTextNode(" " + prop));
        propsList.appendChild(li);
      });
      var moreLink = document.getElementById("modalMoreLink");
      if (moreLink) moreLink.href = "productos/" + slugify(p.name) + ".html";
      var waLink = document.getElementById("modalWaLink");
      if (waLink) waLink.href = "https://wa.me/59894872605?text=" + encodeURIComponent("Hola DORILA, quiero pedir " + p.name + " (" + p.id + ")");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    card.addEventListener("click", openModal);
    card.addEventListener("keydown", function(e){
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); }
    });

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function render(){
    var q  = (document.getElementById("searchInput").value || "").trim().toLowerCase();
    var activeCat = document.querySelector(".filter-btn.is-active");
    var cat = activeCat ? activeCat.dataset.category : "";
    var groupCats = cat ? GROUP_CATS[cat] : null;

    var list = PRODUCTS.filter(function(p){
      var matchesCat = !cat || (groupCats ? groupCats.indexOf(p.category) !== -1 : p.category === cat);
      var haystack   = (p.name + " " + p.scientific + " " + p.category + " " + p.desc + " " + p.props.join(" ")).toLowerCase();
      var matchesQ   = !q || haystack.indexOf(q) !== -1;
      return matchesCat && matchesQ;
    });

    grid.innerHTML = "";
    list.forEach(function(p){ grid.appendChild(cardForProduct(p)); });
    document.getElementById("productCount").textContent = list.length + " hierba" + (list.length === 1 ? "" : "s") + " encontrada" + (list.length === 1 ? "" : "s");
    document.getElementById("productEmpty").hidden = list.length > 0;
    initLazyLoading();
  }

  /* Filtros por grupo */
  var filtersWrap = document.getElementById("productFilters");
  var allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "filter-btn is-active";
  allBtn.dataset.category = "";
  allBtn.textContent = "Todas";
  allBtn.addEventListener("click", function(){
    filtersWrap.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.remove("is-active"); });
    allBtn.classList.add("is-active");
    render();
  });
  filtersWrap.appendChild(allBtn);

  GROUP_DEFS.forEach(function(g){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn";
    btn.dataset.category = g.key;
    btn.textContent = g.label;
    btn.addEventListener("click", function(){
      filtersWrap.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      render();
    });
    filtersWrap.appendChild(btn);
  });

  /* Tarjetas de categoría en el hero */
  document.querySelectorAll(".category-card[data-category]").forEach(function(card){
    card.addEventListener("click", function(){
      var g = groupFor(card.dataset.category);
      filtersWrap.querySelectorAll(".filter-btn").forEach(function(b){
        b.classList.toggle("is-active", b.dataset.category === g);
      });
      render();
      document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
    });
  });

  /* Buscador inline */
  var searchInput = document.getElementById("searchInput");
  var searchClear = document.getElementById("searchClear");
  searchInput.addEventListener("input", function(){
    searchClear.classList.toggle("is-visible", searchInput.value.length > 0);
    render();
  });
  searchClear.addEventListener("click", function(){
    searchInput.value = "";
    searchClear.classList.remove("is-visible");
    render();
    searchInput.focus();
  });

  /* Modal: cerrar */
  var modal = document.getElementById("plantModal");
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.querySelectorAll("[data-close-modal]").forEach(function(el){
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* --- 5. CARRITO --- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem("dorila-cart") || "{}") || {}; } catch (err) { cart = {}; }

  function findProduct(id){
    for (var i = 0; i < PRODUCTS.length; i++){ if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
    return null;
  }
  function priceOf(p){ return parseInt(p.price.replace(/[^0-9]/g, ""), 10) || 0; }
  function cartTotalUnits(){
    var n = 0; for (var k in cart) n += cart[k]; return n;
  }
  function saveCart(){
    try { localStorage.setItem("dorila-cart", JSON.stringify(cart)); } catch (err) {}
  }
  function updateBadge(){
    var n = cartTotalUnits();
    cartCountEl.textContent = n;
    cartBtn.setAttribute("aria-label", "Carrito, " + n + " producto" + (n === 1 ? "" : "s"));
  }
  function addToCart(id){ cart[id] = (cart[id] || 0) + 1; saveCart(); updateBadge(); renderCart(); }
  function changeQty(id, delta){
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart(); updateBadge(); renderCart();
  }

  var cartPage     = document.getElementById("cartPage");
  var cartList     = document.getElementById("cartList");
  var cartEmpty    = document.getElementById("cartEmpty");
  var cartItemCountEl = document.getElementById("cartItemCount");
  var cartSubtotalEl  = document.getElementById("cartSubtotal");

  function openCart(){ renderCart(); cartPage.classList.add("is-open"); cartPage.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden"; }
  function closeCart(){ cartPage.classList.remove("is-open"); cartPage.setAttribute("aria-hidden","true"); document.body.style.overflow = ""; }

  cartBtn.addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartPage.querySelectorAll("[data-cart-go-shop]").forEach(function(el){
    el.addEventListener("click", function(){ closeCart(); document.getElementById("productos").scrollIntoView({ behavior: "smooth" }); });
  });
  cartPage.addEventListener("click", function(e){ if (e.target === cartPage) closeCart(); });

  function renderCart(){
    var ids = Object.keys(cart);
    var hasItems = ids.length > 0;
    cartEmpty.hidden = hasItems;
    cartList.hidden  = !hasItems;
    cartList.innerHTML = "";
    var units = 0, total = 0;
    ids.forEach(function(id){
      var p = findProduct(id); if (!p) return;
      var qty = cart[id], line = priceOf(p) * qty;
      units += qty; total += line;
      var row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML =
        '<img class="cart-item-img" src="' + p.img + '" alt="' + p.name + '">' +
        '<div class="cart-item-info"><h3>' + p.name + '</h3><p>' + p.price + ' c/u</p>' +
          '<div class="cart-qty">' +
            '<button type="button" data-act="dec" aria-label="Quitar uno de ' + p.name + '">&minus;</button>' +
            '<span aria-live="polite">' + qty + '</span>' +
            '<button type="button" data-act="inc" aria-label="Agregar uno de ' + p.name + '">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item-side">' +
          '<strong>$' + line + '</strong>' +
          '<button type="button" data-act="del" aria-label="Quitar ' + p.name + ' del carrito">Eliminar</button>' +
        '</div>';
      row.querySelector('[data-act="inc"]').addEventListener("click", function(){ addToCart(id); });
      row.querySelector('[data-act="dec"]').addEventListener("click", function(){ changeQty(id, -1); });
      row.querySelector('[data-act="del"]').addEventListener("click", function(){ changeQty(id, -999); });
      cartList.appendChild(row);
    });
    cartItemCountEl.textContent = units;
    cartSubtotalEl.textContent  = "$" + total;
  }

  /* Verificación */
  var verifyModal = document.getElementById("verifyModal");
  var orderModal  = document.getElementById("orderModal");

  function renderVerify(){
    var total = 0, list = document.getElementById("verifyList");
    list.innerHTML = "";
    Object.keys(cart).forEach(function(id){
      var p = findProduct(id); if (!p) return;
      var qty = cart[id], line = priceOf(p) * qty; total += line;
      var li = document.createElement("li");
      var name = document.createElement("span"); name.textContent = p.name + " \u00D7 " + qty;
      var price = document.createElement("strong"); price.textContent = "$" + line;
      li.appendChild(name); li.appendChild(price); list.appendChild(li);
    });
    document.getElementById("verifyTotal").textContent = "$" + total;
  }
  function openVerify(){ if (cartTotalUnits() === 0) return; renderVerify(); verifyModal.classList.add("is-open"); verifyModal.setAttribute("aria-hidden","false"); }
  function closeVerify(){ verifyModal.classList.remove("is-open"); verifyModal.setAttribute("aria-hidden","true"); }
  document.getElementById("cartCheckout").addEventListener("click", openVerify);
  verifyModal.querySelectorAll("[data-verify-close]").forEach(function(el){ el.addEventListener("click", closeVerify); });

  /* Orden */
  function pad2(n){ return (n < 10 ? "0" : "") + n; }
  function generateOrder(){
    var now = new Date();
    var num = "DOR-" + now.getFullYear() + pad2(now.getMonth()+1) + pad2(now.getDate()) + "-" + (Math.floor(Math.random()*9000)+1000);
    document.getElementById("orderNumber").textContent = num;
    document.getElementById("orderDate").textContent   = now.toLocaleDateString("es-UY",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    var items = document.getElementById("orderItems"); items.innerHTML = "";
    var total = 0, lines = [];
    Object.keys(cart).forEach(function(id){
      var p = findProduct(id); if (!p) return;
      var qty = cart[id], line = priceOf(p)*qty; total += line;
      var li = document.createElement("li");
      var name = document.createElement("span"); name.className="item-name"; name.textContent = p.name+" \u00D7 "+qty;
      var price = document.createElement("strong"); price.textContent = "$"+line;
      li.appendChild(name); li.appendChild(price); items.appendChild(li);
      lines.push(p.name+" x"+qty+" ($"+line+")");
    });
    document.getElementById("orderTotal").textContent = "$"+total;
    document.getElementById("orderWa").href = "https://wa.me/59894872605?text=" + encodeURIComponent("Hola DORILA, quiero confirmar mi orden "+num+".\n"+lines.join("\n")+"\nTotal: $"+total);
    closeVerify(); orderModal.classList.add("is-open"); orderModal.setAttribute("aria-hidden","false");
  }
  function closeOrder(){ orderModal.classList.remove("is-open"); orderModal.setAttribute("aria-hidden","true"); }
  function finishOrder(){ closeOrder(); cart={}; saveCart(); updateBadge(); renderCart(); closeCart(); }
  document.getElementById("verifyConfirm").addEventListener("click", generateOrder);
  document.getElementById("orderPrint").addEventListener("click", function(){ window.print(); });
  document.getElementById("orderDone").addEventListener("click", finishOrder);
  orderModal.querySelectorAll("[data-order-close]").forEach(function(el){ el.addEventListener("click", closeOrder); });

  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (orderModal.classList.contains("is-open")) closeOrder();
    else if (verifyModal.classList.contains("is-open")) closeVerify();
    else if (cartPage.classList.contains("is-open")) closeCart();
  });

  Object.keys(cart).forEach(function(id){ if (!findProduct(id)) delete cart[id]; });
  saveCart(); updateBadge(); renderCart();
  if (new URLSearchParams(window.location.search).get("open-cart") === "1") openCart();
  render();

  /* --- 6. FILTROS DESDE NAV --- */
  function applyCategoryFilter(cat){
    if (!filtersWrap) return;
    var g = groupFor(cat);
    filtersWrap.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.toggle("is-active", b.dataset.category === g); });
    render();
    var prods = document.getElementById("productos");
    if (prods) prods.scrollIntoView({ behavior: "smooth" });
    /* cerrar menú móvil si está abierto */
    var nm = document.getElementById("navMobile");
    if (nm && nm.classList.contains("is-open")){
      nm.classList.remove("is-open");
      var sc = document.getElementById("scrim");
      var mt = document.getElementById("menuToggle");
      if (sc) sc.classList.remove("is-open");
      if (mt){ mt.setAttribute("aria-expanded","false"); mt.setAttribute("aria-label","Abrir men\u00fa"); }
      document.body.style.overflow = "";
    }
  }
  document.querySelectorAll(".nav-desktop .dropdown a[data-cat]").forEach(function(a){
    a.addEventListener("click", function(e){
      e.preventDefault();
      applyCategoryFilter(a.dataset.cat);
      var parent = a.closest("li.has-menu");
      if (parent) parent.classList.remove("is-open");
    });
  });
  var mobileCatList = document.getElementById("mobileCatList");
  if (mobileCatList){
    mobileCatList.querySelectorAll("a[data-cat]").forEach(function(a){
      a.addEventListener("click", function(e){ e.preventDefault(); applyCategoryFilter(a.dataset.cat); });
    });
  }

  /* --- 7. SEMILLERÍA DESDE BUSCADOR OVERLAY (sessionStorage) --- */
  var storedQ = sessionStorage.getItem("dorila-search");
  if (storedQ){
    searchInput.value = storedQ;
    searchClear.classList.add("is-visible");
    render();
    sessionStorage.removeItem("dorila-search");
    document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
  }

})();