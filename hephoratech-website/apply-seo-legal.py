#!/usr/bin/env python3
"""SEO corrections + legal pages.

  1. Canonical tag on every page (pointing at the clean URL)
  2. Internal .html links rewritten to clean URLs (no more redirect hop)
  3. og:url / twitter URLs corrected to the clean URL
  4. Organization + LocalBusiness + WebSite JSON-LD on the homepage
  5. Terms & Conditions and Privacy Policy pages, linked from the footer
     and added to sitemap.xml

Run:  python apply-seo-legal.py
"""
import os, re, glob, shutil, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://hephoratech.com"
EMAIL = "info@hephoratech.com"
PHONE = "+91 99942 29860"
TEL = "+919994229860"
UPDATED = datetime.date.today().strftime("%d %B %Y")

SKIP = {"index-classic.html"}


def clean_url(fname):
    return "/" if fname == "index.html" else "/" + fname[:-5]


# ───────────────────────── legal page content ─────────────────────────
TERMS_BODY = f"""
<section class="page-hero">
  <div class="wrap">
    <span class="pill-label">Legal</span>
    <h1>Terms &amp; Conditions</h1>
    <p class="lead">The terms that apply when you engage HephoraTech for design, development or marketing work.</p>
    <p class="legal-meta">Last updated {UPDATED}</p>
  </div>
</section>

<section class="alt">
  <div class="wrap legal">
    <h2>1. About these terms</h2>
    <p>These terms govern the services HephoraTech (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides to a client (&ldquo;you&rdquo;). They apply alongside any written proposal, quotation or statement of work we agree with you. Where a signed agreement conflicts with these terms, the signed agreement takes precedence.</p>

    <h2>2. Our services</h2>
    <p>We provide website and application development, e-commerce builds, search engine optimisation, automation and AI integration, social media and advertising services, and SaaS product development. The exact scope for your project is defined in the proposal or quotation we issue to you.</p>

    <h2>3. Quotes, scope and changes</h2>
    <p>Quotations are based on the requirements described to us at the time of quoting and remain valid for 30 days unless stated otherwise. Work outside the agreed scope &mdash; additional pages, features, revisions or integrations &mdash; will be quoted separately and only started once you approve it in writing.</p>

    <h2>4. Payment</h2>
    <p>Unless agreed otherwise in writing, projects are invoiced with an advance payment before work begins and the balance on completion, prior to final delivery or deployment. Longer projects may be billed against milestones. Invoices are payable within the period stated on the invoice. We may pause work on overdue accounts.</p>

    <h2>5. Your responsibilities</h2>
    <p>You agree to provide content, brand assets, access credentials, approvals and feedback within a reasonable time. Delays in providing these will move timelines accordingly. You confirm that any material you supply to us &mdash; text, images, logos, data &mdash; is either owned by you or licensed for the use intended, and does not infringe anyone else's rights.</p>

    <h2>6. Ownership and intellectual property</h2>
    <p>On receipt of full payment, ownership of the custom work produced specifically for your project transfers to you, including source code and design files created for that project. We retain ownership of our own pre-existing tools, libraries, frameworks and internal components, and grant you a perpetual, non-exclusive licence to use them as part of your delivered project. Third-party components remain subject to their own licences.</p>
    <p>Unless you ask us in writing not to, we may reference the project and display non-confidential visuals of it in our portfolio.</p>

    <h2>7. Third-party services</h2>
    <p>Projects commonly rely on third-party platforms &mdash; hosting, domains, payment gateways, email services, app stores, analytics and AI providers. Those services are governed by their own terms and pricing. We are not responsible for their availability, policy changes or fees, though we will help you work through any issues that arise.</p>

    <h2>8. Confidentiality</h2>
    <p>Each party agrees to keep the other's non-public business information confidential and to use it only for the purpose of the engagement. This obligation continues after the project ends.</p>

    <h2>9. Warranties and disclaimers</h2>
    <p>We will perform our services with reasonable skill and care. Following delivery, we will correct defects in our own work reported within the support window stated in your proposal, at no charge. That window does not cover new features, content changes, third-party platform changes, or issues caused by modifications made by you or another party.</p>
    <p>We do not guarantee specific commercial outcomes. In particular, search engine rankings, advertising performance, traffic volumes and revenue depend on factors outside our control, including search engine and platform algorithm changes and competitor activity.</p>

    <h2>10. Limitation of liability</h2>
    <p>To the extent permitted by law, our total liability arising from an engagement is limited to the fees you paid us for that engagement. We are not liable for indirect or consequential loss, including loss of profit, revenue, data or business opportunity. Nothing in these terms limits liability that cannot lawfully be limited.</p>

    <h2>11. Support and maintenance</h2>
    <p>Ongoing support, hosting management and maintenance are provided where they form part of your agreement or an active retainer. Support requests outside an active arrangement are billed at our standard rates.</p>

    <h2>12. Cancellation</h2>
    <p>Either party may end an engagement with written notice. If you cancel, you remain liable for work completed up to that point and for any third-party costs already committed on your behalf. Advance payments cover work already performed and are non-refundable to that extent.</p>

    <h2>13. Governing law</h2>
    <p>These terms are governed by the laws of India. The courts of Tiruppur, Tamil Nadu have exclusive jurisdiction over any dispute, without prejudice to your rights under applicable consumer law.</p>

    <h2>14. Changes to these terms</h2>
    <p>We may update these terms from time to time. The version published on this page at the date your engagement begins is the one that applies to it.</p>

    <h2>15. Contact</h2>
    <p>Questions about these terms can be sent to <a href="mailto:{EMAIL}">{EMAIL}</a> or {PHONE}. HephoraTech, Tiruppur, Tamil Nadu, India.</p>
  </div>
</section>
"""

