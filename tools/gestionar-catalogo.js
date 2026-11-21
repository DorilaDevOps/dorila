"use strict";

var catalogo = require("./catalogo-lib");

var argv = process.argv.slice(2);
var dry = argv.indexOf("--dry-run") !== -1;
var args = argv.filter(function(a){ return a !== "--dry-run"; });
var command = args.shift() || "ayuda";

function find(plantas, id){
  return plantas.filter(function(p){ return p.id === id || p.slug === id; })[0] || null;
}

function uniqueSlug(base, plantas, currentId){
  var root = catalogo.slugify(base);
  var used = {};
  plantas.forEach(function(p){ if (p.id !== currentId) used[p.slug] = true; });
  var candidate = root;
  var n = 2;
  while (used[candidate]){
    candidate = root + "-" + n;
    n += 1;
  }
  return candidate;
}

function guardar(plantas, mensaje){
  catalogo.validateCatalog(plantas);
  if (!dry){
    catalogo.saveCanonical(plantas);
    catalogo.saveProducts(catalogo.buildProducts(plantas));
  }
  console.log((dry ? "SIM " : "OK  ") + mensaje);
  console.log("Total: " + plantas.length + " plantas");
}

function stats(plantas){
  var out = { total: plantas.length, vendibles: 0, extremas: 0, sinStock: 0 };
  plantas.forEach(function(p){
    if (catalogo.esVendible(p)) out.vendibles++;
    if (p.toxicidad === "EXTREMA") out.extremas++;
    if (!p.disponible) out.sinStock++;
  });
  return out;
}

function normalizarNuevo(raw, plantas){
  var categorias = catalogo.categorias();
  var label = String(raw.categoria || raw.categoriaBotanica || "Tratamientos");
  var cat = categorias.filter(function(c){ return c.label === label || c.slug === label; })[0] || categorias.filter(function(c){ return c.label === "Tratamientos"; })[0];
  var toxicidad = catalogo.TOXICIDADES.indexOf(raw.toxicidad) !== -1 ? raw.toxicidad : "NO_DETERMINADA";
  var precio = Number(raw.precio || 0);
  var stock = Number(raw.stock || 0);
  var disponible = raw.disponible === true && toxicidad !== "EXTREMA" && stock > 0 && precio > 0;
  var id = /^DOR-[A-Z]{3}-\d{3}$/.test(raw.id || "") ? raw.id : catalogo.siguienteId(plantas, cat.slug);

  return {
    id: id,
    nombre: raw.nombre || raw.name || "",
    slug: uniqueSlug(raw.slug || raw.nombre || raw.name || "planta", plantas, id),
    sinonimos: raw.sinonimos || [],
    nombre_cientifico: raw.nombre_cientifico || raw.scientific || "Especie no determinada",
    familia: raw.familia || "",
    categoria: cat.label,
    categoriaSlug: cat.slug,
    categoriaBotanica: raw.categoriaBotanica || cat.label,
    toxicidad: toxicidad,
    forma_consumo: raw.forma_consumo || [],
    partes_usadas: raw.partes_usadas || [],
    destacada: raw.destacada === true,
    imagen: catalogo.normalizarImagen(raw.imagen || raw.img),
    imagen2: raw.imagen2 ? catalogo.normalizarImagen(raw.imagen2) : "",
    palabras_clave: raw.palabras_clave || raw.palabrasClave || [],
    relacionadas: raw.relacionadas || [],
    descripcion: raw.descripcion || raw.desc || "",
    descripcionComercial: raw.descripcionComercial || raw.desc || "Ficha botánica informativa.",
    principios_activos: raw.principios_activos || [],
    usos_y_dolencias: toxicidad === "EXTREMA" ? [] : (raw.usos_y_dolencias || []),
    preparacion: toxicidad === "EXTREMA" ? [] : (raw.preparacion || []),
    precauciones: raw.precauciones || "La información es orientativa. Consultá con un profesional de la salud antes de usar cualquier planta medicinal.",
    precio: precio,
    stock: disponible ? stock : 0,
    disponible: disponible,
    presentaciones: raw.presentaciones || [],
    props: toxicidad === "EXTREMA"
      ? ["ALERTA: toxicidad EXTREMA. No se recomienda su consumo ni uso medicinal. Esta planta no se comercializa en DORILA."]
      : (raw.props || []),
    origen: raw.origen || "botanico"
  };
}

