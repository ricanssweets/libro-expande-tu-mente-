// Genera el audiolibro completo: un MP3 por entrada del libro (salta la bibliografía,
// que es una lista de referencias). Reanudable: salta los MP3 que ya existen.
// Uso: node tools/build-audiobook.mjs [ruta-salida]
import { BOOK } from "../src/book-data.js";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] || new URL("../ediciones/audio", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const scriptDir = "/tmp/audiobook-scripts";
mkdirSync(scriptDir, { recursive: true });

function flatten(entry) {
  const parts = [];
  const walk = (x) => {
    if (typeof x === "string") parts.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object")
      for (const [k, v] of Object.entries(x)) {
        if (["id", "num", "tag", "title", "subtitle"].includes(k)) continue;
        walk(v);
      }
  };
  for (const key of ["hook", "paragraphs", "pullquote", "sections", "steps", "exercise", "keyidea", "closing"])
    if (entry[key]) walk(entry[key]);
  return parts.map((s) => s.trim()).filter(Boolean);
}

let done = 0;
BOOK.forEach((entry, i) => {
  if (entry.id === "bibliografia") return;
  const nn = String(i + 1).padStart(2, "0");
  const file = join(outDir, `${nn}-${entry.id}.mp3`);
  if (existsSync(file)) {
    console.log(`skip ${file} (ya existe)`);
    done++;
    return;
  }
  const head = entry.num
    ? `Capítulo ${entry.num}. ${entry.title}. ${entry.subtitle || ""}`
    : `${entry.tag || "Introducción"}. ${entry.title}. ${entry.subtitle || ""}`;
  const blocks = [head, ...flatten(entry)];
  const script = blocks.map((b) => `Narrador: ${b.replace(/\s+/g, " ")}`).join("\n\n");
  const scriptPath = join(scriptDir, `${nn}-${entry.id}.txt`);
  writeFileSync(scriptPath, script);
  console.log(`narrando ${file} (${blocks.length} bloques)…`);
  execFileSync(
    "/opt/hatch/bin/tts",
    ["synthesize-script", "--script", scriptPath, "--speaker", "Narrador=avocado_v2:MAI_03", "--language", "es", "--output", file],
    { stdio: "inherit" }
  );
  done++;
});
console.log(`audiolibro: ${done} archivos en ${outDir}`);
