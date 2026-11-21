"use strict";

/* =====================================================================
   DORILA — check-recetas.js
   Pruebas del núcleo de recetas de la comunidad y verificación de la
   integración pública/admin. Sin dependencias externas.

   Uso:  node tools/check-recetas.js   (o: npm test)
   ===================================================================== */

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var core = require("../netlify/functions/_lib/recetas-core");
var seed = require("../js/recetas_.js");

var ROOT = path.resolve(__dirname, "..");
var PRODUCTS = require(path.join(ROOT, "js", "productos.js"));
var passed = 0;
var failed = 0;
var NOW = Date.parse("2025-11-10T12:00:00.000Z");

function check(name, actual, expected){
  var deep = (actual && typeof actual === "object") || (expected && typeof expected === "object");
  var a = deep ? JSON.stringify(actual) : String(actual);
  var e = deep ? JSON.stringify(expected) : String(expected);
  if (a === e){ passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name + "\n         esperado: " + e + "\n         actual:   " + a); }
}
function ok(name, cond){
  if (cond){ passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name); }
}

function validPayload(){
  return {
    author: {
      firstName: "Ana",
      lastName: "Pereyra",
      nationality: "Uruguaya",
      city: "Salto"
    },
    recipe: {
      category: "Digestivo",
      ingredients: ["1 cucharada de manzanilla seca", "250 ml de agua caliente"],
      steps: ["Colocá la manzanilla en una taza.", "Verté el agua y dejá reposar 5 minutos."],
      story: "Una receta de familia.",
      precautions: "Consultá si estás embarazada o tomás medicación.",
      noKnownPrecautions: false
    },
    consents: { authorship: true, review: true, privacy: true },
    startedAt: NOW - 5000
  };
}

function event(token, method, body){
  var headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  return {
    httpMethod: method || "GET",
    headers: headers,
    body: body ? JSON.stringify(body) : "",
    blobs: "contexto"
  };
}

console.log("1. Categorías, estados y datos semilla");
(function(){
  check("14 categorías", core.CATEGORIES.length, 14);
  check("categorías sin duplicados", new Set(core.CATEGORIES).size, 14);
  check("6 estados", core.STATUSES.length, 6);
  check("semilla con 3 recetas", seed.recipes.length, 3);
  check("semilla usa las mismas categorías", seed.categories, core.CATEGORIES);
  seed.recipes.forEach(function(recipe){
    ok("semilla válida: " + recipe.id, core.CATEGORIES.indexOf(recipe.category) !== -1 &&
      recipe.status === "published" &&
      recipe.author && recipe.author.name &&
      recipe.ingredients.length >= 2 &&
      recipe.steps.length >= 2 &&
      typeof recipe.noKnownPrecautions === "boolean");
  });
  check("semilla sin duplicados", new Set(seed.recipes.map(function(r){ return r.id; })).size, 3);
})();

console.log("\n2. Validación del envío");
(function(){
  var valid = core.validateSubmission(validPayload(), { now: NOW });
  ok("envío válido", valid.ok);
  check("normaliza nombre completo", valid.data && valid.data.author.fullName, "Ana Pereyra");

  var noName = validPayload(); noName.author.firstName = "";
  var r1 = core.validateSubmission(noName, { now: NOW });
  ok("rechaza nombre vacío", !r1.ok && !!r1.errors.firstName);

  var badCategory = validPayload(); badCategory.recipe.category = "Inventada";
  var r2 = core.validateSubmission(badCategory, { now: NOW });
  ok("rechaza categoría inválida", !r2.ok && !!r2.errors.category);

  var fewIngredients = validPayload(); fewIngredients.recipe.ingredients = ["Solo una"];
  var r3 = core.validateSubmission(fewIngredients, { now: NOW });
  ok("rechaza menos de 2 ingredientes", !r3.ok && !!r3.errors.ingredients);

  var fewSteps = validPayload(); fewSteps.recipe.steps = ["Solo un paso"];
  var r4 = core.validateSubmission(fewSteps, { now: NOW });
  ok("rechaza menos de 2 pasos", !r4.ok && !!r4.errors.steps);

  var noPrecautions = validPayload(); noPrecautions.recipe.precautions = ""; noPrecautions.recipe.noKnownPrecautions = false;
  var r5 = core.validateSubmission(noPrecautions, { now: NOW });
  ok("exige precauciones o declaración", !r5.ok && !!r5.errors.precautions);

  var declared = noPrecautions; declared.recipe.noKnownPrecautions = true;
  var r6 = core.validateSubmission(declared, { now: NOW });
  ok("acepta declaración de no conocer precauciones", r6.ok);

  var noConsent = validPayload(); noConsent.consents.privacy = false;
  var r7 = core.validateSubmission(noConsent, { now: NOW });
  ok("exige los 3 consentimientos", !r7.ok && !!r7.errors.consents);

  var honeypot = validPayload(); honeypot.website = "spam";
  var r8 = core.validateSubmission(honeypot, { now: NOW });
  ok("rechaza honeypot", !r8.ok);

  var tooFast = validPayload(); tooFast.startedAt = NOW - 100;
  var r9 = core.validateSubmission(tooFast, { now: NOW });
  ok("rechaza envío instantáneo", !r9.ok);

  var longStory = validPayload(); longStory.recipe.story = "x".repeat(1001);
  var r10 = core.validateSubmission(longStory, { now: NOW });
  ok("rechaza experiencia demasiado larga", !r10.ok && !!r10.errors.story);

  var emailContact = validPayload(); emailContact.author.contact = "ana@example.com";
  var r11 = core.validateSubmission(emailContact, { now: NOW });
  ok("acepta correo de contacto opcional", r11.ok && r11.data.author.contact === "ana@example.com");

  var whatsappContact = validPayload(); whatsappContact.author.contact = "WhatsApp: +598 94 872 605";
  var r12 = core.validateSubmission(whatsappContact, { now: NOW });
  ok("acepta WhatsApp de contacto opcional", r12.ok && /\+598/.test(r12.data.author.contact));

  var badContact = validPayload(); badContact.author.contact = "consultas";
  var r13 = core.validateSubmission(badContact, { now: NOW });
  ok("rechaza contacto que no es email ni WhatsApp", !r13.ok && !!r13.errors.contact);

  var longContact = validPayload(); longContact.author.contact = "a".repeat(161);
  var r14 = core.validateSubmission(longContact, { now: NOW });
  ok("rechaza contacto demasiado largo", !r14.ok && !!r14.errors.contact);
})();

