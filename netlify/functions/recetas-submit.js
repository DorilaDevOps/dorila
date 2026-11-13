"use strict";

var core = require("./_lib/recetas-core");
var storeLib = require("./_lib/recetas-store");
var http = require("./_lib/recetas-http");

exports.handler = async function(event){
  if (event.httpMethod !== "POST"){
    return http.json(405, { ok: false, error: "Método no permitido." }, { Allow: "POST" });
  }

  var body = http.parseJsonBody(event);
  if (!body.ok) return http.json(400, { ok: false, error: body.error });

  var validation = core.validateSubmission(body.data, { now: Date.now() });
  if (!validation.ok){
    return http.json(422, {
      ok: false,
      error: "Revisá los campos marcados antes de enviar.",
      fields: validation.errors
    });
  }

  try {
    var store = storeLib.recipeStore(event);
    var record = core.createRecipe(validation.data, { now: Date.now() });
    await storeLib.saveRecipe(store, record);
    return http.json(201, {
      ok: true,
      message: "Receta recibida. La revisaremos antes de publicarla.",
      id: record.id
    });
  } catch (error){
    console.error("recetas-submit:", error && error.message ? error.message : error);
    return http.json(500, { ok: false, error: "No pudimos guardar la receta. Intentá nuevamente." });
  }
};
