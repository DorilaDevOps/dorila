/* ===========================================================
   DORILA — testimonios.js
   Carrusel de testimonios. Inicializa cualquier elemento con
   [data-carousel]: autoplay cada 5s, pausa al hover/foco,
   flechas y puntos. Multi-slide: la cantidad de tarjetas
   visibles se lee de la variable CSS --slides-per-view
   (definida por breakpoint en carousel.css). Respeta
   prefers-reduced-motion.
   =========================================================== */
(function(){
  "use strict";

  var INTERVAL = 5000;
  var REDUCE =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getSlidesPerView(root){
    var raw = getComputedStyle(root).getPropertyValue("--slides-per-view");
    var n = parseInt(raw, 10);
    return n > 0 ? n : 1;
  }

  function initCarousel(root){
    var track = root.querySelector(".carousel-track");
    if (!track) return;

    var slides = Array.prototype.slice.call(track.children);
    var count  = slides.length;
    if (count < 2) return;

    var prev  = root.querySelector(".carousel-prev");
    var next  = root.querySelector(".carousel-next");
    var dots  = root.querySelector(".carousel-dots");

    var index = 0;
    var timer = null;
    var dotButtons = [];

    function maxIndex(){
      return Math.max(0, count - getSlidesPerView(root));
    }

    function buildDots(){
      if (!dots) return;
      slides.forEach(function(_, i){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "carousel-dot";
        b.setAttribute("aria-label", "Ir al testimonio " + (i + 1));
        b.addEventListener("click", function(){
          go(i);
          restart();
        });
        dots.appendChild(b);
        dotButtons.push(b);
      });
    }

    function updateAria(){
      var spv = getSlidesPerView(root);
      slides.forEach(function(slide, i){
        var active = i >= index && i < index + spv;
        slide.setAttribute("aria-hidden", active ? "false" : "true");
        if ("inert" in slide) slide.inert = !active;
      });
      dotButtons.forEach(function(dot, i){
        dot.classList.toggle("is-active", i === index);
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }

    function go(i){
      var m = maxIndex();
      index = Math.max(0, Math.min(i, m));
      var offset = (index * 100) / getSlidesPerView(root);
      track.style.transform = "translateX(-" + offset + "%)";
      updateAria();
    }

    function nextSlide(){ go(index >= maxIndex() ? 0 : index + 1); }
    function prevSlide(){ go(index <= 0 ? maxIndex() : index - 1); }

    function start(){
      if (REDUCE) return;
      stop();
      timer = setInterval(nextSlide, INTERVAL);
    }
    function stop(){
      if (timer){
        clearInterval(timer);
        timer = null;
      }
    }
    function restart(){ start(); }

    if (prev) prev.addEventListener("click", function(){ prevSlide(); restart(); });
    if (next) next.addEventListener("click", function(){ nextSlide(); restart(); });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    var resizeTimer = null;
    window.addEventListener("resize", function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){ go(index); }, 150);
    });

    go(0);
    start();
  }

  var carousels = document.querySelectorAll("[data-carousel]");
  Array.prototype.forEach.call(carousels, initCarousel);
})();