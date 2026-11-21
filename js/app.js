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
  var PRODUCT_BY_SLUG = {};
  PRODUCTS.forEach(function(p){ PRODUCT_BY_SLUG[p.slug] = p; });

  function hasStock(p){
    return !!p && !!p.vendible && Number(p.stock) > 0;
  }

  function maxQty(p){
    if (!p || p.stock === undefined || p.stock === null || p.stock === "") return Infinity;
    var n = parseInt(p.stock, 10);
    return isNaN(n) ? Infinity : Math.max(0, n);
  }

  function capQty(id, n){
    return Math.max(0, Math.min(n, maxQty(findProduct(id))));
  }

  function setText(id, value){
    var el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }

  function slugify(texto){
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function debounce(fn, wait){
    var timer = null;
    return function(){
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function(){ fn.apply(context, args); }, wait);
    };
  }

  function siteUrl(src){
    var value = String(src || "");
    if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(value)) return value;
    return "/" + value;
  }

  function setDeepLinkCanonical(slug){
    var p = PRODUCT_BY_SLUG[slug];
    if (!p) return;
    var link = document.querySelector('link[rel="canonical"]');
    if (link) link.href = window.location.origin + "/productos/" + p.slug + ".html";
  }

  /* --- 2. IMÁGENES lazy --- */
  function buildCardImg(fullUrl, alt, imageClass){
    var img = document.createElement("img");
    img.className = "card-img" + (imageClass ? " " + imageClass : "");
    img.src = thumbUrl(fullUrl);
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.setAttribute("fetchpriority", "low");
    img.width = 600; img.height = 600;
    return img;
  }
  function mediaLoad(img){
    var full = img.getAttribute("data-src");
    if (!full) return;
    var loader = new Image();
    loader.onload = function(){ img.src = siteUrl(full); img.classList.add("is-loaded"); };
    loader.src = siteUrl(full);
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
  var modal = document.getElementById("plantModal");
  var modalImg = document.getElementById("modalImg");
  var modalThumbs = document.getElementById("modalThumbs");
  var modalAlert = document.getElementById("modalAlert");
  var modalLastFocus = null;

  function thumbUrl(src){
    return siteUrl(String(src || "").replace(/\.webp(\?.*)?$/, "-thumb.webp$1"));
  }

  function sectionHidden(id, hidden){
    var el = document.getElementById(id);
    if (el) el.hidden = !!hidden;
  }

  function fillList(id, items){
    var el = document.getElementById(id);
    if (!el) return;
    el.replaceChildren();
    (items || []).forEach(function(item){
      var li = document.createElement("li");
      li.textContent = item;
      el.appendChild(li);
    });
  }

  function renderGallery(p){
    if (!modalThumbs) return;
    modalThumbs.replaceChildren();
    var sources = [p.img, p.img2].filter(Boolean);
    if (sources.length < 2){
      modalThumbs.hidden = true;
      return;
    }
    modalThumbs.hidden = false;
    sources.forEach(function(src, i){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "modal-thumb" + (i === 0 ? " is-active" : "");
      btn.setAttribute("aria-label", (i === 0 ? "Imagen principal de " : "Segunda imagen de ") + p.name);
      var thumb = document.createElement("img");
      thumb.src = thumbUrl(src);
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.onerror = function(){
        thumb.onerror = null;
        thumb.src = siteUrl(p.fallbackImg || window.FALLBACK_IMG || src);
      };
      btn.appendChild(thumb);
      btn.addEventListener("click", function(){
        if (modalImg){
          modalImg.dataset.fallback = "";
          modalImg.src = siteUrl(src);
        }
        modalThumbs.querySelectorAll(".modal-thumb").forEach(function(other){
          other.classList.toggle("is-active", other === btn);
        });
      });
      modalThumbs.appendChild(btn);
    });
  }

  function setModalMedia(p){
    if (!modalImg) return;
    modalImg.dataset.fallback = "";
    modalImg.className = "modal-img" + (p.imageClass ? " " + p.imageClass : "");
    modalImg.alt = p.name + ", producto de herboristería artesanal de DORILA";
    modalImg.removeAttribute("data-src");
    modalImg.src = siteUrl(p.img);
    renderGallery(p);
  }

  if (modalImg){
    modalImg.addEventListener("error", function(){
      if (modalImg.dataset.fallback) return;
      modalImg.dataset.fallback = "1";
      modalImg.src = siteUrl(window.FALLBACK_IMG || "img/placeholder/mandala.svg");
    });
  }

  function renderModalAlert(p){
    if (!modalAlert) return;
    modalAlert.replaceChildren();
    if (!p.alertaTitulo){
      modalAlert.hidden = true;
      return;
    }
    modalAlert.hidden = false;
    var box = document.createElement("div");
    box.className = p.alertClass || "alerta-toxica";
    box.setAttribute("role", "alert");
    var title = document.createElement("strong");
    title.textContent = p.alertaTitulo;
    var body = document.createElement("p");
    body.textContent = p.alertaCuerpo || p.alerta || "";
    box.appendChild(title);
    box.appendChild(body);
    if (p.alertaNota){
      var note = document.createElement("small");
      note.textContent = p.alertaNota;
      box.appendChild(note);
    }
    modalAlert.appendChild(box);
  }

  function openProductModal(slug){
    var p = PRODUCT_BY_SLUG[slug];
    if (!p || !modal) return;
    modalLastFocus = document.activeElement;

    var sinonimos = p.sinonimos || [];
    setText("modalCat", p.categoriaLabel || p.category || "");
    setText("modalTitle", p.name);
    setText("modalScientific", p.scientific ? "Nombre científico: " + p.scientific : "");
    setText("modalSynonyms", sinonimos.length ? "También conocida como: " + sinonimos.join(", ") : "");
    sectionHidden("modalSynonyms", !sinonimos.length);
    setText("modalDesc", p.botanicalDesc || p.desc || "");
    var disponible = hasStock(p);
    setText("modalStock", disponible ? "Disponible" : (p.toxicidad === "EXTREMA" ? "No disponible para venta" : "Sin stock"));
    setText("modalPrice", p.price || (p.toxicidad === "EXTREMA" ? "No se comercializa" : "Ficha botánica informativa"));
    setText("modalFamilia", p.familia || "—");
    setText("modalTox", p.toxicidadLabel || p.toxicidad || "—");

    fillList("modalProps", p.props);
    sectionHidden("modalPropsSection", !(p.props || []).length);
    fillList("modalUsos", p.usos);
    sectionHidden("modalUsosSection", !(p.usos || []).length);
    fillList("modalPreparacion", p.preparacion);
    sectionHidden("modalPreparacionSection", !(p.preparacion || []).length);
    setText("modalPrecauciones", p.precauciones || "");
    sectionHidden("modalPrecaucionesSection", !p.precauciones);

    var addBtn = document.getElementById("modalAddBtn");
    if (addBtn){
      addBtn.hidden = !disponible;
      addBtn.disabled = !disponible;
      addBtn.setAttribute("data-id", p.id);
    }

    renderRelated(p);
    setModalMedia(p);
    renderModalAlert(p);
    modal.showModal();
    document.body.classList.add("modal-open");
  }

  function closeModal(){
    if (modal && modal.open) modal.close();
  }

  if (modal){
    modal.addEventListener("close", function(){
      document.body.classList.remove("modal-open");
      if (modalLastFocus && typeof modalLastFocus.focus === "function"){
        modalLastFocus.focus({ preventScroll: true });
      }
    });
    modal.addEventListener("click", function(event){
      if (event.target === modal) closeModal();
    });
  }
  var modalCloseBtn = document.getElementById("modalClose");
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modal){
    modal.querySelectorAll("[data-close-modal]").forEach(function(el){
      el.addEventListener("click", closeModal);
    });
  }

  /* --- 4. RENDERIZADO Y FILTROS --- */
  var grid         = document.getElementById("productGrid");
  var cartCountEl  = document.getElementById("cartCount");
  var cartBtn      = document.getElementById("cartBtn");
  var loadMoreBtn  = document.getElementById("loadMoreProducts");
  var INITIAL_VISIBLE = 4;
  var PAGE_SIZE = 4;
  var visibleCount = INITIAL_VISIBLE;
  var renderToken = 0;
  var skeletonTimer = null;

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

  function renderRelated(p){
    var wrap = document.getElementById("modalRelatedWrap");
    var relatedGrid = document.getElementById("modalRelated");
    if (!wrap || !relatedGrid) return;
    relatedGrid.innerHTML = "";
    var permitir = p.vendible
      ? function(r){ return r.vendible; }
      : function(r){ return r.toxicidad !== "EXTREMA"; };
    var related = (p.related || []).map(function(slug){ return PRODUCT_BY_SLUG[slug]; }).filter(function(r){
      return r && r.id !== p.id && permitir(r);
    }).slice(0, 4);
    if (!related.length){
      related = PRODUCTS.filter(function(r){
        return r.id !== p.id && r.category === p.category && permitir(r);
      }).slice(0, 4);
    }
    if (!related.length){
      wrap.hidden = true;
      return;
    }
    related.forEach(function(r){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "related-card";
      card.dataset.product = r.slug;
      var img = document.createElement("img");
      img.className = r.imageClass || "";
      img.src = thumbUrl(r.img);
      img.alt = r.name + ", producto de herboristería artesanal de DORILA";
      img.loading = "lazy";
      img.width = 240; img.height = 240;
      var name = document.createElement("span");
      name.className = "related-name";
      name.textContent = r.name;
      var price = document.createElement("span");
      price.className = "related-price";
      price.textContent = r.price || "Ficha botánica";
      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      card.addEventListener("click", function(){
        openProductModal(r.slug);
      });
      relatedGrid.appendChild(card);
    });
    wrap.hidden = false;
  }

  function cardForProduct(p){
    var card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = p.id;
    card.dataset.category = p.category;
    card.dataset.toxicidad = p.toxicidad || "";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", "Abrir ficha de " + p.name);

    var media = document.createElement("div");
    media.className = "product-media";
    media.appendChild(buildCardImg(p.img, p.name + ", hierba medicinal de DORILA", p.imageClass));

    var badge = p.toxicidad && p.toxicidad !== "SEGURA" && p.toxicidad !== "NO_DETERMINADA"
      ? "<span class=\"tox-badge " + (p.alertClass || "") + "\">" + p.toxicidadLabel + "</span>"
      : "";
    var availability = p.vendible ? "" : "<span class=\"availability-badge\">" + (p.toxicidad === "EXTREMA" ? "No disponible para venta" : "Sin stock") + "</span>";
    var addButton = p.vendible
      ? "<button class=\"add-btn\" type=\"button\" aria-label=\"Agregar " + p.name + " al carrito\">" +
          "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 5v14M5 12h14\"/></svg>" +
        "</button>"
      : "";

    var body = document.createElement("div");
    body.className = "product-body";
    body.innerHTML =
      "<h3>" + p.name + "</h3>" +
      "<p>" + (p.desc || p.botanicalDesc || "") + "</p>" +
      badge +
      "<div class=\"product-footer\">" +
        "<span class=\"product-price\">" + (p.price || availability) + "</span>" +
        addButton +
      "</div>";

    var addBtn = body.querySelector(".add-btn");
    if (addBtn) addBtn.addEventListener("click", function(e){
      e.stopPropagation();
      if (!addToCart(p.id)) return;
      this.innerHTML = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 6L9 17l-5-5\"/></svg>";
      var self = this;
      setTimeout(function(){
        self.innerHTML = "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 5v14M5 12h14\"/></svg>";
      }, 1200);
    });

    card.addEventListener("keydown", function(e){
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target !== card) return;
      e.preventDefault();
      openProductModal(p.slug);
    });
    card.addEventListener("click", function(){ openProductModal(p.slug); });

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function normalizarTexto(texto){
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function gramas(texto){
    var t = " " + normalizarTexto(texto) + " ";
    var out = [];
    for (var i = 0; i < t.length - 2; i++) out.push(t.slice(i, i + 3));
    return out;
  }

  function searchScore(p, q){
    var norm = normalizarTexto(q);
    var termSlug = slugify(q);
    if (!norm && !termSlug) return 1;

    var texto = [
      p.name, p.scientific, p.categoriaLabel, p.category, p.familia,
      p.toxicidadLabel, p.desc, p.botanicalDesc,
      (p.sinonimos || []).join(" "), (p.palabrasClave || []).join(" "),
      (p.usos || []).join(" "), (p.props || []).join(" ")
    ].join(" ");
    var haystack = normalizarTexto(texto);
    var haystackSlug = slugify(texto);
    var score = 0;

    if (haystack.indexOf(norm) !== -1 || haystackSlug.indexOf(termSlug) !== -1) score += 10;
    if (slugify(p.name).indexOf(termSlug) !== -1) score += 4;
    (p.sinonimos || []).forEach(function(sinonimo){
      if (normalizarTexto(sinonimo).indexOf(norm) !== -1 || slugify(sinonimo).indexOf(termSlug) !== -1) score += 6;
    });
    if (score) return score;

    var partes = gramas(q);
    if (!partes.length) return 0;
    var coincidencias = partes.filter(function(g){ return haystack.indexOf(g) !== -1; }).length;
    return coincidencias / partes.length >= 0.6 ? 2 + coincidencias : 0;
  }

  function skeletonCard(){
    var card = document.createElement("div");
    card.className = "product-card is-skeleton";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = '<div class="skeleton-media"></div><div class="product-body"><div class="skeleton-line"></div><div class="skeleton-line is-short"></div><div class="product-footer"><span class="skeleton-line"></span><span class="skeleton-line is-short"></span></div></div>';
    return card;
  }

  function showSkeleton(count){
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < count; i++) fragment.appendChild(skeletonCard());
    if (lazyObserver) lazyObserver.disconnect();
    grid.replaceChildren(fragment);
    grid.setAttribute("aria-busy", "true");
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    document.getElementById("productCount").textContent = "Cargando hierbas\u2026";
    document.getElementById("productEmpty").hidden = true;
  }

  function render(){
    var token = ++renderToken;
    var q  = (document.getElementById("searchInput").value || "").trim();
    var activeCat = document.querySelector(".filter-btn.is-active");
    var cat = activeCat ? activeCat.dataset.category : "";
    var groupCats = cat ? GROUP_CATS[cat] : null;

    var list = PRODUCTS
      .map(function(p){ return { product: p, score: searchScore(p, q) }; })
      .filter(function(entry){
        var p = entry.product;
        var matchesCat = !cat || (groupCats ? groupCats.indexOf(p.category) !== -1 : p.category === cat);
        return matchesCat && entry.score > 0;
      })
      .sort(function(a, b){
        return b.score - a.score || String(a.product.name).localeCompare(String(b.product.name), "es");
      })
      .map(function(entry){ return entry.product; });

    var total = list.length;
    var limit = parseInt(grid.dataset.limit || "0", 10);
    var isDefaultView = !cat && !q;
    var isPreview = limit > 0 && isDefaultView;
    var previewTotal = isPreview ? Math.min(total, limit) : total;
    var visible = isPreview ? Math.min(visibleCount, previewTotal) : previewTotal;
    var shown = list.slice(0, visible);

    showSkeleton(shown.length);
    window.clearTimeout(skeletonTimer);
    skeletonTimer = window.setTimeout(function(){
      if (token !== renderToken) return;
      var fragment = document.createDocumentFragment();
      shown.forEach(function(p){ fragment.appendChild(cardForProduct(p)); });
      if (lazyObserver) lazyObserver.disconnect();
      grid.replaceChildren(fragment);
      grid.removeAttribute("aria-busy");
      if (isPreview){
        document.getElementById("productCount").textContent = "Mostrando " + shown.length + " de " + previewTotal + " hierbas destacadas";
      } else {
        document.getElementById("productCount").textContent = total + " hierba" + (total === 1 ? "" : "s") + " encontrada" + (total === 1 ? "" : "s");
      }
      document.getElementById("productEmpty").hidden = total > 0;
      initLazyLoading();
      if (loadMoreBtn) loadMoreBtn.hidden = !(isPreview && visible < previewTotal);
    }, 120);
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
    visibleCount = INITIAL_VISIBLE;
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
    var title = card.querySelector("h3");
    if (!card.hasAttribute("aria-label")){
      card.setAttribute("aria-label", "Filtrar productos por " + (title ? title.textContent.trim() : card.dataset.category));
    }
    var arrow = card.querySelector(".category-links");
    if (arrow){
      arrow.removeAttribute("aria-label");
      arrow.setAttribute("aria-hidden", "true");
    }

    function selectCategory(){
      var g = groupFor(card.dataset.category);
      filtersWrap.querySelectorAll(".filter-btn").forEach(function(b){
        b.classList.toggle("is-active", b.dataset.category === g);
      });
      render();
      document.getElementById("productos").scrollIntoView({ behavior: "smooth" });
    }

    card.addEventListener("click", selectCategory);
    card.addEventListener("keydown", function(e){
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        selectCategory();
      }
    });
  });

  /* Buscador inline */
  var searchInput = document.getElementById("searchInput");
  var searchClear = document.getElementById("searchClear");
  var scheduleRender = debounce(render, 150);
  searchInput.addEventListener("input", function(){
    searchClear.classList.toggle("is-visible", searchInput.value.length > 0);
    scheduleRender();
  });
  searchClear.addEventListener("click", function(){
    searchInput.value = "";
    searchClear.classList.remove("is-visible");
    visibleCount = INITIAL_VISIBLE;
    render();
    searchInput.focus();
  });

  if (loadMoreBtn){
    loadMoreBtn.addEventListener("click", function(){
      var limit = parseInt(grid.dataset.limit || "0", 10) || 0;
      if (visibleCount >= limit) return;
      visibleCount += PAGE_SIZE;
      render();
    });
  }

  /* --- 5. CARRITO --- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem("dorila-cart") || "{}") || {}; } catch (err) { cart = {}; }

  function findProduct(id){
    for (var i = 0; i < PRODUCTS.length; i++){ if (PRODUCTS[i].id === id) return PRODUCTS[i]; }
    return null;
  }
  function priceOf(p){ return typeof p.priceNum === "number" ? p.priceNum : (parseInt(String(p.price || "").replace(/[^0-9]/g, ""), 10) || 0); }
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
  function addToCart(id){
    var p = findProduct(id);
    if (!hasStock(p)) return false;
    var before = cart[id] || 0;
    var next = Math.min(before + 1, maxQty(p));
    if (next <= before) return false;
    cart[id] = next;
    saveCart(); updateBadge(); renderCart();
    return true;
  }
  function changeQty(id, delta){
    var next = capQty(id, (cart[id] || 0) + delta);
    if (next <= 0) delete cart[id];
    else cart[id] = next;
    saveCart(); updateBadge(); renderCart();
  }

  /* Re-lee el carrito desde localStorage, descarta ids huérfanos y cantidades
     no positivas. cart.js y app.js mantienen copias propias del mismo localStorage:
     sin esto, volver con atrás/adelante (bfcache) o agregar desde otra pestaña
     dejaba el badge, el carrito y el checkout desfasados. */
  function syncCart(){
    var fresh = {};
    try { fresh = JSON.parse(localStorage.getItem("dorila-cart") || "{}") || {}; } catch (err) { fresh = {}; }
    cart = {};
    Object.keys(fresh).forEach(function(id){
      var n = parseInt(fresh[id], 10);
      var p = findProduct(id);
      if (n > 0 && hasStock(p)) cart[id] = Math.min(n, maxQty(p));
    });
    saveCart();
    updateBadge();
    if (cartPage && cartPage.classList.contains("is-open")) renderCart();
  }

  /* Agregar al carrito desde el modal de planta */
  var modalAddBtn = document.getElementById("modalAddBtn");
  if (modalAddBtn) modalAddBtn.addEventListener("click", function(){
    if (this.disabled || this.hidden || this.classList.contains("is-success")) return;
    if (!hasStock(findProduct(this.dataset.id))) return;
    if (!addToCart(this.dataset.id)) return;
    this.classList.add("is-success");
    this.textContent = "\u00A1Agregado! \u2713";
    var self = this;
    setTimeout(function(){
      self.classList.remove("is-success");
      self.textContent = "Agregar al carrito";
    }, 1400);
  });

  var cartPage     = document.getElementById("cartPage");
  var cartList     = document.getElementById("cartList");
  var cartEmpty    = document.getElementById("cartEmpty");
  var cartItemCountEl = document.getElementById("cartItemCount");
  var cartSubtotalEl  = document.getElementById("cartSubtotal");

  function openCart(){ syncCart(); renderCart(); cartPage.classList.add("is-open"); cartPage.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden"; }
  function closeCart(){ cartPage.classList.remove("is-open"); cartPage.setAttribute("aria-hidden","true"); document.body.style.overflow = ""; }

  cartBtn.addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartPage.querySelectorAll("[data-cart-go-shop]").forEach(function(el){
    el.addEventListener("click", function(){ closeCart(); document.getElementById("productos").scrollIntoView({ behavior: "smooth" }); });
  });
  cartPage.addEventListener("click", function(e){ if (e.target === cartPage) closeCart(); });

  /* Resincronización: bfcache (atrás/adelante), otra pestaña y volver al tab. */
  window.addEventListener("pageshow", syncCart);
  window.addEventListener("storage", function(e){
    if (e.key && e.key !== "dorila-cart") return;
    syncCart();
  });
  document.addEventListener("visibilitychange", function(){
    if (!document.hidden) syncCart();
  });

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
    var orderWa = document.getElementById("orderWa");
    orderWa.href = "https://wa.me/59894872605?text=" + encodeURIComponent("Hola DORILA, quiero confirmar mi orden "+num+".\n"+lines.join("\n")+"\nTotal: $"+total);
    orderWa.classList.remove("is-disabled");
    orderWa.textContent = "Enviar por WhatsApp";
    var orderNote = document.querySelector(".order-note");
    if (orderNote) orderNote.textContent = "Envi\u00E1 esta orden por WhatsApp y coordinamos env\u00EDo y pago. Pod\u00E9s guardarla en PDF para tu comprobante.";
    closeVerify(); orderModal.classList.add("is-open"); orderModal.setAttribute("aria-hidden","false");
  }
  function closeOrder(){ orderModal.classList.remove("is-open"); orderModal.setAttribute("aria-hidden","true"); }
  function finishOrder(){ closeOrder(); cart={}; saveCart(); updateBadge(); renderCart(); closeCart(); }
  document.getElementById("verifyConfirm").addEventListener("click", generateOrder);
  var orderWa = document.getElementById("orderWa");
  orderWa.addEventListener("click", function(){
    if (orderWa.classList.contains("is-disabled")) return;
    orderWa.classList.add("is-disabled");
    orderWa.textContent = "Abriendo WhatsApp\u2026";
    var orderNote = document.querySelector(".order-note");
    if (orderNote) orderNote.textContent = "Tu carrito se conserva hasta que confirmes la orden. Si WhatsApp no se abre, volv\u00E9 a revisar y enviar el pedido.";
  });
  document.getElementById("orderPrint").addEventListener("click", function(){ window.print(); });
  document.getElementById("orderDone").addEventListener("click", finishOrder);
  orderModal.querySelectorAll("[data-order-close]").forEach(function(el){ el.addEventListener("click", closeOrder); });

  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (orderModal.classList.contains("is-open")) closeOrder();
    else if (verifyModal.classList.contains("is-open")) closeVerify();
    else if (cartPage.classList.contains("is-open")) closeCart();
  });

  syncCart();
  renderCart();
  var initialParams = new URLSearchParams(window.location.search);
  if (initialParams.get("open-cart") === "1") openCart();
  render();

  /* Deep links: ?categoria=cremas y ?p=nombre-del-producto */
  var initialCat = initialParams.get("categoria");
  if (initialCat) applyCategoryFilter(initialCat);
  var initialProduct = initialParams.get("p") || initialParams.get("producto");
  if (initialProduct){
    var initialMatch = PRODUCT_BY_SLUG[initialProduct] || PRODUCTS.filter(function(p){ return (p.slug || slugify(p.name)) === initialProduct || slugify(p.name) === initialProduct; })[0];
    if (initialMatch){
      setDeepLinkCanonical(initialMatch.slug);
      openProductModal(initialMatch.slug);
    }
  }

  /* --- 6. FILTROS DESDE NAV --- */
  function applyCategoryFilter(cat){
    if (!filtersWrap) return;
    var g = groupFor(cat);
    filtersWrap.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.toggle("is-active", b.dataset.category === g); });
    render();
    var prods = document.getElementById("productos");
    if (prods) prods.scrollIntoView({ behavior: "smooth" });
    /* cerrar menú móvil si está abierto */
    if (typeof window.DORILA_CLOSE_MOBILE_MENU === "function") window.DORILA_CLOSE_MOBILE_MENU();
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