#!/usr/bin/env python3
"""Replaces the homepage services 'branch tree' with the v2 bento card grid,
and appends the matching CSS to assets/xtract.css.  Safe to re-run.
Run:  python apply-bento.py
"""
import os, re, shutil, json

HERE = os.path.dirname(os.path.abspath(__file__))
IDX = os.path.join(HERE, "index.html")
CSS = os.path.join(HERE, "assets", "xtract.css")
MARK = "/* ═══ SERVICES BENTO (v2 layout) ═══ */"

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
        cards += f'''
      <a href="{s['href']}" class="sb-card{wide} rv rv-scale{delay}" style="grid-column:span {s['span']}">
        <span class="sb-art" style="background-image:url({s['img']})" aria-hidden="true"></span>
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
@media(max-width:640px){
  .sbento{grid-template-columns:1fr;gap:16px}
  .sb-card{padding:24px;min-height:280px}
  .sb-card h3,.sb-card.wide h3{font-size:1.28rem}
}
'''


def main():
    src = open(IDX, encoding="utf-8").read()
    start = src.find('<div class="tree" id="svcTree">')
    if start == -1:
        if 'class="sbento"' in src:
            print("index.html already converted — skipping HTML step.")
        else:
            raise SystemExit("Could not find the services tree in index.html")
    else:
        endmark = '\n    </div>\n  </div>\n</section>'
        end = src.find(endmark, start)
        if end == -1:
            raise SystemExit("Could not find the end of the services tree")
        shutil.copy(IDX, IDX + ".bak")
        src = src[:start] + build_html() + src[end + len('\n    </div>'):]
        open(IDX, "w", encoding="utf-8").write(src)
        print("index.html: tree → bento  (backup at index.html.bak)")

    css = open(CSS, encoding="utf-8").read()
    if MARK in css:
        css = css[:css.find(MARK)].rstrip() + "\n\n"
        print("assets/xtract.css: refreshed existing bento CSS")
    else:
        shutil.copy(CSS, CSS + ".bak")
        css = css.rstrip() + "\n\n"
        print("assets/xtract.css: bento CSS appended  (backup at xtract.css.bak)")
    open(CSS, "w", encoding="utf-8").write(css + CSS_BLOCK)


if __name__ == "__main__":
    main()
