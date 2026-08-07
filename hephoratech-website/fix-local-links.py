#!/usr/bin/env python3
"""Reverts internal links from root-absolute clean URLs back to relative .html.

Why: clean URLs like href="/services" only resolve when the site is served from
a domain root. Opening the files directly (file:///D:/...) makes "/" resolve to
the drive root, which breaks local preview entirely.

The SEO value of clean *internal* links was marginal anyway — rel=canonical is
the signal Google actually uses to pick the indexed URL, and .html requests
already 301 to the clean URL on the live site. Canonicals, og:url, structured
data and the legal pages all stay exactly as they are.

Run:  python fix-local-links.py
"""
import os, re, glob

HERE = os.path.dirname(os.path.abspath(__file__))
PAGES = {os.path.basename(p) for p in glob.glob(os.path.join(HERE, "*.html"))}
CLEAN = {("/" if p == "index.html" else "/" + p[:-5]): p for p in PAGES}


def fix(path):
    src = open(path, encoding="utf-8").read()
    orig = src

    def relink(m):
        q, href = m.group(1), m.group(2)
        base = href.split("#")[0]
        frag = href[len(base):]
        # only touch root-absolute links that map to one of our pages
        if base in CLEAN:
            return f"href={q}{CLEAN[base]}{frag}{q}"
        return m.group(0)

    # href="/..." only — canonical/og use full https:// URLs and are untouched
    src = re.sub(r'href=(["\'])(/[^"\']*)\1', relink, src)
    if src != orig:
        open(path, "w", encoding="utf-8").write(src)
        return True
    return False


if __name__ == "__main__":
    n = 0
    for p in sorted(glob.glob(os.path.join(HERE, "*.html"))):
        if fix(p):
            n += 1
    print(f"  ✓ {n} pages: internal links back to relative .html")
