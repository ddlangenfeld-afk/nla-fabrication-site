import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing indexable lives behind these — cart is per-visitor, /api is
      // JSON, /ops is the operations dashboard. Note that robots.txt is a
      // request, not a control: /ops is protected by the auth gate in
      // middleware.ts, and this line only keeps well-behaved crawlers from
      // wasting requests on a 401.
      disallow: ["/cart", "/api/", "/ops"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
