import { SANS } from "./theme.js";

/* Diagramas de la v5: lo que el texto explica, visto de un vistazo.
   SVG hechos a mano con los colores del tema; cada uno lleva su pie. */

function Frame({ T, title, caption, children, label }) {
  return (
    <figure role="img" aria-label={label} style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: "16px 18px", margin: "22px 0", background: T.bg2 + "55" }}>
      <figcaption style={{ fontFamily: SANS, fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gold, marginBottom: 10 }}>
        {title}
      </figcaption>
      {children}
      <p style={{ fontFamily: SANS, fontSize: 12, color: T.inkSoft, lineHeight: 1.55, margin: "10px 0 0 0" }}>{caption}</p>
    </figure>
  );
}

function Olvido({ T }) {
  return (
    <Frame T={T} title="La curva del olvido, y cómo se dobla"
      caption="Sin repasos, lo aprendido cae en días (curva tenue). Cada recuperación en el momento justo levanta la curva y aplana la siguiente caída: el olvido se vuelve más lento tras cada repaso."
      label="Gráfico: la retención cae rápido sin repaso y se mantiene alta con repasos espaciados">
      <svg viewBox="0 0 320 170" width="100%" height="auto" aria-hidden="true">
        <line x1="34" y1="10" x2="34" y2="140" stroke={T.line} strokeWidth="1.5" />
        <line x1="34" y1="140" x2="312" y2="140" stroke={T.line} strokeWidth="1.5" />
        <text x="8" y="20" fontSize="9" fill={T.inkSoft} fontFamily="sans-serif">100%</text>
        <text x="270" y="156" fontSize="9" fill={T.inkSoft} fontFamily="sans-serif">tiempo →</text>
        <path d="M34,18 C90,60 130,110 190,128 C240,138 280,139 312,139" fill="none" stroke={T.inkSoft} strokeWidth="2" strokeDasharray="4 3" />
        <path d="M34,18 C60,45 80,70 100,84 L100,40 C120,58 140,74 165,86 L165,44 C190,60 215,74 245,86 L245,50 C268,64 290,74 312,82" fill="none" stroke={T.gold} strokeWidth="2.5" />
        {[100, 165, 245].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={i === 0 ? 84 : i === 1 ? 86 : 86} r="4" fill={T.gold} />
          </g>
        ))}
        <text x="52" y="34" fontSize="10" fill={T.gold} fontFamily="sans-serif" fontWeight="700">Con repasos espaciados</text>
        <text x="196" y="124" fontSize="10" fill={T.inkSoft} fontFamily="sans-serif">Sin repaso</text>
        <text x="86" y="102" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif">repaso</text>
        <text x="152" y="104" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif">repaso</text>
        <text x="232" y="104" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif">repaso</text>
      </svg>
    </Frame>
  );
}

