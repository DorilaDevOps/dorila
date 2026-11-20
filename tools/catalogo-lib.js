"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var DATA_DIR = path.join(ROOT, "data");
var CATEGORIAS_PATH = path.join(DATA_DIR, "categorias.json");
var ENTRADA_PATH = path.join(DATA_DIR, "entrada-plantas.json");
var PLANTAS_PATH = path.join(DATA_DIR, "plantas.json");
var PRODUCTOS_PATH = path.join(ROOT, "js", "productos.js");
var FALLBACK_IMG = "img/placeholder/mandala.svg";
var DEFAULT_PRECAUCION = "La información es orientativa. Consultá con un profesional de la salud antes de usar cualquier planta medicinal.";
var ALERTA_EXTREMA = "ALERTA: toxicidad EXTREMA. No se recomienda su consumo ni uso medicinal. Esta planta no se comercializa en DORILA.";
var TOXICIDADES = ["SEGURA", "BAJA", "MODERADA", "ALTA", "EXTREMA", "NO_DETERMINADA"];
var TOX_LABELS = {
  SEGURA: "Segura",
  BAJA: "Toxicidad baja",
  MODERADA: "Toxicidad moderada",
  ALTA: "Toxicidad alta",
  EXTREMA: "Toxicidad extrema",
  NO_DETERMINADA: "Sin determinar"
};
var TONOS = [
  "descanso", "digestivo", "belleza", "aromaterapia", "masajes", "tratamientos",
  "aceites", "unguentos", "cremas", "locion", "tinturas", "jabones"
];

