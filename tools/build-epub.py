#!/usr/bin/env python3
"""Construye ediciones/Expande-Tu-Mente.epub (EPUB 3) desde ediciones/build/content.json.
Requiere antes: node tools/build-epub.mjs. Sin dependencias fuera de la stdlib."""
import json, zipfile, html, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "ediciones", "build", "content.json")
OUT = os.path.join(ROOT, "ediciones", "Expande-Tu-Mente.epub")
COVER = os.path.join(ROOT, "ediciones", "build", "portada-epub.jpg")

def esc(t):
    return html.escape(t or "", quote=False)

def chapter_xhtml(c, idx):
    parts = []
    parts.append(f'<p class="tag">{esc(c["tag"])}</p>')
    parts.append(f'<h1>{esc(c["title"])}</h1>')
    if c["subtitle"]:
        parts.append(f'<p class="subtitle">{esc(c["subtitle"])}</p>')
    if c["hook"]:
        parts.append(f'<p class="hook">«{esc(c["hook"])}»</p>')
    for p in c["paragraphs"]:
        parts.append(f"<p>{esc(p)}</p>")
    if c["pullquote"]:
        parts.append(f'<blockquote>«{esc(c["pullquote"])}»</blockquote>')
    for s in c["sections"]:
        parts.append(f'<h2>{esc(s["h"])}</h2>')
        for p in s["p"]:
            parts.append(f"<p>{esc(p)}</p>")
    if c["steps"]:
        parts.append("<ol>")
        for st in c["steps"]:
            parts.append(f'<li><strong>{esc(st["t"])}</strong><br/>{esc(st["d"])}</li>')
        parts.append("</ol>")
    if c["exercise"]:
        items = "".join(f"<li>{esc(i)}</li>" for i in c["exercise"]["items"])
        parts.append(f'<aside class="exercise"><h2>Ejercicio — {esc(c["exercise"]["title"])}</h2><ul>{items}</ul></aside>')
    if c["keyidea"]:
        parts.append(f'<aside class="keyidea"><p>«{esc(c["keyidea"])}»</p></aside>')
    if c["closing"]:
        parts.append(f"<p>{esc(c['closing'])}</p>")
    if c["quiz"]:
        qs = []
        ans = []
        for i, q in enumerate(c["quiz"]):
            opts = "".join(f"<li>{esc(o)}</li>" for o in q["options"])
            qs.append(f'<li><p><strong>{esc(q["q"])}</strong></p><ol class="opts">{opts}</ol></li>')
            ans.append(f'<li><strong>{"ABCD"[q["answer"]]}</strong> — {esc(q["why"])}</li>')
        parts.append('<aside class="quiz"><h2>Quiz — practica recuperar</h2>'
                     "<p>Responde de memoria antes de mirar las respuestas del final.</p>"
                     f'<ol>{ "".join(qs) }</ol>'
                     f'<h3>Respuestas</h3><ol>{ "".join(ans) }</ol></aside>')
    body = "\n".join(parts)
    return f'''<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es" lang="es">
<head><title>{esc(c["title"])}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><section id="ch{idx}">{body}</section></body>
</html>'''

CSS = """body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.65; margin: 5%; color: #211A10; }
h1 { font-size: 1.7em; line-height: 1.15; margin: .2em 0 .3em 0; }
h2 { font-size: 1.25em; color: #8a6410; margin-top: 1.3em; }
.tag { font-family: sans-serif; font-size: .72em; letter-spacing: .14em; text-transform: uppercase; color: #B9760F; font-weight: bold; }
.subtitle, .hook { font-style: italic; color: #555; }
blockquote { border-left: 3px solid #C9A227; margin: 1em 0; padding: .4em 1em; background: #faf5e6; font-style: italic; }
aside.exercise { border: 1.5px dashed #C9A227; border-radius: 8px; padding: .8em 1em; background: #faf5e6; }
aside.keyidea { background: #211A10; color: #F5EEDC; border-radius: 8px; padding: .8em 1em; }
aside.quiz { border: 1.5px solid #C9A227; border-radius: 8px; padding: .8em 1em; }
ol.opts { list-style-type: upper-alpha; }
.cover { text-align: center; } .cover img { max-width: 100%; }
"""

def ensure_cover():
    if os.path.exists(COVER):
        return
    from PIL import Image
    os.makedirs(os.path.dirname(COVER), exist_ok=True)
    Image.open(os.path.join(ROOT, "portada.png")).resize((1000, 1500)).save(COVER, quality=85, optimize=True)

def main():
    ensure_cover()
    data = json.load(open(SRC, encoding="utf-8"))
    manifest, spine, nav_items = [], [], []
    files = {}
    files["OEBPS/style.css"] = CSS
    files["OEBPS/cover.xhtml"] = '''<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es" lang="es">
<head><title>Portada</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><p class="cover"><img src="portada.jpg" alt="Portada de Expande Tu Mente"/></p></body>
</html>'''
    manifest.append('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>')
    manifest.append('<item id="coverimg" href="portada.jpg" media-type="image/jpeg" properties="cover-image"/>')
    spine.append('<itemref idref="cover"/>')
    for i, c in enumerate(data):
        cid = f"ch{i}"
        files[f"OEBPS/{cid}.xhtml"] = chapter_xhtml(c, i)
        manifest.append(f'<item id="{cid}" href="{cid}.xhtml" media-type="application/xhtml+xml"/>')
        spine.append(f'<itemref idref="{cid}"/>')
        label = f'{c["num"]}. {c["title"]}' if c["num"] else c["title"]
        nav_items.append(f'<li><a href="{cid}.xhtml">{esc(label)}</a></li>')
    files["OEBPS/nav.xhtml"] = f'''<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">
<head><title>Índice</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><nav epub:type="toc"><h1>Índice</h1><ol>{ "".join(nav_items) }</ol></nav></body>
</html>'''
    manifest.append('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>')
    manifest.append('<item id="css" href="style.css" media-type="text/css"/>')
    opf = f'''<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">urn:uuid:8f2c4d1e-expande-mente-v5</dc:identifier>
<dc:title>Expande Tu Mente</dc:title>
<dc:creator>Darwin Acevedo Sanchez</dc:creator>
<dc:language>es</dc:language>
<dc:description>Sistema Memoria Expandida: aprende como realmente aprende tu cerebro. Edición expandida e interactiva: 27 capítulos y 2 apéndices con respaldo científico, ejercicios y quizzes.</dc:description>
<meta property="dcterms:modified">2026-10-21T00:00:00Z</meta>
</metadata>
<manifest>{ "".join(manifest) }</manifest>
<spine>{ "".join(spine) }</spine>
</package>'''
    files["OEBPS/content.opf"] = opf
    files["META-INF/container.xml"] = '''<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>'''
    cover_bytes = open(COVER, "rb").read()
    with zipfile.ZipFile(OUT, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        for name, content in files.items():
            z.writestr(name, content, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/portada.jpg", cover_bytes, compress_type=zipfile.ZIP_DEFLATED)
    size = os.path.getsize(OUT)
    print(f"EPUB OK → {OUT} ({size} bytes, {len(data)} entradas)")

if __name__ == "__main__":
    main()
