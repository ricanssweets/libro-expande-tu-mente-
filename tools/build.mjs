// Compila el JSX a JavaScript plano con esbuild.
// - app.js .......... bundle de navegador, autocontenido (React incluido): la app no
//                     depende de ningún CDN en tiempo de ejecución.
// - dist/app.ssr.cjs . bundle CommonJS para las pruebas de render en Node.
import { build } from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const common = {
  bundle: true,
  jsx: "automatic",
  target: ["es2019"],
  logLevel: "warning",
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' }
};

await build({
  ...common,
  entryPoints: ["src/main.jsx"],
  outfile: "app.js",
  format: "iife",
  minify: true,
  banner: { js: `/* Expande Tu Mente v${pkg.version} — generado por tools/build.mjs. No editar a mano. */` }
});

await build({
  ...common,
  entryPoints: ["src/app.jsx"],
  outfile: "dist/app.ssr.cjs",
  format: "cjs",
  platform: "node",
  minify: false,
  // React queda externo para que las pruebas usen el MISMO React que react-dom/server.
  // Dos copias de React rompen los hooks (dispatcher nulo).
  external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]
});

console.log("build OK → app.js (navegador) + dist/app.ssr.cjs (pruebas)");
