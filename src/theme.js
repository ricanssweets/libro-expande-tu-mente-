// Constantes de presentación: temas, tamaños de texto, tipografía y utilidades.
export const THEMES = {
  light: { bg: "#F5EEDC", bg2: "#ECE1C4", ink: "#211A10", inkSoft: "#5B5138", gold: "#B9760F", goldBg: "#DDA525", line: "#D8CBA0" },
  dark: { bg: "#1B1712", bg2: "#26201A", ink: "#F1E9D8", inkSoft: "#C8BCA0", gold: "#E9BA4E", goldBg: "#E9BA4E", line: "#3B3428" }
};

// Escalera de tamaños. El orden es la única fuente de verdad para +/-.
export const FONT_ORDER = ["s", "m", "l", "xl"];
export const FONT_SIZES = { s: 15, m: 17, l: 19, xl: 22 };

// Pila tipográfica con alternativas reales en Windows/Android antes del serif genérico.
export const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";
export const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Quita acentos y normaliza para búsquedas tolerantes ("atencion" encuentra "atención").
export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Texto plano y buscable de un capítulo: incluye cuerpo, secciones, ejercicios e ideas clave.
export function chapterSearchText(chapter) {
  const parts = [
    chapter.tag, chapter.title, chapter.subtitle, chapter.hook, chapter.pullquote,
    ...(chapter.paragraphs || []),
    ...(chapter.sections || []).flatMap((s) => [s.h, ...(s.p || [])]),
    ...(chapter.steps || []).flatMap((s) => [s.t, s.d]),
    ...(chapter.exercise ? [chapter.exercise.title, ...(chapter.exercise.items || [])] : []),
    ...(typeof chapter.keyidea === "object" && chapter.keyidea ? [chapter.keyidea.label, chapter.keyidea.text] : [chapter.keyidea]),
    chapter.teaser, chapter.closing
  ];
  return normalizeText(parts.filter(Boolean).join(" "));
}

// Idea clave como texto plano (puede ser cadena u objeto { label, text }).
export function keyIdea(chapter) {
  const k = chapter.keyidea;
  if (!k) return null;
  return typeof k === "object" ? { label: k.label || "Idea clave", text: k.text || "" } : { label: "Idea clave", text: k };
}
