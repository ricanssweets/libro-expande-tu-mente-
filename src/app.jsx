import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BOOK } from "./book-data.js";
export { BOOK };
import { THEMES, FONT_ORDER, FONT_SIZES, SERIF, SANS, normalizeText, chapterSearchText } from "./theme.js";
import ReaderView from "./ReaderView.jsx";
import TrainView from "./TrainView.jsx";
import { Sidebar, Header, Footer, HomeView } from "./ui.jsx";

/* ------------------------------------------------ almacenamiento seguro */

const LS = {
  prefs: "expande-reading-prefs",
  bookmarks: "expande-bookmarks",
  progress: "expande-reading-progress",
  read: "expande-chapters-read",
  scroll: "expande-scroll-positions"
};

// Safari en modo privado o cuota llena lanzan al escribir; nunca debe tumbar el render.
function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function prefersDark() {
  try {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return false;
  }
}

// Umbral de scroll a partir del cual se considera un capítulo "leído".
const READ_THRESHOLD = 0.85;

const CHAPTERS = BOOK.map((c, idx) => ({ id: c.id, num: c.num, title: c.title, tag: c.tag, idx }));

/* ------------------------------------------------------------------ App */

// `initialView`/`initialChapter` existen para las pruebas de render; en producción
// siempre se abre en la portada y en el último capítulo leído.
export default function App({ initialView, initialChapter } = {}) {
  const [themeName, setThemeName] = useState(() => {
    const prefs = readLocal(LS.prefs, null);
    if (prefs && (prefs.theme === "light" || prefs.theme === "dark")) return prefs.theme;
    return prefersDark() ? "dark" : "light";
  });
  const [fontKey, setFontKey] = useState(() => {
    const prefs = readLocal(LS.prefs, null);
    return prefs && FONT_ORDER.includes(prefs.font) ? prefs.font : "m";
  });
  const [chapterIdx, setChapterIdx] = useState(() => {
    if (Number.isInteger(initialChapter) && initialChapter >= 0 && initialChapter < BOOK.length) return initialChapter;
    const prog = readLocal(LS.progress, null);
    if (prog && Number.isInteger(prog.chapterIdx) && prog.chapterIdx >= 0 && prog.chapterIdx < BOOK.length) return prog.chapterIdx;
    return 0;
  });
  const [view, setView] = useState(initialView === "reader" ? "reader" : initialView === "train" ? "train" : "home");
  const [trainTab, setTrainTab] = useState("tests");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    const bm = readLocal(LS.bookmarks, []);
    return Array.isArray(bm) ? bm.filter((id) => BOOK.some((c) => c.id === id)) : [];
  });
  const [readSet, setReadSet] = useState(() => {
    const r = readLocal(LS.read, []);
    return new Set(Array.isArray(r) ? r.filter((id) => BOOK.some((c) => c.id === id)) : []);
  });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [chapterReadPct, setChapterReadPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 820
  );

  const contentRef = useRef(null);
  const scrollSaveTimer = useRef(null);
  const toastTimer = useRef(null);
  const T = THEMES[themeName];

  /* persistencia */
  useEffect(() => { writeLocal(LS.prefs, { theme: themeName, font: fontKey }); }, [themeName, fontKey]);
  useEffect(() => { writeLocal(LS.bookmarks, bookmarks); }, [bookmarks]);
  useEffect(() => { writeLocal(LS.read, [...readSet]); }, [readSet]);
  useEffect(() => { writeLocal(LS.progress, { chapterIdx, updatedAt: Date.now() }); }, [chapterIdx]);

  /* tema + color de la barra del navegador */
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", themeName === "dark" ? "#1B1712" : "#F5EEDC");
    document.documentElement.style.background = T.bg;
    document.documentElement.style.colorScheme = themeName;
  }, [themeName, T.bg]);

  /* tamaño de ventana */
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth > 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Escape cierra el índice en móvil */
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  /* búsqueda con retardo para no filtrar 15 capítulos en cada tecla */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  /* índice de búsqueda sobre TODO el texto, sin acentos */
  const searchIndex = useMemo(() => BOOK.map(chapterSearchText), []);

  const results = useMemo(() => {
    const q = normalizeText(debouncedQuery.trim());
    if (!q) return CHAPTERS;
    return CHAPTERS.filter((c) => searchIndex[c.idx].includes(q));
  }, [debouncedQuery, searchIndex]);

  /* guardar/restaurar posición de lectura */
  const saveScroll = useCallback((idx, ratio) => {
    const all = readLocal(LS.scroll, {});
    all[BOOK[idx].id] = Number(ratio.toFixed(4));
    writeLocal(LS.scroll, all);
  }, []);

  const goToChapter = useCallback((idx) => {
    const next = Math.max(0, Math.min(BOOK.length - 1, idx));
    setChapterIdx(next);
    setView("reader");
    setSidebarOpen(false);
    setChapterReadPct(0);
  }, []);

  /* al abrir un capítulo, restaurar la posición guardada */
  useEffect(() => {
    if (view !== "reader") return;
    const el = contentRef.current;
    if (!el) return;
    const all = readLocal(LS.scroll, {});
    const ratio = typeof all[BOOK[chapterIdx].id] === "number" ? all[BOOK[chapterIdx].id] : 0;
    const apply = () => {
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = ratio > 0 && max > 0 ? Math.round(ratio * max) : 0;
      setChapterReadPct(ratio > 0 ? Math.round(ratio * 100) : 0);
    };
    apply();
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(apply) : null;
    return () => { if (raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf); };
  }, [view, chapterIdx]);

  const onScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 1;
    setChapterReadPct(Math.round(ratio * 100));
    if (ratio >= READ_THRESHOLD) {
      setReadSet((prev) => (prev.has(BOOK[chapterIdx].id) ? prev : new Set(prev).add(BOOK[chapterIdx].id)));
    }
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => saveScroll(chapterIdx, ratio), 300);
  }, [chapterIdx, saveScroll]);

  const resetProgress = useCallback(() => {
    setReadSet(new Set());
    writeLocal(LS.read, []);
    writeLocal(LS.scroll, {});
    setChapterReadPct(0);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, []);

  /* tamaño de texto: escalera unificada, ahora el botón − sí reduce */
  const shiftFont = useCallback((dir) => {
    setFontKey((k) => {
      const i = FONT_ORDER.indexOf(k);
      const next = Math.max(0, Math.min(FONT_ORDER.length - 1, i + dir));
      return FONT_ORDER[next];
    });
  }, []);

  const toggleBookmark = useCallback((id) => {
    setBookmarks((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const [toast, setToast] = useState("");

  const copyIdea = useCallback((text) => {
    const done = () => { setCopied(true); showToast("Idea copiada"); setTimeout(() => setCopied(false), 2000); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => showToast("No se pudo copiar"));
        return;
      }
    } catch (e) { /* sin clipboard: se intenta el respaldo */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    } catch (e) {
      showToast("No se pudo copiar");
    }
  }, [showToast]);

  const chapter = BOOK[chapterIdx];
  const readCount = readSet.size;
  const progressPct = Math.round((readCount / BOOK.length) * 100);
  const bookmarkList = CHAPTERS.filter((c) => bookmarks.includes(c.id));

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: T.bg, color: T.ink, fontFamily: SERIF, display: "flex", overflow: "hidden" }}>
      <a
        href="#contenido"
        style={{
          position: "absolute", left: -9999, top: 0, background: T.gold, color: "#1B1712",
          padding: "10px 14px", borderRadius: 8, fontFamily: SANS, fontWeight: 700, zIndex: 200
        }}
        onFocus={(e) => { e.currentTarget.style.left = "12px"; e.currentTarget.style.top = "12px"; }}
        onBlur={(e) => { e.currentTarget.style.left = "-9999px"; }}
      >
        Saltar al contenido
      </a>

      <Sidebar
        T={T} isDesktop={isDesktop} sidebarOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        view={view} setView={setView}
        query={query} setQuery={setQuery} results={results}
        chapters={CHAPTERS} chapterIdx={chapterIdx}
        onChapter={(idx) => goToChapter(idx)}
        bookmarks={bookmarks} bookmarkList={bookmarkList}
        onResetProgress={resetProgress}
        progressPct={progressPct} readCount={readCount}
      />

      {sidebarOpen && !isDesktop && (
        <div onClick={() => setSidebarOpen(false)} aria-hidden="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50 }} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh", maxHeight: "100vh" }}>
        <Header
          T={T} isDesktop={isDesktop} openSidebar={() => setSidebarOpen(true)}
          view={view} chapter={chapter} bookmarks={bookmarks}
          onTrain={() => { setTrainTab("tests"); setView("train"); }}
          onToggleBookmark={() => toggleBookmark(chapter.id)}
          fontKey={fontKey} onShiftFont={shiftFont}
          themeName={themeName} onToggleTheme={() => setThemeName((t) => (t === "light" ? "dark" : "light"))}
          toast={toast}
        />

        <main
          id="contenido"
          ref={contentRef}
          onScroll={view === "reader" ? onScroll : undefined}
          tabIndex={-1}
          style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
        >
          {view === "home"
            ? <HomeView
              T={T} chapters={CHAPTERS}
              onStart={() => goToChapter(chapterIdx)}
              onChapter={goToChapter}
              onTrain={(tab) => { setTrainTab(tab); setView("train"); }}
              chapterIdx={chapterIdx} total={BOOK.length}
              progressPct={progressPct} readCount={readCount}
            />
            : view === "train"
              ? <TrainView T={T} initialTab={trainTab} />
              : <ReaderView
                chapter={chapter} T={T} fontSize={FONT_SIZES[fontKey]}
                onCopyIdea={copyIdea} copied={copied}
              />}
        </main>

        {view === "reader" && (
          <Footer
            T={T} chapterIdx={chapterIdx} total={BOOK.length}
            goToChapter={goToChapter} chapter={chapter} readPct={chapterReadPct}
          />
        )}
      </div>
    </div>
  );
}
