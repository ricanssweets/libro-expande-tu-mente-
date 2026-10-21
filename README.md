# Expande Tu Mente

Libro interactivo (PWA) sobre aprendizaje y memoria. **Edición expandida v3:** 27 capítulos y 2
apéndices (protocolos rápidos y bibliografía verificada con DOI), con una sección
«La ciencia, con números» en cada capítulo original y capítulos nuevos sobre memoria de
trabajo, plasticidad, codificación, contexto, ejercicio, nutrición, estrés, mitos, falsos
recuerdos, suplementos y protección cognitiva a largo plazo. Un ejercicio práctico en cada
capítulo. Se puede leer online, instalar en el teléfono y usar sin conexión.

**Sitio publicado:** https://ricanssweets.github.io/libro-expande-tu-mente-/

## Qué incluye

| Archivo | Descripción |
|---|---|
| `index.html` | Shell: metadatos SEO/Open Graph, CSP y respaldo visible sin JavaScript |
| `app.js` | Bundle generado con esbuild (React incluido). No se carga ningún CDN |
| `styles.css` | Estilos base, tema oscuro automático y estilos del respaldo |
| `contenido.html` | El libro completo como HTML semántico, sin JavaScript |
| `sw.js` | Service Worker: offline real, navegación red-primero, caché versionada |
| `manifest.json` | Manifiesto PWA (instalable, atajos, iconos any/maskable) |
| `src/` | Código fuente: datos del libro, componentes y utilidades |
| `tests/` | Pruebas: render server-side y contrato del sitio |
| `legacy/index.v1.html` | Versión 1 original, conservada como referencia y fuente de datos |

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install          # dependencias de compilación
npm run build        # src/ -> app.js  (esbuild, React incluido)
npm run static       # genera contenido.html y sitemap.xml
npm test             # pruebas de render y de contrato
npm run release      # build + static + test
```

Tras cualquier cambio de contenido o de código hay que:

1. Ejecutar `npm run release`.
2. **Subir `VERSION` en `sw.js`** para que los lectores que ya tienen la app reciban la nueva caché.
3. Commitear también los artefactos generados (`app.js`, `contenido.html`, `sitemap.xml`).

Los datos del libro viven en `src/book-data.js`. La v3 se ensambló a partir del texto de la
v2 (capítulos originales conservados, renumerados en orden de lectura) más capítulos nuevos
con citas verificadas. Para editar el texto, edita `src/book-data.js` y vuelve a compilar.

### Integración continua

`.github/workflows/ci.yml` se ejecuta en cada push a `main` y en cada pull request. Hace dos cosas:

- **Detecta artefactos desincronizados.** Regenera `app.js`, `contenido.html` y `sitemap.xml` y
  falla si el resultado difiere del versionado. Así un cambio en `src/` sin `npm run release`
  no pasa desapercibido.
- **Ejecuta `npm test`** (62 comprobaciones: contrato del sitio, render en servidor y
  ejecución real del bundle en jsdom).

Para que esa comprobación funcione, la generación es **determinista**: no se escribe ninguna
fecha en los archivos generados.

## Cómo funciona

- **Sin dependencias en tiempo de ejecución.** React va dentro de `app.js`; no hay CDN, así que
  la CSP queda en `script-src 'self'` y no hace falta SRI.
- **Offline de verdad.** `sw.js` precachea shell, bundle, estilos y contenido estático. La
  navegación usa red-primero (las actualizaciones llegan) y el resto caché-primero con
  revalidación en segundo plano.
- **Respaldo sin JavaScript.** `index.html` muestra un resumen dentro de `#root` y enlaza a
  `contenido.html`, que contiene el libro entero como HTML.
- **Progreso honesto.** Un capítulo cuenta como leído al superar el 85% de su scroll; el
  progreso y los marcadores se guardan en `localStorage` con manejo de errores.
- **Entrenamiento interactivo (v4).** Cada capítulo cierra con un quiz de 3 preguntas con
  explicación citada (`src/quiz-data.js`). La vista «Entrenar» incluye dos tests de memoria
  (span de dígitos y recuerdo de una lista de 15 palabras) con historial, y un mazo de 52
  flashcards con repetición espaciada tipo SM-2 (`src/cards-data.js`): las tarjetas vencidas
  y el historial viven en `localStorage`, sin cuentas ni servidor.

## Publicación

El sitio se publica desde la raíz de la rama `main` con GitHub Pages. No requiere build en
CI: `app.js`, `contenido.html` y `sitemap.xml` se versionan ya generados.

## Licencia

Ver [LICENSE](LICENSE). El texto del libro es obra de su autor; el código se publica bajo MIT.
