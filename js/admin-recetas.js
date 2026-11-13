"use strict";

/* =====================================================================
   DORILA — admin-recetas.js
   Panel privado de moderación. El token se guarda solo en sessionStorage
   y se envía como Authorization: Bearer a la Function de Netlify.
   ===================================================================== */

(function(){
  var TOKEN_KEY = "dorila-admin-token";
  var API = "/.netlify/functions/recetas-admin";
  var token = "";
  var recipes = [];
  var categories = [];
  var labels = {};
  var reviewKeys = [];
  var current = null;
  var el = {};

  function byId(id){ return document.getElementById(id); }

  function node(tag, className, text){
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined && text !== null) item.textContent = text;
    return item;
  }

  function append(parent, child){ parent.appendChild(child); return child; }

  function formatDate(value){
    if (!value) return "—";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
    } catch (error){
      return date.toLocaleString();
    }
  }

  function readToken(){
    try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch (error){ return ""; }
  }

  function saveToken(value){
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (error){ /* sessionStorage puede estar bloqueado. */ }
  }

  function feedback(message, isError){
    if (!el.feedback) return;
    el.feedback.textContent = message || "";
    el.feedback.hidden = !message;
    el.feedback.classList.toggle("is-error", !!isError);
  }

  function showGate(message){
    if (el.panel) el.panel.hidden = true;
    if (el.gate) el.gate.hidden = false;
    if (el.gateError){
      el.gateError.textContent = message || "";
      el.gateError.hidden = !message;
    }
    if (el.token) el.token.focus();
  }

  function showPanel(){
    if (el.gate) el.gate.hidden = true;
    if (el.panel) el.panel.hidden = false;
  }

  function api(method, body){
    var options = {
      method: method,
      headers: {
        "Accept": "application/json",
        "Authorization": "Bearer " + token
      }
    };
    if (body){
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    return fetch(API, options).then(function(response){
      return response.json().catch(function(){ return {}; }).then(function(data){
        if (response.status === 401){
          token = "";
          saveToken("");
          showGate("El token no es válido o venció. Ingresalo nuevamente.");
          throw new Error("No autorizado.");
        }
        if (!response.ok || !data.ok){
          throw new Error((data && data.error) || "No pudimos completar la operación.");
        }
        return data;
      });
    });
  }

  function load(){
    if (!token){
      showGate("");
      return;
    }
    feedback("Cargando recetas…", false);
    api("GET").then(function(data){
      recipes = Array.isArray(data.recipes) ? data.recipes : [];
      categories = Array.isArray(data.categories) ? data.categories : [];
      labels = data.labels || {};
      reviewKeys = data.reviewKeys || [];
      showPanel();
      if (el.sessionNote) el.sessionNote.textContent = "Sesión activa en este navegador. El token no se guarda en el sitio ni en las recetas.";
      populateStatusFilter();
      render();
      feedback("", false);
    }).catch(function(error){
      if (token) showGate(error.message || "No pudimos cargar el panel.");
    });
  }

  function populateStatusFilter(){
    if (!el.statusFilter) return;
    var previous = el.statusFilter.value || "all";
    el.statusFilter.textContent = "";
    var all = node("option", "", "Todos los estados");
    all.value = "all";
    el.statusFilter.appendChild(all);
    Object.keys(labels).forEach(function(status){
      var option = node("option", "", labels[status]);
      option.value = status;
      el.statusFilter.appendChild(option);
    });
    el.statusFilter.value = previous;
  }

  function statusBadge(status){
    var badge = node("span", "admin-badge is-" + status, labels[status] || status);
    return badge;
  }

  function renderStats(){
    if (!el.stats) return;
    el.stats.textContent = "";
    var counts = {};
    recipes.forEach(function(recipe){ counts[recipe.status] = (counts[recipe.status] || 0) + 1; });
    var order = ["pending", "review", "changes", "approved", "published", "rejected"];
    order.forEach(function(status){
      var card = node("div", "admin-stat");
      card.appendChild(node("span", "admin-stat-value", String(counts[status] || 0)));
      card.appendChild(node("span", "admin-stat-label", labels[status] || status));
      el.stats.appendChild(card);
    });
  }

  function matches(recipe){
    var term = (el.search && el.search.value || "").trim().toLowerCase();
    var status = el.statusFilter && el.statusFilter.value || "all";
    if (status !== "all" && recipe.status !== status) return false;
    if (!term) return true;
    var haystack = [
      recipe.id,
      recipe.recipe && recipe.recipe.category,
      recipe.author && recipe.author.fullName,
      recipe.author && recipe.author.nationality,
      recipe.author && recipe.author.city
    ].join(" ").toLowerCase();
    return haystack.indexOf(term) !== -1;
  }

  function render(){
    renderStats();
    if (!el.list) return;
    var filtered = recipes.filter(matches);
    el.list.textContent = "";
    filtered.forEach(function(recipe){
      var author = recipe.author || {};
      var data = recipe.recipe || {};
      var card = node("article", "admin-card");
      card.setAttribute("data-status", recipe.status);

      var top = node("div", "admin-card-top");
      append(top, statusBadge(recipe.status));
      append(top, node("time", "admin-card-date", formatDate(recipe.createdAt)));
      append(card, top);

      append(card, node("h2", "admin-card-title", data.category || "Sin categoría"));
      append(card, node("p", "admin-card-author", (author.fullName || "Sin nombre") + " · " + (author.nationality || "Sin nacionalidad")));
      var excerpt = data.story || (data.ingredients || []).slice(0, 3).join(", ") || "Sin detalle.";
      append(card, node("p", "admin-card-excerpt", excerpt.length > 180 ? excerpt.slice(0, 177) + "…" : excerpt));

      var actions = node("div", "admin-card-actions");
      var open = node("button", "admin-btn admin-btn-primary", "Revisar receta");
      open.type = "button";
      open.addEventListener("click", function(){ openDetail(recipe); });
      append(actions, open);
      append(card, actions);
      el.list.appendChild(card);
    });
    if (el.empty) el.empty.hidden = filtered.length !== 0;
  }

  function section(title){
    var block = node("section", "admin-detail-section");
    append(block, node("h3", "", title));
    return block;
  }

  function textBlock(text){
    return node("p", "admin-detail-text", text || "—");
  }

  function listBlock(tag, items){
    var list = node(tag, "admin-detail-list");
    (items || []).forEach(function(item){ append(list, node("li", "", item)); });
    return list;
  }

  function renderDetail(recipe){
    if (!el.detailBody) return;
    el.detailBody.textContent = "";
    current = recipe;
    var author = recipe.author || {};
    var data = recipe.recipe || {};
    var consents = recipe.consents || {};
    var moderation = recipe.moderation || {};

    var head = node("header", "admin-detail-head");
    append(head, statusBadge(recipe.status));
    var title = node("h2", "", data.category || "Sin categoría");
    title.id = "adminDetailTitle";
    append(head, title);
    append(head, node("p", "admin-detail-author", (author.fullName || "Sin nombre") + " · " + [author.city, author.nationality].filter(Boolean).join(", ")));
    append(head, node("p", "admin-detail-id", "ID: " + recipe.id + " · Recibida: " + formatDate(recipe.createdAt) + " · Actualizada: " + formatDate(recipe.updatedAt)));
    append(el.detailBody, head);

    var authorBlock = section("Datos de la persona");
    var authorList = node("dl", "admin-detail-dl");
    [["Nombre", author.fullName], ["Nacionalidad", author.nationality], ["Ciudad", author.city || "No indicada"]].forEach(function(pair){
      append(authorList, node("dt", "", pair[0]));
      append(authorList, node("dd", "", pair[1] || "—"));
    });
    append(authorBlock, authorList);
    append(el.detailBody, authorBlock);

    var ingredientsBlock = section("Ingredientes");
    append(ingredientsBlock, listBlock("ul", data.ingredients));
    append(el.detailBody, ingredientsBlock);

    var stepsBlock = section("Preparación");
    append(stepsBlock, listBlock("ol", data.steps));
    append(el.detailBody, stepsBlock);

    if (data.story){
      var storyBlock = section("Experiencia compartida");
      append(storyBlock, textBlock(data.story));
      append(el.detailBody, storyBlock);
    }

    var safetyBlock = section("Precauciones");
    append(safetyBlock, textBlock(data.noKnownPrecautions ? "La persona declara no conocer precauciones específicas." : data.precautions));
    append(el.detailBody, safetyBlock);

    var consentBlock = section("Consentimientos");
    var consentList = node("ul", "admin-consent-list");
    [["Autoría o permiso para compartir", consents.authorship], ["Acepta revisión editorial", consents.review], ["Acepta publicación de nombre y ciudad", consents.privacy]].forEach(function(pair){
      append(consentList, node("li", "", (pair[1] ? "Sí · " : "No · ") + pair[0]));
    });
    append(consentBlock, consentList);
    append(el.detailBody, consentBlock);

    var checklistBlock = section("Checklist editorial y de seguridad");
    var checklist = node("div", "admin-checklist");
    reviewKeys.forEach(function(key){
      var label = node("label", "admin-check");
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!(recipe.review && recipe.review[key] === true);
      input.setAttribute("data-review", key);
      append(label, input);
      append(label, node("span", "", checklistLabel(key)));
      append(checklist, label);
    });
    append(checklistBlock, checklist);
    var saveChecklist = node("button", "admin-btn admin-btn-secondary", "Guardar checklist");
    saveChecklist.type = "button";
    saveChecklist.addEventListener("click", function(){
      var review = {};
      Array.prototype.forEach.call(checklist.querySelectorAll("[data-review]"), function(input){
        review[input.getAttribute("data-review")] = input.checked;
      });
      patch({ review: review, notes: notes.value }, "Checklist guardado.");
    });
    append(checklistBlock, saveChecklist);
    append(el.detailBody, checklistBlock);

    var notesBlock = section("Notas internas");
    var notes = node("textarea", "admin-textarea");
    notes.id = "adminNotes";
    notes.rows = 4;
    notes.maxLength = 1500;
    notes.placeholder = "Observaciones para el equipo. No se muestran públicamente.";
    notes.value = moderation.notes || "";
    append(notesBlock, notes);
    var saveNotes = node("button", "admin-btn admin-btn-secondary", "Guardar notas");
    saveNotes.type = "button";
    saveNotes.addEventListener("click", function(){ patch({ notes: notes.value }, "Notas guardadas."); });
    append(notesBlock, saveNotes);
    append(el.detailBody, notesBlock);

    var historyBlock = section("Historial de estados");
    var history = node("ol", "admin-history");
    (moderation.history || []).slice().reverse().forEach(function(entry){
      var item = node("li", "admin-history-item");
      append(item, node("strong", "", labels[entry.status] || entry.status));
      append(item, node("span", "admin-history-date", formatDate(entry.at)));
      if (entry.note) append(item, node("p", "", entry.note));
      append(history, item);
    });
    append(historyBlock, history);
    append(el.detailBody, historyBlock);

    var actionBlock = section("Acciones de moderación");
    var actionList = node("div", "admin-detail-actions");
    detailActions(recipe.status).forEach(function(action){
      var button = node("button", "admin-btn " + (action.primary ? "admin-btn-primary" : "admin-btn-secondary"), action.label);
      button.type = "button";
      button.addEventListener("click", function(){ changeStatus(recipe, action, notes); });
      append(actionList, button);
    });
    append(actionBlock, actionList);
    append(el.detailBody, actionBlock);
  }

  function checklistLabel(key){
    return {
      identification: "Identificación y consentimientos",
      ingredients: "Ingredientes y proporciones claras",
      preparation: "Preparación y conservación",
      safety: "Precauciones y seguridad",
      communication: "Comunicación responsable, sin promesas de cura"
    }[key] || key;
  }

  function detailActions(status){
    var actions = [];
    if (status === "pending") actions.push({ to: "review", label: "Tomar en revisión", primary: true });
    if (status === "review") actions.push({ to: "approved", label: "Aprobar receta", primary: true });
    if (status === "approved") actions.push({ to: "published", label: "Publicar receta", primary: true });
    if (status === "changes") actions.push({ to: "review", label: "Reabrir revisión", primary: true });
    if (status === "review" || status === "approved" || status === "published"){
      actions.push({ to: "changes", label: status === "published" ? "Despublicar y pedir cambios" : "Solicitar cambios", note: true });
    }
    if (status === "pending" || status === "review" || status === "changes" || status === "approved"){
      actions.push({ to: "rejected", label: "Rechazar", note: true });
    }
    if (status === "rejected") actions.push({ to: "review", label: "Reabrir revisión", primary: true });
    return actions;
  }

  function changeStatus(recipe, action, notesInput){
    var note = notesInput ? notesInput.value.trim() : "";
    if (action.note && !note){
      feedback("Escribí el motivo en las notas internas antes de esta acción.", true);
      if (notesInput) notesInput.focus();
      return;
    }
    if (action.to === "published"){
      var complete = reviewKeys.every(function(key){ return recipe.review && recipe.review[key] === true; });
      if (!complete){
        feedback("Completá y guardá los cinco puntos del checklist antes de publicar.", true);
        return;
      }
    }
    if ((action.to === "rejected" || action.to === "changes") && !window.confirm("¿Confirmás esta acción? La receta cambiará de estado.")) return;
    patch({ status: action.to, note: note }, "Estado actualizado a " + (labels[action.to] || action.to) + ".");
  }

  function patch(payload, message){
    if (!current) return;
    var body = Object.assign({ id: current.id }, payload);
    feedback("Guardando…", false);
    api("PATCH", body).then(function(data){
      var index = recipes.findIndex(function(recipe){ return recipe.id === data.recipe.id; });
      if (index !== -1) recipes[index] = data.recipe;
      render();
      renderDetail(data.recipe);
      feedback(message, false);
    }).catch(function(error){
      feedback(error.message || "No pudimos guardar los cambios.", true);
    });
  }

  function exportPublished(){
    var published = recipes.filter(function(recipe){ return recipe.status === "published"; }).map(function(recipe){
      var data = recipe.recipe || {};
      var author = recipe.author || {};
      return {
        id: recipe.id,
        status: "published",
        category: data.category,
        author: {
          name: author.fullName || "",
          nationality: author.nationality || "",
          city: author.city || ""
        },
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        story: data.story || "",
        precautions: data.precautions || "",
        noKnownPrecautions: data.noKnownPrecautions === true,
        publishedAt: recipe.publishedAt || recipe.updatedAt
      };
    });
    var body = "/* Copia estática generada desde el panel de DORILA. */\n" +
      "(function(root, categories, recipes){\n" +
      "  if (typeof module !== \"undefined\" && module.exports) module.exports = { categories: categories, recipes: recipes };\n" +
      "  if (root){ root.DORILA_RECIPE_CATEGORIES = categories; root.DORILA_COMMUNITY_SEED_RECIPES = recipes; }\n" +
      "})(typeof window !== \"undefined\" ? window : null, " +
      JSON.stringify(categories, null, 2) + ", " +
      JSON.stringify(published, null, 2) + ");\n";
    var blob = new Blob([body], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "recetas_.js";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    feedback("Descargaste recetas_.js con " + published.length + " receta(s) publicada(s).", false);
  }

  function openDetail(recipe){
    renderDetail(recipe);
    if (el.detailDialog){
      if (typeof el.detailDialog.showModal === "function") el.detailDialog.showModal();
      else el.detailDialog.setAttribute("open", "");
    }
  }

  function init(){
    el.gate = byId("adminGate");
    el.panel = byId("adminPanel");
    el.token = byId("adminToken");
    el.tokenForm = byId("adminTokenForm");
    el.gateError = byId("adminGateError");
    el.sessionNote = byId("adminSessionNote");
    el.stats = byId("adminStats");
    el.list = byId("adminList");
    el.empty = byId("adminEmpty");
    el.feedback = byId("adminFeedback");
    el.search = byId("adminSearch");
    el.statusFilter = byId("adminStatusFilter");
    el.detailDialog = byId("adminDetailDialog");
    el.detailBody = byId("adminDetailBody");

    token = readToken();

    if (el.tokenForm){
      el.tokenForm.addEventListener("submit", function(event){
        event.preventDefault();
        var value = el.token.value.trim();
        if (!value){
          showGate("Ingresá el token de administración.");
          return;
        }
        token = value;
        saveToken(token);
        load();
      });
    }
    if (byId("adminLogout")) byId("adminLogout").addEventListener("click", function(){
      token = "";
      saveToken("");
      recipes = [];
      showGate("Sesión cerrada.");
    });
    if (byId("adminRefresh")) byId("adminRefresh").addEventListener("click", load);
    if (byId("adminExport")) byId("adminExport").addEventListener("click", exportPublished);
    if (el.search) el.search.addEventListener("input", render);
    if (el.statusFilter) el.statusFilter.addEventListener("change", render);
    if (byId("adminDetailClose")) byId("adminDetailClose").addEventListener("click", function(){
      if (el.detailDialog) el.detailDialog.close();
    });

    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