function readJson(file){
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function backup(file){
  if (fs.existsSync(file)) fs.writeFileSync(file + ".bak", fs.readFileSync(file));
}

function writeJson(file, value){
  backup(file);
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", encoding());
}

function encoding(){
  return "utf8";
}

function categorias(){
  return readJson(CATEGORIAS_PATH);
}

function categoriaPorSlug(slug){
  return categorias().filter(function(c){ return c.slug === slug; })[0] || null;
}

function categoriaPorLabel(label){
  var key = clave(label);
  return categorias().filter(function(c){ return clave(c.label) === key || clave(c.slug) === key; })[0] || null;
}

function slugify(text){
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "planta";
}

function clave(text){
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(x|×|sp|spp|var)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function claveCientifica(text){
  var primero = String(text || "").split(/[\/,;]/)[0];
  return clave(primero).split(" ").slice(0, 2).join(" ");
}

function normalizarImagen(img){
  var value = String(img || "").trim();
  if (!value) return FALLBACK_IMG;
  if (/^placeholder\//.test(value)) return "img/" + value;
  if (/^img\//.test(value)) return value;
  if (/^https?:\/\//.test(value)) return value;
  return "img/" + value.replace(/^\.?\//, "");
}

function precioNumero(value){
  if (typeof value === "number") return Math.max(0, Math.round(value));
  var digitos = String(value || "").replace(/[^0-9]/g, "");
  return parseInt(digitos || "0", 10);
}

function texto(value){
  return String(value === undefined || value === null ? "" : value);
}

function lista(value){
  if (Array.isArray(value)) return value.map(texto);
  if (!value) return [];
  return [texto(value)];
}

function esVendible(planta){
  return !!planta.disponible && planta.stock > 0 && planta.toxicidad !== "EXTREMA" && planta.precio > 0;
}

function pad3(n){
  return ("000" + n).slice(-3);
}

function prefijoDe(categoriaSlug){
  var cat = categoriaPorSlug(categoriaSlug) || categoriaPorLabel("Tratamientos") || categorias()[0];
  return cat.prefijo;
}

function idunico(id, ctx){
  if (id && !ctx.usedIds[id]){
    ctx.usedIds[id] = true;
    return id;
  }
  var prefix = id ? String(id).replace(/-\d+$/, "") : prefijoDe("tratamientos");
  var n = Number((String(id).match(/-(\d+)$/) || [])[1] || 0);
  var candidate;
  do {
    n += 1;
    candidate = prefix + "-" + pad3(n);
  } while (ctx.usedIds[candidate]);
  ctx.usedIds[candidate] = true;
  return candidate;
}

function slugunico(nombre, ctx){
  var base = slugify(nombre);
  var candidate = base;
  var n = 2;
  while (ctx.usedSlugs[candidate]){
    candidate = base + "-" + n;
    n += 1;
  }
  ctx.usedSlugs[candidate] = true;
  return candidate;
}

function remapIds(ids, idMap){
  return lista(ids)
    .map(function(id){ return idMap[id] || id; })
    .filter(function(id, index, all){ return id && all.indexOf(id) === index; });
}

function newContext(){
  return { usedIds: {}, usedSlugs: {}, counters: {}, idMap: {} };
}

function indexarCurrent(productos){
  var index = { byName: {}, byScientific: {}, items: productos };
  productos.forEach(function(p, i){
    var nameKey = clave(p.name);
    var sciKey = claveCientifica(p.scientific);
    if (nameKey && !index.byName[nameKey]) index.byName[nameKey] = i;
    if (sciKey && !index.byScientific[sciKey]) index.byScientific[sciKey] = i;
  });
  return index;
}

function buscarMatch(planta, index){
  var nameKey = clave(planta.nombre);
  var sciKey = claveCientifica(planta.nombre_cientifico);
  if (nameKey && index.byName[nameKey] !== undefined) return index.byName[nameKey];
  if (sciKey && index.byScientific[sciKey] !== undefined) return index.byScientific[sciKey];
  return undefined;
}

function propsBotanicas(planta, extrema){
  if (extrema) return [ALERTA_EXTREMA, "No se comercializa ni se sugiere su consumo."];
  var props = ["Ficha botánica informativa. Sin stock para venta."];
  var usos = lista(planta.usos_y_dolencias).slice(0, 3);
  if (usos.length) props.push("Usos tradicionales registrados: " + usos.join(", ") + ".");
  if (planta.precauciones) props.push(texto(planta.precauciones));
  return props;
}

function presentacion(id, precio, disponible){
  return [{
    sku: id + "-01",
    formato: "Unidad",
    precio: precio,
    stock: disponible ? 1 : 0,
    disponible: !!disponible
  }];
}

function desdeComercial(p, planta, ctx){
  var cat = categoriaPorSlug(p.category) || categoriaPorLabel("Tratamientos") || categorias()[0];
  var toxicidad = planta ? (TOXICIDADES.indexOf(planta.toxicidad) !== -1 ? planta.toxicidad : "NO_DETERMINADA") : "NO_DETERMINADA";
  var extrema = toxicidad === "EXTREMA";
  var precio = extrema ? 0 : precioNumero(p.price);
  var disponible = !extrema;
  var stock = disponible ? 1 : 0;
  var props = lista(p.props);
  if (extrema) props = [ALERTA_EXTREMA, "No se comercializa ni se sugiere su consumo."];

  return {
    id: p.id,
    idBotanico: planta ? texto(planta.id) : "",
    nombre: texto(p.name),
    slug: slugunico(p.name, ctx),
    sinonimos: planta ? lista(planta.sinonimos) : [],
    nombre_cientifico: planta && planta.nombre_cientifico ? texto(planta.nombre_cientifico) : texto(p.scientific),
    familia: planta ? texto(planta.familia) : "",
    categoria: cat.label,
    categoriaSlug: cat.slug,
    categoriaBotanica: planta ? texto(planta.categoria) || cat.label : cat.label,
    toxicidad: toxicidad,
    forma_consumo: planta ? lista(planta.forma_consumo) : [],
    partes_usadas: planta ? lista(planta.partes_usadas) : [],
    destacada: true,
    imagen: normalizarImagen(p.img),
    imagen2: p.img2 ? normalizarImagen(p.img2) : "",
    palabras_clave: planta ? lista(planta.palabras_clave) : props.slice(),
    relacionadas: remapIds(planta ? planta.relacionadas : [], ctx.idMap),
    descripcion: planta && planta.descripcion ? texto(planta.descripcion) : texto(p.desc),
    descripcionComercial: texto(p.desc),
    principios_activos: planta ? lista(planta.principios_activos) : [],
    usos_y_dolencias: planta ? lista(planta.usos_y_dolencias) : [],
    preparacion: extrema ? [] : (planta ? lista(planta.preparacion) : []),
    precauciones: planta && planta.precauciones ? texto(planta.precauciones) : DEFAULT_PRECAUCION,
    precio: precio,
    stock: stock,
    disponible: disponible,
    presentaciones: presentacion(p.id, precio, disponible),
    props: props,
    origen: planta ? "fusionado" : "comercial"
  };
}

function desdeBotanica(planta, ctx){
  var cat = categoriaPorLabel(planta.categoria) || categoriaPorSlug("tratamientos") || categorias()[0];
  var toxicidad = TOXICIDADES.indexOf(planta.toxicidad) !== -1 ? planta.toxicidad : "NO_DETERMINADA";
  var extrema = toxicidad === "EXTREMA";
  var id = idunico(planta.id, ctx);
  var desc = extrema
    ? "Ficha informativa sobre una planta tóxica. No se recomienda su consumo ni uso medicinal; no se comercializa en DORILA."
    : "Ficha botánica informativa de " + texto(planta.nombre) + ". Sin stock para venta en este catálogo.";

  return {
    id: id,
    idBotanico: texto(planta.id),
    nombre: texto(planta.nombre),
    slug: slugunico(planta.nombre, ctx),
    sinonimos: lista(planta.sinonimos),
    nombre_cientifico: texto(planta.nombre_cientifico) || ("Especie no determinada (" + texto(planta.nombre) + ")"),
    familia: texto(planta.familia),
    categoria: cat.label,
    categoriaSlug: cat.slug,
    categoriaBotanica: cat.label,
    toxicidad: toxicidad,
    forma_consumo: lista(planta.forma_consumo),
    partes_usadas: lista(planta.partes_usadas),
    destacada: false,
    imagen: normalizarImagen(planta.imagen),
    imagen2: "",
    palabras_clave: lista(planta.palabras_clave),
    relacionadas: remapIds(planta.relacionadas, ctx.idMap),
    descripcion: texto(planta.descripcion) || desc,
    descripcionComercial: desc,
    principios_activos: lista(planta.principios_activos),
    usos_y_dolencias: extrema ? [] : lista(planta.usos_y_dolencias),
    preparacion: extrema ? [] : lista(planta.preparacion),
    precauciones: texto(planta.precauciones) || DEFAULT_PRECAUCION,
    precio: 0,
    stock: 0,
    disponible: false,
    presentaciones: lista(planta.presentaciones),
    props: propsBotanicas(planta, extrema),
    origen: "botanico"
  };
}

function readCurrentProducts(){
  var resolved = require.resolve(PRODUCTOS_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function mergeCatalog(entradaFile){
  var entrada = readJson(entradaFile || ENTRADA_PATH);
  if (!Array.isArray(entrada)) throw new Error("El archivo de entrada debe contener un array de plantas");

  var base = readCurrentProducts().filter(function(p){ return /^cons-\d{3}$/.test(p.id); });
  var ctx = newContext();
  base.forEach(function(p){ ctx.usedIds[p.id] = true; });

  var index = indexarCurrent(base);
  var matches = {};
  entrada.forEach(function(planta, i){
    var hit = buscarMatch(planta || {}, index);
    if (hit !== undefined) matches[i] = hit;
  });
  Object.keys(matches).forEach(function(i){
    var planta = entrada[Number(i)];
    if (planta && planta.id) ctx.idMap[planta.id] = base[matches[i]].id;
  });

  var resultado = [];
  base.forEach(function(p, i){
    var plantaIdx = Object.keys(matches).filter(function(k){ return matches[k] === i; })[0];
    resultado.push(desdeComercial(p, plantaIdx === undefined ? null : entrada[Number(plantaIdx)], ctx));
  });
  entrada.forEach(function(planta, i){
    if (matches[i] === undefined && planta) resultado.push(desdeBotanica(planta, ctx));
  });
  resultado.forEach(function(planta){
    if (planta.toxicidad === "EXTREMA"){
      planta.precio = 0;
      planta.stock = 0;
      planta.disponible = false;
      planta.preparacion = [];
      planta.usos_y_dolencias = [];
    }
  });
  return resultado;
}

function validateCatalog(plantas){
  var errors = [];
  if (!Array.isArray(plantas) || !plantas.length) errors.push("El catálogo está vacío");
  var ids = {};
  var slugs = {};
  var cats = {};
  categorias().forEach(function(c){ cats[c.slug] = true; });

  plantas.forEach(function(p, i){
    var where = "[" + i + "] " + (p && p.id ? p.id : "sin id");
    if (!p || typeof p !== "object"){ errors.push(where + ": registro inválido"); return; }
    if (!p.id) errors.push(where + ": falta id");
    if (ids[p.id]) errors.push(where + ": id duplicado");
    ids[p.id] = true;
    if (!p.nombre) errors.push(where + ": falta nombre");
    if (!p.nombre_cientifico) errors.push(where + ": falta nombre_cientifico");
    if (!p.slug) errors.push(where + ": falta slug");
    if (slugs[p.slug]) errors.push(where + ": slug duplicado");
    slugs[p.slug] = true;
    if (!cats[p.categoriaSlug]) errors.push(where + ": categoría desconocida " + p.categoriaSlug);
    if (TOXICIDADES.indexOf(p.toxicidad) === -1) errors.push(where + ": toxicidad desconocida " + p.toxicidad);
    if (typeof p.precio !== "number" || p.precio < 0) errors.push(where + ": precio inválido");
    if (typeof p.stock !== "number" || p.stock < 0) errors.push(where + ": stock inválido");
    if (typeof p.disponible !== "boolean") errors.push(where + ": disponible debe ser booleano");
    if (p.toxicidad === "EXTREMA" && (p.disponible || p.stock > 0 || p.precio > 0)){
      errors.push(where + ": EXTREMA no puede estar disponible ni tener precio");
    }
    if (p.disponible && p.stock <= 0) errors.push(where + ": disponible requiere stock > 0");
    if (p.disponible && p.precio <= 0) errors.push(where + ": disponible requiere precio > 0");
  });
  if (errors.length) throw new Error(errors.join("\n"));
  return true;
}

function readCanonical(){
  return readJson(PLANTAS_PATH);
}

function saveCanonical(plantas){
  validateCatalog(plantas);
  writeJson(PLANTAS_PATH, plantas);
  return plantas;
}

function alertaPara(planta){
  if (planta.toxicidad === "EXTREMA") return ALERTA_EXTREMA;
  if (planta.toxicidad === "ALTA" || planta.toxicidad === "MODERADA" || planta.toxicidad === "BAJA"){
    return "Precaución: " + TOX_LABELS[planta.toxicidad].toLowerCase() + ". " + (planta.precauciones || DEFAULT_PRECAUCION);
  }
  return "";
}

function imageClass(planta){
  var img = normalizarImagen(planta.imagen);
  var tono = TONOS.indexOf(planta.categoriaSlug) !== -1 ? planta.categoriaSlug : "tratamientos";
  return /mandala\.svg$/i.test(img) ? "img-mandala mandala-" + tono : "";
}

function toProduct(planta, byId){
  var vendible = esVendible(planta);
  var related = (planta.relacionadas || []).map(function(id){ return byId[id]; }).filter(function(p){
    return p && p.toxicidad !== "EXTREMA";
  }).map(function(p){ return p.slug; });

  return {
    id: planta.id,
    name: planta.nombre,
    slug: planta.slug,
    scientific: planta.nombre_cientifico,
    category: planta.categoriaSlug,
    categoriaLabel: planta.categoria,
    desc: planta.descripcionComercial || planta.descripcion,
    botanicalDesc: planta.descripcion,
    price: planta.precio > 0 ? "$" + planta.precio : "",
    priceNum: planta.precio,
    img: normalizarImagen(planta.imagen),
    img2: planta.imagen2 ? normalizarImagen(planta.imagen2) : "",
    imageClass: imageClass(planta),
    fallbackImg: FALLBACK_IMG,
    props: lista(planta.props),
    familia: planta.familia || "",
    toxicidad: planta.toxicidad,
    toxicidadLabel: TOX_LABELS[planta.toxicidad] || planta.toxicidad,
    alerta: alertaPara(planta),
    alertClass: planta.toxicidad === "EXTREMA" ? "alerta-toxica-extrema" : (planta.alerta ? "alerta-toxica" : ""),
    stock: planta.stock,
    disponible: !!planta.disponible,
    vendible: vendible,
    usos: planta.toxicidad === "EXTREMA" ? [] : lista(planta.usos_y_dolencias),
    preparacion: planta.toxicidad === "EXTREMA" ? [] : lista(planta.preparacion),
    precauciones: planta.precauciones || DEFAULT_PRECAUCION,
    palabrasClave: lista(planta.palabras_clave),
    related: related,
    presentaciones: lista(planta.presentaciones),
    fichaBotanica: planta.origen !== "comercial",
    origen: planta.origen
  };
}

function buildProducts(plantas){
  validateCatalog(plantas);
  var byId = {};
  plantas.forEach(function(p){ byId[p.id] = p; });
  return plantas.map(function(p){ return toProduct(p, byId); });
}

function productsSource(products){
  var header = "/* DORILA - catálogo de productos generado desde data/plantas.json.\n   No editar a mano: corré \"npm run catalogo\". */\n";
  var body = products.map(function(p){
    return "  " + JSON.stringify(p, null, 2).split("\n").join("\n  ");
  }).join(",\n");
  return header + "var DORILA_PRODUCTS = [\n" + body + "\n];\n\n" +
    "if (typeof module !== \"undefined\" && module.exports){ module.exports = DORILA_PRODUCTS; }\n" +
    "if (typeof window !== \"undefined\"){ window.DORILA_PRODUCTS = DORILA_PRODUCTS; }\n";
}

function saveProducts(products){
  backup(PRODUCTOS_PATH);
  fs.writeFileSync(PRODUCTOS_PATH, productsSource(products), "utf8");
}

function siguienteId(plantas, categoriaSlug){
  var prefix = prefijoDe(categoriaSlug);
  var max = 0;
  plantas.forEach(function(p){
    var m = new RegExp("^" + prefix + "-(\\d+)$").exec(p.id || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return prefix + "-" + pad3(max + 1);
}

function parseValue(value){
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (/^[\[{]/.test(value)) return JSON.parse(value);
  return value;
}

module.exports = {
  ROOT: ROOT,
  CATEGORIAS_PATH: CATEGORIAS_PATH,
  ENTRADA_PATH: ENTRADA_PATH,
  PLANTAS_PATH: PLANTAS_PATH,
  PRODUCTOS_PATH: PRODUCTOS_PATH,
  FALLBACK_IMG: FALLBACK_IMG,
  TOXICIDADES: TOXICIDADES,
  readJson: readJson,
  writeJson: writeJson,
  categorias: categorias,
  slugify: slugify,
  clave: clave,
  normalizarImagen: normalizarImagen,
  esVendible: esVendible,
  mergeCatalog: mergeCatalog,
  validateCatalog: validateCatalog,
  readCanonical: readCanonical,
  readCurrentProducts: readCurrentProducts,
  saveCanonical: saveCanonical,
  buildProducts: buildProducts,
  saveProducts: saveProducts,
  productsSource: productsSource,
  siguienteId: siguienteId,
  parseValue: parseValue
};
