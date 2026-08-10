/**
 * HephoraTech — Cloudflare Worker
 *
 * Serves the static site and 301s a few retired URLs. Assets are bound in
 * wrangler.jsonc; note that a file matching the request path is served
 * directly and this Worker is never invoked for it.
 */

// Pages that no longer exist, mapped to their replacement. A real 301 keeps the
// link equity and gives Google an unambiguous signal, which a meta-refresh stub
// with a self-canonical does not.
const GONE = {
  '/product-attendance': '/products',
  '/product-attendance.html': '/products',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const moved = GONE[url.pathname.replace(/\/+$/, '') || '/'];
    if (moved) return Response.redirect(new URL(moved, url).toString(), 301);

    return env.ASSETS.fetch(request);
  },
};
