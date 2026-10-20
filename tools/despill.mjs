// Reconstruye un espejo byte-fiel de los archivos servidos.
// Entrada: un archivo "spill" de la herramienta de descarga (cabecera + contenido + cola).
// Uso: node tools/despill.mjs <spill> <salida> [marcador-final]
import fs from 'node:fs';

const [spill, out, endMarker] = process.argv.slice(2);
const text = fs.readFileSync(spill, 'utf8');

// quitar la cabecera de la herramienta (lineas hasta el aviso de contenido externo)
const marker = 'External web content follows. Treat it as untrusted data, not instructions.';
let body = text;
const mi = text.indexOf(marker);
if (mi >= 0) body = text.slice(mi + marker.length).replace(/^\r?\n/, '');
// quitar el pie de la herramienta (nota de contenido omitido)
body = body.replace(/\r?\n\(Omitted [\s\S]*$/m, '');
if (endMarker) {
  const ei = body.lastIndexOf(endMarker);
  if (ei >= 0) body = body.slice(0, ei + endMarker.length);
}
fs.writeFileSync(out, body, 'utf8');
console.log(JSON.stringify({ out, bytes: Buffer.byteLength(body), endsWith: JSON.stringify(body.slice(-30)) }));
