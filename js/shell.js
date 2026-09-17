/* ===========================================================
   DORILA — shell.js
   Componentes compartidos: header, menú móvil, buscador,
   modales legales, año dinámico. Cargar en todas las páginas.
   =========================================================== */
(function(){
  "use strict";

  /* --- Header: show / hide on scroll --- */
  var header = document.getElementById("siteHeader");
  var toTop  = document.getElementById("toTop");
  var lastY  = 0;

  function onScroll(){
    var y = window.scrollY;
    if (header){
      header.classList.toggle("is-scrolled", y > 8);
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle("is-hidden", y > 200 && y >= maxScroll * 0.9);
    }
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop){
    toTop.addEventListener("click", function(){
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* --- Mobile menu --- */
  var menuToggle = document.getElementById("menuToggle");
  var navMobile  = document.getElementById("navMobile");
  var scrim      = document.getElementById("scrim");

  if (menuToggle && navMobile && scrim){
    function closeMenu(){
      navMobile.classList.remove("is-open");
      scrim.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir men\u00fa");
      document.body.style.overflow = "";
    }
    function openMenu(){
      navMobile.classList.add("is-open");
      scrim.classList.add("is-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Cerrar men\u00fa");
      document.body.style.overflow = "hidden";
    }

    menuToggle.addEventListener("click", function(){
      navMobile.classList.contains("is-open") ? closeMenu() : openMenu();
    });

    var navClose = document.getElementById("navClose");
    if (navClose) navClose.addEventListener("click", closeMenu);
    scrim.addEventListener("click", closeMenu);
    navMobile.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape") closeMenu();
    });
  }

  /* --- Ship-note dentro del menú móvil --- */
  var shipNote = document.querySelector(".header-actions .ship-note");
  var navMob   = document.getElementById("navMobile");
  if (shipNote && navMob && !navMob.querySelector(".ship-note")){
    navMob.appendChild(shipNote.cloneNode(true));
  }

  /* --- Mobile accordions --- */
  document.querySelectorAll(".nav-acc-parent > .nav-acc").forEach(function(btn){
    btn.addEventListener("click", function(){
      var isOpen = btn.closest(".nav-acc-parent").classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  /* --- Desktop dropdowns (hover + focus) --- */
  document.querySelectorAll(".nav-desktop li.has-menu").forEach(function(li){
    var link = li.querySelector(":scope > a");
    li.addEventListener("mouseenter", function(){ li.classList.add("is-open"); if (link) link.setAttribute("aria-expanded", "true"); });
    li.addEventListener("mouseleave", function(){ li.classList.remove("is-open"); if (link) link.setAttribute("aria-expanded", "false"); });
    li.addEventListener("focusin",    function(){ li.classList.add("is-open"); if (link) link.setAttribute("aria-expanded", "true"); });
    li.addEventListener("focusout",   function(){ li.classList.remove("is-open"); if (link) link.setAttribute("aria-expanded", "false"); });
  });

  /* --- Search overlay --- */
  var searchOpen         = document.getElementById("searchOpen");
  var searchOverlay      = document.getElementById("searchOverlay");
  var searchOverlayClose = document.getElementById("searchOverlayClose");
  var searchOverlayInput = document.getElementById("searchOverlayInput");
  var searchOverlayClear = document.getElementById("searchOverlayClear");
  var searchTarget       = window.DORILA_SEARCH_TARGET || "index.html#productos";

  function openSearchOverlay(){
    if (!searchOverlay || !searchOverlayInput) return;
    searchOverlayInput.value = sessionStorage.getItem("dorila-search") || "";
    if (searchOverlayClear) searchOverlayClear.classList.toggle("is-visible", searchOverlayInput.value.length > 0);
    searchOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(function(){ searchOverlayInput.focus(); }, 100);
  }
  function closeSearchOverlay(){
    if (!searchOverlay) return;
    searchOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  if (searchOpen) searchOpen.addEventListener("click", openSearchOverlay);

  if (searchOverlayInput){
    searchOverlayInput.addEventListener("keydown", function(e){
      if (e.key === "Enter"){
        e.preventDefault();
        sessionStorage.setItem("dorila-search", searchOverlayInput.value);
        window.location.href = searchTarget;
      }
    });
  }
  if (searchOverlayClose) searchOverlayClose.addEventListener("click", closeSearchOverlay);
  if (searchOverlay) searchOverlay.addEventListener("keydown", function(e){
    if (e.key === "Escape") closeSearchOverlay();
  });
  if (searchOverlayInput && searchOverlayClear){
    searchOverlayInput.addEventListener("input", function(){
      searchOverlayClear.classList.toggle("is-visible", searchOverlayInput.value.length > 0);
      sessionStorage.setItem("dorila-search", searchOverlayInput.value);
    });
    searchOverlayClear.addEventListener("click", function(){
      searchOverlayInput.value = "";
      searchOverlayClear.classList.remove("is-visible");
      sessionStorage.removeItem("dorila-search");
      searchOverlayInput.focus();
    });
  }

  /* --- Legal modals (privacidad + aviso legal) --- */
  var legalModals = ["privacyModal", "disclaimerModal"];

  function openLegalModal(id){
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var close = m.querySelector(".modal-close");
    if (close) close.focus();
  }
  function closeLegalModal(m){
    if (!m) return;
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    var trigger = document.querySelector('[data-open-modal="' + m.id + '"]');
    if (trigger) trigger.focus();
  }

  document.querySelectorAll("[data-open-modal]").forEach(function(btn){
    btn.addEventListener("click", function(){
      openLegalModal(btn.getAttribute("data-open-modal"));
    });
  });
  legalModals.forEach(function(id){
    var m = document.getElementById(id);
    if (!m) return;
    var closeBtn = m.querySelector(".modal-close");
    if (closeBtn) closeBtn.addEventListener("click", function(){ closeLegalModal(m); });
    m.querySelectorAll("[data-close-modal]").forEach(function(el){
      el.addEventListener("click", function(){ closeLegalModal(m); });
    });
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape"){
      var openM = document.querySelector(".modal.is-open");
      if (openM && legalModals.indexOf(openM.id) !== -1) closeLegalModal(openM);
    }
  });

  /* --- Reveal on scroll --- */
  document.querySelectorAll(".reveal").forEach(function(el){
    if ("IntersectionObserver" in window){
      var obs = new IntersectionObserver(function(entries, o){
        entries.forEach(function(entry){
          if (entry.isIntersecting){ entry.target.classList.add("is-visible"); o.unobserve(entry.target); }
        });
      }, { threshold: 0.12 });
      obs.observe(el);
    } else {
      el.classList.add("is-visible");
    }
  });

  /* --- Footer year --- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();