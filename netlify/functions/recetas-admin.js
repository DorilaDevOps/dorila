"use strict";

var core = require("./_lib/recetas-core");
var storeLib = require("./_lib/recetas-store");
var http = require("./_lib/recetas-http");

var ID_PATTERN = /^rc-[a-z0-9-]{4,90}$/;

function unauthorized(){
  return http.json(401, { ok: false, error: "Token de administración inválido o ausente." });
}

exports.handler = async function(event){
  var auth = core.verifyAdminToken(event, process.env);
  if (auth.missing){
    return http.json(500, { ok: false, error: "Falta configurar ADMIN_TOKEN en Netlify." });
  }
  if (!auth.ok) return unauthorized();

  if (event.httpMethod === "GET"){
    try {
      var store = storeLib.recipeStore(event);
      var recipes = (await storeLib.listRecipes(store)).sort(function(a, b){
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
      return http.json(200, {
        ok: true,
        recipes: recipes,
        categories: core.CATEGORIES,
        statuses: core.STATUSES,
        labels: core.STATUS_LABELS,
        reviewKeys: core.REVIEW_KEYS
      });
    } catch (error){
      console.error("recetas-admin GET:", error && error.message ? error.message : error);
      return http.json(500, { ok: false, error: "No pudimos cargar las recetas para moderación." });
    }
  }

  if (event.httpMethod === "PATCH"){
    var body = http.parseJsonBody(event);
    if (!body.ok) return http.json(400, { ok: false, error: body.error });

    var id = core.cleanLine(body.data.id);
    if (!ID_PATTERN.test(id)) return http.json(400, { ok: false, error: "Identificador de receta inválido." });

    try {
      var store = storeLib.recipeStore(event);
      var record = await storeLib.getRecipe(store, id);
      if (!record) return http.json(404, { ok: false, error: "La receta no existe." });

      var result = core.applyAdminPatch(record, body.data, { now: Date.now() });
      if (!result.ok) return http.json(422, { ok: false, error: result.error });

      await storeLib.saveRecipe(store, result.record);
      return http.json(200, {
        ok: true,
        recipe: result.record,
        labels: core.STATUS_LABELS,
        reviewKeys: core.REVIEW_KEYS
      });
    } catch (error){
      console.error("recetas-admin PATCH:", error && error.message ? error.message : error);
      return http.json(500, { ok: false, error: "No pudimos guardar los cambios de moderación." });
    }
  }

  return http.json(405, { ok: false, error: "Método no permitido." }, { Allow: "GET, PATCH" });
};
