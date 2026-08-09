# HephoraTech Website — Session Handoff

Paste this into a new session to pick up where we left off.
Last updated: 09 August 2026.

## Project

- **Folder:** `D:\Hephoratech`
- **Live site:** hephoratech.com (Cloudflare Workers)
- **Repo:** github.com/aswath-design/Hephoratech_website (branch `master`)
- **Stack:** Static HTML/CSS/JS, no build step. Shared `assets/xtract.css` + `assets/xtract.js`.
- **Backend:** Cloudflare Worker at `worker/index.js` — serves the site, proxies `/api/chat`
  to OpenAI. Config in `wrangler.jsonc`.

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

Current: `xtract.css/js?v=14`, `magic-rings.js?v=3`.

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

### 3. Do not gate anything on IntersectionObserver

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

**Weights (gzipped):** web-app-development 7.7KB · seo 8.9KB · ai-animation-flow 10.4KB ·
ecommerce 75.8KB · social-media 115.9KB · **saas 177.8KB**. The last two embed PNGs and are
~62% of the animation payload. Swapping them for pure-vector files would save ~250KB.

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

### Mobile
Every page scrolled sideways by 65px at 390px. Cause: the decorative `.orb` elements are
`position:absolute` with no positioned ancestor, so their containing block is the initial
containing block and `body{overflow-x:hidden}` never clipped them. Fixed with
`.orb{max-width:100%}`. Touch targets raised on phones — menu toggle was 20×22, now 44×44
(needed `flex-shrink:0`, since `.nav-in` is a flex row).

### Other
- Social links live: Instagram + Facebook, `target="_blank" rel="noopener noreferrer"`.
- Newsletter form is real (Web3Forms) — was fake, showed "Subscribed ✓" and discarded the address.
- `404.html` added; `wrangler.jsonc` expects one and none existed.
- Worker system prompt gave the pre-migration email; now `info@hephoratech.com`.
- `sameAs` added to Organization + ProfessionalService schema (Instagram, Facebook).
- Header "Start a Project" button removed from all 16 pages.
- Orphaned `index-classic.html`, `style.css`, `app.js` removed; `.wrangler/` untracked.

---

## Outstanding

| Item | Notes |
|---|---|
| **AI chat widget is down** | OpenAI account has no credits — `429`. Billing fix only, no code change. Top up at platform.openai.com. |
| **LinkedIn icon is a dead link** | Still `href="#"` on 16 pages. No LinkedIn page exists yet; creating one also helps brand recognition (below). |
| **Google autocorrects the brand** | Searching "hephoratech" returns results for "hiprotech". Not a site bug — the term has no authority yet. Needs time, backlinks, Google Business Profile, and brand searches. `sameAs` was the code-side part. |
| **Only 5 of 15 pages indexed** | Request indexing in Search Console. All 15 sitemap URLs return 200 and self-canonicalise correctly — no technical blocker. |
| **`saas.json` is 178KB gz** | Embeds a 228KB PNG. With `social-media.json` (116KB) it is most of the animation payload. |
| **Callouts for cards 02 and 06** | Possible but need a per-aspect overlay; the current one assumes square artwork. |
| **Team photos missing** | `assets/team/{aswathaman,saran,giritharan,kamalesh}.jpg` are referenced on About and 404. They degrade to initials, so nothing looks broken. |
| **Client naming** | The PDF says "a food business" rather than Chechi Puttu Kadai — still needs the client's permission to name them or use screenshots. |

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
- **Secrets:** `npx wrangler secret put OPENAI_API_KEY` — the name goes on the command line, the
  key at the prompt. Never in the command itself.

---

## Files worth knowing

```
D:\Hephoratech\
├── hephoratech-website/        the site
│   ├── assets/xtract.css       ~2500 lines, all styling
│   ├── assets/xtract.js        all behaviour incl. the Lottie loader
│   ├── assets/magic-rings.js   WebGL hero background
│   └── assets/lottie/          player + 6 animation JSONs
├── worker/index.js             Worker: serves site, /api/chat → OpenAI
├── wrangler.jsonc
├── HephoraTech-Profile.pdf     4-page client-facing capability profile
└── hephoratech-react-rebuild-plan.md   scoped, not started
```

### The PDF
`HephoraTech-Profile.pdf` — 4 pages, 82KB, built by a script kept in the session scratchpad
(not in the repo). Claims are grounded in the site copy and Terms; note Terms §9 says
*"We do not guarantee specific commercial outcomes"*, so it deliberately promises no results.
16 tappable links (site, mailto, tel). To rebuild it, ask for the reportlab script again.
