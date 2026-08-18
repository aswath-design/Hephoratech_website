# HephoraTech Website — Session Handoff

Paste this into a new session to pick up where we left off.
Last updated: 17 August 2026 (registrar outage). Earlier entries dated 09 August 2026
are from the SEO/entity session and still current.

**The other three markdown files in this repo are stale.** `SETUP.md` and
`HOW-TO-ADD-VIDEO.md` were written against earlier versions of the site and describe
markup and files that no longer exist; `hephoratech-react-rebuild-plan.md` scopes 6 pages
when there are 16. Trust this file over those.

## Project

- **Folder:** `D:\Hephoratech`
- **Live site:** hephoratech.com (Cloudflare Workers)
- **Repo:** github.com/aswath-design/Hephoratech_website (branch `master`)
- **Stack:** Static HTML/CSS/JS, no build step. Shared `assets/xtract.css` + `assets/xtract.js`.
- **Backend:** Cloudflare Worker at `worker/index.js` — 26 lines: serves the site and 301s
  retired URLs. Config in `wrangler.jsonc`. (It used to proxy `/api/chat` to OpenAI; the chat
  widget and that endpoint were both removed 09 Aug 2026.)
- **Chat widget:** now a hosted third-party script, `cdn.hephoratech.com/widget.js`, on all
  16 pages. Not part of this repo's code — configured via `data-site-id` / `data-api`.

### Deploying — read this first

**Pushing to `master` deploys the site automatically.** Verified 09 Aug 2026: a commit
pushed minutes earlier was already live with no manual step. You do **not** need
`npx wrangler deploy` for normal content/CSS/JS changes. (Earlier notes in this file said
otherwise — that was wrong.)

---

## Critical conventions

### 1. Cache-busting — bump the version when you edit CSS or JS

Every page loads `assets/xtract.css?v=N` and `assets/xtract.js?v=N`; `magic-rings.js` has
its own `?v=N`. **If you edit those files you MUST bump the number across all HTML**, or
browsers serve the old copy and your change silently does nothing:

```bash
cd "D:\Hephoratech\hephoratech-website"
sed -i 's|xtract.css?v=14|xtract.css?v=15|g; s|xtract.js?v=14|xtract.js?v=15|g' *.html
```

Current: `xtract.css/js?v=23`, `magic-rings.js?v=3`.

This cost hours in the last session — several rounds of changes appeared to do nothing
because the browser held a stale `xtract.js`.

### 2. Never test with `file://`

Opening `index.html` by double-clicking gives a flood of console errors and a broken page.
Lottie fetches its JSON over XHR, and a `file://` page has a `null` origin, so Chrome blocks
every one as cross-origin. **This is not a bug in the site.** Always:

```powershell
cd "D:\Hephoratech\hephoratech-website"; python -m http.server 8080
```

then `http://localhost:8080`. Served properly there are zero console errors.

### 3. A static asset shadows the Worker — the Worker never runs for that path

`wrangler.jsonc` binds `./hephoratech-website` as assets. **When a file matches the request
path, Cloudflare serves it directly and does not invoke `worker/index.js`.** The Worker only
runs when nothing matches.

Same silent-failure shape as the two below. A 301 added to the Worker for
`/product-attendance` did nothing while `product-attendance.html` still existed: no error,
just a 200 where a 301 was expected. Deleting the file fixed it instantly.

**So: to add a Worker redirect for a path that has an HTML file, delete the file in the same
change.** Verify with `curl -sI` against the live URL, not by reading the code.

### 4. Do not gate anything on IntersectionObserver

This bit the codebase **three times** in one session. Its failure mode is the worst kind:
no error, nothing in the console, just a feature that silently never starts. Both the Lottie
loader and the hero rings were gated on it and never ran. Both now start on
`load` → `requestIdleCallback` (Lottie) or synchronously (rings), and use the observer only
to *pause* work that is already running.

---

## What is live now

