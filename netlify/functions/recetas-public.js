"use strict";

var core = require("./_lib/recetas-core");
var storeLib = require("./_lib/recetas-store");
var http = require("./_lib/recetas-http");

exports.handler = async function(event){
  if (event.httpMethod !== "GET"){
    return http.json(405, { ok: false, error: "Método no permitido." }, { Allow: "GET" });
  }

  try {
    var store = storeLib.recipeStore(event);
    var records = await storeLib.listRecipes(store);
    var recipes = records
      .map(core.toPublic)
      .filter(Boolean)
      .sort(function(a, b){
        return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      })
      .slice(0, 100);

    return http.json(200, { ok: true, recipes: recipes }, {
      "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300"
    });
  } catch (error){
    console.error("recetas-public:", error && error.message ? error.message : error);
    return http.json(200, { ok: false, recipes: [], error: "No pudimos cargar las recetas de la comunidad." });
  }
};
