#!/usr/bin/env python3
"""Replaces the homepage services 'branch tree' with the v2 bento card grid,
and appends the matching CSS to assets/xtract.css.  Safe to re-run.
Run:  python apply-bento.py
"""
import os, re, shutil, json

HERE = os.path.dirname(os.path.abspath(__file__))
IDX = os.path.join(HERE, "index.html")
CSS = os.path.join(HERE, "assets", "xtract.css")
JS = os.path.join(HERE, "assets", "xtract.js")
MARK = "/* ═══ SERVICES BENTO (v2 layout) ═══ */"
ENDMARK = "/* ═══ END SERVICES BENTO ═══ */"
ANIM_JS_MARK = "/* ---- service card lottie panels ---- */"


def replace_block(css, mark, endmark, block):
    """Swap out only this script's own block.

    The old code did `css[:css.find(mark)]`, which truncated the stylesheet at
    the marker — silently deleting every block appended *after* it (products,
    perf, legal, hero rings). That's how the hero lost `position:absolute` and
    its canvas started growing without bound.
    """
    i = css.find(mark)
    if i == -1:                                   # first run — append
        return css.rstrip() + "\n\n" + block
    j = css.find(endmark, i)
    if j == -1:                                   # legacy block, ran to EOF
        return css[:i].rstrip() + "\n\n" + block
    return css[:i].rstrip() + "\n\n" + block + css[j + len(endmark):]

SERVICES = [
    dict(n="01", label="Web &amp; App Development", h3="Build fast, scalable products",
         href="service-web-development.html", img="assets/services/svc-web.jpg", span=4,
         p="Custom websites, web applications and mobile apps built for speed, scale and conversion — from first wireframe through to production deploy.",
         tags=["Websites", "Web Apps", "iOS &amp; Android"],
         ico='<svg viewBox="0 0 24 24"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>'),
    dict(n="02", label="E-Commerce", h3="Sell across every platform",
         href="service-ecommerce.html", img="assets/services/svc-ecom.jpg", span=2,
         p="Shopify stores, Amazon storefronts and multi-platform commerce that converts.",
         tags=["Shopify", "Amazon", "WooCommerce"],
         ico='<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/></svg>'),
    dict(n="03", label="SEO &amp; Optimization", h3="Rank higher, load faster",
         href="service-seo.html", img="assets/services/svc-seo.jpg", span=2,
         p="Technical SEO and rebuilds of existing sites for speed and ranking.",
         tags=["Technical SEO", "Site Speed", "Audits"],
         ico='<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v6h-6"/></svg>'),
    dict(n="04", label="Automation &amp; AI", h3="Automate repetitive work",
         href="service-automation-ai.html", img="assets/services/svc-automation.jpg", span=4,
         p="Workflow automation and AI widgets embedded into your site or product, so the repetitive work runs itself.",
         tags=["AI Widgets", "Workflows", "Chatbots"],
         ico='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 10v6M4.2 4.2l4.3 4.3m7 7l4.3 4.3M1 12h6m10 0h6M4.2 19.8l4.3-4.3m7-7l4.3-4.3"/></svg>'),
    dict(n="05", label="Social Media &amp; Ads", h3="Grow reach that converts",
         href="service-social-media.html", img="assets/services/svc-social.jpg", span=3,
         p="Post creation, content calendars and paid campaigns on Meta platforms.",
         tags=["Post Creation", "Meta Ads", "Creative"],
         ico='<svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6z"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>'),
    dict(n="06", label="SaaS Product Builds", h3="Ship your own platform",
         href="service-saas.html", img="assets/services/svc-saas.jpg", span=3,
         p="End-to-end SaaS — architecture, UI, deployment and the ongoing support behind it.",
         tags=["Architecture", "UI/UX", "Cloud"],
         ico='<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>'),
]