PRIVACY_BODY = f"""
<section class="page-hero">
  <div class="wrap">
    <span class="pill-label">Legal</span>
    <h1>Privacy Policy</h1>
    <p class="lead">What information this website collects, why we collect it, and what we do with it.</p>
    <p class="legal-meta">Last updated {UPDATED}</p>
  </div>
</section>

<section class="alt">
  <div class="wrap legal">
    <h2>1. Who we are</h2>
    <p>HephoraTech is a digital product studio based in Tiruppur, Tamil Nadu, India. For anything relating to this policy or your data, contact <a href="mailto:{EMAIL}">{EMAIL}</a> or {PHONE}.</p>

    <h2>2. What we collect</h2>
    <p><strong>Information you give us.</strong> When you submit the contact form we collect your name, email address, phone number, the service you selected and the message you write. If you use the AI assistant on the site, we receive the messages you type into it and any contact details you choose to share there.</p>
    <p><strong>Information collected automatically.</strong> Like most websites, our hosting provider records standard technical data such as IP address, browser type, device type, pages visited and referring page. This is used for security and to understand how the site is used.</p>
    <p>We do not collect payment card details through this website, and we do not ask for sensitive personal information.</p>

    <h2>3. How we use it</h2>
    <p>We use the information to reply to your enquiry, prepare quotations, deliver and support services you engage us for, keep the site secure and working, and meet our legal and accounting obligations. We do not sell your personal information, and we do not use your enquiry details for unrelated marketing.</p>

    <h2>4. Service providers we use</h2>
    <p>Some of your information passes through third parties who help us operate the site:</p>
    <ul>
      <li><strong>Cloudflare</strong> &mdash; hosting and content delivery for this website.</li>
      <li><strong>Web3Forms</strong> &mdash; delivers contact form submissions to our inbox.</li>
      <li><strong>OpenAI</strong> &mdash; powers the AI assistant; messages you send to it are processed by their API to generate a reply.</li>
      <li><strong>Google Search Console</strong> &mdash; aggregated, non-identifying data about how the site performs in search.</li>
    </ul>
    <p>These providers process data on our behalf under their own privacy terms. We share information with them only as needed to run the site.</p>

    <h2>5. Cookies and local storage</h2>
    <p>This site does not use advertising or cross-site tracking cookies. It stores a small preference in your browser's local storage to remember your light or dark theme choice, and the AI assistant may use session storage to keep a conversation in one visit. You can clear these at any time through your browser settings.</p>

    <h2>6. How long we keep it</h2>
    <p>Enquiries are kept for as long as needed to respond and, where an engagement follows, for the duration of that engagement plus the period required for legal, tax and accounting purposes. Enquiries that do not lead to work are removed once they are no longer useful.</p>

    <h2>7. Your rights</h2>
    <p>You can ask us for a copy of the personal information we hold about you, ask us to correct it if it is wrong, or ask us to delete it where we have no ongoing need or legal obligation to keep it. Write to <a href="mailto:{EMAIL}">{EMAIL}</a> and we will respond within a reasonable period.</p>

    <h2>8. Security</h2>
    <p>The site is served over HTTPS and we take reasonable technical and organisational measures to protect the information we hold. No method of transmission or storage is completely secure, so we cannot guarantee absolute security. Please do not send passwords or sensitive credentials through the contact form or the AI assistant.</p>

    <h2>9. Children</h2>
    <p>This site is intended for businesses and is not directed at children. We do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.</p>

    <h2>10. External links</h2>
    <p>Our site may link to other websites and app store listings. We are not responsible for their content or privacy practices, and we encourage you to read their policies.</p>

    <h2>11. Changes to this policy</h2>
    <p>We may update this policy as the site or our services change. The revision date at the top of this page shows when it was last changed.</p>

    <h2>12. Contact</h2>
    <p>Questions or requests about your data: <a href="mailto:{EMAIL}">{EMAIL}</a> &middot; {PHONE} &middot; Tiruppur, Tamil Nadu, India.</p>
  </div>
</section>
"""

