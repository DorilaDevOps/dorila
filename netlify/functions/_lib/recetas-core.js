"use strict";

/* =====================================================================
   DORILA — recetas-core.js
   Reglas puras de la comunidad de recetas: categorías, validación,
   estados de moderación y forma pública. Sin dependencias de Netlify.
   Se usa desde las Functions y desde tools/check-recetas.js.
   ===================================================================== */

var crypto = require("crypto");

var CATEGORIES = [
  "Descanso y relajación",
  "Digestivo",
  "Circulación",
  "Defensas",
  "Articular y muscular",
  "Urinario y renal",
  "Hepático",
  "Respiratorio",
  "Energía y vitalidad",
  "Aromaterapia y bienestar sensorial",
  "Bienestar femenino",
  "Equilibrio emocional",
  "Bienestar integral y autocuidado",
  "Otros tratamientos"
];

var STATUSES = ["pending", "review", "changes", "approved", "rejected", "published"];

var STATUS_LABELS = {
  pending: "Pendiente",
  review: "En revisión",
  changes: "Cambios solicitados",
  approved: "Aprobada",
  rejected: "Rechazada",
  published: "Publicada"
};

var TRANSITIONS = {
  pending:  ["review", "rejected"],
  review:   ["approved", "changes", "rejected"],
  changes:  ["review", "rejected"],
  approved: ["published", "changes", "rejected"],
  rejected: ["review"],
  published:["changes"]
};

var LIMITS = {
  firstName: 80,
  lastName: 80,
  nationality: 60,
  city: 80,
  contact: 160,
  ingredientsMin: 2,
  ingredientsMax: 30,
  ingredient: 160,
  stepsMin: 2,
  stepsMax: 30,
  step: 400,
  story: 1000,
  precautions: 600,
  notes: 1500
};

var REVIEW_KEYS = ["identification", "ingredients", "preparation", "safety", "communication"];

var PUBLIC_LEGEND = "Receta compartida por nuestra comunidad. Contenido recibido de un colaborador y revisado editorialmente por Dorila Natural. Su publicación no implica certificación de eficacia ni garantía de seguridad terapéutica.";

