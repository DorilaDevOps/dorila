/* ===========================================================
   DORILA — info-form.js
   Formulario "Solicitar información" → WhatsApp.
   Se autodefine si la página tiene #infoForm (index y recetas).
   Cargar después de js/shell.js.
   =========================================================== */
(function(){
  "use strict";
  var infoForm = document.getElementById("infoForm");
  if (!infoForm) return;
  infoForm.addEventListener("submit", function(e){
    e.preventDefault();
    if (!infoForm.checkValidity()){ infoForm.reportValidity(); return; }
    var name  = document.getElementById("infoName").value.trim();
    var email = document.getElementById("infoEmail").value.trim();
    var phone = document.getElementById("infoPhone").value.trim();
    var topic = document.getElementById("infoTopic").value;
    var msg   = document.getElementById("infoMsg").value.trim();
    var text  = "Hola DORILA, quiero solicitar información.\nNombre: "+name+"\nTeléfono: "+phone+"\n";
    if (email) text += "Correo: "+email+"\n";
    text += "Tema: "+topic+"\nMensaje: "+msg;
    var wa = document.getElementById("infoSuccess");
    if (wa) wa.classList.add("is-visible");
    window.open("https://wa.me/59894872605?text="+encodeURIComponent(text),"_blank","noopener");
    infoForm.reset();
  });
})();