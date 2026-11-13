"use strict";

var blobs = require("@netlify/blobs");
var connectLambda = blobs.connectLambda;
var getStore = blobs.getStore;

var STORE_NAME = "dorila-recetas";
var PREFIX = "recetas/";

function recipeStore(event){
  if (event && event.blobs && typeof connectLambda === "function"){
    connectLambda(event);
  }
  return getStore(STORE_NAME);
}

function keyFor(id){
  return PREFIX + id + ".json";
}

async function listRecipes(store){
  store = store || recipeStore();
  var result = await store.list({ prefix: PREFIX });
  var blobs = (result && result.blobs) || [];
  var recipes = await Promise.all(blobs.map(async function(blob){
    try {
      return await store.get(blob.key, { type: "json" });
    } catch (error){
      return null;
    }
  }));
  return recipes.filter(Boolean);
}

async function getRecipe(store, id){
  store = store || recipeStore();
  if (!id) return null;
  return store.get(keyFor(id), { type: "json" });
}

async function saveRecipe(store, record){
  store = store || recipeStore();
  await store.setJSON(keyFor(record.id), record);
  return record;
}

module.exports = {
  STORE_NAME: STORE_NAME,
  PREFIX: PREFIX,
  recipeStore: recipeStore,
  keyFor: keyFor,
  listRecipes: listRecipes,
  getRecipe: getRecipe,
  saveRecipe: saveRecipe
};
