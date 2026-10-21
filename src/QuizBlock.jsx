import { useState } from "react";
import { SERIF, SANS } from "./theme.js";
import { QUIZ } from "./quiz-data.js";

/* Quiz de 3 preguntas al final de cada capítulo: recuperación activa aplicada,
   no solo contada. Sin nota guardada: el valor está en el intento. */
export default function QuizBlock({ chapterId, T, fontSize }) {
  const questions = QUIZ[chapterId];
  const [picked, setPicked] = useState({});
  const [checked, setChecked] = useState(false);
  if (!questions || questions.length === 0) return null;

  const score = questions.reduce((acc, q, i) => acc + (picked[i] === q.answer ? 1 : 0), 0);
  const allPicked = questions.every((_, i) => picked[i] !== undefined);

  const optStyle = (qi, oi) => {
    const isPicked = picked[qi] === oi;
    const isAnswer = questions[qi].answer === oi;
    let border = T.line, bg = "transparent", color = T.ink;
    if (checked && isAnswer) { border = T.gold; bg = T.gold + "26"; }
    else if (checked && isPicked && !isAnswer) { border = "#B3261E"; bg = "#B3261E14"; color = T.inkSoft; }
    else if (isPicked) { border = T.gold; bg = T.bg2; }
    return {
      display: "flex", width: "100%", textAlign: "left", gap: 10, alignItems: "baseline",
      padding: "10px 12px", marginBottom: 8, borderRadius: 8, border: `1.5px solid ${border}`,
      background: bg, color, fontFamily: SANS, fontSize: fontSize - 3.5, lineHeight: 1.45,
      cursor: checked ? "default" : "pointer"
    };
  };

  return (
    <section aria-label="Quiz del capítulo" style={{ border: `1.5px solid ${T.gold}`, borderRadius: 12, padding: "18px 20px", margin: "26px 0 6px 0", background: T.bg2 + "66" }}>
      <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: fontSize - 2, color: T.gold, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: ".04em" }}>
        Quiz — practica recuperar
      </h2>
      <p style={{ fontFamily: SANS, fontSize: fontSize - 3.5, color: T.inkSoft, margin: "0 0 16px 0", lineHeight: 1.5 }}>
        Sin mirar atrás: responder de memoria es justo la técnica que este libro entrena. Luego comprueba y lee por qué.
      </p>

      {questions.map((q, qi) => (
        <fieldset key={qi} style={{ border: "none", margin: "0 0 18px 0", padding: 0 }}>
          <legend style={{ fontFamily: SERIF, fontWeight: 700, fontSize: fontSize, marginBottom: 10, padding: 0 }}>
            {qi + 1}. {q.q}
          </legend>
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              type="button"
              disabled={checked}
              aria-pressed={picked[qi] === oi}
              onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
              style={optStyle(qi, oi)}
            >
              <span aria-hidden="true" style={{ fontWeight: 800, color: T.gold, minWidth: 16 }}>
                {"ABCD"[oi]}
              </span>
              <span>
                {opt}
                {checked && q.answer === oi ? " ✓" : ""}
                {checked && picked[qi] === oi && q.answer !== oi ? " ✗" : ""}
              </span>
            </button>
          ))}
          {checked && (
            <p style={{ fontFamily: SANS, fontSize: fontSize - 3.5, color: T.inkSoft, lineHeight: 1.55, margin: "6px 0 0 0" }}>
              <b style={{ color: T.ink }}>{picked[qi] === q.answer ? "Correcto. " : "No exactamente. "}</b>
              {q.why}
            </p>
          )}
        </fieldset>
      ))}

      {!checked ? (
        <button
          type="button"
          disabled={!allPicked}
          onClick={() => setChecked(true)}
          style={{
            background: allPicked ? T.gold : T.line, color: "#1B1712", border: "none", borderRadius: 9,
            padding: "11px 18px", fontFamily: SANS, fontWeight: 800, fontSize: fontSize - 3,
            cursor: allPicked ? "pointer" : "not-allowed"
          }}
        >
          {allPicked ? "Comprobar respuestas" : "Elige una respuesta en cada pregunta"}
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <p role="status" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: fontSize, margin: 0 }}>
            Tu resultado: {score} de {questions.length}
            {score === questions.length ? " — memoria trabajando como debe." : score >= 1 ? " — lo que falló, vuelve a intentarlo mañana: ese es el repaso espaciado." : " — perfecto material de repaso: vuelve a las secciones señaladas y reintenta mañana."}
          </p>
          <button
            type="button"
            onClick={() => { setPicked({}); setChecked(false); }}
            style={{
              background: "transparent", color: T.ink, border: `1px solid ${T.line}`, borderRadius: 9,
              padding: "9px 14px", fontFamily: SANS, fontWeight: 700, fontSize: fontSize - 3.5, cursor: "pointer"
            }}
          >
            Reintentar el quiz
          </button>
        </div>
      )}
    </section>
  );
}
