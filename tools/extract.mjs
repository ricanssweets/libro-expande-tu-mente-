// Extrae el contenido del libro (BOOK + THEMES + FONTS + ICONS) del index.html auditado
// para reconstruir src/app.jsx sin transcribir a mano. Uso:
//   node tools/extract.mjs <ruta-al-index.html-legacy> <salida>
import fs from 'node:fs';

const [srcPath, outPath] = process.argv.slice(2);
const html = fs.readFileSync(srcPath, 'utf8');

const scriptOpen = html.indexOf('<script type="text/babel"');
const scriptStart = html.indexOf('>', scriptOpen) + 1;
const scriptEnd = html.indexOf('</script>', html.indexOf('root.render'));
const code = html.slice(scriptStart, scriptEnd);

const bookStart = code.indexOf('const BOOK = [');
const bookEnd = code.indexOf('/* ============================= THEME');
if (bookStart < 0 || bookEnd < 0) throw new Error('No se encontró el bloque BOOK/THEME');

const block = code.slice(bookStart, bookEnd).trimEnd();
if (!/const BOOK = \[/.test(block)) throw new Error('Bloque inesperado');

const header = `// Datos extraídos del index.html original (v1) sin modificaciones de contenido.
// Generado por tools/extract.mjs — no editar el contenido a mano.
`;

const withExport = block.replace(/^const BOOK =/, 'export const BOOK =');
if (!/^export const BOOK =/m.test(withExport)) throw new Error('No se pudo exportar BOOK');

fs.writeFileSync(outPath, header + withExport + '\n', 'utf8');

const chapters = (block.match(/id: "ch\d+"/g) || []).length;
console.log(JSON.stringify({ outPath, bytes: Buffer.byteLength(block), chapters }));
