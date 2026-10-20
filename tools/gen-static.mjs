// Genera contenido.html: el libro completo como HTML semántico, sin JavaScript.
// Sirve para buscadores, lectores que no ejecutan scripts y como respaldo offline.
// La salida es determinista (sin fechas) para que CI pueda detectar artefactos desincronizados.
import { writeFileSync, readFileSync } from "node:fs";
import { BOOK } from "../src/book-data.js";
import { keyIdea } from "../src/theme.js";

const SITE = "https://ricanssweets.github.io/libro-expande-tu-mente-/";
const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const slug = (c) => c.id;
const label = (c) => (c.num ? `Capítulo ${c.num}` : "Introducción");

const paragraphs = (arr) => (arr || []).map((p) => `      <p>${esc(p)}</p>`).join("\n");

const renderChapter = (c) => {
  const out = [];
  out.push(`  <section id="${slug(c)}" aria-labelledby="${slug(c)}-titulo">`);
  out.push(`    <p class="tag">${esc(c.tag)}</p>`);
  out.push(`    <h2 id="${slug(c)}-titulo">${esc(c.title)}</h2>`);
  if (c.subtitle) out.push(`    <p class="sub">${esc(c.subtitle)}</p>`);
  if (c.hook) out.push(`    <blockquote><p>${esc(c.hook)}</p></blockquote>`);
  if (c.paragraphs) out.push(paragraphs(c.paragraphs));
  if (c.pullquote) out.push(`    <blockquote><p>${esc(c.pullquote)}</p></blockquote>`);
  for (const s of c.sections || []) {
    out.push(`    <h3>${esc(s.h)}</h3>`);
    out.push(paragraphs(s.p));
  }
  if (c.steps) {
    out.push("    <ol>");
    for (const s of c.steps) out.push(`      <li><strong>${esc(s.t)}</strong> — ${esc(s.d)}</li>`);
    out.push("    </ol>");
  }
  if (c.exercise) {
    out.push('    <div class="exercise">');
    out.push(`      <h3>Ejercicio — ${esc(c.exercise.title)}</h3>`);
    out.push("      <ul>");
    for (const item of c.exercise.items) out.push(`        <li>${esc(item)}</li>`);
    out.push("      </ul>");
    out.push("    </div>");
  }
  const idea = keyIdea(c);
  if (idea) out.push(`    <div class="keyidea"><h3>${esc(idea.label)}</h3><p>${esc(idea.text)}</p></div>`);
  if (c.closing) out.push(`    <p>${esc(c.closing)}</p>`);
  if (c.teaser) out.push(`    <p class="sub">Sigue leyendo → ${esc(c.teaser)}</p>`);
  out.push("  </section>");
  return out.join("\n");
};

const toc = BOOK.map((c) =>
  `      <li><a href="#${slug(c)}">${esc(label(c))}. ${esc(c.title)}</a></li>`
).join("\n");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>Expande Tu Mente — el libro completo (texto)</title>
<meta name="description" content="Texto completo de Expande Tu Mente: 15 capítulos sobre cómo aprende el cerebro, con un ejercicio práctico por capítulo."/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="${SITE}contenido.html"/>
<meta name="theme-color" content="#F5EEDC"/>
<meta name="color-scheme" content="light dark"/>
<meta property="og:type" content="book"/>
<meta property="og:title" content="Expande Tu Mente — el libro completo"/>
<meta property="og:description" content="15 capítulos sobre aprendizaje y memoria, en texto."/>
<meta property="og:url" content="${SITE}contenido.html"/>
<meta property="og:image" content="${SITE}icon-512.png"/>
<link rel="manifest" href="manifest.json"/>
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"/>
<link rel="stylesheet" href="styles.css"/>
</head>
<body>
<main class="static-page">
  <p class="tag">Sistema Memoria Expandida™</p>
  <h1>Expande Tu Mente</h1>
  <p class="sub">Aprende como realmente aprende tu cerebro.</p>
  <p>Versión en texto: ${BOOK.length} capítulos con un ejercicio práctico en cada uno.</p>

  <nav class="toc" aria-label="Contenido">
    <h2>Contenido</h2>
    <ol>
${toc}
    </ol>
  </nav>

${BOOK.map(renderChapter).join("\n\n")}

  <footer>
    <p><a class="back" href="index.html">← Volver a la versión interactiva</a></p>
    <p>Versión ${VERSION} · generado por tools/gen-static.mjs a partir de src/book-data.js.</p>
  </footer>
</main>
</body>
</html>
`;

writeFileSync("contenido.html", html, "utf8");
const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter((w) => w.length > 1).length;
console.log(JSON.stringify({ file: "contenido.html", bytes: Buffer.byteLength(html), chapters: BOOK.length, approxWords: words }));
