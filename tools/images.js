// =====================================================================
// DORILA — Optimizador de imágenes.
// Genera <nombre>.webp (máx. 1200px, calidad 80) y <nombre>-thumb.webp
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
const THUMB_WIDTH = 32;
const QUALITY = 80;
const SKIP = new Set(["favicon.png", "og-dorila.png"]);

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
    const thumb = base + "-thumb.webp";

    const srcStat = fs.statSync(file);
    const stale = (out) =>
      !fs.existsSync(out) || srcStat.mtimeMs > fs.statSync(out).mtimeMs;

    if (!stale(webp)) {
      kept++;
      continue;
    }

    await sharp(file)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(webp);

    await sharp(file)
      .rotate()
      .resize({ width: THUMB_WIDTH })
      .webp({ quality: 60 })
      .toFile(thumb);

    const kb = (fs.statSync(webp).size / 1024).toFixed(1);
    console.log("→ " + path.basename(webp) + " (" + kb + " KB)");
    updated++;
  }

  const siteText = loadSiteText();
  let removed = 0;
  for (const f of fs.readdirSync(SRC_DIR)) {
    if (!f.endsWith(".webp")) continue;
    const base = f.endsWith("-thumb.webp")
      ? f.slice(0, f.length - "-thumb.webp".length)
      : f.slice(0, f.length - ".webp".length);
    const hasSource = [".jpg", ".jpeg", ".png"].some((ext) =>
      fs.existsSync(path.join(SRC_DIR, base + ext))
    );
    if (hasSource) continue;
    const plainName = base + ".webp";
    if (siteText.includes("img/" + f) || siteText.includes("img/" + plainName)) continue;
    fs.unlinkSync(path.join(SRC_DIR, f));
    console.log("⌫ huérfano eliminado: " + f);
    removed++;
  }

  let thumbAdded = 0;
  for (const f of fs.readdirSync(SRC_DIR)) {
    if (!f.endsWith(".webp") || f.endsWith("-thumb.webp")) continue;
    const thumb = f.slice(0, f.length - ".webp".length) + "-thumb.webp";
    if (fs.existsSync(path.join(SRC_DIR, thumb))) continue;
    await sharp(path.join(SRC_DIR, f))
      .resize({ width: THUMB_WIDTH })
      .webp({ quality: 60 })
      .toFile(path.join(SRC_DIR, thumb));
    console.log("→ thumb reparado: " + thumb);
    thumbAdded++;
  }

  console.log(
    `\nImágenes: ${updated} regeneradas, ${kept} sin cambios, ${removed} huérfanos eliminados, ${thumbAdded} thumbs reparados.`
  );
  if (updated) {
    console.log("Corré también: node tools/generate.js (no necesario por contenido).");
  }
})();