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

  console.log(
    `\nImágenes: ${updated} regeneradas, ${kept} sin cambios.`
  );
  if (updated) {
    console.log("Corré también: node tools/generate.js (no necesario por contenido).");
  }
})();