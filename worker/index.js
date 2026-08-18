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
    // NOTE: as of 18 Aug 2026 this branch is dormant by design. www was
    // deleted from DNS that day and is NXDOMAIN, so nothing reaches the
    // Worker on that hostname and no route covers it. (Before deletion it
    // resolved to Cloudflare but had no route, so it served a 522 error page
    // — the one genuinely bad outcome of the three available.)
    //
    // The branch is kept as a guard, not as live behaviour: if a www record
    // is ever re-added — by hand, or by a Cloudflare default when a setting
    // is toggled — this makes the site 301 rather than quietly mirroring all
    // 16 pages on a second hostname. Non-www stays canonical either way.
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const moved = GONE[url.pathname.replace(/\/+$/, '') || '/'];
    if (moved) return Response.redirect(new URL(moved, url).toString(), 301);

    return env.ASSETS.fetch(request);
  },
};
