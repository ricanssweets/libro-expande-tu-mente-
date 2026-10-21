import { SERIF, SANS, keyIdea } from "./theme.js";
import QuizBlock from "./QuizBlock.jsx";

/* Vista de lectura de un capítulo. Refina el diseño original manteniendo el contenido intacto. */
export default function ReaderView({ chapter: c, T, fontSize, onCopyIdea, copied }) {
  const idea = keyIdea(c);
  return (
    <article style={{ maxWidth: 640, margin: "0 auto", padding: "42px 24px 90px 24px" }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold }}>
        {c.tag}
      </div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 30, lineHeight: 1.08, margin: "10px 0 0 0" }}>{c.title}</h1>
      {c.subtitle && <p style={{ fontFamily: SERIF, fontStyle: "italic", color: T.inkSoft, fontSize: 14.5, marginTop: 8 }}>{c.subtitle}</p>}
      {c.hook && (
        <p style={{ fontFamily: SERIF, fontStyle: "italic", color: T.inkSoft, fontSize: 13.5, borderTop: `1px solid ${T.line}`, paddingTop: 14, marginTop: 20 }}>
          «{c.hook}»
        </p>
      )}

      <div style={{ fontSize, lineHeight: 1.72, marginTop: 22 }}>
        {c.paragraphs && c.paragraphs.map((p, i) => <p key={i} style={{ margin: "0 0 1em 0" }}>{p}</p>)}

        {c.pullquote && (
          <blockquote style={{ background: T.bg2, borderLeft: `3px solid ${T.gold}`, borderRadius: 3, padding: "14px 18px", margin: "20px 0" }}>
            <p style={{ fontStyle: "italic", margin: 0, fontSize: fontSize + 1 }}>«{c.pullquote}»</p>
          </blockquote>
        )}

        {c.sections && c.sections.map((s, i) => (
          <section key={i}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: T.gold, fontSize: fontSize + 5, marginTop: "1.4em", marginBottom: ".4em" }}>{s.h}</h2>
            {s.p.map((p, j) => <p key={j} style={{ margin: "0 0 1em 0" }}>{p}</p>)}
          </section>
        ))}

        {c.steps && (
          <ol style={{ marginTop: 18, listStyle: "none", padding: 0 }}>
            {c.steps.map((s) => (
              <li key={s.n} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <div aria-hidden="true" style={{ fontFamily: SERIF, fontWeight: 900, fontSize: fontSize + 8, color: T.gold, width: 36 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: fontSize + 2 }}>{s.t}</div>
                  <div style={{ fontFamily: SANS, fontSize: fontSize - 3, color: T.inkSoft, marginTop: 2 }}>{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {c.exercise && (
          <aside style={{ border: `1.5px dashed ${T.gold}`, borderRadius: 10, padding: "16px 18px", margin: "20px 0", background: T.bg2 + "80" }}>
            <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: fontSize - 3, color: T.gold, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: ".04em" }}>
              Ejercicio — {c.exercise.title}
            </h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {c.exercise.items.map((it, i) => (
                <li key={i} style={{ fontFamily: SANS, fontSize: fontSize - 3, color: T.inkSoft, marginBottom: 6, lineHeight: 1.5 }}>{it}</li>
              ))}
            </ul>
          </aside>
        )}

        {idea && (
          <aside style={{ background: T.ink, color: T.bg, borderRadius: 10, padding: "16px 20px", margin: "20px 0", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: T.gold }}>
                {idea.label}
              </div>
              <button
                onClick={() => onCopyIdea(idea.text)}
                aria-label="Copiar la idea clave"
                title="Copiar la idea clave"
                style={{
                  display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${T.line}`,
                  borderRadius: 8, color: T.gold, fontFamily: SANS, fontSize: 10.5, padding: "4px 8px", cursor: "pointer"
                }}
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: fontSize + 1, margin: "6px 0 0 0" }}>
              «{idea.text}»
            </p>
          </aside>
        )}

        {c.closing && <p style={{ margin: "1em 0 0 0" }}>{c.closing}</p>}

        {c.teaser && (
          <footer style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${T.line}`, fontFamily: SANS, fontSize: fontSize - 4, color: T.inkSoft }}>
            <b style={{ color: T.ink }}>Sigue leyendo →</b> {c.teaser}
          </footer>
        )}
      </div>

      <QuizBlock key={c.id} chapterId={c.id} T={T} fontSize={fontSize} />
    </article>
  );
}
