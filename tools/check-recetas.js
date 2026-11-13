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
})();

console.log("\n3. Creación y transiciones de estado");
(function(){
  var valid = core.validateSubmission(validPayload(), { now: NOW });
  var recipe = core.createRecipe(valid.data, { now: NOW });
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
  var admin = fs.readFileSync(path.join(ROOT, "admin-recetas.html"), "utf8");
  var template = fs.readFileSync(path.join(ROOT, "templates", "ficha-producto.html"), "utf8");
  var robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
  var netlify = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  var generate = fs.readFileSync(path.join(ROOT, "tools", "generate.js"), "utf8");
  var pagesCss = fs.readFileSync(path.join(ROOT, "asset", "pages.css"), "utf8");

  var heroStart = recetas.indexOf('<section class="recipes-hero"');
  var heroEnd = recetas.indexOf("</section>", heroStart);
  var hero = recetas.slice(heroStart, heroEnd);
  var heroCtasStart = hero.indexOf('<div class="hero-ctas">');
  var heroCtasEnd = hero.indexOf("</div>", heroCtasStart);
  var heroCtas = hero.slice(heroCtasStart, heroCtasEnd);

  check("hero tiene 3 CTAs", (heroCtas.match(/class="btn btn-look"/g) || []).length, 3);
  ok("hero usa etiqueta corta Ver", /class="hero-cta-label-short"[^>]*>Ver<\/span>/.test(heroCtas));
  ok("hero usa etiqueta corta Técnicas", /class="hero-cta-label-short"[^>]*>Técnicas<\/span>/.test(heroCtas));
  ok("hero usa etiqueta corta Mi receta", /class="hero-cta-label-short"[^>]*>Mi receta<\/span>/.test(heroCtas));
  ok("hero comparte receta desde el tercer CTA",
    /<button[^>]*data-share-open[^>]*aria-label="Compartir mi receta"/.test(heroCtas));
  ok("hero oculta el eyebrow en mobile",
    /@media \(max-width: 639px\)\{[\s\S]*?\.recipes-hero \.eyebrow-mark\{ display:none; \}/.test(pagesCss));
  ok("hero cambia a etiquetas cortas en mobile",
    /@media \(max-width: 639px\)\{[\s\S]*?\.recipes-hero \.hero-cta-label-full\{ display:none; \}[\s\S]*?\.recipes-hero \.hero-cta-label-short\{ display:inline; \}/.test(pagesCss));
  ok("hero mantiene los CTAs en una fila",
    /\.recipes-hero \.hero-ctas\{ width:100%; flex-wrap:nowrap; \}/.test(pagesCss) &&
    /@media \(min-width: 640px\)\{[\s\S]*?\.recipes-hero \.hero-ctas\{ flex-wrap:nowrap; \}/.test(pagesCss));

  ok("recetas tiene la sección comunidad", /id="recetas-comunidad"/.test(recetas));
  ok("recetas carga recetas_.js", /js\/recetas_\.js\?v=/.test(recetas));
  ok("recetas carga recetas-comunidad.js", /js\/recetas-comunidad\.js\?v=/.test(recetas));
  ok("recetas carga comunidad.css", /asset\/comunidad\.css/.test(recetas));
  ["shareDialog", "shareConfirmDialog", "shareCancelDialog", "shareSuccessDialog", "shareErrorDialog"].forEach(function(id){
    ok("diálogo presente: " + id, new RegExp('id="' + id + '"').test(recetas));
  });
  ok("formulario con paso 1 y 2", /id="shareStep1"/.test(recetas) && /id="shareStep2"/.test(recetas));

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

  var privacyFiles = ["index.html", "historia.html", "saber.html", "recetas.html", "gracias.html", "templates/ficha-producto.html"];
  privacyFiles.forEach(function(file){
    var html = fs.readFileSync(path.join(ROOT, file), "utf8");
    ok("privacidad actualizada: " + file, /Netlify Blobs/.test(html) && !/no los guarda ni los almacena en ningún servidor propio/.test(html));
  });

  ok("robots bloquea admin", /Disallow: \/admin-recetas\.html/.test(robots));
  ok("netlify.toml protege admin", /for = "\/admin-recetas\.html"/.test(netlify) && /X-Robots-Tag/.test(netlify));
  ok("generate.js incluye admin", /ROOT_PAGES = \[[^\]]*admin-recetas\.html/.test(generate));
  ok("admin no entra al sitemap", /mainPages = \["", "historia\.html", "saber\.html", "recetas\.html", "gracias\.html"\]/.test(generate));
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

console.log("\n7. Functions con Blobs en memoria");
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
