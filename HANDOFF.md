# HephoraTech Website — Session Handoff

Paste this into a new session to pick up where we left off.

## Project

- **Folder:** `D:\Hephoratech`
- **Live site:** hephoratech.com (Cloudflare Workers)
- **Repo:** github.com/aswath-design/Hephoratech_website
- **Stack:** Static HTML/CSS/JS, no build step. Shared `assets/xtract.css` + `assets/xtract.js`.
- **Backend:** Cloudflare Worker at `worker/index.js` — serves the site, proxies `/api/chat` to OpenAI. Config in `wrangler.jsonc`.

## What's working

- Contact form — Web3Forms wired, confirmed delivering mail to Aswath@hephoratech.com
- Light/dark theme with view-transition "wave" animation
- Services section — vertical "branch tree" layout with scroll-synced trunk line
- Products page — annotated showcase with CSS-drawn UI mockups
- About page — team section (4 members)
- AI chat widget — glass UI, lead-capture gate (name + phone), styled message input
- Open Graph share image + meta tags across pages
- Google Search Console verified, sitemap submitted, Business Profile set up

## Uncommitted work — needs review, commit, push

Added AI-generated background images to the 6 service cards.

- **Files:** `assets/services/` → `svc-web.jpg`, `svc-ecom.jpg`, `svc-seo.jpg`, `svc-automation.jpg`, `svc-social.jpg`, `svc-saas.jpg`
- **Markup:** a `<span class="tc-bg">` inside each `.tree-card` in `index.html`
- **Styles:** `.tc-bg` in `xtract.css` — artwork sits upper-right, radial mask fades it toward the text
- **Tuning knobs:** `--tc-bg-op` / `--tc-bg-op-hover` (dark: `.8` / `1`, light: `.62` / `.8`)

To ship it:

```
cd D:\Hephoratech
git add hephoratech-website/index.html hephoratech-website/assets/xtract.css hephoratech-website/assets/services/
git commit -m "Add background images to service cards"
git push
```

## Known issue

**AI agent returns "assistant is unavailable."** Everything is wired correctly — the secret is named `OPENAI_API_KEY` and the Worker reads it fine. Cloudflare logs show:

```
OpenAI error 429 — You have no credits remaining
```

Fix is billing-side only: add credits at platform.openai.com. No code change needed. `gpt-4o-mini` is cheap; even $5 lasts a long time for a chat widget.

## Gotchas

- **Git locks:** commits run from the assistant sandbox often fail with `.git/index.lock` errors. Run `git commit` and `git push` yourself in PowerShell.
- **Push auth:** Windows Credential Manager caches the wrong account. Use:
  ```
  git push https://aswath-design@github.com/aswath-design/Hephoratech_website.git master
  ```
  and paste a fresh Personal Access Token when prompted.
- **PowerShell curl:** `curl` is aliased to `Invoke-WebRequest` and rejects curl flags. Use `Invoke-RestMethod` instead.
- **Secrets:** `npx wrangler secret put OPENAI_API_KEY` — the name goes on the command line, the key goes at the `Enter a secret value:` prompt. Never put the key in the command itself.

## Not started

- **Widget booking flow** — collect name, phone, email, service dropdown inside the chat widget → "we'll contact you soon" → emails Aswath@hephoratech.com. Reuses the same free Web3Forms key (safe client-side).
- **Team photos** — 4 portraits into `assets/team/` as `{name}.jpg`
- **Real product screenshots** — needs permission from the Chechi Puttu Kadai client for the Food Delivery app
- **React rebuild** — scoping plan written, see `hephoratech-react-rebuild-plan.md`. Vite + React + Framer Motion, prerendered to static HTML so SEO holds, same Worker. Multi-session effort. Phase 1 (scaffold + deploy pipeline) is the low-risk starting point.

## Security cleanup

Two GitHub tokens and one OpenAI key were pasted into chat during the last session. Revoke and regenerate them:

- GitHub → Settings → Developer settings → Personal access tokens
- platform.openai.com → API keys
