import { createRoot } from "react-dom/client";
import App from "./app.jsx";

// El shell (index.html) ya trae un mensaje de respaldo dentro de #root.
// Si React no se ejecuta, ese mensaje permanece visible en lugar de una página en blanco.
const container = document.getElementById("root");
if (container) createRoot(container).render(<App />);
