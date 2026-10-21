import { useState, useEffect, useRef } from "react";
import { SERIF, SANS, normalizeText } from "./theme.js";
import { CARDS } from "./cards-data.js";

/* Vista Entrenar: el libro deja de hablar de practicar y pasa a practicar.
   - Tests de memoria: span de dígitos y recuerdo de lista de palabras, con historial.
   - Flashcards con repetición espaciada (algoritmo tipo SM-2 simplificado).
   Todo el estado vive en este dispositivo (localStorage), como el resto de la app. */

const LS_TESTS = "expande-test-history";
const LS_SRS = "expande-srs-state";

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* cuota o modo privado */ }
}

const btnGold = (T, disabled) => ({
  background: disabled ? T.line : T.gold, color: "#1B1712", border: "none", borderRadius: 9,
  padding: "11px 18px", fontFamily: SANS, fontWeight: 800, fontSize: 13.5,
  cursor: disabled ? "not-allowed" : "pointer"
});
const btnGhost = (T) => ({
  background: "transparent", color: T.ink, border: `1px solid ${T.line}`, borderRadius: 9,
  padding: "10px 15px", fontFamily: SANS, fontWeight: 700, fontSize: 13, cursor: "pointer"
});
const panel = (T) => ({
  border: `1px solid ${T.line}`, borderRadius: 12, padding: "18px 20px", background: T.bg2 + "55", marginBottom: 18
});

/* ---------------------------------------------------------- span de dígitos */

function DigitSpan({ T, onResult }) {
  const [phase, setPhase] = useState("idle"); // idle | showing | input | done
  const [seq, setSeq] = useState("");
  const [answer, setAnswer] = useState("");
  const [len, setLen] = useState(3);
  const [failsAtLen, setFailsAtLen] = useState(0);
  const [span, setSpan] = useState(0);
  const [feedback, setFeedback] = useState("");
  const timer = useRef(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const startRound = (length) => {
    let s = "";
    for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
    setSeq(s); setAnswer(""); setPhase("showing"); setFeedback("");
    timer.current = setTimeout(() => setPhase("input"), 700 + length * 800);
  };
  const start = () => { setLen(3); setFailsAtLen(0); setSpan(0); startRound(3); };

  const submit = () => {
    if (answer.trim() === seq) {
      const newSpan = len;
      if (len >= 10) { setSpan(newSpan); setPhase("done"); onResult(`Span de dígitos: ${newSpan}`); return; }
      setSpan(newSpan); setFailsAtLen(0); setLen(len + 1);
      setFeedback(`Correcto. Subimos a ${len + 1} dígitos.`);
      startRound(len + 1);
    } else {
      const f = failsAtLen + 1;
      if (f >= 2) { setPhase("done"); onResult(`Span de dígitos: ${span}`); }
      else { setFailsAtLen(f); setFeedback("No era esa la secuencia. Un intento más con la misma longitud."); startRound(len); }
    }
  };

  return (
    <section style={panel(T)} aria-label="Test de span de dígitos">
      <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, margin: "0 0 6px 0" }}>Span de dígitos</h3>
      <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.55, margin: "0 0 14px 0" }}>
        La medida clásica de la memoria de trabajo: verás una secuencia, se oculta y la escribes de memoria.
        La longitud sube tras cada acierto; el test termina con dos fallos a la misma longitud. La media adulta ronda 5–7 trabajando con esfuerzo y agrupando.
      </p>
      {phase === "idle" && <button type="button" onClick={start} style={btnGold(T, false)}>Empezar el test</button>}
      {phase === "showing" && (
        <div aria-live="polite" style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 40, letterSpacing: "0.3em", textAlign: "center", padding: "18px 0" }}>
          {seq}
        </div>
      )}
      {phase === "input" && (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={answer} onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric" autoFocus aria-label="Escribe la secuencia que viste"
            placeholder={`${len} dígitos…`}
            style={{ flex: "1 1 180px", padding: "11px 13px", borderRadius: 9, border: `1.5px solid ${T.line}`, background: T.bg, color: T.ink, fontFamily: SANS, fontSize: 16, letterSpacing: "0.2em" }}
          />
          <button type="submit" style={btnGold(T, answer.length === 0)}>Comprobar</button>
        </form>
      )}
      {feedback && phase !== "done" && <p role="status" style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, marginTop: 10 }}>{feedback}</p>}
      {phase === "done" && (
        <div>
          <p role="status" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, margin: "4px 0 10px 0" }}>
            Tu span de hoy: {span} dígitos.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.55, margin: "0 0 12px 0" }}>
            No es un veredicto: es tu escritorio mental de hoy, con este sueño y esta atención. El truco legal no es forzarlo,
            es agrupar: en la vida real, convierte las secuencias en bloques con sentido y el mismo límite rinde mucho más (capítulo 3).
          </p>
          <button type="button" onClick={start} style={btnGhost(T)}>Repetir el test</button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------- lista de palabras */

