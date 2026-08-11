"use client";

import { Analytics } from "@vercel/analytics/next";

/*
 * Vercel Web Analytics.
 *
 * Until this existed the site recorded nothing at all, so "has anyone visited
 * yet" had no answer — not "no", genuinely no data either way. Worth having in
 * before any marketing push rather than after, because traffic that arrives
 * before the tag does is traffic nobody can ever count.
 *
 * Chosen over GA/Plausible purely because the site already deploys to Vercel:
 * no extra account, no cookie banner (it stores no cookies and no personal
 * data), and no third-party origin in the CSP. It reports pageviews and
 * referrers, which is the entire question being asked. If the question later
 * becomes "which glyph do people pick", that is a custom event, not a
 * different vendor.
 *
 * WHY /ops IS EXCLUDED
 *
 * /ops is the internal instrument panel — margins, orders, cost model. Its
 * visitors are us, repeatedly, and every one of those views would land in the
 * same pageview count used to judge whether the shop is getting traffic. On a
 * site whose real traffic is currently near zero, a handful of admin sessions
 * is not noise, it is most of the graph. Dropping them here rather than
 * mentally subtracting them later keeps the number honest by construction.
 *
 * beforeSend returning null drops the event in the browser, so nothing about
 * an /ops visit is transmitted at all.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        // event.url is absolute; parse rather than substring-matching so a
        // query string or a path like /shop?from=/ops cannot fool it.
        let pathname: string;
        try {
          pathname = new URL(event.url).pathname;
        } catch {
          return event;
        }
        if (pathname === "/ops" || pathname.startsWith("/ops/")) return null;
        return event;
      }}
    />
  );
}
