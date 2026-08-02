import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = SitemapEntry["changeFrequency"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: [string, ChangeFrequency, number][] = [
    ["", "monthly", 1],
    ["/shop", "weekly", 0.9],
    ["/about", "yearly", 0.6],
    ["/contact", "yearly", 0.5],
    ["/legal/privacy", "yearly", 0.2],
    ["/legal/terms", "yearly", 0.2],
    ["/legal/shipping-returns", "yearly", 0.2],
  ];

  return [
    ...staticRoutes.map(([path, changeFrequency, priority]) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...getAllProducts().map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      // Purchasable parts outrank the ones still in fitment verification.
      priority: product.status === "available" ? 0.8 : 0.4,
    })),
  ];
}
