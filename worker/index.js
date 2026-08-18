/**
 * HephoraTech — Cloudflare Worker
 *
 * Serves the static site, sends www to the apex, and 301s a few retired URLs.
 * Assets are bound in wrangler.jsonc; note that a file matching the request
 * path is served directly and this Worker is never invoked for it.
 */

// Pages that no longer exist, mapped to their replacement. A real 301 keeps the
// link equity and gives Google an unambiguous signal, which a meta-refresh stub
// with a self-canonical does not.
const GONE = {
  '/product-attendance': '/products',
  '/product-attendance.html': '/products',
};

// Non-www is canonical everywhere — all 16 canonicals, the sitemap, og:url and
// the schema. www is not a second home for the site; it is a redirect to the
// apex, path and query preserved.
const CANONICAL_HOST = 'hephoratech.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // www → apex. Checked before anything else so the redirect wins over both
    // the GONE map and asset serving.
    //
    // NOTE: this only runs if a Worker route actually covers the www hostname.
    // As of 18 Aug 2026 no route does, which is why www returns a Cloudflare
    // 522 rather than reaching this code. See HANDOFF.md — the recommended fix
    // is a Cloudflare Redirect Rule, which runs at the edge before Workers and
    // costs no invocation. This branch is here so that if a www route is ever
    // added, the correct behaviour is already in place instead of www quietly
    // serving a duplicate copy of the whole site.
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const moved = GONE[url.pathname.replace(/\/+$/, '') || '/'];
    if (moved) return Response.redirect(new URL(moved, url).toString(), 301);

    return env.ASSETS.fetch(request);
  },
};
