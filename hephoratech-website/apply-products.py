#!/usr/bin/env python3
"""Replaces the homepage products sticky-showcase with the v2 alternating
split-row layout (copy one side, illustration the other).
Run:  python apply-products.py
"""
import os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
IDX = os.path.join(HERE, "index.html")
CSS = os.path.join(HERE, "assets", "xtract.css")
MARK = "/* ═══ PRODUCTS SPLIT (v2 layout) ═══ */"

PRODUCTS = [
    dict(
        n="01", chip="In development", live=False,
        title="HephoraTech School Manager",
        href="product-school-manager.html", img="assets/ill/school.svg",
        p="A complete school management platform &mdash; admissions to alumni, fees to gradebooks &mdash; all in one system instead of five. Every record lives in one place, so staff, teachers and management always see the same up-to-date picture.",
        tags=["Admissions", "Fees", "Attendance", "Gradebooks"],
        ico='<svg viewBox="0 0 24 24"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/></svg>'),
    dict(
        n="02", chip="Live &middot; on Google Play", live=True,
        title="Custom Food Delivery App",
        href="product-food-delivery.html", img="assets/ill/food.svg",
        p="A complete ordering and delivery platform built for your brand &mdash; customer app, restaurant dashboard, live rider tracking and payments in one system instead of stitched-together tools.",
        tags=["Customer App", "Cloud Kitchen Ready", "Live Tracking", "On Google Play"],
        ico='<svg viewBox="0 0 24 24"><path d="M3 11h18M5 11V8a7 7 0 0114 0v3"/><path d="M4 15h16a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M12 4V2"/></svg>'),
]


def build_html():
    rows = ""
    for i, p in enumerate(PRODUCTS):
        flip = " flip" if i % 2 else ""
        tags = "".join(f"<span>{t}</span>" for t in p["tags"])
        live = " is-live" if p["live"] else ""
        rows += f'''
      <div class="p2row{flip}">
        <div class="p2-txt rv">
          <div class="p2-top">
            <div class="p2-ico">{p['ico']}</div>
            <span class="p2-chip{live}">{p['chip']}</span>
          </div>
          <h3>{p['title']}</h3>
          <p>{p['p']}</p>
          <div class="p2-tags">{tags}</div>
          <a href="{p['href']}" class="btn btn-primary mag p2-btn"><span>Explore Product</span><span class="btn-ico"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
        </div>
        <div class="p2-art rv rv-scale">
          <span class="p2-n">{p['n']}</span>
          <img class="art-dark" src="{p['img'].replace('.svg','-dark.svg')}" alt="{p['title']}" loading="lazy">
          <img class="art-light" src="{p['img']}" alt="{p['title']}" loading="lazy">
        </div>
      </div>'''
    return f'''<div class="p2wrap">{rows}
    </div>'''


CSS_BLOCK = MARK + '''
.p2wrap{display:flex;flex-direction:column;gap:64px;margin-top:8px}
.p2row{display:grid;grid-template-columns:1fr 1.05fr;gap:52px;align-items:center}
.p2row.flip .p2-txt{order:2}
.p2-top{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.p2-ico{
  width:46px;height:46px;border-radius:13px;flex-shrink:0;display:grid;place-items:center;
  background:var(--pur-soft);border:1px solid rgba(30,95,255,.28);
}
.p2-ico svg{width:21px;height:21px;fill:none;stroke:var(--pur-2);stroke-width:1.9;
  stroke-linecap:round;stroke-linejoin:round}
.p2-chip{
  font-size:.68rem;font-weight:700;letter-spacing:.11em;text-transform:uppercase;
  color:var(--pur-3);padding:6px 13px;border-radius:100px;
  background:var(--pur-soft);border:1px solid rgba(30,95,255,.3);
}
.p2-chip.is-live{color:#4ade80;background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.32)}
.p2-txt h3{font-size:clamp(1.5rem,2.7vw,2.15rem);letter-spacing:-.028em;line-height:1.1;
  color:var(--text);margin:0 0 14px}
.p2-txt p{color:var(--muted);font-size:.97rem;line-height:1.68;margin:0;max-width:52ch}
.p2-tags{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 26px}
.p2-tags span{
  font-size:.72rem;font-weight:600;color:var(--muted);padding:7px 13px;border-radius:100px;
  background:var(--w04);border:1px solid var(--line);
}
.p2-art{
  position:relative;border-radius:24px;overflow:hidden;border:1px solid var(--line);
  background:#0d1424;box-shadow:0 30px 70px -36px rgba(0,0,0,.8);
  transition:transform .8s var(--ease),box-shadow .6s var(--ease),background .4s;
}
.p2-art:hover{transform:translateY(-6px);box-shadow:0 46px 90px -40px rgba(0,0,0,.9),0 0 34px rgba(30,95,255,.14)}
.p2-art img{width:100%;height:auto;display:block;transition:transform 1.4s var(--ease)}
.p2-art:hover img{transform:scale(1.035)}
/* dark is the default theme — swap the artwork with it */
.p2-art .art-light{display:none}
.p2-art .art-dark{display:block}
html[data-theme="light"] .p2-art{background:#eef3ff}
html[data-theme="light"] .p2-art .art-light{display:block}
html[data-theme="light"] .p2-art .art-dark{display:none}
.p2-n{
  position:absolute;top:16px;left:20px;z-index:2;font-family:var(--head);
  font-size:.76rem;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.3);
}
html[data-theme="light"] .p2-n{color:rgba(13,19,34,.32)}
.p2-btn{align-self:flex-start}
html[data-theme="light"] .p2-art{box-shadow:0 30px 70px -40px rgba(15,35,80,.45)}
html[data-theme="light"] .p2-tags span{background:rgba(15,35,80,.04)}
@media(max-width:900px){
  .p2wrap{gap:44px}
  .p2row{grid-template-columns:1fr;gap:26px}
  .p2row.flip .p2-txt{order:0}
  .p2-txt p{max-width:none}
}
'''


def main():
    src = open(IDX, encoding="utf-8").read()
    start = src.find('<div class="ss-lead rv">')
    if start == -1:
        if 'class="p2wrap"' in src:
            print("index.html already converted — skipping HTML step.")
        else:
            raise SystemExit("Could not find the products showcase in index.html")
    else:
        endmark = '\n    </div>\n  </div>\n</section>'
        end = src.find(endmark, start)
        if end == -1:
            raise SystemExit("Could not find the end of the products section")
        shutil.copy(IDX, IDX + ".products.bak")
        src = src[:start] + build_html() + src[end + len('\n    </div>'):]
        open(IDX, "w", encoding="utf-8").write(src)
        print("index.html: products sticky → v2 split rows  (backup at index.html.products.bak)")

    css = open(CSS, encoding="utf-8").read()
    if MARK in css:
        css = css[:css.find(MARK)].rstrip() + "\n\n"
        print("assets/xtract.css: refreshed existing products CSS")
    else:
        css = css.rstrip() + "\n\n"
        print("assets/xtract.css: products CSS appended")
    open(CSS, "w", encoding="utf-8").write(css + CSS_BLOCK)


if __name__ == "__main__":
    main()