function ayuda(){
  console.log("Uso: node tools/gestionar-catalogo.js <comando> [argumentos] [--dry-run]");
  console.log("");
  console.log("Comandos:");
  console.log("  validar                 Verifica data/plantas.json");
  console.log("  listar [filtro]         Lista ids, nombres, toxicidad y stock");
  console.log("  ver <id|slug>           Muestra un registro completo");
  console.log("  importar [archivo]      Regenera desde data/entrada-plantas.json");
  console.log("  agregar <archivo.json>  Agrega una planta o un array de plantas");
  console.log("  editar <id> <campo> <valor>");
  console.log("  eliminar <id>");
}

try {
  if (command === "ayuda" || command === "help" || command === "--help"){
    ayuda();
  } else if (command === "validar"){
    var plantasValidar = catalogo.readCanonical();
    catalogo.validateCatalog(plantasValidar);
    console.log("OK  catálogo válido");
    console.log(JSON.stringify(stats(plantasValidar), null, 2));
  } else if (command === "listar"){
    var plantasListar = catalogo.readCanonical();
    var filtro = (args[0] || "").toLowerCase();
    var filtradas = plantasListar.filter(function(p){
      return !filtro ||
        p.id.toLowerCase().indexOf(filtro) !== -1 ||
        p.nombre.toLowerCase().indexOf(filtro) !== -1 ||
        p.categoriaSlug.indexOf(filtro) !== -1 ||
        p.toxicidad.toLowerCase().indexOf(filtro) !== -1;
    });
    filtradas.forEach(function(p){
      console.log(p.id + " | " + p.nombre + " | " + p.categoriaSlug + " | " + p.toxicidad + " | stock " + p.stock + (catalogo.esVendible(p) ? " | VENTA" : " | SIN VENTA"));
    });
    console.log("Mostradas " + filtradas.length + " de " + plantasListar.length);
  } else if (command === "ver"){
    var encontrado = find(catalogo.readCanonical(), args[0]);
    if (!encontrado) throw new Error("No existe la planta " + args[0]);
    console.log(JSON.stringify(encontrado, null, 2));
  } else if (command === "importar"){
    var archivo = args[0] || catalogo.ENTRADA_PATH;
    var importadas = catalogo.mergeCatalog(archivo);
    guardar(importadas, "Importado " + archivo);
  } else if (command === "agregar"){
    var fuente = catalogo.readJson(args[0]);
    var plantasAgregar = catalogo.readCanonical();
    var nuevos = Array.isArray(fuente) ? fuente : [fuente];
    nuevos.forEach(function(raw){ plantasAgregar.push(normalizarNuevo(raw, plantasAgregar)); });
    guardar(plantasAgregar, "Agregadas " + nuevos.length + " plantas");
  } else if (command === "editar"){
    var plantasEditar = catalogo.readCanonical();
    var registro = find(plantasEditar, args[0]);
    if (!registro) throw new Error("No existe la planta " + args[0]);
    var campo = args[1];
    var valor = catalogo.parseValue(args[2]);
    if (!campo || args.length < 3) throw new Error("Indicá campo y valor");
    if (campo === "categoria"){
      var cat = catalogo.categorias().filter(function(c){ return c.label === valor || c.slug === valor; })[0];
      if (!cat) throw new Error("Categoría desconocida: " + valor);
      registro.categoria = cat.label;
      registro.categoriaSlug = cat.slug;
    } else {
      registro[campo] = valor;
    }
    if (campo === "slug") registro.slug = uniqueSlug(valor, plantasEditar, registro.id);
    if (registro.toxicidad === "EXTREMA"){
      registro.precio = 0;
      registro.stock = 0;
      registro.disponible = false;
      registro.preparacion = [];
      registro.usos_y_dolencias = [];
    }
    guardar(plantasEditar, "Editada " + registro.id + "." + campo);
  } else if (command === "eliminar"){
    var plantasEliminar = catalogo.readCanonical();
    var borrar = find(plantasEliminar, args[0]);
    if (!borrar) throw new Error("No existe la planta " + args[0]);
    guardar(plantasEliminar.filter(function(p){ return p.id !== borrar.id; }), "Eliminada " + borrar.id);
  } else {
    throw new Error("Comando desconocido: " + command);
  }
} catch (error) {
  console.error("Error: " + error.message);
  process.exit(1);
}
