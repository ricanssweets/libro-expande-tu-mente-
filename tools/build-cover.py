#!/usr/bin/env python3
"""Compone la portada desde el arte original (sin texto) + la tipografía.

Reglas del autor: solo «Darwin Acevedo» (nunca el nombre completo) y ninguna
mención a ediciones o versiones.
Uso: python3 tools/build-cover.py [arte.png] [salida.png]
"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ART = sys.argv[1] if len(sys.argv) > 1 else "/home/hatch/workspace/libro-cover-work/media-generation-portada-fondo-0-985b71ce-a32d-470b-89de-8a6277743c79.png"
OUT = sys.argv[2] if len(sys.argv) > 2 else "portada.png"
W, H = 1280, 1920

SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
SERIF_B = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SERIF_I = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"

CREAM = (243, 236, 220)
CREAM_SOFT = (214, 205, 186)
GOLD = (201, 162, 39)

img = Image.open(ART).convert("RGB").resize((W, H), Image.LANCZOS)

# Velo oscuro inferior para que el nombre del autor se lea sobre las raíces.
veil = Image.new("L", (1, H))
for y in range(H):
    veil.putpixel((0, y), 0 if y < int(H * 0.78) else int(170 * (y - H * 0.78) / (H * 0.22)))
veil = veil.resize((W, H))
black = Image.new("RGB", (W, H), (5, 4, 3))
img = Image.composite(black, img, veil.point(lambda v: v))

d = ImageDraw.Draw(img)


def centered(text, y, font, fill, tracking=0):
    if tracking:
        widths = [d.textlength(ch, font=font) for ch in text]
        total = sum(widths) + tracking * (len(text) - 1)
        x = (W - total) / 2
        for ch, w in zip(text, widths):
            d.text((x, y), ch, font=font, fill=fill)
            x += w + tracking
        return total
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)
    return w


def fit_font(path, text, target_w, start):
    size = start
    while size > 10:
        f = ImageFont.truetype(path, size)
        if d.textlength(text, font=f) <= target_w:
            return f
        size -= 4
    return ImageFont.truetype(path, size)


# Marca superior
f_brand = ImageFont.truetype(SERIF, 40)
centered("SISTEMA MEMORIA EXPANDIDA™", 148, f_brand, GOLD, tracking=10)

# Título
f_title = fit_font(SERIF_B, "EXPANDE", 1020, 190)
centered("EXPANDE", 252, f_title, CREAM)
centered("TU MENTE", 418, f_title, CREAM)
d.line([(500, 592), (780, 592)], fill=GOLD, width=3)

# Subtítulo
f_sub = ImageFont.truetype(SERIF_I, 46)
centered("Aprende como realmente aprende tu cerebro", 622, f_sub, CREAM_SOFT)

# Autor (solo nombre y primer apellido; sin línea de edición)
f_author = ImageFont.truetype(SERIF, 47)
centered("DARWIN ACEVEDO", 1745, f_author, CREAM, tracking=12)

img.save(OUT)
print("portada OK →", OUT, img.size)