def build_html():
    cards = ""
    for i, s in enumerate(SERVICES):
        wide = " wide" if s["span"] >= 4 else ""
        tags = "".join(f"<span>{t}</span>" for t in s["tags"])
        delay = f" rv-d{min(i,5)}" if i else ""   # v1 defines rv-d1 … rv-d5
        # An animated SVG has to be a real element, not a background-image —
        # browsers run SMIL reliably in <img>, less so in background-image.
        if s["img"].endswith(".svg"):
            art = f'<img class="sb-art" src="{s["img"]}" alt="" aria-hidden="true" loading="lazy">'
        else:
            art = f'<span class="sb-art" style="background-image:url({s["img"]})" aria-hidden="true"></span>'
        cards += f'''
      <a href="{s['href']}" class="sb-card{wide} rv rv-scale{delay}" style="grid-column:span {s['span']}">
        {art}
        <span class="sb-num">{s['n']}</span>
        <div class="sb-body">
          <div class="sb-ico">{s['ico']}</div>
          <span class="sb-label">{s['label']}</span>
          <h3>{s['h3']}</h3>
          <div class="sb-foot">
            <div class="sb-tags">{tags}</div>
            <span class="sb-go">Explore <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>
      </a>'''
    return f'''<div class="sbento">{cards}
    </div>'''


CSS_BLOCK = MARK + '''
.sbento{display:grid;grid-template-columns:repeat(6,1fr);gap:18px;margin-top:6px}
.sb-card{
  position:relative;display:flex;flex-direction:column;justify-content:flex-end;
  min-height:282px;padding:28px;border-radius:22px;overflow:hidden;isolation:isolate;
  background:#0B0F1A;border:1px solid var(--line);
  box-shadow:0 26px 60px -34px rgba(0,0,0,.85);
  transition:transform .7s var(--ease),box-shadow .6s var(--ease),border-color .45s;
}
.sb-card.wide{min-height:312px}
.sb-card:hover{transform:translateY(-7px);border-color:rgba(30,95,255,.4);
  box-shadow:0 44px 90px -40px rgba(0,0,0,.95),0 0 34px rgba(30,95,255,.14)}
.sb-art{
  position:absolute;inset:0;z-index:-2;background-size:cover;background-position:center;
  opacity:.66;transition:transform 1.5s var(--ease),opacity .6s var(--ease);
}
.sb-card:hover .sb-art{transform:scale(1.07);opacity:.8}
/* the SVG variant is an <img>, so it needs object-fit to behave like the
   background-image photos do — same box, same crop, card size unchanged */
img.sb-art{width:100%;height:100%;object-fit:cover;object-position:center}
.sb-card::after{
  content:'';position:absolute;inset:0;z-index:-1;
  background:linear-gradient(180deg,rgba(4,6,13,.12) 0%,rgba(4,6,13,.72) 50%,rgba(4,6,13,.96) 100%);
}
.sb-num{
  position:absolute;top:22px;right:26px;font-family:var(--head);font-size:.78rem;font-weight:700;
  letter-spacing:.12em;color:rgba(255,255,255,.36);
}
.sb-ico{
  width:46px;height:46px;border-radius:13px;display:grid;place-items:center;margin-bottom:15px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
  backdrop-filter:blur(8px);transition:transform .6s cubic-bezier(.34,1.4,.5,1),background .4s;
}
.sb-ico svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:2;
  stroke-linecap:round;stroke-linejoin:round}
.sb-card:hover .sb-ico{transform:scale(1.08) rotate(-5deg);background:rgba(30,95,255,.45)}
.sb-label{
  display:block;font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;
  color:var(--pur-3);margin-bottom:8px;
}
.sb-card h3{color:#fff;font-size:1.36rem;letter-spacing:-.02em;line-height:1.16;margin:0}
.sb-card.wide h3{font-size:1.62rem}
.sb-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;
  flex-wrap:wrap;margin-top:20px}
.sb-tags{display:flex;gap:7px;flex-wrap:wrap}
.sb-tags span{
  font-size:.68rem;font-weight:600;letter-spacing:.03em;color:rgba(255,255,255,.72);
  padding:5px 11px;border-radius:100px;background:rgba(255,255,255,.09);
  border:1px solid rgba(255,255,255,.13);
}
.sb-go{display:inline-flex;align-items:center;gap:7px;color:#fff;font-family:var(--head);
  font-size:.83rem;font-weight:700;opacity:.9;transition:gap .45s var(--ease),opacity .3s}
.sb-go svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.3;
  stroke-linecap:round;stroke-linejoin:round}
.sb-card:hover .sb-go{gap:12px;opacity:1}
html[data-theme="light"] .sb-card{border-color:rgba(15,35,80,.1);
  box-shadow:0 26px 60px -36px rgba(15,35,80,.5)}
html[data-theme="light"] .sb-card:hover{box-shadow:0 44px 90px -42px rgba(15,35,80,.55),0 0 30px rgba(30,95,255,.12)}
@media(max-width:1000px){
  .sbento{grid-template-columns:repeat(2,1fr)}
  .sb-card,.sb-card.wide{grid-column:span 1!important;min-height:300px}
}
/* ═══ SERVICE CARD MOTION ═══ */
/* The artwork drifts very slowly so the cards feel alive at rest. `scale` and
   `translate` are separate properties from `transform`, so the idle drift and
   the hover scale compose instead of fighting each other. */
.sb-art{
  animation:sbDrift 34s ease-in-out infinite alternate;
  will-change:scale,translate;
}
@keyframes sbDrift{
  from{scale:1.02;translate:0 0}
  to{scale:1.13;translate:-2.5% -2%}
}
/* different durations + directions so the six never move in lockstep */
.sb-card:nth-child(2) .sb-art{animation-duration:29s;animation-direction:alternate-reverse}
.sb-card:nth-child(3) .sb-art{animation-duration:41s}
.sb-card:nth-child(4) .sb-art{animation-duration:36s;animation-direction:alternate-reverse}
.sb-card:nth-child(5) .sb-art{animation-duration:31s}
.sb-card:nth-child(6) .sb-art{animation-duration:44s;animation-direction:alternate-reverse}

/* a light sweep that crosses the card on hover */
.sb-card::before{
  content:'';position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(105deg,transparent 38%,rgba(140,180,255,.13) 48%,
             rgba(190,215,255,.2) 52%,rgba(140,180,255,.13) 56%,transparent 66%);
  transform:translateX(-130%);
  transition:transform 1.1s cubic-bezier(.22,1,.36,1);
}
.sb-card:hover::before{transform:translateX(130%)}

/* the artwork brightens and the blue lifts as you hover */
.sb-card:hover .sb-art{opacity:.9;filter:saturate(1.15) brightness(1.06)}
.sb-art{filter:saturate(1) brightness(1);transition:transform 1.5s var(--ease),opacity .6s var(--ease),filter .6s var(--ease)}

@media (prefers-reduced-motion:reduce){
  .sb-art{animation:none}
  .sb-card::before{display:none}
}
@media(max-width:640px){
  .sbento{grid-template-columns:1fr;gap:16px}
  .sb-card{padding:24px;min-height:280px}
  .sb-card h3,.sb-card.wide h3{font-size:1.28rem}
}
''' + ENDMARK + "\n"


