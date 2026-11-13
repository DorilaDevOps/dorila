"use strict";

/* =====================================================================
   DORILA — check-contraste.js
   Comprueba los pares de color principales de los paneles público y
   de administración contra WCAG AA. Sin dependencias externas.

   Uso:  node tools/check-contraste.js   (o: npm test)
   ===================================================================== */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var passed = 0;
var failed = 0;

function ok(name, condition){
  if (condition){ passed++; console.log("  ok   " + name); }
  else { failed++; console.log("  FAIL " + name); }
}

function block(css, selector){
  var start = css.indexOf(selector + "{");
  if (start === -1) return "";
  var end = css.indexOf("}", start);
  return end === -1 ? "" : css.slice(start, end);
}

function tokens(css, selector){
  var found = {};
  var source = block(css, selector);
  var pattern = /(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,6})\s*;/gi;
  var match;
  while ((match = pattern.exec(source))){
    found[match[1]] = match[2];
  }
  return found;
}

function tokenNames(css, selector){
  var found = [];
  var source = block(css, selector);
  var pattern = /(--[a-z0-9-]+)\s*:/gi;
  var match;
  while ((match = pattern.exec(source))){
    found.push(match[1]);
  }
  return found;
}

function rgb(hex){
  var value = hex.replace("#", "");
  if (value.length === 3){
    value = value.split("").map(function(char){ return char + char; }).join("");
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ];
}

