/* ===========================================================
   DORILA — info-form.js
   Modal de contacto reutilizable → WhatsApp.
   El formulario se construye UNA sola vez (single source of
   truth) y se inyecta en cualquier página que tenga un botón
   con [data-contact-open] (index y recetas). Cero duplicación.
   Cargar después de js/shell.js.
   =========================================================== */
(function(){
  "use strict";

  var openTriggers = document.querySelectorAll("[data-contact-open]");
  if (!openTriggers.length) return;

  var modal = document.createElement("div");
  modal.className = "modal modal-contact";
  modal.id = "infoModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML =
      '<div class="modal-scrim" data-close-info-modal></div>' +
      '<div class="modal-dialog" role="document">' +
        '<button class="modal-close" type="button" data-close-info-modal aria-label="Cerrar">' +
          '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<div class="modal-body">' +
          '<h3>Solicitá información</h3>' +
          '<p>Contanos qué te interesa y te respondemos con todo el detalle.</p>' +
           '<p class="info-form-note">Al completar el formulario, se abrirá WhatsApp con tu mensaje armado; solo tenés que confirmar el envío.</p>' +
          '<form class="info-form" id="infoForm" novalidate>' +
            '<div class="field">' +
              '<label for="infoName">Nombre <em>(obligatorio)</em></label>' +
              '<input type="text" id="infoName" name="nombre" autocomplete="name" required placeholder="Tu nombre">' +
            '</div>' +
            '<div class="field">' +
              '<label for="infoPhone">Teléfono <em>(obligatorio)</em></label>' +
              '<input type="tel" id="infoPhone" name="telefono" autocomplete="tel" required placeholder="099 000 000">' +
            '</div>' +
            '<div class="field">' +
              '<label for="infoTopic">Tema</label>' +
              '<select id="infoTopic" name="tema">' +
                '<option value="Consulta general">Consulta general</option>' +
                '<option value="Pedir hierbas">Pedir hierbas</option>' +
                '<option value="Envíos">Envíos</option>' +
                '<option value="Otro">Otro</option>' +
              '</select>' +
            '</div>' +
            '<div class="field">' +
              '<label for="infoMsg">Mensaje <em>(obligatorio)</em></label>' +
              '<textarea id="infoMsg" name="mensaje" required placeholder="Escribinos tu consulta…"></textarea>' +
            '</div>' +
            '<button class="btn btn-primary" type="submit">Enviar por WhatsApp</button>' +
            '<p class="info-success" id="infoSuccess" role="status">¡Gracias! Se abrió WhatsApp con tu consulta.</p>' +
          '</form>' +
        '</div>' +
      '</div>';
  document.body.appendChild(modal);

  var infoForm    = document.getElementById("infoForm");
  var infoSuccess = document.getElementById("infoSuccess");

  function openModal(){
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    var firstField = infoForm.querySelector("input, select, textarea");
    if (firstField) setTimeout(function(){ firstField.focus(); }, 80);
  }
  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  openTriggers.forEach(function(btn){
    btn.addEventListener("click", openModal);
  });
  modal.querySelectorAll("[data-close-info-modal]").forEach(function(el){
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  infoForm.addEventListener("submit", function(e){
    e.preventDefault();
    if (!infoForm.checkValidity()){ infoForm.reportValidity(); return; }
    var name  = document.getElementById("infoName").value.trim();
    var phone = document.getElementById("infoPhone").value.trim();
    var topic = document.getElementById("infoTopic").value;
    var msg   = document.getElementById("infoMsg").value.trim();
    var text  = "Hola DORILA, quiero solicitar información.\nNombre: "+name+"\nTeléfono: "+phone+"\n";
    text += "Tema: "+topic+"\nMensaje: "+msg;
    if (infoSuccess) infoSuccess.classList.add("is-visible");
    window.open("https://wa.me/59894872605?text="+encodeURIComponent(text),"_blank","noopener");
    infoForm.reset();
  });
})();