def main():
    src = open(IDX, encoding="utf-8").read()
    start = src.find('<div class="tree" id="svcTree">')
    if start != -1:
        endmark = '\n    </div>\n  </div>\n</section>'
        end = src.find(endmark, start)
        if end == -1:
            raise SystemExit("Could not find the end of the services tree")
        shutil.copy(IDX, IDX + ".bak")
        src = src[:start] + build_html() + src[end + len('\n    </div>'):]
        open(IDX, "w", encoding="utf-8").write(src)
        print("index.html: tree → bento  (backup at index.html.bak)")
    else:
        # already converted at least once — regenerate the card markup in
        # place so re-running picks up SERVICES changes (e.g. a new `anim`)
        start = src.find('<div class="sbento">')
        if start == -1:
            raise SystemExit("Could not find the services tree or the bento grid in index.html")
        endmark = '\n    </div>\n  </div>\n</section>'
        end = src.find(endmark, start)
        if end == -1:
            raise SystemExit("Could not find the end of the bento grid")
        if not os.path.exists(IDX + ".bak"):
            shutil.copy(IDX, IDX + ".bak")
        src = src[:start] + build_html() + src[end + len('\n    </div>'):]
        open(IDX, "w", encoding="utf-8").write(src)
        print("index.html: bento cards regenerated")

    css = open(CSS, encoding="utf-8").read()
    if MARK not in css and not os.path.exists(CSS + ".bak"):
        shutil.copy(CSS, CSS + ".bak")
    open(CSS, "w", encoding="utf-8").write(replace_block(css, MARK, ENDMARK, CSS_BLOCK))
    print("assets/xtract.css: bento CSS written (later blocks preserved)")

    # ── js: drop the lottie-panel wiring, back to the plain photo cards ──
    js = open(JS, encoding="utf-8").read()
    if ANIM_JS_MARK in js:
        tail_at = js.rstrip().rfind("})();")
        mark_at = js.find(ANIM_JS_MARK)
        js = js[:mark_at].rstrip() + "\n" + js[tail_at:]
        open(JS, "w", encoding="utf-8").write(js)
        print("assets/xtract.js: anim-panel wiring removed")


if __name__ == "__main__":
    main()
