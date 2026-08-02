export const SITE_NAME = "NLA Fabrication";
export const SITE_TAGLINE = "Reproduction parts for the 96–00 Civic that the factory no longer makes";

// Placeholder domain — set NEXT_PUBLIC_SITE_URL in the deployment environment.
// Flagged in README: the real domain still needs to be purchased/decided.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nla-fabrication.example.com";

// Placeholder contact inbox — flagged in README, needs a real address before launch.
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "hello@nla-fabrication.example.com";

export const SITE_DESCRIPTION =
  "3D-printed reproduction interior parts for the 1996–2000 Civic (EK/EJ). Discontinued glove box latches, HVAC knobs, and trim — modeled from original geometry, validated on the chassis, and produced to order.";

/*
 * Marketplace storefronts.
 *
 * These are deliberately empty. Inventing a plausible-looking Etsy or eBay URL
 * would put a dead link in the footer of every page and in the site's
 * structured data, and a 404 on a storefront link reads as an abandoned
 * business faster than having no link at all.
 *
 * To switch one on, set the environment variable — no code change, no
 * redeploy of anything but the env:
 *
 *   NEXT_PUBLIC_ETSY_URL=https://www.etsy.com/shop/YourShopName
 *   NEXT_PUBLIC_EBAY_URL=https://www.ebay.com/str/your-store-name
 *   NEXT_PUBLIC_AMAZON_URL=https://www.amazon.com/stores/…
 *
 * Anything left unset simply doesn't render — the footer column, the shop
 * strip, and the Organization `sameAs` all read from this one list.
 */
export type Marketplace = {
  id: string;
  label: string;
  /** Shown under the label; says what that channel is actually for. */
  note: string;
  url: string | undefined;
};

const MARKETPLACE_CONFIG: Marketplace[] = [
  {
    id: "etsy",
    label: "Etsy",
    note: "Made-to-order storefront with buyer protection",
    url: process.env.NEXT_PUBLIC_ETSY_URL,
  },
  {
    id: "ebay",
    label: "eBay",
    note: "Listed with parts compatibility for the EK/EJ chassis",
    url: process.env.NEXT_PUBLIC_EBAY_URL,
  },
  {
    id: "amazon",
    label: "Amazon",
    note: "Fulfilment for high-volume catalog items",
    url: process.env.NEXT_PUBLIC_AMAZON_URL,
  },
];

/** A storefront that actually has a URL — the only shape consumers ever see. */
export type LiveMarketplace = Marketplace & { url: string };

/** Only the storefronts that have a real URL configured. */
export const MARKETPLACES: LiveMarketplace[] = MARKETPLACE_CONFIG.filter(
  (m): m is LiveMarketplace => Boolean(m.url)
);