LEGAL_CSS = """
/* ═══ LEGAL PAGES ═══ */
.legal{max-width:820px}
.legal h2{font-size:1.18rem;font-weight:700;letter-spacing:-.02em;margin:36px 0 12px;color:var(--text)}
.legal h2:first-child{margin-top:0}
.legal p{color:var(--muted);font-size:.96rem;line-height:1.75;margin-bottom:14px}
.legal ul{margin:0 0 16px 20px;color:var(--muted);font-size:.96rem;line-height:1.75}
.legal li{margin-bottom:8px}
.legal a{color:var(--pur-2);text-decoration:underline;text-underline-offset:3px}
.legal a:hover{color:var(--pur-3)}
.legal strong{color:var(--text);font-weight:600}
.legal-meta{font-size:.82rem;color:var(--muted-2);margin-top:10px}
.foot-legal{display:flex;gap:16px;flex-wrap:wrap}
.foot-legal a{color:var(--muted-2);font-size:.82rem;transition:color .3s}
.foot-legal a:hover{color:var(--text)}
"""


def jsonld():
    import json
    data = [
        {"@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#organization",
         "name": "HephoraTech", "url": SITE + "/", "logo": SITE + "/assets/logo-transparent.png",
         "image": SITE + "/assets/og-image.png",
         "description": "HephoraTech builds websites, e-commerce stores, mobile apps, custom software and SaaS products. Based in Tiruppur, Tamil Nadu.",
         "email": EMAIL, "telephone": PHONE,
         "address": {"@type": "PostalAddress", "addressLocality": "Tiruppur",
                     "addressRegion": "Tamil Nadu", "addressCountry": "IN"},
         "contactPoint": [{"@type": "ContactPoint", "telephone": PHONE, "email": EMAIL,
                           "contactType": "sales", "areaServed": "IN", "availableLanguage": ["en", "ta"]}]},
        {"@context": "https://schema.org", "@type": "ProfessionalService", "@id": SITE + "/#localbusiness",
         "name": "HephoraTech", "url": SITE + "/", "image": SITE + "/assets/og-image.png",
         "priceRange": "$$", "email": EMAIL, "telephone": PHONE,
         "address": {"@type": "PostalAddress", "addressLocality": "Tiruppur",
                     "addressRegion": "Tamil Nadu", "addressCountry": "IN"},
         "areaServed": [{"@type": "Country", "name": "India"}],
         "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Services", "itemListElement": [
             {"@type": "Offer", "itemOffered": {"@type": "Service", "name": n}} for n in
             ["Web & App Development", "E-Commerce", "SEO & Website Optimization",
              "Automation & AI", "Social Media & Ads", "SaaS Product Builds"]]}},
        {"@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "/#website",
         "url": SITE + "/", "name": "HephoraTech",
         "publisher": {"@id": SITE + "/#organization"}},
    ]
    return ('<script type="application/ld+json">'
            + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
            + "</script>")


