#!/usr/bin/env python3
"""Performance pass for the HephoraTech site.

Fixes, in order of impact:

  1. IMAGES  — six 1152x864 JPEGs (1.9 MB) were loaded as CSS backgrounds on the
     homepage. Resized to display size and re-encoded progressive. Same filenames,
     so no markup changes.

  2. ORB DRIFT — the cursor-drift loop wrote marginLeft/marginTop every frame on
     elements carrying filter:blur(90px). Margin triggers LAYOUT, so every frame
     cost a full reflow plus a 90px gaussian blur repaint, forever, even idle.
     Now uses the independent `translate` property (compositor-only, and it does
     not clash with the keyframes' `transform`), and the loop halts once settled.

  3. STARFIELD — an uncapped rAF loop clearing a devicePixelRatio-scaled canvas
     (7.2M px on a 2x 1080p screen) forever, even scrolled past or tab hidden.
     Now DPR-capped, pauses off-screen and when the tab is hidden.

  4. CSS — smaller blur radii, off-screen sections skipped via content-visibility,
     and paint containment on cards.

Run:  python optimize-perf.py
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
JS = os.path.join(HERE, "assets", "xtract.js")
CSS = os.path.join(HERE, "assets", "xtract.css")
IMG = os.path.join(HERE, "assets", "services")
MARK = "/* ═══ PERF PASS ═══ */"


# ───────────────────────── 1. images ─────────────────────────
def optimise_images():
    try:
        from PIL import Image
    except ImportError:
        print("  ! Pillow not available — skipping image step")
        return
    total_before = total_after = 0
    for name in sorted(os.listdir(IMG)):
        if not name.lower().endswith((".jpg", ".jpeg")):
            continue
        p = os.path.join(IMG, name)
        before = os.path.getsize(p)
        if before < 160_000:                      # already optimised
            total_before += before; total_after += before
            continue
        bak = p + ".orig"
        if not os.path.exists(bak):
            shutil.copy(p, bak)
        im = Image.open(bak).convert("RGB")
        im.thumbnail((900, 900), Image.LANCZOS)   # cards render ≤780px wide
        im.save(p, "JPEG", quality=70, optimize=True, progressive=True)
        after = os.path.getsize(p)
        total_before += before; total_after += after
        print(f"  {name:22s} {before/1024:6.1f} KB → {after/1024:6.1f} KB  ({im.size[0]}x{im.size[1]})")
    if total_before:
        print(f"  {'TOTAL':22s} {total_before/1024:6.1f} KB → {total_after/1024:6.1f} KB "
              f"({100 - total_after/total_before*100:.0f}% smaller)")


# ───────────────────────── 2 + 3. javascript ─────────────────────────
ORB_OLD = """  const orbs = [...document.querySelectorAll('.orb')];
  if(orbs.length){
    let ox=0, oy=0, txo=0, tyo=0;
    addEventListener('mousemove', e=>{
      txo = (e.clientX/innerWidth - .5); tyo = (e.clientY/innerHeight - .5);
    }, {passive:true});
    (function drift(){
      ox += (txo-ox)*.04; oy += (tyo-oy)*.04;
      orbs.forEach((o,i)=>{
        const k = (i+1)*16;
        o.style.marginLeft = (ox*k).toFixed(1)+'px';
        o.style.marginTop  = (oy*k).toFixed(1)+'px';
      });
      requestAnimationFrame(drift);
    })();
  }"""

ORB_NEW = """  const orbs = [...document.querySelectorAll('.orb')];
  const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(orbs.length && !noMotion && matchMedia('(hover:hover)').matches){
    let ox=0, oy=0, txo=0, tyo=0, orbRaf=0;
    // `translate` is its own property: compositor-only, and it does NOT fight
    // the keyframes' `transform`. Writing margin here used to force a layout
    // + a 90px blur repaint on every single frame.
    const drift = () => {
      ox += (txo-ox)*.06; oy += (tyo-oy)*.06;
      for(let i=0;i<orbs.length;i++){
        const k = (i+1)*16;
        orbs[i].style.translate = (ox*k).toFixed(1)+'px '+(oy*k).toFixed(1)+'px';
      }
      // stop once it has settled — no idle rAF burning frames
      orbRaf = (Math.abs(txo-ox) > .001 || Math.abs(tyo-oy) > .001)
        ? requestAnimationFrame(drift) : 0;
    };
    addEventListener('mousemove', e=>{
      txo = (e.clientX/innerWidth - .5); tyo = (e.clientY/innerHeight - .5);
      if(!orbRaf && !document.hidden) orbRaf = requestAnimationFrame(drift);
    }, {passive:true});
    addEventListener('visibilitychange', ()=>{
      if(document.hidden && orbRaf){ cancelAnimationFrame(orbRaf); orbRaf = 0; }
    });
  }"""

STAR_RESIZE_OLD = """    function resize(){
      w = cv.width = innerWidth * devicePixelRatio;
      h = cv.height = (host.offsetHeight || 940) * devicePixelRatio;
      const n = Math.min(190, Math.floor(w*h/24000/devicePixelRatio));"""

STAR_RESIZE_NEW = """    // cap DPR: at 2x on a 1080p screen the old canvas was ~7.2M pixels,
    // cleared and repainted every frame
    const DPR = Math.min(devicePixelRatio || 1, 1.5);
    function resize(){
      w = cv.width = innerWidth * DPR;
      h = cv.height = (host.offsetHeight || 940) * DPR;
      const n = Math.min(120, Math.floor(w*h/26000/DPR));"""

STAR_DRAW_OLD = """    function draw(){
      ctx.clearRect(0,0,w,h);
      for(const st of stars){
        st.a += st.s; const al = .35 + Math.abs(Math.sin(st.a))*.6;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fillStyle = `rgba(${starRGB},${al})`; ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    resize(); draw();"""

STAR_DRAW_NEW = """    let starRaf = 0, onScreen = true;
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(const st of stars){
        st.a += st.s; const al = .35 + Math.abs(Math.sin(st.a))*.6;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7);
        ctx.fillStyle = `rgba(${starRGB},${al})`; ctx.fill();
      }
      starRaf = requestAnimationFrame(draw);
    }
    const startStars = () => {
      if(!starRaf && onScreen && !document.hidden
         && !matchMedia('(prefers-reduced-motion: reduce)').matches)
        starRaf = requestAnimationFrame(draw);
    };
    const stopStars = () => { if(starRaf){ cancelAnimationFrame(starRaf); starRaf = 0; } };
    // don't paint a canvas nobody can see
    new IntersectionObserver(es => {
      onScreen = es[0].isIntersecting;
      onScreen ? startStars() : stopStars();
    }, {threshold:0}).observe(host);
    addEventListener('visibilitychange', ()=> document.hidden ? stopStars() : startStars());
    resize(); startStars();"""

PAR_OLD = """    const state = pars.map(()=>({cur:0, tgt:0}));
    (function par(){
      for(let i=0;i<pars.length;i++){
        const el = pars[i], st = state[i];
        const r = el.getBoundingClientRect();
        if(r.bottom > -240 && r.top < innerHeight + 240){
          st.tgt = -(r.top + r.height/2 - innerHeight/2) * parseFloat(el.dataset.par || .05);
        }
        st.cur += (st.tgt - st.cur) * .08;          // damping
        if(Math.abs(st.tgt - st.cur) > .05)
          el.style.transform = `translate3d(0,${st.cur.toFixed(2)}px,0)`;
      }
      requestAnimationFrame(par);
    })();"""

PAR_NEW = """    const state = pars.map(()=>({cur:0, tgt:0}));
    const amt = pars.map(el => parseFloat(el.dataset.par || .05));
    let parRaf = 0, parIdle = 0;
    // Read ALL rects first, then write ALL transforms. Interleaving read/write
    // in one loop forced a synchronous layout per element, per frame.
    const par = () => {
      const vh = innerHeight, rects = [];
      for(let i=0;i<pars.length;i++) rects.push(pars[i].getBoundingClientRect());
      let moving = false;
      for(let i=0;i<pars.length;i++){
        const st = state[i], r = rects[i];
        if(r.bottom > -240 && r.top < vh + 240)
          st.tgt = -(r.top + r.height/2 - vh/2) * amt[i];
        st.cur += (st.tgt - st.cur) * .08;
        if(Math.abs(st.tgt - st.cur) > .05){
          pars[i].style.transform = `translate3d(0,${st.cur.toFixed(2)}px,0)`;
          moving = true;
        }
      }
      // idle for ~half a second with nothing moving → stop until the next scroll
      parIdle = moving ? 0 : parIdle + 1;
      parRaf = (parIdle > 30 || document.hidden) ? 0 : requestAnimationFrame(par);
    };
    const kickPar = () => { parIdle = 0; if(!parRaf && !document.hidden) parRaf = requestAnimationFrame(par); };
    addEventListener('scroll', kickPar, {passive:true});
    addEventListener('resize', kickPar, {passive:true});
    addEventListener('visibilitychange', ()=>{
      if(document.hidden){ if(parRaf){ cancelAnimationFrame(parRaf); parRaf = 0; } } else kickPar();
    });
    kickPar();"""

JS_PATCHES = [
    ("parallax → batched reads/writes + halts when idle", PAR_OLD, PAR_NEW),
    ("orb cursor drift → compositor-only + self-halting", ORB_OLD, ORB_NEW),
    ("starfield → DPR-capped", STAR_RESIZE_OLD, STAR_RESIZE_NEW),
    ("starfield → pauses off-screen / tab hidden", STAR_DRAW_OLD, STAR_DRAW_NEW),
]


# ───────────────────────── 4. css ─────────────────────────
CSS_BLOCK = MARK + """
/* Smaller blur radius — gaussian blur cost scales with radius, and at this
   size 60px is visually indistinguishable from 90px. */
.orb{filter:blur(60px);will-change:translate}
.orb-1{width:520px;height:400px}
.orb-2{width:430px;height:320px}

/* Skip rendering work for sections that are off-screen. `auto` in
   contain-intrinsic-size makes the browser remember each section's real height
   after first paint, so the scrollbar doesn't jump around. */
#services,#products,#process,footer{content-visibility:auto;contain-intrinsic-size:auto 900px}

/* Card artwork is decorative and clipped — contain its paint so a hover
   repaint can't invalidate the rest of the page. */
.sb-card,.p2-art{contain:paint}
.sb-art{will-change:transform}

/* The nav is the only backdrop-filter that stays on screen while scrolling;
   promote it so it isn't re-rasterised each frame. */
.nav-in{will-change:max-width,padding}

@media (prefers-reduced-motion:reduce){
  .orb-1,.orb-2{animation:none!important}
}
"""


def patch_js():
    src = open(JS, encoding="utf-8").read()
    if not os.path.exists(JS + ".perf.bak"):
        shutil.copy(JS, JS + ".perf.bak")
    applied = 0
    for label, old, new in JS_PATCHES:
        if new.split("\n")[0].strip() in src and old not in src:
            print(f"  · already applied: {label}")
            continue
        if old not in src:
            print(f"  ! could not find target for: {label}")
            continue
        src = src.replace(old, new, 1)
        applied += 1
        print(f"  ✓ {label}")
    open(JS, "w", encoding="utf-8").write(src)
    return applied


def patch_css():
    css = open(CSS, encoding="utf-8").read()
    if MARK in css:
        css = css[:css.find(MARK)].rstrip() + "\n\n"
        print("  ✓ refreshed perf CSS")
    else:
        if not os.path.exists(CSS + ".perf.bak"):
            shutil.copy(CSS, CSS + ".perf.bak")
        css = css.rstrip() + "\n\n"
        print("  ✓ appended perf CSS")
    open(CSS, "w", encoding="utf-8").write(css + CSS_BLOCK)


if __name__ == "__main__":
    print("1. images"); optimise_images()
    print("2/3. javascript"); patch_js()
    print("4. css"); patch_css()
    print("done.")