function cleanText(value){
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function cleanLine(value){
  return cleanText(value).replace(/[ \t]+/g, " ").replace(/\n+/g, " ").trim();
}

function validContact(value){
  var text = cleanLine(value).replace(/^whatsapp\s*[:\-]?\s*/i, "");
  if (!text) return true;
  var email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  var phone = /^\+?[\d\s().-]{6,24}$/.test(text) && (text.match(/\d/g) || []).length >= 6;
  return email || phone;
}

function cleanBlock(value){
  return cleanText(value)
    .split("\n")
    .map(function(line){ return line.replace(/[ \t]+/g, " ").trim(); })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isObject(value){
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function addError(errors, field, message){
  if (!errors[field]) errors[field] = message;
}

function cleanStringArray(value, maxItems, maxLength){
  var list = Array.isArray(value) ? value : [];
  var cleaned = [];
  list.forEach(function(item){
    var text = cleanLine(item);
    if (text) cleaned.push(text);
  });
  return { list: cleaned, sourceLength: list.length, maxItems: maxItems, maxLength: maxLength };
}

function validateSubmission(payload, options){
  options = options || {};
  var now = options.now || Date.now();
  var errors = {};

  if (!isObject(payload)){
    return { ok: false, errors: { _form: "El envío no tiene el formato esperado." }, data: null };
  }

  if (cleanLine(payload.website)){
    return { ok: false, errors: { _form: "No pudimos validar el envío." }, data: null };
  }

  var startedAt = Number(payload.startedAt);
  if (isFinite(startedAt) && startedAt > 0 && now - startedAt < 1500){
    return { ok: false, errors: { _form: "Esperá un momento antes de enviar la receta." }, data: null };
  }

  var author = isObject(payload.author) ? payload.author : {};
  var firstName = cleanLine(author.firstName);
  var lastName = cleanLine(author.lastName);
  var nationality = cleanLine(author.nationality);
  var city = cleanLine(author.city);
  var contact = cleanLine(author.contact);

  if (firstName.length < 2) addError(errors, "firstName", "Ingresá tu nombre.");
  if (firstName.length > LIMITS.firstName) addError(errors, "firstName", "El nombre es demasiado largo.");
  if (lastName.length < 2) addError(errors, "lastName", "Ingresá tu apellido.");
  if (lastName.length > LIMITS.lastName) addError(errors, "lastName", "El apellido es demasiado largo.");
  if (nationality.length < 2) addError(errors, "nationality", "Ingresá tu nacionalidad.");
  if (nationality.length > LIMITS.nationality) addError(errors, "nationality", "La nacionalidad es demasiado larga.");
  if (city.length > LIMITS.city) addError(errors, "city", "La ciudad es demasiado larga.");
  if (contact.length > LIMITS.contact) addError(errors, "contact", "El medio de contacto es demasiado largo.");
  if (!validContact(contact)) addError(errors, "contact", "Ingresá un WhatsApp o un correo electrónico válido.");

  var recipe = isObject(payload.recipe) ? payload.recipe : {};
  var category = cleanLine(recipe.category);
  if (CATEGORIES.indexOf(category) === -1) addError(errors, "category", "Elegí una categoría de uso válida.");

  var ingredients = cleanStringArray(recipe.ingredients, LIMITS.ingredientsMax, LIMITS.ingredient);
  var steps = cleanStringArray(recipe.steps, LIMITS.stepsMax, LIMITS.step);

  if (ingredients.sourceLength > LIMITS.ingredientsMax) addError(errors, "ingredients", "Hay demasiados ingredientes.");
  if (ingredients.list.length < LIMITS.ingredientsMin) addError(errors, "ingredients", "Agregá al menos dos ingredientes con sus cantidades.");
  if (ingredients.list.some(function(item){ return item.length > LIMITS.ingredient; })) addError(errors, "ingredients", "Uno de los ingredientes es demasiado largo.");

  if (steps.sourceLength > LIMITS.stepsMax) addError(errors, "steps", "Hay demasiados pasos.");
  if (steps.list.length < LIMITS.stepsMin) addError(errors, "steps", "Agregá al menos dos pasos de preparación.");
  if (steps.list.some(function(item){ return item.length > LIMITS.step; })) addError(errors, "steps", "Uno de los pasos es demasiado largo.");

  var story = cleanBlock(recipe.story);
  if (story.length > LIMITS.story) addError(errors, "story", "La experiencia es demasiado larga.");

  var precautions = cleanBlock(recipe.precautions);
  var noKnownPrecautions = recipe.noKnownPrecautions === true;
  if (precautions.length > LIMITS.precautions) addError(errors, "precautions", "Las precauciones son demasiado largas.");
  if (!precautions && !noKnownPrecautions) addError(errors, "precautions", "Escribí las precauciones o marcá que no conocés ninguna.");

  var consents = isObject(payload.consents) ? payload.consents : {};
  if (consents.authorship !== true) addError(errors, "consents", "Confirmá que la receta es tuya o que tenés permiso para compartirla.");
  if (consents.review !== true) addError(errors, "consents", "Aceptá la revisión editorial antes de enviar.");
  if (consents.privacy !== true) addError(errors, "consents", "Aceptá que tu nombre y ciudad se muestren si la receta se publica.");

  if (Object.keys(errors).length){
    return { ok: false, errors: errors, data: null };
  }

  return {
    ok: true,
    errors: {},
    data: {
      author: {
        firstName: firstName,
        lastName: lastName,
        fullName: firstName + " " + lastName,
        nationality: nationality,
        city: city,
        contact: contact
      },
      recipe: {
        category: category,
        ingredients: ingredients.list,
        steps: steps.list,
        story: story,
        precautions: noKnownPrecautions ? "" : precautions,
        noKnownPrecautions: noKnownPrecautions
      },
      consents: {
        authorship: true,
        review: true,
        privacy: true
      }
    }
  };
}

function makeId(){
  return "rc-" + Date.now().toString(36) + "-" + crypto.randomBytes(3).toString("hex");
}

function createRecipe(data, options){
  options = options || {};
  var now = new Date(options.now || Date.now()).toISOString();
  var record = {
    id: makeId(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    author: data.author,
    recipe: data.recipe,
    consents: data.consents,
    review: {
      identification: false,
      ingredients: false,
      preparation: false,
      safety: false,
      communication: false
    },
    moderation: {
      notes: "",
      lastReviewNote: "",
      notesUpdatedAt: null,
      history: [{ status: "pending", at: now, note: "Receta recibida para revisión." }]
    }
  };
  return record;
}

function canTransition(from, to){
  return TRANSITIONS[from] ? TRANSITIONS[from].indexOf(to) !== -1 : false;
}

function checklistComplete(review){
  if (!isObject(review)) return false;
  return REVIEW_KEYS.every(function(key){ return review[key] === true; });
}

function applyAdminPatch(record, patch, options){
  options = options || {};
  var now = new Date(options.now || Date.now()).toISOString();
  var next = JSON.parse(JSON.stringify(record));

  if (!isObject(patch)) return { ok: false, error: "Los cambios no tienen el formato esperado." };

  if (typeof patch.notes === "string"){
    var notes = cleanBlock(patch.notes);
    if (notes.length > LIMITS.notes) return { ok: false, error: "Las notas internas son demasiado largas." };
    next.moderation.notes = notes;
    next.moderation.notesUpdatedAt = now;
  }

  if (isObject(patch.review)){
    REVIEW_KEYS.forEach(function(key){
      if (key in patch.review) next.review[key] = patch.review[key] === true;
    });
  }

  if (patch.status !== undefined){
    var to = cleanLine(patch.status);
    if (STATUSES.indexOf(to) === -1) return { ok: false, error: "Estado inválido." };
    if (to === next.status){
      next.updatedAt = now;
      return { ok: true, record: next };
    }
    if (!canTransition(next.status, to)) return { ok: false, error: "Ese cambio de estado no está permitido." };
    if (to === "published" && !checklistComplete(next.review)){
      return { ok: false, error: "Completá el checklist editorial antes de publicar." };
    }
    var note = cleanBlock(patch.note || "");
    if ((to === "changes" || to === "rejected") && !note){
      return { ok: false, error: "Escribí el motivo antes de solicitar cambios o rechazar." };
    }
    next.status = to;
    next.updatedAt = now;
    if (to === "published") next.publishedAt = next.publishedAt || now;
    if (note) next.moderation.lastReviewNote = note;
    next.moderation.history.push({ status: to, at: now, note: note });
  } else {
    next.updatedAt = now;
  }

  return { ok: true, record: next };
}

function toPublic(record){
  if (!record || record.status !== "published") return null;
  var recipe = record.recipe || {};
  var author = record.author || {};
  return {
    id: record.id,
    category: recipe.category,
    author: {
      name: author.fullName || ((author.firstName || "") + " " + (author.lastName || "")).trim(),
      nationality: author.nationality || "",
      city: author.city || ""
    },
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.slice() : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps.slice() : [],
    story: recipe.story || "",
    precautions: recipe.precautions || "",
    noKnownPrecautions: recipe.noKnownPrecautions === true,
    publishedAt: record.publishedAt || record.updatedAt
  };
}

function getHeader(event, name){
  var headers = (event && event.headers) || {};
  var wanted = String(name).toLowerCase();
  var found = "";
  Object.keys(headers).forEach(function(key){
    if (String(key).toLowerCase() === wanted) found = headers[key];
  });
  return found;
}

function verifyAdminToken(event, env){
  var expected = env && env.ADMIN_TOKEN;
  if (!expected) return { ok: false, missing: true };
  var auth = getHeader(event, "authorization");
  var token = String(auth || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false };

  var a = Buffer.from(token);
  var b = Buffer.from(String(expected));
  if (a.length !== b.length) return { ok: false };
  try {
    return { ok: crypto.timingSafeEqual(a, b) };
  } catch (error){
    return { ok: false };
  }
}

module.exports = {
  CATEGORIES: CATEGORIES,
  STATUSES: STATUSES,
  STATUS_LABELS: STATUS_LABELS,
  TRANSITIONS: TRANSITIONS,
  LIMITS: LIMITS,
  REVIEW_KEYS: REVIEW_KEYS,
  PUBLIC_LEGEND: PUBLIC_LEGEND,
  cleanText: cleanText,
  cleanLine: cleanLine,
  cleanBlock: cleanBlock,
  validateSubmission: validateSubmission,
  createRecipe: createRecipe,
  canTransition: canTransition,
  checklistComplete: checklistComplete,
  applyAdminPatch: applyAdminPatch,
  toPublic: toPublic,
  getHeader: getHeader,
  verifyAdminToken: verifyAdminToken
};
