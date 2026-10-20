// Genera sitemap.xml con las páginas publicadas.
// Salida determinista (sin fechas variables) para que CI pueda detectar artefactos
// desincronizados. <lastmod> es opcional en el protocolo de sitemaps y se omite a
// propósito: si no, cada regeneración ensuciaría el repositorio con la fecha del día.
import { writeFileSync } from "node:fs";

const SITE = "https://ricanssweets.github.io/libro-expande-tu-mente-/";

const urls = [
  { loc: SITE, priority: "1.0", changefreq: "monthly" },
  { loc: SITE + "contenido.html", priority: "0.9", changefreq: "monthly" }
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

writeFileSync("sitemap.xml", xml, "utf8");
console.log(JSON.stringify({ file: "sitemap.xml", bytes: Buffer.byteLength(xml), urls: urls.length }));