console.log("\n3. Creación y transiciones de estado");
(function(){
  var payloadWithContact = validPayload();
  payloadWithContact.author.contact = "ana@example.com";
  var valid = core.validateSubmission(payloadWithContact, { now: NOW });
  var recipe = core.createRecipe(valid.data, { now: NOW });
  check("contacto guardado en registro interno", recipe.author.contact, "ana@example.com");
  ok("id con formato esperado", /^rc-[a-z0-9-]{4,90}$/.test(recipe.id));
  check("nace pendiente", recipe.status, "pending");
  check("checklist inicia incompleto", core.checklistComplete(recipe.review), false);
  check("historial inicial", recipe.moderation.history.length, 1);

  ok("pending -> review", core.canTransition("pending", "review"));
  ok("pending no publica directo", !core.canTransition("pending", "published"));
  ok("review -> approved", core.canTransition("review", "approved"));
  ok("approved -> published", core.canTransition("approved", "published"));
  ok("published -> changes", core.canTransition("published", "changes"));
  ok("published no vuelve a approved", !core.canTransition("published", "approved"));
  ok("rejected -> review", core.canTransition("rejected", "review"));

  var review = { identification: true, ingredients: true, preparation: true, safety: true, communication: true };
  check("checklist completo", core.checklistComplete(review), true);

  var notReady = core.createRecipe(valid.data, { now: NOW });
  var toReview = core.applyAdminPatch(notReady, { status: "review" }, { now: NOW });
  var toApproved = core.applyAdminPatch(toReview.record, { status: "approved" }, { now: NOW });
  var publishIncomplete = core.applyAdminPatch(toApproved.record, { status: "published" }, { now: NOW });
  ok("no publica sin checklist", !publishIncomplete.ok);

  var noNote = core.applyAdminPatch(toReview.record, { status: "changes" }, { now: NOW });
  ok("pide motivo para cambios", !noNote.ok);
  var withNote = core.applyAdminPatch(toReview.record, { status: "changes", note: "Falta indicar proporción." }, { now: NOW });
  ok("acepta cambios con motivo", withNote.ok);

  var rejectNoNote = core.applyAdminPatch(notReady, { status: "rejected" }, { now: NOW });
  ok("pide motivo para rechazo", !rejectNoNote.ok);

  var checked = core.applyAdminPatch(notReady, { review: review }, { now: NOW });
  var checkedReview = core.applyAdminPatch(checked.record, { status: "review" }, { now: NOW });
  var checkedApproved = core.applyAdminPatch(checkedReview.record, { status: "approved" }, { now: NOW, note: "" });
  var published = core.applyAdminPatch(checkedApproved.record, { status: "published", note: "Publicación editorial." }, { now: NOW });
  ok("publica con checklist completo", published.ok);
  check("estado publicado", published.record.status, "published");
  ok("publishedAt definido", !!published.record.publishedAt);
  check("historial acumula estados", published.record.moderation.history.length, 4);

  var publicRecipe = core.toPublic(published.record);
  ok("toPublic devuelve receta publicada", !!publicRecipe);
  check("toPublic no expone consentimientos", "consents" in publicRecipe, false);
  check("toPublic no expone notas internas", "moderation" in publicRecipe, false);
  check("toPublic no expone contacto", "contact" in publicRecipe.author, false);
  check("toPublic no filtra el email de contacto", JSON.stringify(publicRecipe).indexOf("ana@example.com") === -1, true);
  check("toPublic conserva autor", publicRecipe.author.name, "Ana Pereyra");

  var afterChanges = core.applyAdminPatch(published.record, { status: "changes", note: "Revisar precauciones." }, { now: NOW });
  ok("despublica al pedir cambios", afterChanges.ok && core.toPublic(afterChanges.record) === null);
})();

console.log("\n4. Autenticación del panel");
(function(){
  var good = core.verifyAdminToken(event("secreto", "GET"), { ADMIN_TOKEN: "secreto" });
  var bad = core.verifyAdminToken(event("otro", "GET"), { ADMIN_TOKEN: "secreto" });
  var missing = core.verifyAdminToken(event("", "GET"), {});
  ok("acepta token correcto", good.ok);
  ok("rechaza token incorrecto", !bad.ok);
  ok("detecta ADMIN_TOKEN ausente", missing.missing === true);
})();

