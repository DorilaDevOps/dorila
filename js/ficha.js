/* ===========================================================
   DORILA — ficha.js
   Galería de miniaturas en las fichas de producto.
   Cargar en fichas (productos/*.html), después de js/shell.js.
   =========================================================== */
(function(){
  "use strict";
  var main = document.querySelector(".ficha-gallery .ficha-main");
  var thumbs = document.querySelectorAll(".ficha-gallery .ficha-thumb");
  if (!main || !thumbs.length) return;
  thumbs.forEach(function(thumb){
    thumb.addEventListener("click", function(){
      main.src = thumb.getAttribute("data-img");
      thumbs.forEach(function(t){ t.classList.toggle("is-active", t === thumb); });
    });
  });
})();