### Services section — rebuilt as a zig-zag
Six full-width alternating rows (artwork left / copy right, flipping each row) replacing the
old bento grid. Each row carries a description pulled from that service's own page. All six
stock photos deleted; `assets/services/` no longer exists.

### Lottie animations — six, one per service
- Player is **self-hosted and pinned**: `assets/lottie/lottie.min.js` (lottie-web 5.12.2).
- **Use the FULL build, not `lottie_light`.** The light build ships no filter support, so
  blurred layers render as hard-edged solids — one animation's soft white glow became an
  opaque blob. Cost: 74KB gz vs 45KB.
- Loads after `load` then on idle, so first paint and LCP are untouched.
- `data-par` on the container overrides `preserveAspectRatio` per card (card 01 left-aligns).

**Weights (gzipped / raw):** web-app-development 7/80KB · seo 8/155KB · ai-animation-flow
7/94KB · ecommerce 56/**1105**KB · social-media 109/**718**KB · **saas 179/356KB**. The raw
figures matter more than the gzipped ones — that is what gets parsed and turned into SVG
nodes. Re-exporting the three fat ones as pure vector is the single biggest perf win left.

**All six pause when off screen** (added 09 Aug 2026). They previously ran `autoplay+loop`
with nothing stopping them, so five animations rendered continuously off screen — the largest
continuous cost on the page and the cause of reported lag. The observer only ever *stops*
work already running, so convention 4 still holds. `ht:thaw` checks last observed visibility
so a page transition cannot resume an offscreen animation.

### Hover callouts (cards 01, 03, 04 only)
A dot on the artwork edge, an elbow line drawing outward, then a micro-caps label. One inline
SVG overlay on a **square viewBox matched to the artwork**, so both scale together — dots stay
on the edge to within 0.1px at any width. Hidden below 1000px, where the side gaps close up.

Cards 02, 05, 06 have no callouts: their animations are wide-format (1.27–1.57 aspect), so the
side gap shrinks. Card 05 leaves only 99px and labels need ~120px.

### Hero rings
WebGL canvas (`magic-rings.js`). Fixed: the render loop was never started (no initial
`play()`), so it drew a correctly-sized, permanently blank canvas. Now paints synchronously.
Added a **CSS ring fallback** (`.cssring`) for browsers without WebGL and for phones, keyed
off the `no-hero-rings` class the JS sets when the factory bails.

**Note:** Chrome removed the SwiftShader software-WebGL fallback (deprecated from Chrome 130).
On a machine with no GPU, WebGL is now simply unavailable — which is why the rings vanished on
the owner's PC. Launch Chrome with `--enable-unsafe-swiftshader` to see them locally.

### Default theme
The site ships **light by default** (changed 09 Aug 2026). The anti-flash script in every
`<head>` reads `ht-theme` from localStorage and falls back to `light`; it no longer follows
`prefers-color-scheme`. The CSS is still authored dark-first with `html[data-theme="light"]`
as the override, so light is an override that is now applied by default. The toggle is
unaffected and a visitor's choice still wins.

### Mobile
Every page scrolled sideways by 65px at 390px. Cause: the decorative `.orb` elements are
`position:absolute` with no positioned ancestor, so their containing block is the initial
containing block and `body{overflow-x:hidden}` never clipped them. Fixed with
`.orb{max-width:100%}`. Touch targets raised on phones — menu toggle was 20×22, now 44×44
(needed `flex-shrink:0`, since `.nav-in` is a flex row).

### SEO and entity signals (09 Aug, second session)

The site's technical SEO was audited end to end and is clean: robots.txt allows all and
declares the sitemap, all 15 sitemap URLs self-canonicalise, every page has a unique title
and description, `404.html` is the only `noindex`, and the brand appears 3–6× in visible body
text per page. **Indexing is confirmed working** — `site:hephoratech.com` returns the
homepage, About, Products and Services, crawled within 2 days.

Fixed this session:

- **Always Use HTTPS** enabled in Cloudflare (SSL/TLS → Edge Certificates). Google had
  `http://hephoratech.com/about` indexed as a separate host from the https pages, splitting
  ranking signals. Now 301s, path preserved.
- **`/product-attendance` → `/products`** as a real 301 in the Worker (see convention 3).
  The old stub was a meta-refresh page that declared *itself* canonical.
- **`<lastmod>`** added to all 15 sitemap URLs.
- **LinkedIn company page created** — `linkedin.com/company/hephoratech` — and wired into all
  16 pages plus `sameAs` on both the Organization and ProfessionalService schema.
- **Google Business Profile** corrected: renamed `Hephora Tech` → `HephoraTech` (one word,
  matching the site), phone and website added. Website field points at the apex https URL.

### Internal links must stay extensionless — and the JS is coupled to that

All internal links are root-relative clean URLs (`/about`, `/service-seo`, `/` for home).
**Do not write `href="about.html"`.** Workers Assets answers `/about.html` with a **307
Temporary** redirect to `/about`; because it is temporary Google never consolidates the two,
so it crawls both forever. That put 11 URLs into Search Console's "Page with redirect" on a
16-page site.

**The page-transition handler in `xtract.js` (~line 25) decides what counts as an internal
link by pattern-matching the href.** It now accepts `^/[a-z0-9-]*$` and, as a fallback,
`.html`. If you change the URL shape again, update that test in the same commit or every page
transition on the site silently stops firing — no error, links still work, the animation just
never runs.

**www does not exist** (NXDOMAIN) and deliberately so. Non-www is canonical everywhere —
all 16 canonicals, the sitemap, `og:url` and the schema. The string `www.hephoratech` appears
nowhere in the codebase. Do not "fix" this by switching to www.

### The brand-name problem — read before doing more SEO work

Searching `hephoratech` returns results for **`hiprotech`** (hiprotech.in, iPhone accessories,
has a full Knowledge Panel). Google overrides the correction *even inside quote marks*, which
means it has near-zero confidence the string is a real word. With autocorrect forced off,
Google's own summary says:

> "There is no prominent or widely recognized company... strictly named 'hephoratech'. The
> exact string maps to a reserved or registered domain lookup identifier (hephoratech.com)
> rather than an active corporate entity **with public listings**."

That is an entity-recognition problem, not a code problem. Nothing left in the repo affects
it. What does: public listings naming the entity (LinkedIn ✅, GBP ⏳, Play Store, Justdial /
IndiaMART / Sulekha / Clutch), reviews, and real people searching the term and clicking
"Search instead for". Expect months, not weeks.

Upside: nobody owns the exact string `hephoratech` — the rivals are *hephatech*, *hepytech*,
*hepotech*, *hiprotech*, all different strings. Once Google accepts the entity, the term is
uncontested.

### Domain, DNS, and the 17 Aug outage — read this before debugging any downtime

The domain is registered at **Namecheap** and delegated to Cloudflare nameservers
**`amy.ns.cloudflare.com`** and **`byron.ns.cloudflare.com`**.

On 17 Aug 2026 the site went fully down with `ERR_CONNECTION_REFUSED`. It was **not** the
code, Cloudflare, or the deploy. Namecheap had suspended the domain for an **unverified
WHOIS registrant email** — an ICANN requirement with a 15-day window, and the domain was
registered on 2 Aug. The registrar overrode the nameservers at the registry with
`verify-contact-details.namecheap.com` / `failed-whois-verification.namecheap.com` and
pointed the domain at `198.54.117.242`, which serves a "Whois verification is pending" page.

**The Namecheap panel kept showing the correct Cloudflare nameservers throughout** — the
override is applied upstream of the panel, so the panel is not evidence of anything.

**Diagnosing downtime, in order:**

1. `nslookup -type=NS hephoratech.com 8.8.8.8` — anything other than amy/byron.ns.cloudflare.com
   means a registrar problem. Stop looking at the code.
2. Check the registry directly, which is authoritative and cannot be cached:
   `curl -s https://rdap.verisign.com/com/v1/domain/hephoratech.com`
   A healthy domain shows only `client transfer prohibited`. **`clientHold` or `serverHold`
   means suspended.**
3. Windows `nslookup` reads through the local resolver and happily reports stale answers.
   For the true picture use `https://dns.google/resolve?name=hephoratech.com&type=A`.

**Recovery:** verifying the email restores everything — no reconfiguration needed, the stored
Cloudflare nameservers take effect again by themselves.

**After recovery, caches lie for hours.** Browsers, routers, and especially Indian mobile
carriers hold the bad record well past its 300s TTL. Chrome caches DNS separately from the OS
(`chrome://net-internals/#dns` → Clear host cache, in addition to `ipconfig /flushdns`).
A device that tried during the outage is the *worst* thing to test recovery with. Use
`downforeveryoneorjustme.com` or a device that never tried.

IPv6 was checked and ruled out during this incident: the AAAA records
(`2606:4700:3035::ac43:b7b0`, `2606:4700:3032::6815:4872`) resolve and connect normally.

### Other
- Social links live: Instagram + Facebook + LinkedIn, `target="_blank" rel="noopener noreferrer"`.
  No `href="#"` placeholders remain anywhere on the site.
- Newsletter form is real (Web3Forms) — was fake, showed "Subscribed ✓" and discarded the address.
- `404.html` added; `wrangler.jsonc` expects one and none existed.
- `sameAs` added to Organization + ProfessionalService schema (Instagram, Facebook).
- Header "Start a Project" button removed from all 16 pages.
- Orphaned `index-classic.html`, `style.css`, `app.js` removed; `.wrangler/` untracked.

---

## Outstanding

Ordered by what actually matters.

| Item | Notes |
|---|---|
| **Confirm the WHOIS verification stuck** | The 17 Aug suspension was lifted, and the registry now shows only `client transfer prohibited` (healthy). But this is the one thing that can take the whole site down again. Namecheap → Profile → Contact Information should show no pending banner. |
| **No uptime monitoring** | The 17 Aug outage ran ~1 hour before anyone noticed, and only by accident. UptimeRobot (free, 5-min checks on `https://hephoratech.com`) would have alerted in five minutes. Worth three minutes of setup. |
| **Widget "Start chat" reportedly fails** | The hosted widget's prechat form does not proceed for the owner. **The API is not the cause** — `/v1/widget/config`, `/v1/widget/identify` and `/v1/widget/chat` were each tested end to end and all return 200, with correct CORS and preflight for `https://hephoratech.com`. Not reproducible from outside a browser. Widget source lives at `D:\AI Widget`; the client-side gate is a phone regex `/^[+]?[\d][\d\s\-()]{5,23}$/` that runs *before* any network call. Note `config` 403s without an `Origin` header — browsers always send one, so the live site is fine, but it will fail on any non-allowlisted origin. |
| **Brand autocorrects to `hiprotech`** | Off-site only; see "The brand-name problem" above. As of 17 Aug the site ranks **first** for the exact term once autocorrect is disabled, and the AI Overview describes the company correctly from the site's own content — so only the correction itself remains. No code fix exists. |
| **GBP is manager-only** | Profile shows "Only visible to you" — the public can't find it. Most likely the pending name-change review, slower for a service-area business with no street address. Don't make further edits (each restarts the clock); if still hidden after ~2 weeks, use Support in Business Profile Manager. |
| **No directory listings** | Justdial, IndiaMART, Sulekha, Clutch. Identical name/address/phone each time. This is the "public listings" Google says are missing, and the lever for outranking the Facebook page on the brand term. |
| **No reviews** | GBP has zero. Three or four materially strengthen a new profile; prominence is one of Google's three local ranking factors. |
| **Delete the OpenAI secrets** | Front end and backend both gone, but the Cloudflare secrets remain. `npx wrangler secret delete OPENAI_API_KEY` and, if set, `OPENAI_MODEL`. Harmless but pointless. |
| **Play Store developer account** | The food delivery app sits on the *client's* Play account, verified with the owner's personal identity — so its developer name is not HephoraTech's to change, and Google links accounts by identity (a ban on one can take the other down). Get the identity moved to the client before creating a HephoraTech org account. That needs a **D-U-N-S number**, free but up to 30 days. |
| **Re-export the three fat Lottie files** | `ecommerce` 1105KB raw, `social-media` 718KB, `saas` 356KB — they embed PNGs. Pure-vector re-exports would cut ~250KB and reduce render cost. Design work, not code. Biggest perf win left. |
| **Callouts for cards 02 and 06** | Possible but need a per-aspect overlay; the current one assumes square artwork. |
| **`HephoraTech-Profile.pdf` says "a food business"** | The site now names **Sai Logabala's Chechi Puttu Kadai** on the homepage and `/product-food-delivery`. The PDF could be regenerated to match; the reportlab script is not in the repo. |

**Resolved, recorded so they are not re-done:** team photos (About cards carry bios now,
`assets/team/` deleted — do not reintroduce placeholders); client naming permission (already
named on the site, use that exact wording); indexing (confirmed indexed and crawled); the
spelling is **Giridharan**, not Giritharan.

---

## Other gotchas

- **PowerShell 5.1 has no `&&`.** Use `;` or `if ($?) { }`. Bash-style chaining is a parser error.
- **Git locks:** commits from the assistant sandbox sometimes fail with `.git/index.lock`.
- **Push auth:** Windows Credential Manager caches the wrong account. If push fails:
  ```
  git push https://aswath-design@github.com/aswath-design/Hephoratech_website.git master
  ```
- **Web3Forms is client-side only** on the free plan. A server-side call (curl, or a fetch from
  the Worker) is refused. Keep form submission in the browser.
- **PowerShell `curl`** is aliased to `Invoke-WebRequest` and rejects curl flags. Use
  `Invoke-RestMethod`.
- **Secrets:** `npx wrangler secret put NAME` takes the name on the command line and the value
  at the prompt — never the value in the command. The only secrets left are the orphaned
  OpenAI ones, pending deletion.

---

## Files worth knowing

```
D:\Hephoratech\
├── hephoratech-website/        the site — 16 HTML pages
│   ├── _headers                Cache-Control for /assets/* (7 days + SWR).
│   │                           Workers Assets otherwise sends max-age=0.
│   ├── assets/xtract.css       ~2340 lines, all styling
│   ├── assets/xtract.js        ~770 lines, all behaviour incl. the Lottie
│   │                           loader and the page-transition link gate
│   ├── assets/magic-rings.js   WebGL hero background
│   └── assets/lottie/          player + 6 animation JSONs (~366KB gz total)
├── worker/index.js             26 lines: serves assets, GONE map of 301s.
│                               No /api/chat — removed with the old widget.
├── wrangler.jsonc
├── HephoraTech-Profile.pdf     4-page client-facing capability profile
├── SETUP.md                    ARCHIVED — banner at top says why
├── AI-WIDGET-SETUP.md          ARCHIVED — the widget it documents is gone
├── HOW-TO-ADD-VIDEO.md         STALE — targets .srow-vis/.uim markup that
│                               no longer exists after the Lottie rebuild
└── hephoratech-react-rebuild-plan.md   scoped, not started; says 6 pages,
                                there are 16
```

Deleted and deliberately not coming back: `assets/team/`, `assets/services/`,
`product-attendance.html`, `logo-light.png`, `index-classic.html`, `style.css`, `app.js`.

### The PDF
`HephoraTech-Profile.pdf` — 4 pages, 82KB, built by a script kept in the session scratchpad
(not in the repo). Claims are grounded in the site copy and Terms; note Terms §9 says
*"We do not guarantee specific commercial outcomes"*, so it deliberately promises no results.
16 tappable links (site, mailto, tel). To rebuild it, ask for the reportlab script again.
