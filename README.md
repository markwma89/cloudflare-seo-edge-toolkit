# cloudflare-seo-edge-toolkit

Fixes I use on small-business sites hosted on Cloudflare Pages. Each one came out of a real client audit. Client names and domains are removed.

## What's here

| File | Problem it fixes |
|---|---|
| `functions/_middleware.js` | www and non-www both returning 200 (split rankings), and internal project files being served on the live domain |
| `examples/_redirects` | `.html` duplicates getting indexed, and old URLs after a site rebuild |
| `examples/robots.txt` | AI search crawlers blocked by default, so the business never shows up in AI answers |
| `examples/llms.txt` | No plain-text summary of the business for AI assistants to read |
| `examples/schema-service-page.jsonld` | Schema blocks that don't reference each other, and breadcrumbs with broken URLs |

## The problems behind them

**Duplicate host.** On one site, www served a full copy of the site with a 200. Search Console excluded 11 pages as "Alternate page with proper canonical tag" and split impressions between the two hosts. The middleware sends a 301 to whichever host is set in `CANONICAL_HOST`.

**Internal files on the live site.** A Pages project that deploys straight from the repo serves every committed file. On one site that included review docs, QA screenshots, build scripts and `.wrangler` caches with the Cloudflare account id and account email. `.cfignore` doesn't apply to Git builds, so the middleware returns the site's 404 (with `X-Robots-Tag: noindex`) for those paths instead.

**Crawl trap.** A site with no 404 page and relative links let crawlers build endless URLs, and 70 pages ended up unindexed against 23 indexed. The fix was a real 404 page, root-relative links and a rebuilt sitemap. The middleware's 404 handling assumes the site has a `/404` page.

**Schema.** Every entity gets a stable `@id`. The page, service, breadcrumb and business point at each other by `@id` and don't repeat themselves.

## Setup

1. Copy `functions/_middleware.js` into the Pages project.
2. In the project settings, add the environment variable `CANONICAL_HOST`, for example `example.com`.
3. Check `BLOCKED_PREFIXES` and `BLOCKED_ROOT_FILE` against the site. The defaults block root-level `.js` files, so if the site loads scripts from the root (not `/js/`), take `js` out of that pattern.
4. Copy what you need from `examples/` and replace `example.com`.

After deploying:

```bash
curl -sI https://www.example.com/about     # expect 301 to https://example.com/about
curl -sI https://example.com/docs/notes.md # expect 404
curl -sI https://example.com/about.html    # expect 301 to /about
```

Then resubmit the sitemap in Search Console and validate the fix on the affected report.

## License

MIT