function luminance(color){
  return color.map(function(channel){
    var value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  }).reduce(function(total, value, index){
    return total + value * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

function ratio(foreground, background){
  var first = luminance(rgb(foreground));
  var second = luminance(rgb(background));
  var lighter = Math.max(first, second);
  var darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function pair(name, foreground, background, minimum){
  var actual = ratio(foreground, background);
  var condition = actual >= minimum;
  ok(name + " (" + actual.toFixed(2) + ":1)", condition);
  if (!condition){
    console.log("         mínimo: " + minimum.toFixed(1) + ":1; colores: " + foreground + " / " + background);
  }
}

var communityCss = fs.readFileSync(path.join(ROOT, "asset", "comunidad.css"), "utf8");
var adminCss = fs.readFileSync(path.join(ROOT, "asset", "admin-recetas.css"), "utf8");
var community = tokens(communityCss, ":root");
var communityTokenNames = tokenNames(communityCss, ":root");
var communityReferences = (communityCss.match(/var\(--cr-[a-z0-9-]+/gi) || []).map(function(reference){
  return reference.slice(4);
});
communityReferences = communityReferences.filter(function(name, index){
  return communityReferences.indexOf(name) === index;
});
var missingCommunityTokens = communityReferences.filter(function(name){
  return communityTokenNames.indexOf(name) === -1;
});
var communityLiteralDialogCss = communityCss
  .slice(communityCss.indexOf("/* ---------- Diálogos ---------- */"))
  .replace(/var\(--cr-backdrop,\s*rgba\([^)]+\)\)/g, "");
var admin = tokens(adminCss, ".admin-page");

console.log("1. Tokens de contraste");
[
  "--cr-deep", "--cr-muted", "--cr-border", "--cr-field-bg", "--cr-focus",
  "--cr-sage-strong", "--cr-sand-hover", "--cr-progress-bg", "--cr-progress-text",
  "--cr-disabled-bg", "--cr-disabled-text", "--cr-error", "--cr-error-strong",
  "--cr-error-bg", "--cr-error-border", "--cr-warning-bg", "--cr-warning-border",
  "--cr-invalid-bg", "--cr-invalid-border", "--cr-summary-bg", "--cr-close-bg",
  "--cr-sage-soft", "--cr-on-dark"
].forEach(function(name){
  ok("público define " + name, Boolean(community[name]));
});
ok("público declara todos los tokens en :root",
  communityTokenNames.indexOf("--cr-deep") !== -1 && communityTokenNames.indexOf("--cr-backdrop") !== -1);
ok("público resuelve todas las referencias --cr-*",
  missingCommunityTokens.length === 0);
if (missingCommunityTokens.length){
  console.log("         faltan: " + missingCommunityTokens.join(", "));
}
[
  "--admin-text", "--admin-muted", "--admin-accent", "--admin-border",
  "--admin-field-bg", "--admin-focus", "--admin-disabled-bg",
  "--admin-disabled-text", "--admin-error", "--admin-error-strong",
  "--admin-error-bg"
].forEach(function(name){
  ok("admin define " + name, Boolean(admin[name]));
});

console.log("\n2. Contraste del panel público");
var CR_IVORY = "#F7F5EF";
var CR_GREEN = "#E9F0E7";
pair("texto principal sobre tarjeta", community["--cr-deep"], CR_IVORY, 4.5);
pair("texto principal sobre campo", community["--cr-deep"], community["--cr-field-bg"], 4.5);
pair("texto secundario sobre tarjeta", community["--cr-muted"], CR_IVORY, 4.5);
pair("texto secundario sobre campo", community["--cr-muted"], community["--cr-field-bg"], 4.5);
pair("texto secundario sobre fondo verde", community["--cr-muted"], CR_GREEN, 4.5);
pair("acento verde sobre fondo verde", community["--cr-sage-strong"], CR_GREEN, 4.5);
pair("acento verde sobre tarjeta", community["--cr-sage-strong"], CR_IVORY, 4.5);
pair("botón CTA en hover", community["--cr-deep"], community["--cr-sand-hover"], 4.5);
pair("texto del progreso", community["--cr-progress-text"], community["--cr-progress-bg"], 4.5);
pair("texto deshabilitado", community["--cr-disabled-text"], community["--cr-disabled-bg"], 4.5);
pair("error sobre tarjeta", community["--cr-error"], CR_IVORY, 4.5);
pair("error fuerte sobre aviso", community["--cr-error-strong"], community["--cr-error-bg"], 4.5);
pair("borde de campo sobre tarjeta", community["--cr-border"], CR_IVORY, 3);
pair("borde de campo sobre campo", community["--cr-border"], community["--cr-field-bg"], 3);
pair("borde de filtro sobre fondo verde", community["--cr-border"], CR_GREEN, 3);
pair("foco sobre tarjeta", community["--cr-focus"], CR_IVORY, 3);
pair("foco sobre fondo verde", community["--cr-focus"], CR_GREEN, 3);
pair("texto secundario sobre aviso", community["--cr-muted"], community["--cr-warning-bg"], 4.5);
pair("texto secundario sobre error", community["--cr-muted"], community["--cr-error-bg"], 4.5);
pair("texto secundario sobre resumen", community["--cr-muted"], community["--cr-summary-bg"], 4.5);
pair("texto principal sobre resumen", community["--cr-deep"], community["--cr-summary-bg"], 4.5);
pair("texto principal sobre campo inválido", community["--cr-deep"], community["--cr-invalid-bg"], 4.5);
pair("error sobre campo inválido", community["--cr-error"], community["--cr-invalid-bg"], 4.5);
pair("texto sobre botón agregar", community["--cr-deep"], community["--cr-sage-soft"], 4.5);
pair("texto claro sobre acento", community["--cr-on-dark"], community["--cr-sage"], 4.5);
pair("texto claro sobre peligro", community["--cr-on-dark"], community["--cr-error-strong"], 4.5);
pair("borde inválido sobre campo inválido", community["--cr-invalid-border"], community["--cr-invalid-bg"], 3);
pair("borde de cierre sobre fondo de cierre", community["--cr-border"], community["--cr-close-bg"], 3);
pair("borde de aviso sobre fondo de aviso", community["--cr-warning-border"], community["--cr-warning-bg"], 3);
pair("borde de error sobre fondo de error", community["--cr-error-border"], community["--cr-error-bg"], 3);

console.log("\n3. Contraste del panel de administración");
var AD_PAGE = "#E9F0E7";
var AD_IVORY = "#F7F5EF";
pair("texto principal sobre página", admin["--admin-text"], AD_PAGE, 4.5);
pair("texto principal sobre tarjeta", admin["--admin-text"], AD_IVORY, 4.5);
pair("texto secundario sobre página", admin["--admin-muted"], AD_PAGE, 4.5);
pair("texto secundario sobre tarjeta", admin["--admin-muted"], AD_IVORY, 4.5);
pair("acento sobre página", admin["--admin-accent"], AD_PAGE, 4.5);
pair("acento sobre tarjeta", admin["--admin-accent"], AD_IVORY, 4.5);
pair("borde de campo sobre página", admin["--admin-border"], AD_PAGE, 3);
pair("borde de campo sobre tarjeta", admin["--admin-border"], AD_IVORY, 3);
pair("borde de campo sobre campo", admin["--admin-border"], admin["--admin-field-bg"], 3);
pair("foco sobre página", admin["--admin-focus"], AD_PAGE, 3);
pair("foco sobre tarjeta", admin["--admin-focus"], AD_IVORY, 3);
pair("texto deshabilitado", admin["--admin-disabled-text"], admin["--admin-disabled-bg"], 4.5);
pair("error fuerte sobre aviso", admin["--admin-error-strong"], admin["--admin-error-bg"], 4.5);
pair("blanco sobre botón peligro", "#FFFFFF", admin["--admin-error"], 4.5);

console.log("\n4. Reglas de accesibilidad en CSS");
ok("público declara placeholders con color propio",
  /\.community-field input::placeholder[\s\S]*?color:\s*var\(--cr-muted\)/.test(communityCss));
ok("público declara textos deshabilitados",
  /\.community-field input:disabled[\s\S]*?color:\s*var\(--cr-disabled-text\)/.test(communityCss));
ok("público usa tokens en campos inválidos",
  /aria-invalid="true"\][\s\S]*?border-color:\s*var\(--cr-invalid-border\)[\s\S]*?background:\s*var\(--cr-invalid-bg\)/.test(communityCss));
ok("público usa tokens en diálogo de aviso",
  /\.community-dialog\.is-warning \.community-dialog-card\{[^}]*background:\s*var\(--cr-warning-bg\)[^}]*border-color:\s*var\(--cr-warning-border\)/.test(communityCss));
ok("público usa tokens en diálogo de error",
  /\.community-dialog\.is-error \.community-dialog-card\{[^}]*background:\s*var\(--cr-error-bg\)[^}]*border-color:\s*var\(--cr-error-border\)/.test(communityCss));
ok("público usa token en botón de cierre",
  /\.community-dialog-close\{[^}]*background:\s*var\(--cr-close-bg\)/.test(communityCss));
ok("público usa token en resumen de confirmación",
  /\.community-confirm-summary\{[^}]*background:\s*var\(--cr-summary-bg\)/.test(communityCss));
ok("diálogos y formulario no usan colores literales",
  !/#[0-9a-f]{3,8}\b|rgba?\(/i.test(communityLiteralDialogCss));
ok("admin declara placeholders con color propio",
  /\.admin-token-form input::placeholder[\s\S]*?color:\s*var\(--admin-muted\)/.test(adminCss));
ok("admin declara botón peligro con hover",
  /\.admin-btn-danger:hover\{[^}]*var\(--admin-error-strong\)/.test(adminCss));

console.log("\n" + "=".repeat(58));
console.log(passed + " ok, " + failed + " fallo(s)");
console.log("=".repeat(58));
process.exit(failed ? 1 : 0);