console.log("\n5. Integración en las páginas y configuración");
(function(){
  var recetas = fs.readFileSync(path.join(ROOT, "recetas.html"), "utf8");
  var index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  var historia = fs.readFileSync(path.join(ROOT, "historia.html"), "utf8");
  var saber = fs.readFileSync(path.join(ROOT, "saber.html"), "utf8");
  var gracias = fs.readFileSync(path.join(ROOT, "gracias.html"), "utf8");
  var productos = fs.readFileSync(path.join(ROOT, "productos.html"), "utf8");
  var notFound = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
  var admin = fs.readFileSync(path.join(ROOT, "admin-recetas.html"), "utf8");
  var template = fs.readFileSync(path.join(ROOT, "templates", "ficha-producto.html"), "utf8");
  var robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
  var netlify = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  var generate = fs.readFileSync(path.join(ROOT, "tools", "generate.js"), "utf8");
  var imagesJs = fs.readFileSync(path.join(ROOT, "tools", "images.js"), "utf8");
  var pagesCss = fs.readFileSync(path.join(ROOT, "asset", "pages.css"), "utf8");
  var baseCss = fs.readFileSync(path.join(ROOT, "asset", "base.css"), "utf8");
  var homeCss = fs.readFileSync(path.join(ROOT, "asset", "home.css"), "utf8");
  var communityCss = fs.readFileSync(path.join(ROOT, "asset", "comunidad.css"), "utf8");
  var communityJs = fs.readFileSync(path.join(ROOT, "js", "recetas-comunidad.js"), "utf8");
  var infoFormJs = fs.readFileSync(path.join(ROOT, "js", "info-form.js"), "utf8");
  var adminJs = fs.readFileSync(path.join(ROOT, "js", "admin-recetas.js"), "utf8");
  var carouselCss = fs.readFileSync(path.join(ROOT, "asset", "carousel.css"), "utf8");
  var recetasNav = recetas.slice(recetas.indexOf('<nav class="nav-mobile"'), recetas.indexOf("</nav>", recetas.indexOf('<nav class="nav-mobile"')) + 6);
  var templateNav = template.slice(template.indexOf('<nav class="nav-mobile"'), template.indexOf("</nav>", template.indexOf('<nav class="nav-mobile"')) + 6);

  ok("parchment-deep usa el nuevo color",
    /--color-parchment-deep:\s*#edece9/.test(baseCss));
  ok("conservación usa parchment-soft de fondo",
    /\.conservation\{[^}]*background:\s*var\(--color-parchment-soft\)/.test(pagesCss));
  ok("intro usa parchment-soft de fondo",
    /\.intro\{[^}]*background:\s*var\(--color-parchment-soft\)/.test(pagesCss));
  ok("técnicas y disclaimer usan parchment-deep de fondo",
    /\.techniques\{[^}]*background:\s*var\(--color-parchment-deep\)/.test(pagesCss) &&
    /\.disclaimer\{[^}]*background:\s*var\(--color-parchment-deep\)/.test(pagesCss));
  ok("recipe-kicker usa salvia claro con texto crema",
    /\.recipe-kicker\{[^}]*background:\s*var\(--color-salvia-claro\);[^}]*color:\s*var\(--color-parchment-soft\)/.test(pagesCss));
  ok("comunidad conserva su fondo verde",
    /\.community\{[^}]*background:[\s\S]*?var\(--cr-green\)/.test(communityCss) &&
    /--cr-green:\s*var\(--color-verde-suave\)/.test(communityCss));
  ok("conservación usa textos oscuros legibles",
    /\.conservation-item h3\{[^}]*color:\s*var\(--color-ink\)/.test(pagesCss) &&
    /\.conservation-item p\{[^}]*color:\s*var\(--color-body\)/.test(pagesCss));
  ok("beneficios usa texto legible sobre parchment-deep",
    /\.benefits \.section-head p\{[^}]*color:\s*var\(--color-body\)/.test(homeCss));
  ok("carrusel no impone tipografía al quote",
    !/\.carousel-quote\{[^}]*font-family/.test(carouselCss));
  ok("nav móvil agrupa Recetas en un acordeón",
    /id="mobileRecetasToggle"[^>]*aria-controls="mobileRecetasList"/.test(recetasNav));
  ok("nav móvil no duplica la entrada Recetas",
    (recetasNav.match(/>\s*Recetas\s*</g) || []).length === 1);
  ok("submenú móvil enlaza a /recetas",
    /<a href="\/recetas"[^>]*>Descubrir recetas<\/a>/.test(recetasNav));
  ok("nav móvil incluye Técnicas de preparación",
    /href="recetas\.html#tecnicas"[^>]*>Técnicas de preparación</.test(recetasNav));
  ok("nav móvil incluye Recetas caseras",
    /href="recetas\.html#recetas-caseras"[^>]*>Recetas caseras</.test(recetasNav));
  ok("nav móvil incluye Compartir mi receta",
    /href="recetas\.html\?compartir=1#recetas-comunidad"[^>]*>Compartir mi receta</.test(recetasNav));
  ok("submenú móvil respeta el orden solicitado",
    recetasNav.indexOf(">Descubrir recetas<") < recetasNav.indexOf(">Técnicas de preparación<") &&
    recetasNav.indexOf(">Técnicas de preparación<") < recetasNav.indexOf(">Recetas caseras<") &&
    recetasNav.indexOf(">Recetas caseras<") < recetasNav.indexOf(">Compartir mi receta<"));
  ok("nav móvil de fichas no duplica la entrada Recetas",
    (templateNav.match(/>\s*Recetas\s*</g) || []).length === 1);
  ok("submenú móvil de fichas enlaza a /recetas",
    /<a href="\/recetas"[^>]*>Descubrir recetas<\/a>/.test(templateNav));
  ok("nav móvil de fichas usa rutas relativas",
    /href="\.\.\/recetas\.html#tecnicas"[^>]*>Técnicas de preparación</.test(templateNav) &&
    /href="\.\.\/recetas\.html#recetas-caseras"[^>]*>Recetas caseras</.test(templateNav) &&
    /href="\.\.\/recetas\.html\?compartir=1#recetas-comunidad"[^>]*>Compartir mi receta</.test(templateNav));
  ok("submenú móvil de fichas respeta el orden solicitado",
    templateNav.indexOf(">Descubrir recetas<") < templateNav.indexOf(">Técnicas de preparación<") &&
    templateNav.indexOf(">Técnicas de preparación<") < templateNav.indexOf(">Recetas caseras<") &&
    templateNav.indexOf(">Recetas caseras<") < templateNav.indexOf(">Compartir mi receta<"));

  var heroStart = recetas.indexOf('<section class="recipes-hero feature-hero"');
  var heroEnd = recetas.indexOf("</section>", heroStart);
  var hero = recetas.slice(heroStart, heroEnd);
  var heroCtasStart = hero.indexOf('<div class="hero-ctas">');
  var heroCtasEnd = hero.indexOf("</div>", heroCtasStart);
  var heroCtas = hero.slice(heroCtasStart, heroCtasEnd);

  check("hero tiene 3 CTAs", (heroCtas.match(/class="btn btn-look"/g) || []).length, 3);
  ok("hero usa etiqueta corta Ver recetas", /class="hero-cta-label-short"[^>]*>Ver recetas<\/span>/.test(heroCtas));
  ok("hero usa etiqueta corta Técnicas", /class="hero-cta-label-short"[^>]*>Técnicas<\/span>/.test(heroCtas));
  ok("hero usa etiqueta corta Mi receta", /class="hero-cta-label-short"[^>]*>Mi receta<\/span>/.test(heroCtas));
  ok("hero comparte receta desde el tercer CTA",
    /<button[^>]*data-share-open[^>]*aria-label="Compartir mi receta"/.test(heroCtas));
  ok("hero oculta el eyebrow en mobile",
    /@media \(max-width: 639px\)\{[\s\S]*?\.feature-hero \.eyebrow-mark\{ display:none; \}/.test(pagesCss));
  ok("eyebrow-mark oculto globalmente en mobile",
    /@media \(max-width: 639px\)\{\s*\.eyebrow-mark\{ display:none; \}/.test(baseCss));
  ok("hero cambia a etiquetas cortas en mobile",
    /@media \(max-width: 639px\)\{[\s\S]*?\.feature-hero \.hero-cta-label-full\{ display:none; \}[\s\S]*?\.feature-hero \.hero-cta-label-short\{ display:inline; \}/.test(pagesCss));
  ok("hero mantiene los CTAs en una fila y con el color claro",
    /\.feature-hero \.hero-ctas\{[\s\S]*?color:var\(--color-parchment-soft\);[\s\S]*?display:flex;[\s\S]*?flex-wrap:nowrap;[\s\S]*?justify-content:center;[\s\S]*?gap:0\.5rem;[\s\S]*?margin-top:var\(--space-3\);/.test(pagesCss));
  ok("hero comparte el hover del btn-look",
    /\.feature-hero \.hero-ctas \.btn-look\{ color:var\(--color-parchment-soft\); \}/.test(pagesCss) &&
    /\.feature-hero \.hero-ctas \.btn-look:hover\{ color:var\(--color-black\); \}/.test(pagesCss));
  ok("hero usa la misma tipografía y el mismo lead",
    /\.feature-hero \.hero-content h1\{[\s\S]*?font-size:var\(--fs-hero\);[\s\S]*?margin-top:var\(--space-2\);/.test(pagesCss) &&
    /\.page-hero \.hero-lead,\s*\.feature-hero \.lead\{[\s\S]*?margin-top: var\(--space-2\);[\s\S]*?color: rgba\(250, 243, 227, 0\.92\);[\s\S]*?font-size: var\(--fs-lead\);[\s\S]*?max-width: 56ch;[\s\S]*?margin-inline:auto;/.test(pagesCss));
  ok("hero usa el mismo overlay, imagen y padding",
    /\.feature-hero \.hero-overlay\{[\s\S]*?rgba\(28,19,10,0\.86\)/.test(pagesCss) &&
    /\.feature-hero \.hero-content\{[\s\S]*?min-height:66vh;[\s\S]*?padding: calc\(var\(--space-5\) \+ 2rem\) var\(--space-2\) var\(--space-5\);/.test(pagesCss) &&
    /@media \(min-width: 1000px\)\{[\s\S]*?\.feature-hero \.hero-content\{ min-height:74vh;/.test(pagesCss));
  ok("catálogo hereda el hero compartido sin fondo duplicado",
    /\.catalog-hero\.page-hero\{ padding-block:0; background-image:none; \}/.test(pagesCss) &&
    /\.catalog-hero\.page-hero::before\{ display:none; \}/.test(pagesCss));
  ok("eyebrow compartido no hereda la sombra de home.css",
    /\.feature-hero \.hero-text \.eyebrow-mark\{ color:var\(--color-gold\); text-shadow:none; \}/.test(pagesCss));
  ok("no quedan reglas duplicadas de heroes",
    !/\.recipes-hero /.test(pagesCss) && !/\.catalog-hero \.hero-ctas \.btn-look/.test(pagesCss));
  ok("las migas del hero son solo de escritorio",
    /\.crumbs-hero\{ display:none; \}/.test(pagesCss) &&
    /@media \(min-width: 640px\)\{[\s\S]*?\.crumbs-hero\{ display:flex; \}/.test(pagesCss));
  ok("los CTAs del hero son iguales en escritorio",
    /@media \(min-width: 640px\)\{[\s\S]*?\.feature-hero \.hero-ctas \.btn\{ flex:1 1 0; font-size:var\(--fs-small\); padding:0\.8em 0\.75em; white-space:nowrap; \}/.test(pagesCss));
  ok("recetas usa el hero compartido y migas de escritorio",
    /<section class="recipes-hero feature-hero"/.test(recetas) &&
    /<nav class="crumbs crumbs-hero" aria-label="Migas de pan"/.test(recetas));

  ok("recetas tiene la sección comunidad", /id="recetas-comunidad"/.test(recetas));
  ok("recetas carga recetas_.js", /js\/recetas_\.js\?v=/.test(recetas));
  ok("recetas carga recetas-comunidad.js", /js\/recetas-comunidad\.js\?v=/.test(recetas));
  ok("recetas carga comunidad.css", /asset\/comunidad\.css/.test(recetas));
  ok("focus del formulario de comunidad no compite con el ancla",
    /function focusWithoutScroll[\s\S]*?item\.focus\(\{ preventScroll: true \}\)/.test(communityJs) &&
    !/\.focus\(\);/.test(communityJs));
  ok("focus del modal de contacto no mueve el scroll de fondo",
    /firstField\.focus\(\{ preventScroll: true \}\)/.test(infoFormJs));
  var allCss = [baseCss, homeCss, pagesCss, communityCss, carouselCss].join("\n");
  var definedTokens = {};
  (allCss.match(/(--[A-Za-z0-9_-]+)\s*:/g) || []).forEach(function(token){
    definedTokens[token.split(":")[0].trim()] = true;
  });
  var missingTokens = [];
  (allCss.match(/var\((--[A-Za-z0-9_-]+)/g) || []).forEach(function(token){
    var name = token.slice(4);
    if (!definedTokens[name]) missingTokens.push(name);
  });
  ok("tokens CSS sin referencias rotas",
    missingTokens.length === 0 &&
    !/var\(----/.test(allCss) &&
    !/--bg_global-celeste/.test(allCss) &&
    /--border-frame2:\s*3px solid var\(--color-forest\)/.test(baseCss) &&
    /--bg-global-celeste:\s*[^;]*(?:#E9F0E7|var\(--color-verde-suave\))/.test(baseCss));
  ok("fondos alternados usan el token correcto",
    /\.products\{[^}]*background:\s*var\(--bg-global-celeste\)/.test(homeCss) &&
    /\.techniques\{[^}]*background:\s*var\(--color-parchment-deep\)/.test(pagesCss) &&
    /\.recipes\{[^}]*background:\s*var\(--color-parchment-soft\)/.test(pagesCss));
  ok("historia y saber comparten hero y color de acento",
    /<section class="page-hero wrap">\s*<div class="hero-content">/.test(historia) &&
    /<section class="page-hero wrap">\s*<div class="hero-content">/.test(saber) &&
    /\.hero-content h1\{ font-size: var\(--fs-hero\); \}/.test(pagesCss) &&
    /\.page-hero h1 span\{ color: var\(--color-parchment-soft\); \}/.test(pagesCss));
  ok("eyebrow de page-hero se oculta en mobile",
    /@media \(max-width: 639px\)\{[\s\S]*?\.page-hero \.eyebrow-mark\{ display:none; \}/.test(pagesCss));
  ok("CTA de historia y saber usa hero-ctas y btn-primary",
    [historia, saber].every(function(page){
      var foldStart = page.search(/<section class="cta-fold(?: saber-cta)? wrap"[^>]*>/);
      var fold = page.slice(foldStart, page.indexOf("</section>", foldStart));
      return /<div class="hero-ctas">/.test(fold) &&
             (fold.match(/class="btn btn-primary"/g) || []).length === 2 &&
             !/btn-outline/.test(fold);
    }) &&
    /\.cta-fold \.hero-ctas\{/.test(pagesCss) &&
    /\.cta-fold \.hero-ctas \.btn\{/.test(pagesCss) &&
    /\.btn-primary:hover\{ background: var\(--color-crema\); color: var\(--color-black\);\}/.test(baseCss));
  var saberBlock = pagesCss.slice(
    pagesCss.indexOf("/* ==================== saber.html ==================== */"),
    pagesCss.indexOf("/* ==================== gracias.html ==================== */")
  );
  ok("saber usa stats semánticas y tipografía sobria",
    /<dl class="stats-row">/.test(saber) &&
    (saber.match(/<dt class="stat-num">/g) || []).length === 4 &&
    (saber.match(/<dd class="stat-label">/g) || []).length === 4 &&
    !/<div class="stat-card"/.test(saber) &&
    /\.stats-row\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(pagesCss) &&
    /\.stat dt\{[^}]*font-family:var\(--font-body\)/.test(pagesCss) &&
    !/(--color-terracotta|font-family:\s*var\(--font-display\))/.test(saberBlock));
  ok("tech-card usa borde de acento compartido",
    /\.tech-card\{[^}]*border:\s*1px solid var\(--cr-border\);[^}]*border-left:\s*4px solid var\(--color-forest-accent\);/.test(pagesCss));
  ok("parchment-soft sigue como superficie clara canónica",
    /--color-parchment-soft:\s*#FAF3E3/.test(baseCss) &&
    /\.tech-card\{[^}]*background:\s*var\(--color-parchment-soft\)/.test(pagesCss));
  var accordionStart = saber.indexOf('<div class="accordion"');
  var accordionHtml = saber.slice(accordionStart, saber.indexOf('<section class="seasonal-wrap"', accordionStart));
  ok("acordeón de saber usa details nativos y tokens compartidos",
    (accordionHtml.match(/<details class="acc-item" name="saber">/g) || []).length === 5 &&
    (accordionHtml.match(/<summary class="acc-trigger">/g) || []).length === 5 &&
    !/aria-expanded=/.test(accordionHtml) &&
    !/<button class="acc-trigger"/.test(accordionHtml) &&
    /--fs-acc-trigger:\s*clamp\(/.test(baseCss) &&
    /\.acc-trigger h3\{[^}]*font-size:var\(--fs-acc-trigger\)/.test(pagesCss) &&
    /\.acc-item\[open\] \.acc-icon\{[^}]*transform:rotate\(45deg\)/.test(pagesCss));
  ok("plantas de temporada son compactas y crecen sin JS",
    /<section class="seasonal-wrap" aria-labelledby="saber-seasonal-heading">/.test(saber) &&
    /\.plant-card\{[^}]*grid-template-columns:clamp\(84px, 24vw, 120px\)/.test(pagesCss) &&
    /@media \(min-width:560px\)\{[\s\S]*?\.seasonal-grid\{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(pagesCss) &&
    /@media \(min-width:1000px\)\{[\s\S]*?\.plant-card\{ display:flex; flex-direction:column/.test(pagesCss) &&
    pagesCss.indexOf("cierre mobile-first") > pagesCss.indexOf(".catalog-index"));
  ok("imágenes de saber usan srcset responsive y variantes -480",
    (saber.match(/<img src="img\/[^"]+-480\.webp"/g) || []).length === 4 &&
    (saber.match(/srcset="img\/[^"]+-480\.webp 480w, img\/[^"]+\.webp 1200w"/g) || []).length === 4 &&
    (saber.match(/sizes="\(min-width: 1000px\) 260px, \(min-width: 560px\) 320px, 120px"/g) || []).length === 4 &&
    (saber.match(/width="1200" height="(?:788|798|900)"/g) || []).length === 4 &&
    (saber.match(/decoding="async" fetchpriority="low"/g) || []).length === 4 &&
    !/class="plant-media img-toned"/.test(saber) &&
    /SMALL_WIDTH = 480/.test(imagesJs) &&
    /-480\.webp/.test(imagesJs));
  ok("SEO de saber incluye OG, Twitter y datos estructurados",
    /<meta property="og:locale" content="es_UY">/.test(saber) &&
    /<meta property="og:image:width" content="1200">/.test(saber) &&
    /<meta name="twitter:card" content="summary_large_image">/.test(saber) &&
    /<script type="application\/ld\+json">/.test(saber) &&
    /"@type": "WebPage"/.test(saber) &&
    /"@type": "BreadcrumbList"/.test(saber) &&
    !/FAQPage/.test(saber));
  ok("temporada vuelve al pergamino base",
    /\.seasonal-wrap\{[^}]*background: var\(--color-parchment\); \}/.test(pagesCss));
  ok("disclaimer mantiene franja completa y borde verde",
    /<section class="disclaimer" aria-labelledby="disclaimer-heading">/.test(recetas) &&
    !/class="disclaimer wrap"/.test(recetas) &&
    /\.disclaimer-card\{ border: var\(--border-frame2\)/.test(pagesCss));
  var disclaimerStart = recetas.indexOf('<section class="disclaimer"');
  var disclaimerSection = recetas.slice(disclaimerStart, recetas.indexOf("</section>", disclaimerStart));
  ok("disclaimer mantiene el contenido dentro de wrap",
    /<div class="wrap">\s*<div class="disclaimer-card/.test(disclaimerSection));
  ok("CTA e info-request vuelven al padding compacto",
    /\.cta-recipes\{[^}]*padding-block: var\(--space-3\);[^}]*\}/.test(pagesCss) &&
    /\.info-request\{[^}]*padding-block: var\(--space-3\);[^}]*\}/.test(pagesCss));
  ok("CTA e info-request usan parchment-soft",
    /\.cta-recipes\{[^}]*background:\s*var\(--color-parchment-soft\)/.test(pagesCss) &&
    /\.info-request\{[^}]*background:\s*var\(--color-parchment-soft\)/.test(pagesCss));
  ok("CTA e info-request comparten estilo de párrafo",
    /\.cta-card p,\s*\.info-request-card > p\{[^}]*margin-inline:\s*auto;[^}]*margin-top:\s*var\(--space-2\);[^}]*color:\s*var\(--color-body-soft\);[^}]*max-width:\s*46ch;[^}]*font-size:\s*var\(--fs-small\);/.test(pagesCss));
  ok("CTA e info-request sin bordes",
    !/\.cta-card\{[^}]*border:/.test(pagesCss) &&
    !/\.info-request-card\{[^}]*border:/.test(pagesCss));
  ok("contacto usa tipografía h3",
    /#contact-order-heading\{ font-size:var\(--fs-h3\); \}/.test(homeCss));
  ok("comunidad usa la tipografía h2 compartida",
    /\.community h2\{[\s\S]*?font-size: var\(--fs-h2\);/.test(communityCss));
  var communityActions = (recetas.match(/<div class="community-actions">[\s\S]*?<\/div>/g) || []).join("\n");
  ok("acciones de comunidad usan btn-look",
    (communityActions.match(/class="btn btn-look"/g) || []).length === 3 &&
    !/community-btn-(primary|outline)/.test(communityActions));
  ok("acciones de comunidad replican al teaser del index",
    /\.community-actions\{ display: flex; flex-wrap: nowrap; gap: 0\.5rem; margin-top: 1\.5rem; \}/.test(communityCss) &&
    /\.community-actions \.btn\{[\s\S]*?flex: 1 1 0;[\s\S]*?min-width: 0;[\s\S]*?padding: 0\.3em 1\.1em;[\s\S]*?font-size: var\(--fs-small\);[\s\S]*?white-space: normal;[\s\S]*?text-align: center;[\s\S]*?line-height: 1\.2;/.test(communityCss) &&
    /\.community-actions \.btn-look\{ color: var\(--color-forest-accent\); border-color: color-mix\(in srgb, var\(--color-crema\) 55%, transparent\); \}/.test(communityCss) &&
    /@media \(min-width: 760px\)\{[\s\S]*?\.community-actions\{ justify-content: flex-end; \}[\s\S]*?\.community-actions \.btn\{ flex: 0 1 auto; padding: 0\.7em 1\.2em; \}/.test(communityCss) &&
    /\.community-cta \.btn-look\{ background: var\(--color-forest-accent\); border-color: var\(--color-parchment-soft\); color: var\(--color-parchment-soft\); \}/.test(communityCss) &&
    /\.community-cta \.btn-look:hover\{ background: var\(--color-parchment-soft\); border-color: var\(--color-forest-accent\); color: var\(--color-forest-accent\); \}/.test(communityCss));
  ["shareDialog", "shareConfirmDialog", "shareCancelDialog", "shareSuccessDialog", "shareErrorDialog"].forEach(function(id){
    ok("diálogo presente: " + id, new RegExp('id="' + id + '"').test(recetas));
  });
  ok("formulario único con secciones y error unificado",
    /id="shareForm"/.test(recetas) &&
    /id="shareFormError"/.test(recetas) &&
    (recetas.match(/class="community-form-section"/g) || []).length === 2 &&
    /class="community-section-title"/.test(recetas));
  ok("sin navegación por pasos ni checkbox de autoría",
    !/shareStep1|shareStep2|shareProgress|shareNext|shareBack|shareConsentAuthorship/.test(recetas) &&
    !/id="shareSubmit"[^>]*hidden/.test(recetas));
  ok("ayudas de ingredientes y pasos antes de los inputs",
    recetas.indexOf('id="ingredientHelp"') < recetas.indexOf('id="ingredientInput"') &&
    recetas.indexOf('id="stepHelp"') < recetas.indexOf('id="stepInput"'));
  ok("contacto opcional con aviso interno",
    /id="shareContact"/.test(recetas) &&
    /Medio de contacto <em>\(opcional\)<\/em>/.test(recetas) &&
    /No será publicado ni compartido\./.test(recetas));
  ok("consentimientos visibles: revisión y privacidad",
    /shareConsentReview/.test(recetas) && /shareConsentPrivacy/.test(recetas) && !/shareConsentAuthorship/.test(recetas));
  ok("autoría implícita al enviar", /Al enviar, confirmás que la receta es tuya/.test(recetas) && /authorship: true/.test(communityJs));
  ok("JS usa una sola validación", /function validateForm\(\)/.test(communityJs) && !/validateStep|showStep|shareConsentAuthorship/.test(communityJs));
  ok("bloque de revisión y contacto en comunidad", /Revisión y contacto con colaboradores/.test(recetas) && /Todas las recetas compartidas/.test(recetas));
  ok("confirmación resume el contacto opcional", /si dejaste un medio de contacto/.test(recetas) && /shareConfirmSummary/.test(recetas));
  ok("éxito ofrece modificación y baja por email", /mailto:dorilanatural@gmail\.com/.test(recetas) && /bajar tu receta publicada/.test(recetas));
  ok("admin muestra contacto como interno", /Medio de contacto \(interno\)/.test(adminJs));
  var exportBlock = adminJs.slice(adminJs.indexOf("function exportPublished"), adminJs.indexOf("function exportPublished") + 1400);
  ok("export estático no incluye contacto", !/\bcontact\b/.test(exportBlock));
  ok("modal ancho con secciones y aviso de autoría",
    /width: min\(860px/.test(communityCss) &&
    /\.community-form-section\{[^}]*border-top/.test(communityCss) &&
    /\.community-consent-note\{/.test(communityCss));

  var selectStart = recetas.indexOf('id="shareCategory"');
  var selectEnd = recetas.indexOf("</select>", selectStart);
  var selectHtml = recetas.slice(selectStart, selectEnd);
  var options = (selectHtml.match(/<option value="([^"]+)"/g) || []).map(function(tag){
    return tag.replace(/<option value="|"/g, "");
  });
  check("select con 14 categorías", options.length, 14);
  ok("select tiene opción vacía inicial", /<option value="">Elegí una categoría<\/option>/.test(selectHtml));
  check("categorías del select coinciden con el core", options.filter(Boolean), core.CATEGORIES);

  ok("index tiene teaser comunidad", /class="community-teaser"/.test(index));
  ok("index enlaza al formulario", /recetas\.html\?compartir=1#recetas-comunidad/.test(index));
  ok("admin es noindex", /name="robots" content="noindex, nofollow, noarchive"/.test(admin));
  ok("admin carga su JS", /js\/admin-recetas\.js\?v=/.test(admin));
  ok("admin tiene puerta de token", /id="adminTokenForm"/.test(admin) && /id="adminToken"/.test(admin));

  var privacyFiles = ["index.html", "productos.html", "historia.html", "saber.html", "recetas.html", "gracias.html", "404.html", "templates/ficha-producto.html"];
  privacyFiles.forEach(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    ok("privacidad actualizada: " + file,
      /Netlify Blobs/.test(html) &&
      /Datos de contacto opcionales/.test(html) &&
      /No se publica ni se comparte/.test(html) &&
      /dorilanatural@gmail\.com/.test(html) &&
      !/no los guarda ni los almacena en ningún servidor propio/.test(html));
  });

  ok("robots bloquea admin", /Disallow: \/admin-recetas\.html/.test(robots));
  ok("netlify.toml protege admin", /for = "\/admin-recetas\.html"/.test(netlify) && /X-Robots-Tag/.test(netlify));
  ok("generate.js incluye admin", /ROOT_PAGES = \[[^\]]*admin-recetas\.html/.test(generate));
  ok("admin no entra al sitemap", /mainPages = \["", "productos\/", "historia\.html", "saber\.html", "recetas\.html", "gracias\.html"\]/.test(generate));

  var productosPage = productos;
  var sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  var appJs = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");
  var shellJs = fs.readFileSync(path.join(ROOT, "js", "shell.js"), "utf8");
  var edgeCatalogo = fs.readFileSync(path.join(ROOT, "netlify", "edge-functions", "canonical-productos.js"), "utf8");

  ok("productos.html existe y es indexable", /<meta name="robots" content="index, follow">/.test(productosPage));
  ok("productos.html tiene canonical propio", /rel="canonical" href="https:\/\/dorila\.netlify\.app\/productos\/"/.test(productosPage));
  ok("productos.html carga el catálogo completo", /id="productGrid"/.test(productosPage) && /js\/productos\.js\?v=/.test(productosPage) && /js\/app\.js\?v=/.test(productosPage) && /asset\/base\.css\?v=/.test(productosPage));
  ok("productos.html no linkea la variante .html", !/href="productos\.html"/.test(productosPage) && !/productos\.html<\/loc>/.test(sitemap));
  ok("hero de productos usa el hero compartido",
    /<section class="page-hero catalog-hero feature-hero"/.test(productosPage) &&
    /<div class="hero-media">[\s\S]*?<img[\s\S]*?src="\/?img\/montes_bg\.webp"[\s\S]*?fetchpriority="high"/.test(productosPage) &&
    /<p class="hero-lead">/.test(productosPage) &&
    /<div class="hero-ctas">[\s\S]*?class="btn btn-look"/.test(productosPage));
  ok("catálogo quitó el span del h1",
    /<h1 id="catalog-heading">Todos nuestros productos<\/h1>/.test(productosPage));
  ok("migas de productos van antes del hero y son compartidas",
    /<nav class="crumbs crumbs-hero" aria-label="Migas de pan">/.test(productosPage) &&
    productosPage.indexOf('class="crumbs crumbs-hero"') < productosPage.indexOf('class="page-hero catalog-hero feature-hero"'));
  check("productos.html ofrece índice estático de todas las fichas",
    (productosPage.match(/href="\/productos\/[^"]+\.html"/g) || []).length, PRODUCTS.length);
  ok("productos.html no limita los resultados", !/id="productGrid"[^>]*data-limit=/.test(productosPage));
  ok("productos.html usa URLs root-relative bajo /productos/",
    /<script src="\/js\/productos\.js\?v=[0-9a-f]{8}"/.test(productosPage) &&
    /<script src="\/js\/app\.js\?v=[0-9a-f]{8}"/.test(productosPage) &&
    /<link rel="stylesheet" href="\/asset\/base\.css\?v=[0-9a-f]{8}"/.test(productosPage) &&
    /src="\/img\/montes_bg\.webp"/.test(productosPage) &&
    !/(?:src|href)="(?:js|asset|img|productos)\//.test(productosPage));
  ok("app.js normaliza imágenes del catálogo a root-relative",
    /function siteUrl\(src\)/.test(appJs) &&
    /return "\/" \+ value/.test(appJs) &&
    /return siteUrl\(String\(src \|\| ""\)\.replace/.test(appJs) &&
    /modalImg\.src = siteUrl\(p\.img\)/.test(appJs));
  ok("grid usa content-visibility", /\.product-card\{[^}]*content-visibility:auto/.test(homeCss));
  ok("badge de toxicidad se reduce en móvil",
    /@media \(max-width: 639px\)\{[\s\S]*?\.product-card \.tox-badge\{[^}]*font-size:\s*0\.68rem/.test(homeCss));
  ok("badge sigue generándose en la tarjeta",
    /<span class=\\"tox-badge "/.test(appJs));
  ok("grid usa thumbnails sin data-src", /function buildCardImg/.test(appJs) && !/appendChild\(buildLazyImg/.test(appJs));
  ok("búsqueda usa debounce", /var scheduleRender = debounce\(render, 150\)/.test(appJs));
  ok("deep link canoniza la ficha", /function setDeepLinkCanonical/.test(appJs));
  ok("index limita los destacados a 8", /id="productGrid" data-limit="8"/.test(index));
  var categorySection = index.slice(index.indexOf('<div class="category-grid"'), index.indexOf("</section>", index.indexOf('<div class="category-grid"')));
  ok("categorías sin aria-label redundante en la flecha decorativa",
    (categorySection.match(/class="category-links" aria-hidden="true"/g) || []).length === 12 &&
    !/class="category-links"[^>]*aria-label=/.test(categorySection));
  ok("12 íconos de categoría usan SVG inline homogéneo",
    (categorySection.match(/<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1\.6"/g) || []).length === 12 &&
    !/<img\b/.test(categorySection));
  ok("PNG de lotus sin uso eliminado", !fs.existsSync(path.join(ROOT, "img", "icons", "icons83-lotus-100.png")));
  var media640 = homeCss.slice(homeCss.indexOf("@media (min-width:640px){"), homeCss.indexOf("@media (min-width:768px){"));
  ok("categorías mantienen 2 columnas hasta 768px",
    /\.category-grid\{ display:grid; gap:0\.45rem; grid-template-columns:repeat\(2,1fr\); \}/.test(homeCss) &&
    /@media \(min-width:768px\)\{[\s\S]*?\.category-grid\{ grid-template-columns:repeat\(3,1fr\); gap:var\(--space-2\); \}/.test(homeCss) &&
    !/\.category-grid\{ grid-template-columns:repeat\(3,1fr\)/.test(media640));
  ok("h2 de historia usa token clamp sin estilo inline",
    /<h2 id="historia-heading">/.test(index) &&
    !/<h2 id="historia-heading"[^>]*style=/.test(index) &&
    /#historia-heading\{ font-family:var\(--font-display\); font-size:var\(--fs-h2\); color:var\(--color-ink\); margin-top:0\.6rem; \}/.test(homeCss));
  ok("galería inicializa 4 productos y carga 4 más hasta 8",
    /id="productGrid" data-limit="8"/.test(index) &&
    /id="loadMoreProducts"/.test(index) &&
    /var INITIAL_VISIBLE = 4;/.test(appJs) &&
    /var PAGE_SIZE = 4;/.test(appJs) &&
    /visibleCount \+= PAGE_SIZE/.test(appJs) &&
    /Math\.min\(visibleCount, previewTotal\)/.test(appJs));
  ok("skeleton loader marca la grid como ocupada y respeta movimiento reducido",
    /function showSkeleton/.test(appJs) &&
    /grid\.setAttribute\("aria-busy", "true"\)/.test(appJs) &&
    /grid\.removeAttribute\("aria-busy"\)/.test(appJs) &&
    /product-card is-skeleton/.test(appJs) &&
    /@keyframes shimmer/.test(homeCss) &&
    /\.product-card\.is-skeleton/.test(homeCss) &&
    /prefers-reduced-motion: reduce/.test(homeCss));
  ok("modal muestra categoría y precio", /id="modalCat"/.test(index) && /id="modalPrice"/.test(index));
  ok("modal incluye productos relacionados", /id="modalRelatedWrap"/.test(index) && /id="modalRelated"/.test(index));
  ok("app.js renderiza relacionados y limita la home", /function renderRelated/.test(appJs) && /dataset\.limit/.test(appJs));
  ok("app.js oculta y deshabilita el carrito sin stock",
    /function hasStock[\s\S]*?Number\(p\.stock\) > 0/.test(appJs) &&
    /var disponible = hasStock\(p\)/.test(appJs) &&
    /addBtn\.hidden = !disponible/.test(appJs) &&
    /addBtn\.disabled = !disponible/.test(appJs));
  ok("app.js excluye EXTREMA de relacionados", /r\.toxicidad !== "EXTREMA"/.test(appJs));
  ok("app.js rechaza clics en productos no vendibles",
    /if \(!hasStock\(p\)\) return false/.test(appJs) &&
    /function hasStock[\s\S]*?!!p && !!p\.vendible && Number\(p\.stock\) > 0/.test(appJs));
  ok("app.js soporta enlaces profundos de producto y categoría", /get\("p"\)/.test(appJs) && /get\("categoria"\)/.test(appJs));
  ok("nav desktop incluye enlace directo a /recetas y trigger accesible",
    /<a href="\/recetas">Recetas<\/a>/.test(index) &&
    /<button class="dropdown-toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="desktopRecetasMenu"/.test(index));
  ok("edge function canoniza /productos y /productos.html sin loop",
    /path: \["\/productos", "\/productos\.html"\]/.test(edgeCatalogo) &&
    /const CANONICAL_PATH = "\/productos\/"/.test(edgeCatalogo) &&
    /const SOURCE_PATH = "\/productos\.html"/.test(edgeCatalogo) &&
    /const REWRITE_FLAG = "__productos_rewrite"/.test(edgeCatalogo) &&
    /url\.searchParams\.has\(REWRITE_FLAG\)/.test(edgeCatalogo) &&
    /return context\.next\(new Request\(url\.toString\(\)/.test(edgeCatalogo) &&
    /if \(url\.pathname === CANONICAL_PATH\)/.test(edgeCatalogo) &&
    /return rewrite/.test(edgeCatalogo) &&
    /url\.pathname = CANONICAL_PATH/.test(edgeCatalogo) &&
    /Response\.redirect\(url\.toString\(\), 301\)/.test(edgeCatalogo));
  ok("netlify.toml redirige /recetas",
    /from = "\/recetas"[\s\S]*?to = "\/recetas\.html"[\s\S]*?status = 301[\s\S]*?force = true/.test(netlify));
  ok("netlify.toml cachea JS y CSS con versión",
    /for = "\/js\/\*"[\s\S]*?Cache-Control = "public, max-age=31536000, immutable"/.test(netlify) &&
    /for = "\/asset\/\*"[\s\S]*?Cache-Control = "public, max-age=31536000, immutable"/.test(netlify) &&
    (netlify.match(/Cache-Control = "public, max-age=31536000, immutable"/g) || []).length === 2);
  ok("shell.js alterna el dropdown con clic, aria-expanded y cierre diferido",
    /dropdown-toggle/.test(shellJs) &&
    /setOpen\(!li\.classList\.contains\("is-open"\)\)/.test(shellJs) &&
    /setTimeout\(function\(\)\{ setOpen\(false\)/.test(shellJs));
  ok("shell.js sincroniza aria-expanded en menú, acordeones y dropdowns",
    /menuToggle\.setAttribute\("aria-expanded", "true"\)/.test(shellJs) &&
    /menuToggle\.setAttribute\("aria-expanded", "false"\)/.test(shellJs) &&
    /toggle\.setAttribute\("aria-expanded", open \? "true" : "false"\)/.test(shellJs) &&
    /btn\.setAttribute\("aria-expanded", isOpen \? "true" : "false"\)/.test(shellJs));
  ok("todas las fuentes públicas acreditan a Kikiriya-DevOps",
    [index, productosPage, historia, saber, recetas, gracias, notFound, template].every(function(html){
      return /Un proyecto desarrollado con dedicación por/.test(html) &&
        /href="https:\/\/kikiriya-devops\.netlify\.app\/"/.test(html) &&
        /Kikiriya-DevOps<\/a>/.test(html);
    }));
  ok("footer enlaza Envíos y garantía", /Envíos y garantía/.test(index) && /Envíos y garantía/.test(productosPage));
  ok("404 es noindex y vuelve al inicio", /name="robots" content="noindex, follow"/.test(notFound) && /href="index\.html"/.test(notFound));
  ok("sitemap incluye /productos/ y excluye 404/admin", /productos\/<\/loc>/.test(sitemap) && !/productos\.html<\/loc>/.test(sitemap) && !/404\.html<\/loc>/.test(sitemap) && !/admin-recetas\.html<\/loc>/.test(sitemap));
  ok("buscador apunta a /productos/", /DORILA_SEARCH_TARGET \|\| "\/productos\/"/.test(shellJs));
})();

console.log("\n6. Sintaxis de JavaScript nuevo");
(function(){
  [
    "js/recetas_.js",
    "js/recetas-comunidad.js",
    "js/admin-recetas.js",
    "netlify/functions/recetas-submit.js",
    "netlify/functions/recetas-public.js",
    "netlify/functions/recetas-admin.js",
    "netlify/functions/_lib/recetas-core.js",
    "netlify/functions/_lib/recetas-http.js"
  ].forEach(function(file){
    try {
      new vm.Script(fs.readFileSync(path.join(ROOT, file), "utf8"), { filename: file });
      ok("sintaxis válida: " + file, true);
    } catch (error){
      failed++;
      console.log("  FAIL sintaxis: " + file + "\n         " + error.message);
    }
  });
})();

console.log("\n7. Orden, enlaces y navegación del sitio");
(function(){
  var recetasPage = fs.readFileSync(path.join(ROOT, "recetas.html"), "utf8");
  var indexPage = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  var pagesCss = fs.readFileSync(path.join(ROOT, "asset", "pages.css"), "utf8");
  var baseCss = fs.readFileSync(path.join(ROOT, "asset", "base.css"), "utf8");
  var homeCss = fs.readFileSync(path.join(ROOT, "asset", "home.css"), "utf8");
  var markers = [
    'class="recipes-hero feature-hero" id="top"',
    'class="intro wrap" id="intro"',
    'class="techniques" id="tecnicas"',
    'class="conservation" id="conservacion"',
    'class="disclaimer"',
    'class="recipes wrap" id="recetas-caseras"',
    'class="community" id="recetas-comunidad"',
    'class="info-request wrap" id="solicitar-info"'
  ];
  var last = -1;
  var ordered = markers.every(function(marker){
    var at = recetasPage.indexOf(marker);
    if (at <= last) return false;
    last = at;
    return true;
  });
  ok("recetas.html respeta el orden solicitado", ordered);
  ok("recetas.html usa el id específico recetas-caseras",
    /id="recetas-caseras"/.test(recetasPage) && !/id="recetas"/.test(recetasPage));
  ok("solicitar-info usa el mismo btn-primary que contacto",
    /id="solicitar-info"[\s\S]*?<button class="btn btn-primary" type="button" data-contact-open>/.test(recetasPage) &&
    /id="contacto"[\s\S]*?<button class="btn btn-primary" type="button" data-contact-open>/.test(indexPage));
  ok("pages.css no redefine btn-primary", !/\.btn-primary\s*\{/.test(pagesCss));

  var sourcePages = ["index.html", "productos.html", "historia.html", "saber.html", "recetas.html", "gracias.html", "404.html", "templates/ficha-producto.html"];
  var REDIRECTS = { "hierba-de-san-juan.html": true };
  var productFiles = fs.readdirSync(path.join(ROOT, "productos")).filter(function(file){
    return /\.html$/.test(file) && !REDIRECTS[file];
  });
  var allPages = sourcePages.concat(productFiles.map(function(file){ return "productos/" + file; }));
  var missing = allPages.filter(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    var desktopStart = html.indexOf('<nav class="nav-desktop"');
    var mobileStart = html.indexOf('<nav class="nav-mobile"');
    var desktop = html.slice(desktopStart, html.indexOf("</nav>", desktopStart));
    var mobile = html.slice(mobileStart, html.indexOf("</nav>", mobileStart));
    return !/<a href="\/recetas"/.test(desktop) || !/<a href="\/recetas"/.test(mobile);
  });
  ok("todas las páginas llevan /recetas en ambos navs", missing.length === 0);
  if (missing.length) console.log("         faltan: " + missing.join(", "));
  var duplicated = allPages.filter(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    var mobileStart = html.indexOf('<nav class="nav-mobile"');
    var mobile = html.slice(mobileStart, html.indexOf("</nav>", mobileStart));
    return (mobile.match(/>\s*Recetas\s*</g) || []).length !== 1;
  });
  ok("una sola entrada Recetas por nav móvil", duplicated.length === 0);
  if (duplicated.length) console.log("         duplicados: " + duplicated.join(", "));
  var submenuDrift = allPages.filter(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    var mobileStart = html.indexOf('<nav class="nav-mobile"');
    var mobile = html.slice(mobileStart, html.indexOf("</nav>", mobileStart));
    var discover = mobile.indexOf(">Descubrir recetas<");
    var techniques = mobile.indexOf(">Técnicas de preparación<");
    var caseras = mobile.indexOf(">Recetas caseras<");
    var compartir = mobile.indexOf(">Compartir mi receta<");
    return discover < 0 || techniques < 0 || caseras < 0 || compartir < 0 ||
      !(discover < techniques && techniques < caseras && caseras < compartir) ||
      />Todas las recetas</.test(mobile) || />Ver recetas</.test(mobile);
  });
  ok("todas las páginas usan el mismo submenú móvil", submenuDrift.length === 0);
  if (submenuDrift.length) console.log("         desincronizadas: " + submenuDrift.join(", "));
  var stale = allPages.filter(function(file){
    return /href="(?:\.\.\/)?recetas\.html#recetas"/.test(fs.readFileSync(path.join(ROOT, file), "utf8"));
  });
  ok("sin anclas obsoletas #recetas", stale.length === 0);
  var footerDrift = allPages.filter(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    var start = html.indexOf('<footer class="dorila-footer">');
    var end = html.indexOf("</footer>", start);
    var footer = start === -1 || end === -1 ? "" : html.slice(start, end);
    return start === -1 || end === -1 ||
      !/dorila-footer__grid/.test(footer) ||
      !/Donde las recetas de siempre encuentran un lugar para no perderse\./.test(footer) ||
      !/Los saberes crecen cuando se comparten\./.test(footer) ||
      !/La información es orientativa y no sustituye la consulta con profesionales de la salud\./.test(footer) ||
      !/https:\/\/kikiriya-devops\.netlify\.app\//.test(footer) ||
      /<img\b|site-footer|footer-(inner|contact|social|legal|bottom)/.test(footer);
  });
  ok("todas las páginas usan el footer editorial namespaced", footerDrift.length === 0);
  if (footerDrift.length) console.log("         desincronizadas: " + footerDrift.join(", "));
  var footerLinks = allPages.filter(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    var start = html.indexOf('<footer class="dorila-footer">');
    var footer = start === -1 ? "" : html.slice(start, html.indexOf("</footer>", start));
    return !/https:\/\/instagram\.com\/dorilanatural/.test(footer) ||
      !/https:\/\/wa\.me\/59894872605/.test(footer) ||
      !/tel:\+59894872605/.test(footer) ||
      !/data-open-modal="privacyModal"/.test(footer) ||
      !/data-open-modal="disclaimerModal"/.test(footer) ||
      !/recetas\.html\?compartir=1#recetas-comunidad/.test(footer);
  });
  ok("el footer conserva enlaces, iconos y modales", footerLinks.length === 0);
  if (footerLinks.length) console.log("         desincronizadas: " + footerLinks.join(", "));
  ok("base.css reemplaza el footer legacy por estilos mobile-first",
    /\.dorila-footer\{[\s\S]*?padding-block:\s*clamp\(/.test(baseCss) &&
    /@media \(min-width: 640px\)\{[\s\S]*?\.dorila-footer__grid\{\s*grid-template-columns:repeat\(2, minmax\(0, 1fr\)\);/.test(baseCss) &&
    /@media \(min-width: 1000px\)\{[\s\S]*?\.dorila-footer__grid\{\s*grid-template-columns:minmax\(0, 1\.35fr\) repeat\(3, minmax\(0, 1fr\)\);/.test(baseCss) &&
    !/\.site-footer\s*\{/.test(baseCss));
  ok("el tagline del footer usa tipografía de cuerpo",
    /\.dorila-footer__tagline\{[^}]*color:\s*var\(--color-crema\)/.test(baseCss) &&
    !/\.dorila-footer__tagline\{[^}]*font-family:\s*var\(--font-display\)/.test(baseCss));
  ok("footer usa pergamino en share y cuerpo en community",
    /\.dorila-footer__share\{[^}]*border-bottom:1px solid var\(--color-logo-parchment\)/.test(baseCss) &&
    /\.dorila-footer__share\{[^}]*color:var\(--color-logo-parchment\)/.test(baseCss) &&
    /\.dorila-footer__community-copy\{[^}]*font-family:var\(--font-body\)/.test(baseCss) &&
    !/\.dorila-footer__community-copy\{[^}]*font-family:\s*var\(--font-display\)/.test(baseCss));
  ok("wordmark del footer se reduce con clamp en mobile",
    /\.dorila-footer__wordmark\{ font-size:clamp\(1\.35rem, 6vw, 1\.9rem\)/.test(baseCss));
  ok("el footer compacta navs y espacios por debajo de 1000px",
    /@media \(min-width: 360px\)\{[\s\S]*?\.dorila-footer__grid\{\s*grid-template-columns:repeat\(2, minmax\(0, 1fr\)\);/.test(baseCss) &&
    /@media \(max-width: 999px\)\{[\s\S]*?\.dorila-footer__brand\{\s*display:grid;[\s\S]{0,220}grid-template-columns:max-content minmax\(0, 1fr\)/.test(baseCss) &&
    /@media \(max-width: 999px\)[\s\S]*?\.dorila-footer__eyebrow\{\s*margin-bottom:0/.test(baseCss) &&
    /@media \(max-width: 999px\)[\s\S]*?\.dorila-footer__inner,\s*\.dorila-footer__grid\{\s*gap:clamp\(/.test(baseCss));
  ok("home.css usa la ruta correcta de girasol_bg.webp", /url\('\.\.\/img\/girasol_bg\.webp'\)/.test(homeCss));
  ok("base.css define --color-link", /--color-link:\s*(?:#|var\(--color-ink\))/.test(baseCss));
  ok("nav móvil replica el subrayado animado de desktop",
    /\.nav-mobile ul > li > a::after[\s\S]{0,200}right:\s*100%[\s\S]{0,120}background:\s*var\(--color-terracotta\)/.test(baseCss) &&
    /\.nav-mobile ul > li > a:hover::after[\s\S]{0,180}right:\s*0/.test(baseCss));
  ok("acordeón y submenú comparten el subrayado",
    /\.nav-mobile \.nav-acc::after/.test(baseCss) &&
    /\.nav-sublist \.nav-sublist-inner a::after/.test(baseCss) &&
    /\.nav-acc\.is-current::after[\s\S]{0,180}right:\s*0/.test(baseCss));
  ok("CTA móvil queda fuera del subrayado", !/\.nav-mobile a::after/.test(baseCss));
  ["gracias.html", "historia.html", "saber.html"].forEach(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    ok("canonical y og:url en " + file,
      /rel="canonical" href="https:\/\/dorila\.netlify\.app\//.test(html) && /property="og:url"/.test(html));
  });
})();

console.log("\n8. Functions con Blobs en memoria");
var integrationPromise = (async function(){
  var Module = require("module");
  var originalLoad = Module._load;
  var memory = {};
  var connected = [];
  var fakeStore = {
    setJSON: async function(key, value){ memory[key] = JSON.parse(JSON.stringify(value)); },
    get: async function(key, options){
      if (!(key in memory)) return null;
      return options && options.type === "json" ? JSON.parse(JSON.stringify(memory[key])) : memory[key];
    },
    list: async function(options){
      var prefix = options && options.prefix || "";
      return { blobs: Object.keys(memory).filter(function(key){ return key.indexOf(prefix) === 0; }).map(function(key){ return { key: key }; }) };
    }
  };
  Module._load = function(request){
    if (request === "@netlify/blobs") return {
      connectLambda: function(event){ connected.push(event); },
      getStore: function(){ return fakeStore; }
    };
    return originalLoad.apply(this, arguments);
  };
  var submit = require("../netlify/functions/recetas-submit");
  var publicFn = require("../netlify/functions/recetas-public");
  var adminFn = require("../netlify/functions/recetas-admin");
  Module._load = originalLoad;

  var previousToken = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = "secreto";
  try {
    var submitRes = await submit.handler(event("", "POST", validPayload()));
    check("submit acepta envío válido", submitRes.statusCode, 201);
    var submitted = JSON.parse(submitRes.body);
    ok("submit devuelve id", /^rc-[a-z0-9-]{4,90}$/.test(submitted.id));

    var publicBefore = await publicFn.handler(event("", "GET"));
    check("público no muestra pendientes", JSON.parse(publicBefore.body).recipes.length, 0);

    var unauth = await adminFn.handler(event("malo", "GET"));
    check("admin rechaza token incorrecto", unauth.statusCode, 401);

    var adminGet = await adminFn.handler(event("secreto", "GET"));
    check("admin lista pendientes", JSON.parse(adminGet.body).recipes.length, 1);

    var review = { identification: true, ingredients: true, preparation: true, safety: true, communication: true };
    var patchReview = await adminFn.handler(event("secreto", "PATCH", { id: submitted.id, review: review }));
    check("admin guarda checklist", patchReview.statusCode, 200);
    var patchInReview = await adminFn.handler(event("secreto", "PATCH", { id: submitted.id, status: "review" }));
    var patchApproved = await adminFn.handler(event("secreto", "PATCH", { id: submitted.id, status: "approved" }));
    var patchPublished = await adminFn.handler(event("secreto", "PATCH", { id: submitted.id, status: "published" }));
    check("admin publica con checklist", patchPublished.statusCode, 200);
    ok("flujo review/aprobado/publicado", patchInReview.statusCode === 200 && patchApproved.statusCode === 200);

    var publicAfter = await publicFn.handler(event("", "GET"));
    var publicData = JSON.parse(publicAfter.body);
    check("público devuelve la publicada", publicData.recipes.length, 1);
    check("público no filtra consentimientos", "consents" in publicData.recipes[0], false);
    check("público conserva categoría", publicData.recipes[0].category, "Digestivo");
    ok("Blobs recibe el contexto de Lambda", connected.length >= 8 && connected.every(function(item){ return item && item.blobs === "contexto"; }));

    var spam = validPayload(); spam.website = "spam";
    var spamRes = await submit.handler(event("", "POST", spam));
    check("submit rechaza honeypot", spamRes.statusCode, 422);
  } finally {
    if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = previousToken;
  }
})();

integrationPromise.then(function(){
  console.log("\n" + "=".repeat(58));
  console.log(passed + " ok, " + failed + " fallo(s)");
  console.log("=".repeat(58));
  process.exit(failed ? 1 : 0);
}).catch(function(error){
  console.error("\nError inesperado en la prueba de Functions:\n" + (error && error.stack || error));
  process.exit(1);
});