def build_legal_pages(pages):
    shell = open(os.path.join(HERE, "contact.html"), encoding="utf-8").read()
    head_end = shell.find('<section class="page-hero">')
    foot_start = shell.find("<footer")
    head, foot = shell[:head_end], shell[foot_start:]
    for fname, title, desc, body in [
        ("terms.html", "Terms &amp; Conditions — HephoraTech",
         "The terms that apply when you engage HephoraTech for design, development or marketing work.", TERMS_BODY),
        ("privacy.html", "Privacy Policy — HephoraTech",
         "What information hephoratech.com collects, why we collect it, and what we do with it.", PRIVACY_BODY),
    ]:
        h = head
        h = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", h, count=1, flags=re.S)
        h = re.sub(r'(<meta name="description" content=")[^"]*(")', rf"\1{desc}\2", h, count=1)
        h = re.sub(r'(<meta property="og:title" content=")[^"]*(")', rf"\1{title}\2", h, count=1)
        h = re.sub(r'(<meta property="og:description" content=")[^"]*(")', rf"\1{desc}\2", h, count=1)
        h = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                   rf"\1{SITE}{clean_url(fname)}\2", h, count=1)
        h = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")', rf"\1{title}\2", h, count=1)
        h = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', rf"\1{desc}\2", h, count=1)
        open(os.path.join(HERE, fname), "w", encoding="utf-8").write(h + body + "\n" + foot)
        print("  ✓ created", fname)


def patch_page(path):
    fname = os.path.basename(path)
    src = open(path, encoding="utf-8").read()
    orig = src

    # 1. canonical (replace existing or insert before </head>)
    canon = f'<link rel="canonical" href="{SITE}{clean_url(fname)}">'
    if 'rel="canonical"' in src:
        src = re.sub(r'<link rel="canonical"[^>]*>', canon, src, count=1)
    else:
        src = src.replace("</head>", f"{canon}\n</head>", 1)

    # 3. og:url / twitter:url → clean
    src = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                 rf"\1{SITE}{clean_url(fname)}\2", src, count=1)
    src = re.sub(r'(<meta name="twitter:url" content=")[^"]*(")',
                 rf"\1{SITE}{clean_url(fname)}\2", src, count=1)

    # 2. internal .html links → clean URLs (leave assets/, mailto:, tel:, #, http)
    def relink(m):
        q, href = m.group(1), m.group(2)
        if href.startswith(("http", "mailto:", "tel:", "#", "/", "assets/")):
            return m.group(0)
        base = href.split("#")[0]
        frag = href[len(base):]
        if base in pages:
            return f'href={q}{clean_url(base)}{frag}{q}'
        return m.group(0)
    src = re.sub(r'href=(["\'])([^"\']+)\1', relink, src)

    # 4. structured data — homepage only
    if fname == "index.html" and "application/ld+json" not in src:
        src = src.replace("</head>", jsonld() + "\n</head>", 1)

    # 5. footer legal links
    if "foot-legal" not in src and '<div class="foot-bot">' in src:
        src = src.replace(
            '<div class="foot-bot">\n      <div>',
            '<div class="foot-bot">\n      <div class="foot-legal">'
            '<a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a></div>\n      <div>',
            1)
    return src, src != orig


def update_sitemap():
    p = os.path.join(HERE, "sitemap.xml")
    s = open(p, encoding="utf-8").read()
    if "/terms" in s:
        print("  · sitemap already has legal pages")
        return
    add = ("".join(f'  <url><loc>{SITE}/{n}</loc><changefreq>yearly</changefreq>'
                   f'<priority>0.3</priority></url>\n' for n in ("terms", "privacy")))
    s = s.replace("</urlset>", add + "</urlset>")
    open(p, "w", encoding="utf-8").write(s)
    print("  ✓ sitemap.xml: added /terms and /privacy")


if __name__ == "__main__":
    pages = {os.path.basename(p) for p in glob.glob(os.path.join(HERE, "*.html"))} - SKIP

    print("legal pages")
    build_legal_pages(pages)
    pages |= {"terms.html", "privacy.html"}

    print("patching pages")
    changed = 0
    for p in sorted(glob.glob(os.path.join(HERE, "*.html"))):
        if os.path.basename(p) in SKIP:
            continue
        bak = p + ".seo.bak"
        if not os.path.exists(bak):
            shutil.copy(p, bak)
        out, did = patch_page(p)
        if did:
            open(p, "w", encoding="utf-8").write(out)
            changed += 1
    print(f"  ✓ {changed} pages updated (canonical, clean links, og:url, footer legal links)")

    print("css")
    css_path = os.path.join(HERE, "assets", "xtract.css")
    css = open(css_path, encoding="utf-8").read()
    if "═══ LEGAL PAGES" not in css:
        open(css_path, "w", encoding="utf-8").write(css.rstrip() + "\n" + LEGAL_CSS)
        print("  ✓ legal page styles appended")
    else:
        print("  · legal styles already present")

    print("sitemap"); update_sitemap()
    print("done.")
