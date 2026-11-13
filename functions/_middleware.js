/**
 * Cloudflare Pages middleware for two problems I keep running into on client sites.
 *
 * 1. Duplicate hosts. If www and the apex domain both return 200, Search Console
 *    splits impressions between them and marks pages "Alternate page with proper
 *    canonical tag". A 301 to one host lets Google consolidate everything.
 *
 * 2. Internal files served in production. A Pages project that deploys from the
 *    repo root with no build step serves everything that's committed: docs,
 *    screenshots, scripts, .wrangler caches (which include the Cloudflare account
 *    id and account email). .cfignore only applies to `wrangler pages deploy`,
 *    not Git builds, so it doesn't help. These paths get the site's 404 instead.
 *
 * Set CANONICAL_HOST in the Pages project settings (e.g. "example.com").
 */

const BLOCKED_PREFIXES = [
  '/docs/', '/scripts/', '/.github/', '/.wrangler/', '/.vscode/', '/node_modules/',
  '/screenshots/', '/audit/', '/drafts/',
];

// root-level dev files: build scripts, python helpers, markdown, dotfiles
const BLOCKED_ROOT_FILE = /^\/(?:[^/]+\.(?:js|mjs|ts|py|md|sh|toml|lock)|\.[^/]+)$/i;

function isBlocked(pathname) {
  const p = pathname.toLowerCase();
  if (BLOCKED_PREFIXES.some((pre) => p.startsWith(pre) || p === pre.slice(0, -1))) return true;
  return BLOCKED_ROOT_FILE.test(p);
}

async function notFound(context) {
  const page = await context.env.ASSETS.fetch(new URL('/404', context.request.url));
  return new Response(page.body, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const canonical = context.env.CANONICAL_HOST;

  // www.example.com -> example.com (or the other way round, whatever CANONICAL_HOST says)
  if (canonical && url.hostname !== canonical && url.hostname.replace(/^www\./, '') === canonical.replace(/^www\./, '')) {
    url.hostname = canonical;
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  if (isBlocked(url.pathname)) return notFound(context);

  return context.next();
}
