#!/usr/bin/env python3
"""Generates dark-theme variants of the product illustrations.

The illustrations are drawn on a light canvas, which looks wrong on the dark
theme. This maps every surface colour to a dark equivalent while keeping the
brand blue (and the embedded CSS animation) untouched.

Run:  python make-dark-ill.py      →  assets/ill/*-dark.svg
"""
import os, re

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "ill")
SOURCES = ["school.svg", "food.svg"]

# light surface → dark surface. Order matters: longest/most specific first.
MAP = [
    # page background gradient
    ('stop-color="#f4f8ff"', 'stop-color="#111a2c"'),
    ('stop-color="#e9f1ff"', 'stop-color="#0d1424"'),
    ('stop-color="#dfeaff"', 'stop-color="#0a101d"'),
    # ambient glow
    ('stop-color="#c3d8ff"', 'stop-color="#1b2b4f"'),
    ('stop-color="#d8e6ff"', 'stop-color="#152340"'),
    ('stop-color="#e6eeff"', 'stop-color="#101a30"'),
    # glass panels
    ('stop-color="#ffffff" stop-opacity="0.96"', 'stop-color="#ffffff" stop-opacity="0.095"'),
    ('stop-color="#ffffff" stop-opacity="0.72"', 'stop-color="#ffffff" stop-opacity="0.055"'),
    # brand gradient — brighten so it reads on dark
    ('stop-color="#0b3fd4"', 'stop-color="#2f6bff"'),
    ('stop-color="#4a80ff"', 'stop-color="#7aa5ff"'),
    # panel borders
    ('stroke="#ffffff"', 'stroke="rgba(255,255,255,0.11)"'),
    # flat surfaces
    ('"#f6f9ff"', '"#141d31"'),   # sidebar
    ('"#f2f6ff"', '"#18223a"'),   # window bar
    ('"#f4f8ff"', '"#141d31"'),   # inner panel
    ('"#eef4ff"', '"#16203a"'),   # tinted panel
    ('"#eaf1ff"', '"#16203a"'),   # map
    ('"#dfe9ff"', '"rgba(255,255,255,0.14)"'),  # PALE placeholders
    ('"#a9c6ff"', '"#40608f"'),                 # SKY bars/dots
    ('fill="#fff"', 'fill="rgba(255,255,255,0.9)"'),
    ('fill="#ffffff"', 'fill="rgba(255,255,255,0.9)"'),
    # depth
    ('flood-color="#0d1322" flood-opacity="0.11"', 'flood-color="#000000" flood-opacity="0.5"'),
    # brand blue text/accents — lift for contrast on dark
    ('fill="#1e5fff"', 'fill="#6ea0ff"'),
    ('stroke="#1e5fff"', 'stroke="#6ea0ff"'),
]


def convert(name):
    src = open(os.path.join(HERE, name), encoding="utf-8").read()
    out = src
    for a, b in MAP:
        out = out.replace(a, b)
    dest = os.path.join(HERE, name.replace(".svg", "-dark.svg"))
    open(dest, "w", encoding="utf-8").write(out)
    left = sorted(set(re.findall(r'#(?:f[0-9a-f]{5}|e[0-9a-f]{5}|d[0-9a-f]{5})', out)))
    return dest, left


if __name__ == "__main__":
    for n in SOURCES:
        dest, left = convert(n)
        print("  ✓", os.path.basename(dest), "| light colours remaining:", left or "none")
