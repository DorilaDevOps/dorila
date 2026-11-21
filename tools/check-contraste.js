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
  var pattern = /(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,6}|var\(--[a-z0-9-]+\))\s*;/gi;
  var match;
  while ((match = pattern.exec(source))){
    found[match[1]] = match[2];
  }
  return found;
}

function resolveAliases(target, fallbacks){
  Object.keys(target).forEach(function(name){
    var value = target[name];
    var seen = {};
    while (/^var\(--[a-z0-9-]+\)$/i.test(value) && !seen[value]){
      seen[value] = true;
      var alias = value.slice(4, -1);
      value = target[alias] || fallbacks[alias] || "";
    }
    target[name] = value;
  });
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

function mix(foreground, background, percent){
  var first = rgb(foreground);
  var second = rgb(background);
  return "#" + first.map(function(value, index){
    return Math.round(value * percent + second[index] * (1 - percent)).toString(16).padStart(2, "0");
  }).join("");
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
var baseCss = fs.readFileSync(path.join(ROOT, "asset", "base.css"), "utf8");
var base = tokens(baseCss, ":root");
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
resolveAliases(base, {});
resolveAliases(community, base);
resolveAliases(admin, base);

console.log("1. Tokens de contraste");
[
  "--cr-green", "--cr-sage", "--cr-sage-strong", "--cr-ivory", "--cr-sand",
  "--cr-sand-hover", "--cr-deep", "--cr-muted", "--cr-border", "--cr-field-bg",
  "--cr-focus", "--cr-on-dark", "--cr-progress-bg", "--cr-progress-text",
  "--cr-disabled-bg", "--cr-disabled-text", "--cr-error", "--cr-error-strong",
  "--cr-error-bg", "--cr-error-border", "--cr-warning-bg", "--cr-warning-border"
].forEach(function(name){
  ok("público define " + name, Boolean(community[name]));
});
ok("público define --cr-backdrop", communityTokenNames.indexOf("--cr-backdrop") !== -1);
ok("público define --cr-shadow", communityTokenNames.indexOf("--cr-shadow") !== -1);
ok("público declara todos los tokens en :root",
  communityTokenNames.indexOf("--cr-deep") !== -1 && communityTokenNames.indexOf("--cr-backdrop") !== -1);
ok("público mantiene una paleta reducida", communityTokenNames.length >= 18 && communityTokenNames.length <= 26);
ok("verdes base unificados en 4 tokens",
  ["--color-forest", "--color-forest-deep", "--color-salvia", "--color-salvia-claro"].every(function(name){
    return /^#[0-9a-f]{6}$/i.test(base[name]);
  }));
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
pair("acento sobre fondo verde", community["--cr-muted"], CR_GREEN, 4.5);
pair("acento sobre tarjeta", community["--cr-muted"], CR_IVORY, 4.5);
pair("botón CTA en hover", community["--cr-deep"], community["--cr-sand-hover"], 4.5);
pair("texto del progreso", community["--cr-deep"], community["--cr-progress-bg"], 4.5);
pair("texto deshabilitado", community["--cr-muted"], community["--cr-progress-bg"], 4.5);
pair("error sobre tarjeta", community["--cr-error"], CR_IVORY, 4.5);
pair("error sobre aviso", community["--cr-error"], community["--cr-error-bg"], 4.5);
pair("borde de campo sobre tarjeta", community["--cr-border"], CR_IVORY, 3);
pair("borde de campo sobre campo", community["--cr-border"], community["--cr-field-bg"], 3);
pair("borde de filtro sobre fondo verde", community["--cr-border"], CR_GREEN, 3);
pair("foco sobre tarjeta", community["--cr-focus"], CR_IVORY, 3);
pair("foco sobre fondo verde", community["--cr-focus"], CR_GREEN, 3);
pair("texto secundario sobre aviso", community["--cr-muted"], community["--cr-warning-bg"], 4.5);
pair("texto secundario sobre error", community["--cr-muted"], community["--cr-error-bg"], 4.5);
pair("texto secundario sobre resumen", community["--cr-muted"], community["--cr-progress-bg"], 4.5);
pair("texto principal sobre resumen", community["--cr-deep"], community["--cr-progress-bg"], 4.5);
pair("texto principal sobre campo inválido", community["--cr-deep"], community["--cr-error-bg"], 4.5);
pair("error sobre campo inválido", community["--cr-error"], community["--cr-error-bg"], 4.5);
pair("texto sobre botón agregar", community["--cr-deep"], community["--cr-green"], 4.5);
pair("texto claro sobre acento", community["--cr-on-dark"], community["--cr-focus"], 4.5);
pair("texto claro sobre peligro", community["--cr-on-dark"], community["--cr-error"], 4.5);
pair("borde inválido sobre campo inválido", community["--cr-error-border"], community["--cr-error-bg"], 3);
pair("borde de cierre sobre fondo de cierre", community["--cr-border"], community["--cr-ivory"], 3);
pair("borde de aviso sobre fondo de aviso", community["--cr-warning-border"], community["--cr-warning-bg"], 3);
pair("borde de error sobre fondo de error", community["--cr-error-border"], community["--cr-error-bg"], 3);
pair("texto del CTA sobre fondo tintado", base["--color-alerta-text"], mix(base["--color-forest"], community["--cr-green"], 0.08), 4.5);
pair("texto del botón del CTA", base["--color-crema"], community["--cr-deep"], 4.5);

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

console.log("\n4. Contraste del footer");
pair("crema sobre bosque", base["--color-crema"], base["--color-forest-bosque"], 4.5);
pair("salvia claro sobre bosque", base["--color-salvia-claro"], base["--color-forest-bosque"], 4.5);
pair("borde salvia sobre bosque", base["--color-salvia"], base["--color-forest-bosque"], 3);

console.log("\n4b. Contraste de alertas botánicas");
pair("texto de alerta EXTREMA", base["--color-alerta-ink"], base["--color-alerta-bg"], 4.5);
pair("borde de alerta EXTREMA", base["--color-alerta-border"], base["--color-alerta-bg"], 3);
pair("texto de alerta suave", base["--color-alerta-soft-ink"], base["--color-alerta-soft-bg"], 4.5);
pair("borde de alerta suave", base["--color-alerta-soft-border"], base["--color-alerta-soft-bg"], 3);
ok("alerta EXTREMA usa tokens de identidad",
  /\.alerta-toxica-extrema[\s\S]*?background:\s*var\(--color-alerta-bg\)[\s\S]*?color:\s*var\(--color-alerta-ink\)/.test(baseCss));
ok("alerta suave usa tokens de identidad",
  /\.alerta-toxica,[\s\S]*?background:\s*var\(--color-alerta-soft-bg\)[\s\S]*?color:\s*var\(--color-alerta-soft-ink\)/.test(baseCss));

console.log("\n5. Reglas de accesibilidad en CSS");
ok("público declara placeholders con color propio",
  /\.community-field input::placeholder[\s\S]*?color:\s*var\(--cr-muted\)/.test(communityCss));
ok("público declara textos deshabilitados",
  /\.community-field input:disabled[\s\S]*?color:\s*var\(--cr-disabled-text\)/.test(communityCss));
ok("público mantiene foco visible en consentimientos",
  /\.community-consents input:focus-visible[\s\S]*?outline:\s*2px solid var\(--cr-sage\)/.test(communityCss));
ok("público usa tokens en campos inválidos",
  /aria-invalid="true"\][\s\S]*?border-color:\s*var\(--cr-error-border\)[\s\S]*?background:\s*var\(--cr-error-bg\)/.test(communityCss));
ok("público usa tokens en diálogo de aviso",
  /\.community-dialog\.is-warning \.community-dialog-card\{[^}]*background:\s*var\(--cr-warning-bg\)[^}]*border-color:\s*var\(--cr-warning-border\)/.test(communityCss));
ok("público usa tokens en diálogo de error",
  /\.community-dialog\.is-error \.community-dialog-card\{[^}]*background:\s*var\(--cr-error-bg\)[^}]*border-color:\s*var\(--cr-error-border\)/.test(communityCss));
ok("público usa token en botón de cierre",
  /\.community-dialog-close\{[^}]*background:\s*var\(--cr-ivory\)/.test(communityCss));
ok("público usa token en resumen de confirmación",
  /\.community-confirm-summary\{[^}]*background:\s*var\(--cr-progress-bg\)/.test(communityCss));
ok("público usa tint compartido como fondo del CTA",
  /\.community-cta\{[^}]*background:\s*var\(--color-forest-tint\)/.test(communityCss));
ok("público usa texto de alerta accesible en el CTA",
  /\.community-cta p\{[^}]*color:\s*var\(--color-alerta-text\)/.test(communityCss));
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
