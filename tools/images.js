// =====================================================================
// DORILA — Optimizador de imágenes.
// Genera <nombre>.webp (máx. 1200px, calidad 80), <nombre>-480.webp
// (máx. 480px, srcset responsive) y <nombre>-thumb.webp
// (32px, placeholder difuminado) para cada imagen del directorio img/.
//
// Uso:  node tools/images.js
// (también corre automáticamente en el build de Netlify: npm run build)
//
// Reglas:
//  - Procesa jpg/jpeg/png de la raíz de img/ (no img/icons/).
//  - Mantiene favicon.png y og-dorila.png intactos (formatos fijos).
//  - Solo regenera si el original es más nuevo que el .webp existente.
//  - Reescribe el README con la tabla de equivalencias (opcional).
// =====================================================================

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "img");
const MAX_WIDTH = 1200;
const SMALL_WIDTH = 480;
const THUMB_WIDTH = 32;
const QUALITY = 80;
const SKIP = new Set(["favicon.png", "og-dorila.png", "cart22.png"]);

function loadSiteText() {
  let text = "";
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === "img") continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(html|js|css)$/i.test(e.name)) text += fs.readFileSync(p, "utf8") + "\n";
    }
  };
  walk(ROOT);
  return text;
}

(async () => {
  const sources = fs
    .readdirSync(SRC_DIR)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return [".jpg", ".jpeg", ".png"].includes(ext) && !SKIP.has(f);
    })
    .map((f) => path.join(SRC_DIR, f))
    .sort();

  let updated = 0;
  let kept = 0;

  for (const file of sources) {
    const base = file.slice(0, file.lastIndexOf("."));
    const webp = base + ".webp";
    const small = base + "-480.webp";
    const thumb = base + "-thumb.webp";

    const srcStat = fs.statSync(file);
    const stale = (out) =>
      !fs.existsSync(out) || srcStat.mtimeMs > fs.statSync(out).mtimeMs;
    const outputs = [
      { file: webp, width: MAX_WIDTH, quality: QUALITY, withoutEnlargement: true },
      { file: small, width: SMALL_WIDTH, quality: QUALITY, withoutEnlargement: true },
      { file: thumb, width: THUMB_WIDTH, quality: 60, withoutEnlargement: false }
    ].filter((out) => stale(out.file));

    if (outputs.length === 0) {
      kept++;
      continue;
    }

    for (const out of outputs) {
      await sharp(file)
        .rotate()
        .resize({ width: out.width, withoutEnlargement: out.withoutEnlargement })
        .webp({ quality: out.quality })
        .toFile(out.file);
    }

    const kb = (fs.statSync(webp).size / 1024).toFixed(1);
    console.log("→ " + path.basename(webp) + " (" + kb + " KB)");
    updated++;
  }

  const siteText = loadSiteText();
  let removed = 0;
  for (const f of fs.readdirSync(SRC_DIR)) {
    if (!f.endsWith(".webp")) continue;
    const suffix = f.endsWith("-thumb.webp")
      ? "-thumb.webp"
      : f.endsWith("-480.webp")
      ? "-480.webp"
      : ".webp";
    const base = f.slice(0, f.length - suffix.length);
    const hasSource = [".jpg", ".jpeg", ".png"].some((ext) =>
      fs.existsSync(path.join(SRC_DIR, base + ext))
    );
    if (hasSource) continue;
    const variants = [base + ".webp", base + "-480.webp", base + "-thumb.webp"];
    if (variants.some((variant) => siteText.includes("img/" + variant))) continue;
    fs.unlinkSync(path.join(SRC_DIR, f));
    console.log("⌫ huérfano eliminado: " + f);
    removed++;
  }

  let variantsAdded = 0;
  for (const f of fs.readdirSync(SRC_DIR)) {
    if (!f.endsWith(".webp") || f.endsWith("-thumb.webp") || f.endsWith("-480.webp")) continue;
    const stem = f.slice(0, f.length - ".webp".length);
    const missing = [
      { file: stem + "-480.webp", width: SMALL_WIDTH, quality: QUALITY, label: "480" },
      { file: stem + "-thumb.webp", width: THUMB_WIDTH, quality: 60, label: "thumb" }
    ].filter((out) => !fs.existsSync(path.join(SRC_DIR, out.file)));

    for (const out of missing) {
      await sharp(path.join(SRC_DIR, f))
        .resize({ width: out.width })
        .webp({ quality: out.quality })
        .toFile(path.join(SRC_DIR, out.file));
      console.log("→ " + out.label + " reparado: " + out.file);
      variantsAdded++;
    }
  }

  console.log(
    `\nImágenes: ${updated} regeneradas, ${kept} sin cambios, ${removed} huérfanos eliminados, ${variantsAdded} variantes reparadas.`
  );
  if (updated) {
    console.log("Corré también: node tools/generate.js (no necesario por contenido).");
  }
})();