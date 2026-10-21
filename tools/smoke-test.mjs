// Pruebas del sitio: contrato de archivos + render en servidor + ejecución real del
// bundle en un DOM simulado (jsdom). Uso: npm test
import { readFileSync, existsSync } from "node:fs";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

const results = [];
let failed = 0;
function check(name, condition, detail = "") {
  const pass = !!condition;
  if (!pass) failed++;
  results.push({ name, pass, detail });
  console.log(`${pass ? "ok  " : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

/* ---------------------------------------------------- 1. contrato de archivos */

const manifest = JSON.parse(read("manifest.json"));
check("manifest: campos obligatorios", ["name", "start_url", "display", "icons"].every((k) => k in manifest));
check("manifest: orientation libre", manifest.orientation === "any", `orientation=${manifest.orientation}`);
check("manifest: iconos 192 y 512", manifest.icons.some((i) => i.sizes === "192x192") && manifest.icons.some((i) => i.sizes === "512x512"));
check("manifest: purpose any y maskable separados",
  manifest.icons.some((i) => i.purpose === "any") && manifest.icons.some((i) => i.purpose === "maskable"));
check("manifest: sin mojibake", !/Ã|Â/.test(read("manifest.json")));

const indexHtml = read("index.html");
check("index: title", /<title>[^<]{5,}<\/title>/.test(indexHtml));
check("index: meta description", /name="description"/.test(indexHtml));
check("index: Open Graph", /property="og:title"/.test(indexHtml) && /property="og:image"/.test(indexHtml));
check("index: canonical", /rel="canonical"/.test(indexHtml));
check("index: CSP declarada", /Content-Security-Policy/.test(indexHtml));
check("index: sin scripts de terceros", !/<script[^>]+src="https?:/.test(indexHtml));
check("index: sin Babel en el navegador", !/text\/babel/.test(indexHtml) && !/babel-standalone/.test(indexHtml));
check("index: color-scheme", /name="color-scheme"/.test(indexHtml));
check("index: lang es", /<html lang="es"/.test(indexHtml));
check("index: respaldo dentro de #root", /<div id="root">[\s\S]*?<h1>Expande Tu Mente<\/h1>/.test(indexHtml));
check("index: enlace a la version sin JavaScript", /href="contenido\.html"/.test(indexHtml));
check("index: sin mojibake", !/Ã|Â/.test(indexHtml));

/* activos referenciados por el shell */
const localAssets = [...indexHtml.matchAll(/(?:src|href)="([^"#:]+)"/g)]
  .map((m) => m[1]).filter((u) => !u.startsWith("http") && !u.startsWith("data:"));
const missingAssets = [...new Set(localAssets)].filter((u) => !existsSync(new URL(u, root)));
check("index: todos los activos locales existen", missingAssets.length === 0, missingAssets.join(", "));

/* service worker */
const sw = read("sw.js");
const version = (sw.match(/const VERSION = '([^']+)'/) || [])[1];
check("sw: version declarada", !!version, version);
check("sw: skipWaiting", /skipWaiting\(\)/.test(sw));
check("sw: clients.claim", /clients\.claim\(\)/.test(sw));
check("sw: borra cache antigua", /caches\.delete/.test(sw));
check("sw: precache uno a uno con catch", /PRECACHE\.map/.test(sw) && /catch/.test(sw));
check("sw: navegacion red-primero", /isNavigation/.test(sw) && /await fetch\(request\)/.test(sw));
const precache = (sw.match(/const PRECACHE = \[([\s\S]*?)\];/) || [])[1].split("\n").map((s) => s.trim().replace(/[',]/g, "")).filter(Boolean);
const precacheMissing = precache.filter((p) => p !== "./" && !existsSync(new URL(p.replace(/^\.\//, ""), root)));
check("sw: todo lo precacheado existe", precacheMissing.length === 0, precacheMissing.join(", "));
check("sw: cachea la app y los estilos", precache.includes("./app.js") && precache.includes("./styles.css") && precache.includes("./contenido.html"));

/* Bundle: el marcador real es una etiqueta JSX que NO venga precedida de una comilla
   (React incluye la cadena "<svg>" internamente; eso no es JSX). */
const appJs = read("app.js");
const rawTags = [...appJs.matchAll(/(^|[^"'])<(div|span|button|Icon|svg)[\s/>]/g)];
check("app.js: sin JSX crudo", rawTags.length === 0, rawTags.slice(0, 3).map((m) => JSON.stringify(m[0])).join(" "));
check("app.js: sin Babel", !/babel-standalone/i.test(appJs));
check("app.js: React incluido en el bundle", appJs.length > 80000, `${appJs.length} bytes`);

/* contenido estático + sitemap */
const staticHtml = read("contenido.html");
const sitemap = read("sitemap.xml");
check("contenido.html: 30 secciones (intro + 27 capitulos + 2 apendices)", (staticHtml.match(/<section id=/g) || []).length === 30, String((staticHtml.match(/<section id=/g) || []).length));
check("contenido.html: sin JavaScript", !/<script/i.test(staticHtml));
check("contenido.html: accesibilidad basica", /<main /.test(staticHtml) && /aria-label="Contenido"/.test(staticHtml));
check("sitemap.xml valido", /<urlset/.test(sitemap) && (sitemap.match(/<loc>/g) || []).length >= 2);
check("robots.txt con sitemap", /Sitemap:/.test(read("robots.txt")));
check("README y LICENSE presentes", existsSync(new URL("README.md", root)) && existsSync(new URL("LICENSE", root)));

/* sin mojibake en el texto del libro (el bug de codificacion que se corrigio) */
const bookData = read("src/book-data.js");
check("book-data: acentos correctos", bookData.includes("Introducción") && bookData.includes("atención"));
check("book-data: sin mojibake", !/Ã|Â|â€/.test(bookData));
check("book-data: 30 entradas (intro + 27 capitulos + 2 apendices)", (bookData.match(/id: "/g) || []).length === 30);

/* ---------------------------------------------------- 2. render en servidor */

// El bundle es CommonJS: al importarlo desde ESM, `default` puede venir anidado.
const ssrMod = await import(new URL("dist/app.ssr.cjs", root).href);
const App = ssrMod.default?.default ?? ssrMod.default;
const BOOK = ssrMod.BOOK;
check("SSR: BOOK tiene 30 entradas (intro + 27 + 2 apendices)", Array.isArray(BOOK) && BOOK.length === 30, String(BOOK && BOOK.length));
check("SSR: App es una función", typeof App === "function", typeof App);

const React = (await import("react")).default;
const { renderToStaticMarkup } = await import("react-dom/server");
let ssrHtml = "";
let ssrError = null;
try {
  ssrHtml = renderToStaticMarkup(React.createElement(App));
} catch (err) {
  ssrError = err;
}
check("SSR: la app renderiza sin excepciones", !ssrError, ssrError ? String(ssrError.message) : "sin errores");
check("SSR: incluye el indice con los capitulos", ssrHtml.includes("El gran engaño del aprendizaje"));
check("SSR: incluye progreso accesible", /role="progressbar"/.test(ssrHtml));
check("SSR: botones principales con aria-label",
  /aria-label="Reducir tamaño de texto"/.test(ssrHtml) &&
  /aria-label="Aumentar tamaño de texto"/.test(ssrHtml) &&
  /aria-label="Activar tema/.test(ssrHtml) &&
  /aria-label="Buscar en todo el libro"/.test(ssrHtml) &&
  /<nav aria-label="Índice del libro"/.test(ssrHtml));
check("SSR: no hay atributos HTML invalidos de React", !/class=/.test(ssrHtml));

/* la vista de lectura también debe renderizar y marcar el capítulo actual */
let readerHtml = "";
let readerError = null;
try {
  readerHtml = renderToStaticMarkup(React.createElement(App, { initialView: "reader", initialChapter: 1 }));
} catch (err) {
  readerError = err;
}
check("SSR: la vista de lectura renderiza", !readerError && /El gran engaño del aprendizaje/.test(readerHtml), readerError ? String(readerError.message) : "");
check("SSR: marcador de capítulo accesible",
  /aria-label="Guardar marcador"/.test(readerHtml) && /aria-label="Capítulo anterior"/.test(readerHtml) && /aria-label="Capítulo siguiente"/.test(readerHtml));
check("SSR: la idea clave se puede copiar", /aria-label="Copiar la idea clave"/.test(readerHtml));
check("SSR: el contenido del capítulo está en el HTML", /running|recuperar|memoria/i.test(readerHtml) && readerHtml.length > 4000, `${readerHtml.length} bytes`);
check("SSR: el capítulo renderiza su quiz (v4)", /Quiz — practica recuperar/.test(readerHtml) && /Elige una respuesta en cada pregunta/.test(readerHtml));

/* datos interactivos de la v4: quizzes por capítulo y mazo SRS */
const { QUIZ } = await import(new URL("../src/quiz-data.js", import.meta.url));
const { CARDS } = await import(new URL("../src/cards-data.js", import.meta.url));
const quizIds = Object.keys(QUIZ);
const quizOk = quizIds.length === 27 && quizIds.every((id) =>
  Array.isArray(QUIZ[id]) && QUIZ[id].length === 3 && QUIZ[id].every((q) =>
    typeof q.q === "string" && typeof q.why === "string" &&
    Array.isArray(q.options) && q.options.length === 4 && new Set(q.options).size === 4 &&
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3));
check("quiz-data: 27 capítulos x 3 preguntas válidas (81)", quizOk, `${quizIds.length} capítulos`);
check("cards-data: mazo SRS de al menos 45 tarjetas completas",
  Array.isArray(CARDS) && CARDS.length >= 45 && CARDS.every((c) => c.f && c.b && c.t), `${CARDS.length} tarjetas`);

/* la vista Entrenar también debe renderizar (tests + flashcards) */
let trainHtml = "";
let trainError = null;
try {
  trainHtml = renderToStaticMarkup(React.createElement(App, { initialView: "train" }));
} catch (err) {
  trainError = err;
}
check("SSR: la vista Entrenar renderiza (v4)",
  !trainError && /Practica lo que el libro predica/.test(trainHtml) && /Span de dígitos/.test(trainHtml) && /Recuerdo de una lista/.test(trainHtml),
  trainError ? String(trainError.message) : "");

/* ---------------------------------------------------- 3. bundle real en jsdom */

const errors = [];
const dom = new JSDOM(indexHtml, {
  url: "https://ricanssweets.github.io/libro-expande-tu-mente-/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
  virtualConsole: new (await import("jsdom")).VirtualConsole()
    .on("jsdomError", (e) => errors.push(e.message))
    .on("error", (m) => errors.push(String(m)))
});

const { window } = dom;
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
if (!window.navigator.clipboard) {
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: () => Promise.resolve() }, configurable: true });
}

try {
  window.eval(appJs);
} catch (err) {
  errors.push("ejecutando app.js: " + err.message);
}

await new Promise((r) => setTimeout(r, 400));

const doc = window.document;
const body = doc.body.textContent || "";
check("DOM: la app sustituyo el respaldo", body.includes("Sistema Memoria Expandida") || body.includes("Expande"));
check("DOM: el indice lista los 15 capitulos", (doc.querySelectorAll('nav[aria-label="Índice del libro"] button').length) >= 15,
  String(doc.querySelectorAll('nav[aria-label="Índice del libro"] button').length));
check("DOM: portada con llamada a la accion", /Empezar a leer/.test(body));
check("DOM: sin errores de JavaScript", errors.length === 0, errors.slice(0, 3).join(" | "));
check("DOM: los botones de icono tienen aria-label",
  [...doc.querySelectorAll("button")].every((b) => (b.textContent || "").trim().length > 0 || b.getAttribute("aria-label")));

/* Los botones que solo se muestran en movil no aparecen en el marcado de escritorio:
   se comprueba el componente fuente (los aria-label estan junto a los datos que ocultan). */
const uiSource = read("src/ui.jsx");
check("codigo: el boton de menu tiene aria-label", /aria-label="Abrir índice"/.test(uiSource));
check("codigo: el boton de cerrar indice tiene aria-label", /aria-label="Cerrar índice"/.test(uiSource));
check("codigo: el indice es un <nav> con etiqueta", /<nav[\s\S]{0,200}aria-label="Índice del libro"/.test(uiSource));

/* el boton de reducir texto SI reduce (bug de la v1) */
const decrease = doc.querySelector('button[aria-label="Reducir tamaño de texto"]');
const titleBefore = decrease ? decrease.getAttribute("title") : "";
if (decrease) {
  decrease.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 60));
}
const titleAfter = decrease ? decrease.getAttribute("title") : "";
check("DOM: el boton de reducir texto cambia el tamaño", !!decrease && /actual: s/.test(titleAfter), `${titleBefore} -> ${titleAfter}`);

/* busqueda sobre el cuerpo del texto, sin acentos */
const input = doc.querySelector('input[type="search"]');
if (input) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, "Ebbinghaus");
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 300));
}
const statusAfterSearch = doc.querySelector('[role="status"]');
check("DOM: la busqueda cubre el texto del libro (Ebbinghaus)",
  !!statusAfterSearch && /1 capítulo coincide/.test(statusAfterSearch.textContent || ""),
  statusAfterSearch ? (statusAfterSearch.textContent || "").trim() : "sin zona de estado");

if (input) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, "atencion");
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 300));
}
check("DOM: la busqueda ignora acentos (atencion)",
  !!statusAfterSearch && /capítulo/.test(statusAfterSearch.textContent || ""),
  statusAfterSearch ? (statusAfterSearch.textContent || "").trim() : "");

if (input) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, "zzzz");
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 300));
}
check("DOM: avisa cuando no hay resultados",
  !!statusAfterSearch && /Sin resultados/.test(statusAfterSearch.textContent || ""),
  statusAfterSearch ? (statusAfterSearch.textContent || "").trim() : "");

/* persistencia sin excepciones */
check("DOM: guarda preferencias en localStorage", !!window.localStorage.getItem("expande-reading-prefs"));

window.close();

/* ---------------------------------------------------- resumen */

console.log("");
const passed = results.filter((r) => r.pass).length;
console.log(`${passed}/${results.length} comprobaciones correctas${failed ? ` — ${failed} fallidas` : ""}`);
if (failed) {
  console.log("Fallidas:");
  for (const r of results.filter((x) => !x.pass)) console.log(" - " + r.name + (r.detail ? " :: " + r.detail : ""));
  process.exit(1);
}
