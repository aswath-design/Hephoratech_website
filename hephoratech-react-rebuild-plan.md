# HephoraTech Website — React Rebuild Scoping Plan

## Why this is being considered

The current site is static HTML/CSS/JS with no build step — that's why Framer Motion (a React
animation library) can't be used directly. Everywhere Framer-Motion-style spring easing was
wanted, it's been approximated with a hand-tuned CSS `cubic-bezier(.34,1.4,.5,1)` curve. That
gets close, but real Framer Motion adds things CSS can't easily replicate: physics-based
drag/gesture animations, layout animations (`layoutId` shared-element transitions), scroll-linked
choreography with spring interpolation, and exit animations tied to component unmount.

A React rebuild is genuinely possible and would unlock all of that. It is also a real project,
not an afternoon change — everything currently working (6 pages, the theming system, the AI chat
widget, the Cloudflare Worker integration, the contact form) has to be re-implemented, not just
copied over.

## Recommended target stack

- **Vite + React 18 + TypeScript** — fast dev server, small production bundle, no framework
  lock-in to Next.js's server features (which this site doesn't need).
- **Framer Motion** for animation.
- **Keep the existing design system** — the CSS custom properties (`--w02`–`--w18`, `--glass-*`,
  `--pill-*`, `--grad-*`, light/dark tokens) port over almost unchanged into a global stylesheet or
  CSS modules. No need to redo the visual language, only the markup/animation layer.
- **Static prerendering, not a client-only SPA.** This is a marketing site indexed by Google
  (Search Console is already set up). A pure client-rendered SPA risks a temporary SEO dip while
  pages get re-crawled and re-rendered. Vite supports prerendering each route to static HTML at
  build time (via `vite-plugin-ssg` or similar), so Google still sees full HTML — React just
  hydrates on top for the animations. This preserves the current SEO investment.
- **Same Cloudflare Worker**, unchanged in spirit: `wrangler.jsonc`'s `assets.directory` points to
  the Vite build output instead of the current `hephoratech-website/` folder. The `/api/chat`
  route in `worker/index.js` doesn't change at all.

## What has to be migrated (nothing is free)

| Piece | Current | Rebuild effort |
|---|---|---|
| 6 pages (home, about, products, 2 product detail pages, contact) | Hand-written HTML | Rewritten as React components/routes |
| Design tokens & theme system | CSS custom properties + `data-theme` attribute + anti-flash inline script | Ports directly, theme toggle logic rewritten as a React hook |
| Services "branch tree" scroll animation | IntersectionObserver + manual `.tree-fill` height calc | Rewritten with Framer Motion's `useScroll`/`useTransform` |
| Products annotated showcase | IntersectionObserver `data-anno` reveal | Rewritten with Framer Motion `whileInView` |
| AI chat widget | Vanilla JS IIFE building DOM by hand, `sessionStorage` lead capture, fetch to `/api/chat` | Rewritten as a React component; state management (open/closed, gate/chat, message history) becomes much simpler in React |
| Contact form (Web3Forms) | Plain HTML form + fetch | React form component, same Web3Forms endpoint |
| Magnetic buttons / cursor spotlight | Vanilla JS mouse listeners | Small custom hooks, or Framer Motion's `useMotionValue` |
| OG/meta tags per page | Static `<meta>` tags per HTML file | Per-route `<Helmet>`-style head management (e.g. `react-helmet-async` or Vite's per-route head API) |

## Phased plan

1. **Scaffold** — new Vite+React+TS project, port design tokens as global CSS, set up
   prerendering and the Cloudflare Worker asset binding pointing at the new build output. Deploy
   an empty shell to confirm the pipeline works end-to-end before touching content.
2. **Static pages first** — About, Contact, product detail pages (lowest animation complexity).
   Validates the layout system and theming.
3. **Homepage** — hero, marquee, services tree, products lead-in. Highest animation complexity;
   this is where Framer Motion earns its keep.
4. **Products showcase page** — the annotated CSS-mockup sections.
5. **AI chat widget** — port last, since it's the most stateful piece and easiest to get right
   once the rest of the app shell exists.
6. **QA pass** — cross-browser check, Lighthouse/Core Web Vitals comparison against the current
   live site (don't regress load performance for the animation upgrade), mobile pass, re-submit
   sitemap if URLs change.
7. **Cutover** — deploy behind the same domain once parity is confirmed; keep the current static
   site's git history intact in case of rollback.

## Realistic tradeoffs

- **Time**: this is a multi-session effort, not a single sitting — expect it to span several
  working sessions given the number of custom animations and the AI widget's stateful logic.
- **Risk**: temporary regressions are likely during migration (an animation slightly off, a
  meta tag missed) — needs a careful QA pass before cutover, not a straight swap.
- **SEO**: mitigated by prerendering, but any URL structure changes still need a sitemap
  resubmission in Search Console.
- **Ongoing maintenance**: React + a build step is more powerful but adds real complexity —
  `npm install`, a build pipeline, dependency updates — compared to editing an HTML file directly,
  which is what's made this session's rapid iteration possible.
- **What you get**: real spring physics, gesture-driven interactions, shared-element transitions,
  and a codebase that's easier to extend with reusable components as the site grows.

## Suggested next step

Start with Phase 1 (scaffold + deploy pipeline) as a self-contained, low-risk first session — it
proves out the Cloudflare Worker + Vite + prerendering pipeline without touching any live content,
and gives a real "does this actually work end-to-end" checkpoint before committing to the full
migration.
