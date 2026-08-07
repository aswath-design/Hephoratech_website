#!/usr/bin/env python3
"""Swaps the hero background to Magic Rings (React Bits, MIT — ported to
vanilla WebGL). Replaces the Aurora wiring.

Run:  python apply-hero-rings.py
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
IDX = os.path.join(HERE, "index.html")
CSS = os.path.join(HERE, "assets", "xtract.css")
JS = os.path.join(HERE, "assets", "xtract.js")
CLEAN_JS = JS + ".lottie.bak"          # clean copy from before any hero bg block
MARK = "/* ═══ HERO RINGS ═══ */"
JS_MARK = "/* ---- hero magic rings background ---- */"
ANCHOR = '<section class="hero" id="top">'

HTML = ANCHOR + '\n  <div class="hero-rings" id="heroRings" aria-hidden="true"></div>'

CSS_BLOCK = MARK + """
.hero{isolation:isolate}
.hero>.wrap{position:relative;z-index:3}
.hero-rings{
  position:absolute;inset:0;z-index:0;pointer-events:auto;overflow:hidden;
  opacity:0;transition:opacity 1.6s var(--ease);
  -webkit-mask-image:radial-gradient(ellipse 78% 76% at 50% 46%,#000 44%,transparent 86%);
  mask-image:radial-gradient(ellipse 78% 76% at 50% 46%,#000 44%,transparent 86%);
}
.hero-rings.ready{opacity:.9}
.hero-rings canvas{display:block;width:100%;height:100%}
/* the rings are brightest at the centre, which is where the headline sits —
   this keeps the type readable without dulling the edges of the effect */
.hero-rings::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 40% 35% at 50% 44%,rgba(4,6,13,.62),rgba(4,6,13,.24) 58%,transparent 78%);
}
html[data-theme="light"] .hero-rings.ready{opacity:.5}
html[data-theme="light"] .hero-rings::after{
  background:radial-gradient(ellipse 40% 35% at 50% 44%,rgba(247,249,254,.74),rgba(247,249,254,.34) 58%,transparent 78%);
}
/* the old orbs would double up with the rings */
.orb-1,.orb-2{opacity:.1}
@media(max-width:760px){.hero-rings{display:none}.orb-1,.orb-2{opacity:.5}}
@media (prefers-reduced-motion:reduce){.hero-rings{display:none}.orb-1,.orb-2{opacity:.5}}
"""

JS_BLOCK = '''
  ''' + JS_MARK + '''
  (function(){
    var host = document.getElementById('heroRings');
    if(!host) return;
    function init(){
      if(!window.HephoraMagicRings){
        console.warn('[hero] magic-rings.js did not load — hero background skipped');
        return;
      }
      var rings = window.HephoraMagicRings(host, {
      color:        '#1E5FFF',   // brand blue — inner rings
      colorTwo:     '#8FB4FF',   // pale blue  — outer rings
      ringCount:    6,
      speed:        0.85,
      attenuation:  11,
      lineThickness:2,
      baseRadius:   0.28,
      radiusStep:   0.10,
      scaleRate:    0.09,
      opacity:      1,
      noiseAmount:  0.08,
      rotation:     0,
      ringGap:      1.5,
      followMouse:  true,
      mouseInfluence: 0.12,
      hoverScale:   1.06,
        parallax:     0.03
      });
      // hold the shader still while the theme wave sweeps — a canvas that
      // repaints during a View Transition invalidates the snapshot every frame
      if(rings){
        addEventListener('ht:freeze', rings.pause);
        addEventListener('ht:thaw',   rings.play);
      }
    }
    // run now if the library is already there, otherwise wait for load
    if(window.HephoraMagicRings) init(); else addEventListener('load', init);
  })();
'''


def strip(text, mark):
    i = text.find(mark)
    return text if i == -1 else text[:i].rstrip() + "\n"


def main():
    # ── html ──
    src = open(IDX, encoding="utf-8").read()
    src = re.sub(r'\n\s*<div class="hero-(?:aurora|lottie)"[^>]*></div>', "", src)
    src = src.replace('<script src="assets/aurora.js" defer></script>\n', "")
    if 'id="heroRings"' not in src:
        if not os.path.exists(IDX + ".rings.bak"):
            shutil.copy(IDX, IDX + ".rings.bak")
        if ANCHOR not in src:
            raise SystemExit("Could not find the hero section")
        src = src.replace(ANCHOR, HTML, 1)
        print("  ✓ index.html: rings container added")
    if "assets/magic-rings.js" not in src:
        src = src.replace('<script src="assets/xtract.js"',
                          '<script src="assets/magic-rings.js"></script>\n<script src="assets/xtract.js"', 1)
        print("  ✓ index.html: magic-rings.js linked")
    open(IDX, "w", encoding="utf-8").write(src)

    # ── css ──
    css = open(CSS, encoding="utf-8").read()
    for m in ("/* ═══ HERO AURORA ═══ */", "/* ═══ HERO LOTTIE ═══ */", MARK):
        css = strip(css, m)
    open(CSS, "w", encoding="utf-8").write(css.rstrip() + "\n\n" + CSS_BLOCK)
    print("  ✓ xtract.css updated")

    # ── js ── rebuild from the clean copy rather than cutting blocks out by hand
    js = open(JS, encoding="utf-8").read()
    if "hero aurora background" in js or "hero lottie background" in js:
        if not os.path.exists(CLEAN_JS):
            raise SystemExit("previous hero block present but no clean backup")
        js = open(CLEAN_JS, encoding="utf-8").read()
        print("  ✓ xtract.js: restored clean copy")
    if JS_MARK not in js:
        i = js.rstrip().rfind("})();")
        if i == -1:
            raise SystemExit("Could not find the end of the xtract.js IIFE")
        js = js[:i] + JS_BLOCK + "\n" + js[i:]
        print("  ✓ xtract.js: rings init added")
    open(JS, "w", encoding="utf-8").write(js)


if __name__ == "__main__":
    main()