const WORD_POOL = [
  "mesa", "río", "guitarra", "ventana", "elefante", "cuaderno", "playa", "reloj", "jardín", "avión",
  "zapato", "luna", "mercado", "puente", "tijeras", "bosque", "cartera", "tren", "naranja", "espejo",
  "velero", "desierto", "campana", "hormiga", "biblioteca", "volcán", "almohada", "farola", "semilla", "tambor"
];

function WordRecall({ T, onResult }) {
  const [phase, setPhase] = useState("idle"); // idle | study | recall | done
  const [words, setWords] = useState([]);
  const [seconds, setSeconds] = useState(45);
  const [text, setText] = useState("");
  const [hits, setHits] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const start = () => {
    const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5).slice(0, 15);
    setWords(shuffled); setText(""); setHits([]); setSeconds(45); setPhase("study");
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(intervalRef.current); setPhase("recall"); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const grade = () => {
    const said = new Set(
      text.split(/[\s,;]+/).map((w) => normalizeText(w)).filter(Boolean)
    );
    const found = words.filter((w) => said.has(normalizeText(w)));
    setHits(found); setPhase("done");
    onResult(`Lista de palabras: ${found.length}/15`);
  };

  return (
    <section style={panel(T)} aria-label="Test de recuerdo de lista de palabras">
      <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, margin: "0 0 6px 0" }}>Recuerdo de una lista</h3>
      <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.55, margin: "0 0 14px 0" }}>
        15 palabras durante 45 segundos. Después escríbelas todas las que recuerdes, en cualquier orden.
        Consejo del capítulo 8: no las repases en silencio — colócalas en un lugar conocido, una por estación del recorrido.
      </p>
      {phase === "idle" && <button type="button" onClick={start} style={btnGold(T, false)}>Empezar el test</button>}
      {phase === "study" && (
        <div>
          <div aria-live="polite" style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", fontFamily: SERIF, fontSize: 19, fontWeight: 600, padding: "8px 0 12px 0" }}>
            {words.map((w) => <span key={w}>{w}</span>)}
          </div>
          <p role="status" style={{ fontFamily: SANS, fontSize: 12.5, color: T.gold, fontWeight: 700 }}>Tiempo de estudio: {seconds}s</p>
          <button type="button" onClick={() => { clearInterval(intervalRef.current); setPhase("recall"); }} style={btnGhost(T)}>Ya las tengo: a recordar</button>
        </div>
      )}
      {phase === "recall" && (
        <div>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={4} autoFocus
            aria-label="Escribe las palabras que recuerdes"
            placeholder="Una palabra por línea, o separadas por comas…"
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 9, border: `1.5px solid ${T.line}`, background: T.bg, color: T.ink, fontFamily: SANS, fontSize: 15, lineHeight: 1.5 }}
          />
          <button type="button" onClick={grade} style={{ ...btnGold(T, text.trim().length === 0), marginTop: 10 }}>Comprobar</button>
        </div>
      )}
      {phase === "done" && (
        <div>
          <p role="status" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, margin: "4px 0 10px 0" }}>
            Recordaste {hits.length} de 15.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 6px 0" }}>
            <b style={{ color: T.ink }}>Acertaste:</b> {hits.length ? hits.join(", ") : "ninguna esta vez"}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 12px 0" }}>
            <b style={{ color: T.ink }}>Se escaparon:</b> {words.filter((w) => !hits.includes(w)).join(", ") || "—"}
            {" "}· Sin técnica, lo normal en un primer intento son 5–8. Con palacio de la memoria, 15 de 15 es alcanzable hoy mismo.
          </p>
          <button type="button" onClick={start} style={btnGhost(T)}>Otra lista</button>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- flashcards */

