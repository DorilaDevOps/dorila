"use strict";

/* =====================================================================
   DORILA — recetas-comunidad.js
   Listado público, filtros y formulario de «Recetas de persona a persona».
   Sin dependencias. Si la API no está disponible, usa los datos semilla.
   ===================================================================== */

(function(){
  var SEEDS = window.DORILA_COMMUNITY_SEED_RECIPES || [];
  var CATEGORIES = window.DORILA_RECIPE_CATEGORIES || [];
  var LEGEND = "Receta compartida por la comunidad. Contenido revisado editorialmente por Dorila Natural; su publicación no implica certificación de eficacia ni garantía de seguridad terapéutica. No reemplaza la indicación de un profesional de la salud.";
  var PUBLIC_API = "/.netlify/functions/recetas-public";
  var state = { recipes: [], filter: "Todas", loading: true };
  var ingredients = [];
  var steps = [];
  var step = 1;
  var el = {};

  function byId(id){ return document.getElementById(id); }

  function node(tag, className, text){
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined && text !== null) item.textContent = text;
    return item;
  }

  function setHidden(item, hidden){
    if (item) item.hidden = !!hidden;
  }

  function normalize(item){
    item = item || {};
    var author = item.author || {};
    return {
      id: String(item.id || ""),
      category: String(item.category || "Otros tratamientos"),
      author: {
        name: String(author.name || "Colaborador de la comunidad"),
        nationality: String(author.nationality || ""),
        city: String(author.city || "")
      },
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.filter(Boolean).map(String) : [],
      steps: Array.isArray(item.steps) ? item.steps.filter(Boolean).map(String) : [],
      story: String(item.story || ""),
      precautions: String(item.precautions || ""),
      noKnownPrecautions: item.noKnownPrecautions === true,
      publishedAt: String(item.publishedAt || "")
    };
  }

  function dateLabel(value){
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", year: "numeric" }).format(date);
    } catch (error){
      return date.toLocaleDateString();
    }
  }

  function excerpt(recipe){
    if (recipe.story) return recipe.story.length > 170 ? recipe.story.slice(0, 167).trim() + "…" : recipe.story;
    if (recipe.ingredients.length) return "Con " + recipe.ingredients.slice(0, 3).join(", ") + ".";
    return "Una preparación compartida para acompañar el bienestar cotidiano.";
  }

  function renderFilters(){
    if (!el.filters) return;
    var present = CATEGORIES.filter(function(category){
      return state.recipes.some(function(recipe){ return recipe.category === category; });
    });
    var options = ["Todas"].concat(present);
    el.filters.textContent = "";
    options.forEach(function(category){
      var button = node("button", "community-filter", category);
      button.type = "button";
      button.setAttribute("aria-pressed", String(state.filter === category));
      if (state.filter === category) button.classList.add("is-active");
      button.addEventListener("click", function(){
        state.filter = category;
        renderFilters();
        renderList();
      });
      el.filters.appendChild(button);
    });
  }

  function appendList(parent, tag, items){
    var list = node(tag, "community-detail-list");
    items.forEach(function(text){ list.appendChild(node("li", "", text)); });
    parent.appendChild(list);
  }

  function buildCard(recipe){
    var article = node("article", "community-card");
    article.setAttribute("data-category", recipe.category);

    var head = node("div", "community-card-head");
    head.appendChild(node("p", "community-card-kicker", "Receta compartida"));
    head.appendChild(node("h3", "community-card-title", recipe.category));
    var author = [recipe.author.name, recipe.author.city, recipe.author.nationality].filter(Boolean).join(" · ");
    head.appendChild(node("p", "community-card-author", author));
    article.appendChild(head);

    article.appendChild(node("p", "community-card-excerpt", excerpt(recipe)));

    var details = node("details", "community-details");
    details.appendChild(node("summary", "community-details-summary", "Descubrir preparación"));

    var body = node("div", "community-details-body");
    body.appendChild(node("h4", "", "Ingredientes"));
    appendList(body, "ul", recipe.ingredients);
    body.appendChild(node("h4", "", "Preparación"));
    appendList(body, "ol", recipe.steps);

    if (recipe.story){
      body.appendChild(node("h4", "", "La experiencia"));
      body.appendChild(node("p", "community-story", recipe.story));
    }

    var safety = node("div", "community-precaution");
    safety.appendChild(node("h4", "", "Precauciones"));
    safety.appendChild(node("p", "", recipe.noKnownPrecautions
      ? "No se conocen precauciones específicas. Consultá siempre antes de usar plantas medicinales."
      : recipe.precautions));
    body.appendChild(safety);
    body.appendChild(node("p", "community-legend", LEGEND));

    details.appendChild(body);
    article.appendChild(details);

    var date = dateLabel(recipe.publishedAt);
    if (date) article.appendChild(node("p", "community-card-date", "Compartida el " + date));
    return article;
  }

  function renderList(){
    if (!el.list) return;
    var filtered = state.recipes.filter(function(recipe){
      return state.filter === "Todas" || recipe.category === state.filter;
    });

    el.list.textContent = "";
    filtered.forEach(function(recipe){ el.list.appendChild(buildCard(recipe)); });

    if (el.count){
      var total = filtered.length;
      el.count.textContent = total === 0
        ? "Todavía no hay recetas en esta categoría."
        : total + (total === 1 ? " receta compartida" : " recetas compartidas");
    }
    if (el.empty){
      el.empty.hidden = filtered.length !== 0;
      var title = el.empty.querySelector("h3");
      var text = el.empty.querySelector("p");
      if (state.recipes.length === 0){
        if (title) title.textContent = "Sé la primera persona en compartir";
        if (text) text.textContent = "Todavía no hay recetas publicadas. Si tenés una preparación casera para compartir, enviala para revisión.";
      } else {
        if (title) title.textContent = "No hay recetas en esta categoría";
        if (text) text.textContent = "Probá con otro filtro o compartí tu propia receta para empezar.";
      }
    }
  }

  function mergeRecipes(apiRecipes){
    var map = {};
    SEEDS.forEach(function(recipe){ map[recipe.id] = normalize(recipe); });
    (apiRecipes || []).forEach(function(recipe){
      if (recipe && recipe.id) map[recipe.id] = normalize(recipe);
    });
    state.recipes = Object.keys(map).map(function(id){ return map[id]; }).sort(function(a, b){
      return String(b.publishedAt).localeCompare(String(a.publishedAt));
    });
  }

  function loadRecipes(){
    mergeRecipes([]);
    renderFilters();
    renderList();

    if (!window.fetch){
      state.loading = false;
      setHidden(el.loading, true);
      return;
    }

    fetch(PUBLIC_API, { headers: { Accept: "application/json" } })
      .then(function(response){
        return response.json().then(function(data){ return { ok: response.ok, data: data }; });
      })
      .then(function(result){
        if (result.ok && result.data && result.data.ok && Array.isArray(result.data.recipes)){
          mergeRecipes(result.data.recipes);
        }
      })
      .catch(function(){ /* Los datos semilla mantienen la sección disponible. */ })
      .then(function(){
        state.loading = false;
        setHidden(el.loading, true);
        renderFilters();
        renderList();
      });
  }

  function setError(id, message){
    var target = byId(id);
    if (!target) return;
    target.textContent = message || "";
    target.hidden = !message;
  }

  function markInvalid(input, invalid){
    if (!input) return;
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function clearErrors(){
    setError("shareStep1Error", "");
    setError("shareStep2Error", "");
    setError("ingredientError", "");
    setError("stepError", "");
    ["shareFirstName", "shareLastName", "shareNationality", "shareCity", "shareCategory", "shareStory", "sharePrecautions"].forEach(function(id){
      markInvalid(byId(id), false);
    });
  }

  function validateStep1(){
    var errors = [];
    var firstName = byId("shareFirstName");
    var lastName = byId("shareLastName");
    var nationality = byId("shareNationality");
    var city = byId("shareCity");
    clearErrors();

    if (!firstName || firstName.value.trim().length < 2){ errors.push("Ingresá tu nombre."); markInvalid(firstName, true); }
    if (!lastName || lastName.value.trim().length < 2){ errors.push("Ingresá tu apellido."); markInvalid(lastName, true); }
    if (!nationality || nationality.value.trim().length < 2){ errors.push("Ingresá tu nacionalidad."); markInvalid(nationality, true); }
    if (city && city.value.trim().length > 80){ errors.push("La ciudad es demasiado larga."); markInvalid(city, true); }

    if (errors.length){
      setError("shareStep1Error", errors[0]);
      var firstInvalid = [firstName, lastName, nationality, city].find(function(input){
        return input && input.getAttribute("aria-invalid") === "true";
      });
      if (firstInvalid) firstInvalid.focus();
      return false;
    }
    return true;
  }

  function validateStep2(){
    var errors = [];
    var category = byId("shareCategory");
    var story = byId("shareStory");
    var precautions = byId("sharePrecautions");
    var noKnown = byId("shareNoPrecautions");
    var consentAuthorship = byId("shareConsentAuthorship");
    var consentReview = byId("shareConsentReview");
    var consentPrivacy = byId("shareConsentPrivacy");
    clearErrors();

    if (!category || CATEGORIES.indexOf(category.value) === -1){ errors.push("Elegí una categoría de uso."); markInvalid(category, true); }
    if (ingredients.length < 2){ errors.push("Agregá al menos dos ingredientes con sus cantidades."); setError("ingredientError", "Agregá al menos dos ingredientes."); }
    if (steps.length < 2){ errors.push("Agregá al menos dos pasos de preparación."); setError("stepError", "Agregá al menos dos pasos."); }
    if (story && story.value.trim().length > 1000){ errors.push("La experiencia es demasiado larga."); markInvalid(story, true); }
    if (precautions && !noKnown.checked && !precautions.value.trim()){
      errors.push("Escribí las precauciones o marcá que no conocés ninguna.");
      markInvalid(precautions, true);
    }
    if (precautions && precautions.value.trim().length > 600){ errors.push("Las precauciones son demasiado largas."); markInvalid(precautions, true); }
    if (!consentAuthorship || !consentAuthorship.checked) errors.push("Confirmá que la receta es tuya o que tenés permiso para compartirla.");
    if (!consentReview || !consentReview.checked) errors.push("Aceptá la revisión editorial.");
    if (!consentPrivacy || !consentPrivacy.checked) errors.push("Aceptá que tu nombre y ciudad se muestren si se publica.");

    if (errors.length){
      setError("shareStep2Error", errors[0]);
      var firstInvalid = [category, story, precautions].find(function(input){
        return input && input.getAttribute("aria-invalid") === "true";
      });
      if (firstInvalid) firstInvalid.focus();
      else if (ingredients.length < 2) byId("ingredientInput").focus();
      else if (steps.length < 2) byId("stepInput").focus();
      else if (consentAuthorship && !consentAuthorship.checked) consentAuthorship.focus();
      else if (consentReview && !consentReview.checked) consentReview.focus();
      else if (consentPrivacy && !consentPrivacy.checked) consentPrivacy.focus();
      return false;
    }
    return true;
  }

  function showStep(nextStep){
    step = nextStep;
    setHidden(byId("shareStep1"), step !== 1);
    setHidden(byId("shareStep2"), step !== 2);
    setHidden(byId("shareNext"), step !== 1);
    setHidden(byId("shareBack"), step !== 2);
    setHidden(byId("shareSubmit"), step !== 2);
    if (byId("shareProgress")) byId("shareProgress").textContent = step === 1 ? "Paso 1 de 2 · Tus datos" : "Paso 2 de 2 · Tu receta";
    if (step === 1){
      var first = byId("shareFirstName");
      if (first) first.focus();
    }
  }

  function renderRows(kind){
    var isIngredient = kind === "ingredient";
    var values = isIngredient ? ingredients : steps;
    var list = byId(isIngredient ? "ingredientList" : "stepList");
    if (!list) return;
    list.textContent = "";
    values.forEach(function(text, index){
      var item = node("li", "community-row");
      item.appendChild(node("span", "community-row-text", text));
      var remove = node("button", "community-row-remove", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", "Quitar " + (isIngredient ? "ingrediente " : "paso ") + (index + 1));
      remove.addEventListener("click", function(){
        values.splice(index, 1);
        renderRows(kind);
        setError(isIngredient ? "ingredientError" : "stepError", "");
      });
      item.appendChild(remove);
      list.appendChild(item);
    });
  }

  function addRow(kind){
    var isIngredient = kind === "ingredient";
    var input = byId(isIngredient ? "ingredientInput" : "stepInput");
    if (!input) return;
    var text = input.value.replace(/\s+/g, " ").trim();
    if (!text) return;
    var values = isIngredient ? ingredients : steps;
    if (values.length >= 30){
      setError(isIngredient ? "ingredientError" : "stepError", "Llegaste al máximo de 30 renglones.");
      return;
    }
    if (text.length > (isIngredient ? 160 : 400)){
      setError(isIngredient ? "ingredientError" : "stepError", isIngredient ? "El ingrediente es demasiado largo." : "El paso es demasiado largo.");
      return;
    }
    values.push(text);
    input.value = "";
    renderRows(kind);
    setError(isIngredient ? "ingredientError" : "stepError", "");
    input.focus();
  }

  function openDialog(dialog){
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog){
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function resetForm(){
    ingredients = [];
    steps = [];
    renderRows("ingredient");
    renderRows("step");
    if (el.form) el.form.reset();
    if (byId("sharePrecautions")) byId("sharePrecautions").disabled = false;
    if (byId("shareStartedAt")) byId("shareStartedAt").value = String(Date.now());
    clearErrors();
    showStep(1);
    setHidden(byId("shareSubmit"), true);
    if (byId("shareSubmit")){
      byId("shareSubmit").disabled = false;
      byId("shareSubmit").textContent = "Enviar receta para revisión";
    }
  }

  function openShare(){
    resetForm();
    openDialog(byId("shareDialog"));
  }

  function submitRecipe(){
    var payload = {
      author: {
        firstName: byId("shareFirstName").value.trim(),
        lastName: byId("shareLastName").value.trim(),
        nationality: byId("shareNationality").value.trim(),
        city: byId("shareCity").value.trim()
      },
      recipe: {
        category: byId("shareCategory").value,
        ingredients: ingredients.slice(),
        steps: steps.slice(),
        story: byId("shareStory").value.trim(),
        precautions: byId("sharePrecautions").value.trim(),
        noKnownPrecautions: byId("shareNoPrecautions").checked
      },
      consents: {
        authorship: byId("shareConsentAuthorship").checked,
        review: byId("shareConsentReview").checked,
        privacy: byId("shareConsentPrivacy").checked
      },
      website: byId("shareWebsite").value,
      startedAt: Number(byId("shareStartedAt").value) || 0
    };

    var submit = byId("shareSubmit");
    if (submit){
      submit.disabled = true;
      submit.textContent = "Enviando…";
    }

    fetch("/.netlify/functions/recetas-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function(response){
        return response.json().then(function(data){ return { ok: response.ok, data: data }; });
      })
      .then(function(result){
        if (!result.ok || !result.data || !result.data.ok){
          throw new Error((result.data && result.data.error) || "No pudimos enviar la receta.");
        }
        closeDialog(byId("shareDialog"));
        resetForm();
        openDialog(byId("shareSuccessDialog"));
      })
      .catch(function(error){
        if (byId("shareErrorText")) byId("shareErrorText").textContent = error.message || "No pudimos enviar la receta. Revisá tu conexión e intentá nuevamente.";
        openDialog(byId("shareErrorDialog"));
        if (submit){
          submit.disabled = false;
          submit.textContent = "Enviar receta para revisión";
        }
      });
  }

  function init(){
    el.filters = byId("communityFilters");
    el.list = byId("communityList");
    el.count = byId("communityCount");
    el.empty = byId("communityEmpty");
    el.loading = byId("communityLoading");
    el.form = byId("shareForm");

    loadRecipes();

    Array.prototype.forEach.call(document.querySelectorAll("[data-share-open]"), function(button){
      button.addEventListener("click", openShare);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-dialog-close]"), function(button){
      button.addEventListener("click", function(){
        var dialog = button.closest("dialog");
        closeDialog(dialog || byId("shareDialog"));
      });
    });

    if (byId("shareNext")) byId("shareNext").addEventListener("click", function(){ if (validateStep1()) showStep(2); });
    if (byId("shareBack")) byId("shareBack").addEventListener("click", function(){ showStep(1); });
    if (byId("addIngredient")) byId("addIngredient").addEventListener("click", function(){ addRow("ingredient"); });
    if (byId("addStep")) byId("addStep").addEventListener("click", function(){ addRow("step"); });

    ["ingredientInput", "stepInput"].forEach(function(id){
      var input = byId(id);
      if (!input) return;
      input.addEventListener("keydown", function(event){
        if (event.key === "Enter"){ event.preventDefault(); addRow(id === "ingredientInput" ? "ingredient" : "step"); }
      });
    });

    if (byId("shareNoPrecautions")){
      byId("shareNoPrecautions").addEventListener("change", function(){
        var precautions = byId("sharePrecautions");
        if (!precautions) return;
        precautions.disabled = byId("shareNoPrecautions").checked;
        if (!precautions.disabled) precautions.focus();
      });
    }

    if (el.form){
      el.form.addEventListener("submit", function(event){
        event.preventDefault();
        if (!validateStep2()) return;
        var summary = byId("shareConfirmSummary");
        if (summary){
          summary.textContent = "Vas a enviar la receta de " + byId("shareCategory").value.toLowerCase() + " a nombre de " +
            byId("shareFirstName").value.trim() + " " + byId("shareLastName").value.trim() + ". La revisaremos antes de publicarla.";
        }
        openDialog(byId("shareConfirmDialog"));
      });
    }

    if (byId("shareConfirmNo")){
      byId("shareConfirmNo").addEventListener("click", function(){
        closeDialog(byId("shareConfirmDialog"));
        closeDialog(byId("shareDialog"));
        openDialog(byId("shareCancelDialog"));
      });
    }
    if (byId("shareConfirmYes")) byId("shareConfirmYes").addEventListener("click", function(){
      closeDialog(byId("shareConfirmDialog"));
      submitRecipe();
    });
    if (byId("shareErrorRetry")) byId("shareErrorRetry").addEventListener("click", function(){
      closeDialog(byId("shareErrorDialog"));
      openDialog(byId("shareDialog"));
    });

    if (byId("shareStartedAt")) byId("shareStartedAt").value = String(Date.now());

    if (/[?&]compartir=1(?:&|$)/.test(window.location.search)){
      var section = byId("recetas-comunidad");
      if (section && section.scrollIntoView) section.scrollIntoView({ behavior: "smooth", block: "start" });
      openShare();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
