// Genera el volcado JSON del libro para construir el EPUB (tools/build-epub.py).
import { writeFileSync, mkdirSync } from "node:fs";
import { BOOK } from "../src/book-data.js";
import { QUIZ } from "../src/quiz-data.js";
import { keyIdea } from "../src/theme.js";

const out = BOOK.map((c) => ({
  id: c.id,
  num: c.num || null,
  tag: c.tag,
  title: c.title,
  subtitle: c.subtitle || null,
  hook: c.hook || null,
  paragraphs: c.paragraphs || [],
  pullquote: c.pullquote || null,
  sections: c.sections || [],
  steps: c.steps || null,
  exercise: c.exercise || null,
  keyidea: keyIdea(c) ? keyIdea(c).text : null,
  closing: c.closing || null,
  quiz: QUIZ[c.id] || null
}));

mkdirSync(new URL("../ediciones/build", import.meta.url), { recursive: true });
writeFileSync(new URL("../ediciones/build/content.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`EPUB source OK → ediciones/build/content.json (${out.length} entradas)`);
