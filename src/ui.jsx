import { useState, useEffect, useRef } from "react";
import { ICONS } from "./icons.js";
import { SANS, SERIF, FONT_ORDER } from "./theme.js";

export function Icon({ path, size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export function iconBtnStyle(T) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32,
    borderRadius: 8, border: `1px solid ${T.line}`, background: "transparent", color: T.ink, cursor: "pointer"
  };
}

export function navRowStyle(T, active) {
  return {
    display: "flex", alignItems: "center", width: "100%", padding: "9px 10px", borderRadius: 8,
    border: "none", background: active ? T.gold + "26" : "transparent", color: T.ink,
    cursor: "pointer", textAlign: "left", marginBottom: 2, font: "inherit"
  };
}

/* ---------------------------------------------------------------- Sidebar */

export function Sidebar({
  T, isDesktop, sidebarOpen, closeSidebar, view, setView,
  query, setQuery, results, chapters, chapterIdx, onChapter,
  bookmarks, onResetProgress, progressPct, readCount, bookmarkList
}) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (sidebarOpen && !isDesktop && closeRef.current) closeRef.current.focus();
  }, [sidebarOpen, isDesktop]);

  const navItem = (c) => {
    const active = view === "reader" && c.idx === chapterIdx;
    return (
      <button
        key={c.id}
        onClick={() => onChapter(c.idx)}
        style={navRowStyle(T, active)}
        aria-current={active ? "page" : undefined}
      >
        <span aria-hidden="true" style={{ width: 22, fontFamily: SERIF, fontWeight: 700, color: T.gold, fontSize: 12 }}>
          {c.num ? String(c.num).padStart(2, "0") : "—"}
        </span>
        <span style={{ marginLeft: 6, fontSize: 12.5, fontFamily: SANS, flex: 1, textAlign: "left" }}>{c.title}</span>
        {bookmarks.includes(c.id) && <Icon path={ICONS.bookmarkFilled} size={12} color={T.gold} />}
      </button>
    );
  };

  return (
    <nav
      aria-label="Índice del libro"
      style={{
        position: sidebarOpen && !isDesktop ? "fixed" : "relative",
        zIndex: 60, top: 0, left: 0, height: "100%", width: 288, flexShrink: 0,
        background: T.bg2, borderRight: `1px solid ${T.line}`,
        transform: sidebarOpen || isDesktop ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .25s ease",
        display: isDesktop ? "flex" : (sidebarOpen ? "flex" : "none"), flexDirection: "column"
      }}
    >
      <div style={{ padding: "18px 18px 10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold }}>
            Expande Tu Mente
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>Sistema Memoria Expandida™</div>
        </div>
        {!isDesktop && (
          <button ref={closeRef} onClick={closeSidebar} style={iconBtnStyle(T)} aria-label="Cerrar índice">
            <Icon path={ICONS.x} size={16} />
          </button>
        )}
      </div>

      <div style={{ padding: "0 18px 10px 18px" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 8, top: 8, color: T.inkSoft }}><Icon path={ICONS.search} size={13} /></span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en todo el libro…"
            aria-label="Buscar en todo el libro"
            type="search"
            style={{
              width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 28px", borderRadius: 8,
              border: `1px solid ${T.line}`, background: T.bg, color: T.ink, fontSize: 12.5, fontFamily: SANS
            }}
          />
        </div>
        <div aria-live="polite" role="status" style={{ fontFamily: SANS, fontSize: 10.5, color: T.inkSoft, marginTop: 6, minHeight: 14 }}>
          {query.trim()
            ? (results.length === 0
              ? "Sin resultados. Prueba con otra palabra."
              : `${results.length} ${results.length === 1 ? "capítulo coincide" : "capítulos coinciden"}`)
            : "Busca en títulos y en el texto completo"}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 18px 10px" }}>
        <button onClick={() => { setView("home"); closeSidebar(); }} style={{ ...navRowStyle(T, view === "home"), marginBottom: 6 }}>
          <Icon path={ICONS.home} size={13} /> <span style={{ marginLeft: 8 }}>Portada</span>
        </button>
        <button onClick={() => { setView("train"); closeSidebar(); }} style={{ ...navRowStyle(T, view === "train"), marginBottom: 6 }}>
          <Icon path={ICONS.zap} size={13} color={T.gold} /> <span style={{ marginLeft: 8 }}>Entrenar — tests y flashcards</span>
        </button>

        {bookmarkList.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: SANS, fontSize: 9.5, letterSpacing: ".12em", textTransform: "uppercase", color: T.inkSoft, padding: "8px 10px 4px 10px" }}>
              Marcadores
            </div>
            {bookmarkList.map((c) => (
              <button key={"bm-" + c.id} onClick={() => onChapter(c.idx)} style={navRowStyle(T, false)}>
                <Icon path={ICONS.bookmarkFilled} size={12} color={T.gold} />
                <span style={{ marginLeft: 8, fontSize: 12.5, fontFamily: SANS, flex: 1, textAlign: "left" }}>{c.title}</span>
              </button>
            ))}
          </div>
        )}

        {results.map(navItem)}
        {!query.trim() && chapters.map(navItem)}
      </div>

      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.line}` }}>
        <div style={{ fontFamily: SANS, fontSize: 10, color: T.inkSoft, marginBottom: 6 }}>Progreso de lectura</div>
        <div
          role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}
          aria-label="Capítulos leídos"
          style={{ height: 5, borderRadius: 3, background: T.line, overflow: "hidden" }}
        >
          <div style={{ height: "100%", width: `${progressPct}%`, background: T.gold, transition: "width .3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ fontFamily: SANS, fontSize: 10, color: T.inkSoft }}>{progressPct}% · {readCount} de {chapters.length} leídos</span>
          {readCount > 0 && (
            <button
              onClick={onResetProgress}
              style={{ background: "transparent", border: "none", color: T.inkSoft, fontFamily: SANS, fontSize: 10, cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- Header */

export function Header({ T, isDesktop, openSidebar, view, chapter, bookmarks, onToggleBookmark, fontKey, onShiftFont, themeName, onToggleTheme, toast, onTrain }) {
  const label = chapter.num ? `Capítulo ${chapter.num}` : chapter.tag === "Apéndice" ? "Apéndice" : "Introducción";
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${T.line}`, gap: 10, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {!isDesktop && (
          <button onClick={openSidebar} style={iconBtnStyle(T)} aria-label="Abrir índice" aria-expanded={false}>
            <Icon path={ICONS.menu} size={16} />
          </button>
        )}
        {view === "reader" && (
          <div style={{ fontFamily: SANS, fontSize: 11, color: T.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label} · {chapter.title}
          </div>
        )}
        {view === "train" && (
          <div style={{ fontFamily: SANS, fontSize: 11, color: T.inkSoft, whiteSpace: "nowrap" }}>
            Entrenamiento
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {view !== "train" && onTrain && (
          <button
            onClick={onTrain}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 18,
              border: `1.5px solid ${T.gold}`, background: "transparent", color: T.ink,
              fontFamily: SANS, fontSize: 12, fontWeight: 800, cursor: "pointer", marginRight: 2
            }}
            title="Tests de memoria y flashcards con repetición espaciada"
          >
            <Icon path={ICONS.zap} size={13} color={T.gold} /> Entrenar
          </button>
        )}
        {view === "reader" && (
          <button
            onClick={onToggleBookmark}
            style={iconBtnStyle(T)}
            aria-label={bookmarks.includes(chapter.id) ? "Quitar marcador" : "Guardar marcador"}
            aria-pressed={bookmarks.includes(chapter.id)}
            title={bookmarks.includes(chapter.id) ? "Quitar marcador" : "Guardar marcador"}
          >
            <Icon path={bookmarks.includes(chapter.id) ? ICONS.bookmarkFilled : ICONS.bookmark} size={15} color={bookmarks.includes(chapter.id) ? T.gold : T.ink} />
          </button>
        )}
        <button onClick={() => onShiftFont(-1)} style={iconBtnStyle(T)} aria-label="Reducir tamaño de texto" title={`Reducir tamaño de texto (actual: ${fontKey})`}>
          <Icon path={ICONS.minus} size={14} />
        </button>
        <button onClick={() => onShiftFont(1)} style={iconBtnStyle(T)} aria-label="Aumentar tamaño de texto" title={`Aumentar tamaño de texto (actual: ${fontKey})`}>
          <Icon path={ICONS.plus} size={14} />
        </button>
        <button
          onClick={onToggleTheme}
          style={iconBtnStyle(T)}
          aria-label={themeName === "light" ? "Activar tema oscuro" : "Activar tema claro"}
          aria-pressed={themeName === "dark"}
          title={themeName === "light" ? "Activar tema oscuro" : "Activar tema claro"}
        >
          <Icon path={themeName === "light" ? ICONS.moon : ICONS.sun} size={14} />
        </button>
        <span aria-live="polite" role="status" style={{ fontFamily: SANS, fontSize: 11, color: T.gold, minWidth: 0, whiteSpace: "nowrap" }}>
          {toast}
        </span>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- Footer */

export function Footer({ T, chapterIdx, total, goToChapter, chapter, readPct }) {
  const navBtn = {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20,
    border: `1px solid ${T.line}`, background: "transparent", color: T.ink,
    fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer"
  };
  return (
    <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderTop: `1px solid ${T.line}`, gap: 10, flexShrink: 0 }}>
      <button disabled={chapterIdx === 0} onClick={() => goToChapter(Math.max(0, chapterIdx - 1))} style={{ ...navBtn, opacity: chapterIdx === 0 ? 0.35 : 1 }} aria-label="Capítulo anterior">
        <Icon path={ICONS.chevLeft} size={14} /> Anterior
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4, minWidth: 0 }}>
        <div style={{ height: 4, width: "100%", background: T.line, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${readPct}%`, background: T.gold }} />
        </div>
        <span style={{ fontFamily: SANS, fontSize: 10, color: T.inkSoft }}>Avance de este capítulo: {readPct}%</span>
      </div>
      <button disabled={chapterIdx === total - 1} onClick={() => goToChapter(Math.min(total - 1, chapterIdx + 1))} style={{ ...navBtn, opacity: chapterIdx === total - 1 ? 0.35 : 1 }} aria-label="Capítulo siguiente">
        Siguiente <Icon path={ICONS.chevRight} size={14} />
      </button>
    </footer>
  );
}

/* ---------------------------------------------------------------- Home */

export function HomeView({ T, onStart, onChapter, onTrain, chapterIdx, total, progressPct, readCount, chapters }) {
  const CTA = {
    marginTop: 26, background: T.gold, color: "#1B1712", border: "none", borderRadius: 10, padding: "13px 22px",
    fontFamily: SANS, fontWeight: 800, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
  };
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 60px 24px" }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: T.gold }}>
        Sistema Memoria Expandida™
      </div>
      <img
        src="portada-mini.jpg"
        alt="Portada del libro Expande Tu Mente: un cerebro-árbol dorado de ramas neuronales sobre fondo oscuro"
        width={168} height={252}
        style={{ display: "block", marginTop: 22, borderRadius: 8, boxShadow: "0 14px 34px rgba(0,0,0,0.35)", border: `1px solid ${T.line}` }}
      />
      <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 42, lineHeight: 1.02, margin: "20px 0 0 0" }}>
        Expande<br />Tu <span style={{ color: T.gold }}>Mente</span>
      </h1>
      <p style={{ fontFamily: SERIF, fontStyle: "italic", color: T.inkSoft, fontSize: 15, marginTop: 12 }}>
        Aprende como realmente aprende tu cerebro.
      </p>
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: T.inkSoft, marginTop: 10, lineHeight: 1.6 }}>
        27 capítulos y 2 apéndices con ejercicios prácticos, respaldo científico, un quiz por capítulo, tests de memoria y flashcards con repetición espaciada. Tu progreso y tus marcadores se guardan en este dispositivo.
      </p>

      <button onClick={onStart} style={CTA}>
        {chapterIdx > 0 ? <><Icon path={ICONS.reset} size={14} /> Continuar leyendo</> : "Empezar a leer"}
      </button>

      {readCount > 0 && (
        <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 12, color: T.inkSoft }}>
          Progreso: {progressPct}% · {readCount} de {total} capítulos leídos
        </div>
      )}

      {onTrain && (
        <div style={{ marginTop: 30, border: `1.5px solid ${T.gold}`, borderRadius: 12, padding: "18px 20px", background: T.bg2 + "55" }}>
          <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gold, margin: "0 0 6px 0" }}>
            Nuevo en la v4 — entrena, no solo leas
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 14px 0" }}>
            Cada capítulo cierra con un quiz de 3 preguntas. Y aquí puedes medir tu memoria y repasar con espaciado, como manda la ciencia del libro:
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => onTrain("tests")} style={{ ...CTA, marginTop: 0, padding: "11px 16px", fontSize: 12.5 }}>
              Tests de memoria
            </button>
            <button onClick={() => onTrain("cards")} style={{
              background: "transparent", color: T.ink, border: `1.5px solid ${T.line}`, borderRadius: 10, padding: "11px 16px",
              fontFamily: SANS, fontWeight: 800, fontSize: 12.5, cursor: "pointer"
            }}>
              Flashcards SRS
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, fontFamily: SANS, fontSize: 12.5, color: T.inkSoft, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: T.ink }}>Otras ediciones:</span>
        <a href="ediciones/Expande-Tu-Mente.epub" download style={{ color: T.gold, fontWeight: 700 }}>Descargar EPUB</a>
        <a href="ediciones/Expande-Tu-Mente.pdf" download style={{ color: T.gold, fontWeight: 700 }}>Descargar PDF (48 págs.)</a>
        <a href="ediciones/audio-introduccion.mp3" style={{ color: T.gold, fontWeight: 700 }}>Escuchar la introducción (3 min)</a>
        <span>para tu lector de libros, para imprimir o para oír la muestra del audiolibro</span>
      </div>

      <div style={{ marginTop: 44, borderTop: `1px solid ${T.line}`, paddingTop: 22 }}>
        <h2 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.inkSoft, margin: "0 0 12px 0" }}>
          Contenido
        </h2>
        {chapters.map((c) => (
          <button key={c.id} onClick={() => onChapter(c.idx)} style={{
            display: "flex", width: "100%", alignItems: "baseline", gap: 12, padding: "10px 4px",
            background: "transparent", border: "none", borderBottom: `1px dotted ${T.line}`, cursor: "pointer", color: T.ink, textAlign: "left", font: "inherit"
          }}>
            <span aria-hidden="true" style={{ fontFamily: SERIF, fontWeight: 700, color: T.gold, width: 24, fontSize: 13 }}>
              {c.num ? String(c.num).padStart(2, "0") : "—"}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 13, flex: 1 }}>{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