const DAY = 24 * 60 * 60 * 1000;

function gradeCard(prev, grade, now) {
  const s = prev || { reps: 0, interval: 0, ease: 2.5, due: 0 };
  if (grade === 0) {
    return { reps: 0, interval: 0, ease: Math.max(1.3, s.ease - 0.2), due: now + 10 * 60 * 1000, lastGrade: 0 };
  }
  let interval;
  if (s.reps === 0) interval = grade === 1 ? 1 : 1;
  else if (s.reps === 1) interval = grade === 1 ? 2 : 4;
  else interval = Math.round(s.interval * (grade === 1 ? 1.2 : s.ease));
  const ease = grade === 1 ? Math.max(1.3, s.ease - 0.15) : Math.min(2.8, s.ease + 0.05);
  return { reps: s.reps + 1, interval, ease, due: now + interval * DAY, lastGrade: grade };
}

function CardsPanel({ T }) {
  const [srs, setSrs] = useState(() => readLocal(LS_SRS, {}));
  const [queue, setQueue] = useState(null); // índices de la sesión
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  const now = Date.now();
  const dueIdx = CARDS.map((_, i) => i).filter((i) => srs[i] && srs[i].due <= now);
  const newIdx = CARDS.map((_, i) => i).filter((i) => !srs[i]);
  const learned = CARDS.map((_, i) => i).filter((i) => srs[i] && srs[i].reps > 0).length;

  const startSession = () => {
    const q = [...dueIdx, ...newIdx.slice(0, 10)];
    setQueue(q); setPos(0); setFlipped(false); setSessionDone(0);
  };

  const grade = (g) => {
    const idx = queue[pos];
    const next = { ...srs, [idx]: gradeCard(srs[idx], g, Date.now()) };
    setSrs(next); writeLocal(LS_SRS, next);
    setSessionDone((d) => d + 1);
    if (g === 0) setQueue((q) => [...q, idx]); // la que falló vuelve al final de la sesión
    if (pos + 1 < queue.length + (g === 0 ? 1 : 0)) { setPos(pos + 1); setFlipped(false); }
    else setQueue([]);
  };

  const inSession = queue && queue.length > 0 && pos < queue.length;
  const card = inSession ? CARDS[queue[pos]] : null;

  return (
    <section style={panel(T)} aria-label="Flashcards con repetición espaciada">
      <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, margin: "0 0 6px 0" }}>Flashcards — repetición espaciada</h3>
      <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.55, margin: "0 0 8px 0" }}>
        {CARDS.length} tarjetas con la ciencia del libro. El algoritmo decide cuándo vuelve cada una:
        si la sabes, tarda más en reaparecer; si fallas, regresa en minutos y otra vez dentro de la sesión.
      </p>
      <p role="status" style={{ fontFamily: SANS, fontSize: 13, color: T.ink, margin: "0 0 14px 0" }}>
        <b>Para hoy:</b> {dueIdx.length} vencidas · {Math.min(10, newIdx.length)} nuevas disponibles · {learned} ya en rotación
      </p>

      {!inSession && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={startSession} disabled={dueIdx.length === 0 && newIdx.length === 0} style={btnGold(T, dueIdx.length === 0 && newIdx.length === 0)}>
            {dueIdx.length + newIdx.length === 0 ? "Nada vencido: vuelve mañana" : "Empezar la sesión de hoy"}
          </button>
          {sessionDone > 0 && <span role="status" style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft }}>Sesión terminada: {sessionDone} repasos. Vuelve cuando venza la próxima tanda.</span>}
          {Object.keys(srs).length > 0 && (
            <button type="button" onClick={() => { setSrs({}); writeLocal(LS_SRS, {}); setSessionDone(0); }} style={btnGhost(T)}>Reiniciar el mazo</button>
          )}
        </div>
      )}

      {inSession && card && (
        <div>
          <p style={{ fontFamily: SANS, fontSize: 11.5, color: T.inkSoft, margin: "0 0 8px 0" }}>
            Tarjeta {pos + 1} de {queue.length} · Tema: {card.t}
          </p>
          <div style={{ border: `1.5px solid ${T.gold}`, borderRadius: 12, padding: "22px 20px", background: T.bg, minHeight: 110 }}>
            <p style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, lineHeight: 1.4, margin: 0 }}>{card.f}</p>
            {flipped && (
              <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: T.inkSoft, margin: "14px 0 0 0", borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
                {card.b}
              </p>
            )}
          </div>
          {!flipped ? (
            <button type="button" onClick={() => setFlipped(true)} style={{ ...btnGold(T, false), marginTop: 14 }}>
              Mostrar respuesta
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }} role="group" aria-label="¿Cómo te fue con esta tarjeta?">
              <button type="button" onClick={() => grade(0)} style={{ ...btnGhost(T), borderColor: "#B3261E", color: "#B3261E" }}>No lo sabía</button>
              <button type="button" onClick={() => grade(1)} style={btnGhost(T)}>Me costó</button>
              <button type="button" onClick={() => grade(2)} style={btnGold(T, false)}>Lo sabía</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- vista */

