"use strict";

var catalogo = require("./catalogo-lib");

try {
  var plantas = catalogo.readCanonical();
  var productos = catalogo.buildProducts(plantas);
  if (process.argv.indexOf("--dry-run") === -1) catalogo.saveProducts(productos);
  var vendibles = productos.filter(function(p){ return p.vendible; }).length;
  var extremas = productos.filter(function(p){ return p.toxicidad === "EXTREMA"; }).length;
  console.log((process.argv.indexOf("--dry-run") === -1 ? "OK  " : "SIM ") + "js/productos.js <- data/plantas.json");
  console.log("Catálogo: " + productos.length + " plantas | " + vendibles + " vendibles | " + extremas + " EXTREMA");
} catch (error) {
  console.error("Error: " + error.message);
  process.exit(1);
}