function Semaforo({ T }) {
  const rows = [
    { color: "#3E9B4F", name: "Verde — úsalas siempre", items: "Práctica de recuperación · Práctica distribuida (espaciado)" },
    { color: "#D9A821", name: "Amarillo — ayudan con buena ejecución", items: "Interrogación elaborativa · Autoexplicación · Práctica intercalada" },
    { color: "#B3261E", name: "Rojo — poco retorno por hora", items: "Subrayar · Releer · Resumir sin recuperar · Palabra clave · Imágenes para textos" }
  ];
  return (
    <Frame T={T} title="El semáforo de Dunlosky et al. (2013)"
      caption="Diez técnicas evaluadas por evidencia en Psychological Science in the Public Interest. El color no juzga tu esfuerzo: mide cuánto recuerdo compra cada hora invertida."
      label="Tabla visual: técnicas de estudio en verde, amarillo y rojo según su evidencia">
      <div>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "9px 2px", borderBottom: `1px dotted ${T.line}` }}>
            <span aria-hidden="true" style={{ width: 13, height: 13, borderRadius: "50%", background: r.color, flexShrink: 0, position: "relative", top: 2 }} />
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 13, color: T.ink }}>{r.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{r.items}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Escritorio({ T }) {
  const pieces = ["dato 1", "dato 2", "dato 3", "dato 4"];
  return (
    <Frame T={T} title="Tu escritorio mental: cuatro piezas"
      caption="Sin repaso ni agrupación, el foco de la atención sostiene unas 4 piezas (Cowan, 2001). La quinta no entra: cae. Agrupar convierte varias piezas en una y libera el escritorio sin ampliarlo."
      label="Diagrama: cuatro espacios ocupados en la memoria de trabajo y piezas extra que caen fuera">
      <svg viewBox="0 0 320 120" width="100%" height="auto" aria-hidden="true">
        {pieces.map((p, i) => (
          <g key={p}>
            <rect x={20 + i * 62} y="26" width="52" height="40" rx="7" fill={T.gold} opacity="0.9" />
            <text x={46 + i * 62} y="50" fontSize="10" fill="#1B1712" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">{p}</text>
          </g>
        ))}
        {[0, 1].map((i) => (
          <g key={"extra" + i} opacity="0.45">
            <rect x={272 - i * 4} y={70 + i * 18} width="40" height="30" rx="6" fill="none" stroke={T.inkSoft} strokeWidth="1.5" strokeDasharray="3 3" transform={`rotate(${-8 + i * 14} 292 ${85 + i * 18})`} />
          </g>
        ))}
        <text x="20" y="16" fontSize="9.5" fill={T.inkSoft} fontFamily="sans-serif">MEMORIA DE TRABAJO</text>
        <text x="238" y="114" fontSize="9" fill={T.inkSoft} fontFamily="sans-serif">lo demás, fuera</text>
      </svg>
    </Frame>
  );
}

function Sueno({ T }) {
  return (
    <Frame T={T} title="Una noche de sueño: ciclos de ~90 minutos"
      caption="El sueño profundo (NREM) domina la primera mitad de la noche y el sueño REM la segunda. La consolidación declarativa viaja con el NREM: por eso recortar la noche por el final y trasnochar salen igual de caros."
      label="Diagrama: fases del sueño a lo largo de la noche, con más sueño profundo al principio y más REM al final">
      <svg viewBox="0 0 320 150" width="100%" height="auto" aria-hidden="true">
        <line x1="30" y1="12" x2="30" y2="118" stroke={T.line} strokeWidth="1.5" />
        <line x1="30" y1="118" x2="312" y2="118" stroke={T.line} strokeWidth="1.5" />
        <text x="4" y="30" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif">REM</text>
        <text x="2" y="62" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif">Ligero</text>
        <text x="0" y="94" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif">Profundo</text>
        <path d="M30,24 L52,24 L58,88 L78,88 L84,56 L96,24 L120,24 L126,88 L146,88 L152,56 L164,24 L196,24 L202,80 L218,80 L224,50 L236,24 L268,24 L274,64 L288,64 L294,44 L300,24 L312,24" fill="none" stroke={T.gold} strokeWidth="2.5" />
        {[70, 137, 211, 281].map((x, i) => (
          <line key={i} x1={x} y1="14" x2={x} y2="118" stroke={T.line} strokeWidth="1" strokeDasharray="2 4" />
        ))}
        <text x="30" y="134" fontSize="9" fill={T.inkSoft} fontFamily="sans-serif">23:00</text>
        <text x="150" y="134" fontSize="9" fill={T.inkSoft} fontFamily="sans-serif">3:00</text>
        <text x="282" y="134" fontSize="9" fill={T.inkSoft} fontFamily="sans-serif">7:00</text>
      </svg>
    </Frame>
  );
}

function Espaciado({ T }) {
  const marks = [
    { d: 0, label: "Día 0\naprendes" },
    { d: 3, label: "Día 3" },
    { d: 6, label: "Día 6" },
    { d: 10, label: "Día 10" },
    { d: 15, label: "Día 15" },
    { d: 21, label: "Día 21" },
    { d: 28, label: "Día 28" }
  ];
  const x = (d) => 26 + (d / 30) * 268;
  return (
    <Frame T={T} title="Repasos para una meta a 30 días"
      caption="La guía práctica derivada de Cepeda et al. (2008): huecos de alrededor del 10–20% del plazo que falta (el óptimo exacto se acorta en proporción cuando el plazo es muy largo). Para 30 días: repasos cada 3–6 días, con huecos que crecen."
      label="Línea de tiempo: aprender el día 0 y repasar los días 3, 6, 10, 15, 21 y 28 antes del examen del día 30">
      <svg viewBox="0 0 320 92" width="100%" height="auto" aria-hidden="true">
        <line x1="26" y1="38" x2="294" y2="38" stroke={T.line} strokeWidth="2" />
        {marks.map((m) => (
          <g key={m.d}>
            <circle cx={x(m.d)} cy="38" r={m.d === 0 ? 6 : 5} fill={T.gold} />
            <text x={x(m.d)} y="62" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif" textAnchor="middle">{m.label.split("\n")[0]}</text>
            {m.d === 0 && <text x={x(m.d)} y="76" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif" textAnchor="middle">aprendes</text>}
          </g>
        ))}
        <g>
          <rect x={x(30) - 1} y="24" width="3" height="28" fill={T.ink} />
          <text x={x(30)} y="16" fontSize="9" fill={T.ink} fontFamily="sans-serif" fontWeight="700" textAnchor="middle">META</text>
          <text x={x(30)} y="62" fontSize="8.5" fill={T.inkSoft} fontFamily="sans-serif" textAnchor="middle">Día 30</text>
        </g>
      </svg>
    </Frame>
  );
}

export const DIAGRAMS = {
  "ch-trabajo": Escritorio,
  "ch5": Olvido,
  "ch-semaforo": Semaforo,
  "ch9": Sueno,
  "ch15": Espaciado
};

export default function ChapterDiagram({ chapterId, T }) {
  const Cmp = DIAGRAMS[chapterId];
  return Cmp ? <Cmp T={T} /> : null;
}