export default function TrainView({ T, initialTab }) {
  const [tab, setTab] = useState(initialTab === "cards" ? "cards" : "tests");
  const [history, setHistory] = useState(() => {
    const h = readLocal(LS_TESTS, []);
    return Array.isArray(h) ? h : [];
  });

  const addResult = (label) => {
    const next = [{ at: new Date().toISOString(), label }, ...history].slice(0, 12);
    setHistory(next); writeLocal(LS_TESTS, next);
  };

  const tabBtn = (active) => ({
    padding: "9px 16px", borderRadius: 20, border: `1.5px solid ${active ? T.gold : T.line}`,
    background: active ? T.gold : "transparent", color: active ? "#1B1712" : T.ink,
    fontFamily: SANS, fontWeight: 800, fontSize: 13, cursor: "pointer"
  });

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "42px 24px 70px 24px" }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold }}>
        Entrenamiento
      </div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 30, lineHeight: 1.08, margin: "10px 0 8px 0" }}>
        Practica lo que el libro predica
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 20px 0" }}>
        Leer sobre recuperación no fortalece nada: recuperando se aprende. Mide tu memoria, repasa con espaciado
        y observa tu progreso en este dispositivo.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }} role="tablist" aria-label="Tipo de entrenamiento">
        <button type="button" role="tab" aria-selected={tab === "tests"} onClick={() => setTab("tests")} style={tabBtn(tab === "tests")}>Tests de memoria</button>
        <button type="button" role="tab" aria-selected={tab === "cards"} onClick={() => setTab("cards")} style={tabBtn(tab === "cards")}>Flashcards SRS</button>
      </div>

      {tab === "tests" ? (
        <>
          <DigitSpan T={T} onResult={addResult} />
          <WordRecall T={T} onResult={addResult} />
          {history.length > 0 && (
            <section style={panel(T)} aria-label="Historial de tests">
              <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17, margin: "0 0 10px 0" }}>Tu historial reciente</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {history.map((h, i) => (
                  <li key={i} style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, marginBottom: 5 }}>
                    {new Date(h.at).toLocaleDateString("es", { day: "numeric", month: "short" })} · {h.label}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <CardsPanel T={T} />
      )}
    </div>
  );
}
