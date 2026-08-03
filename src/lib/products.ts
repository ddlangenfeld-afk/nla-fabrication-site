import data from "@/data/products.json";

export type ProductVariant = {
  id: string;
  label: string;
  /** One line explaining what this variant actually contains. Only worth
   *  setting where the variants differ in content rather than in handing —
   *  "Driver side" needs no gloss, "Panel kit" does. */
  note?: string;
  /** Overrides the product price for this variant. Absent means the variant
   *  costs the same as every other, which is the case for anything that only
   *  differs by which side of the car it fits. Present is a genuine tier
   *  ladder: T1/T2/T3 of the switch line are one product with one page, not
   *  three near-identical products competing for the same search result. */
  priceCents?: number;
};

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  status: "available" | "coming-soon";
  priceCents: number | null;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  /** Offers the glyph picker alongside colour. Set on the two climate-panel
   *  products — those are the only surfaces in the catalog that are a free
   *  canvas; the latch and bezel have nowhere to put a symbol. See
   *  `glyphSurface` for which half of the library is offered. */
  hasFaceDesigns?: boolean;
  /** Which surface the glyph lands on. "knob" (default) is the flat top of a
   *  slider knob and takes any design; "aperture" is a backlit window cut
   *  through the part, which only some designs survive. */
  glyphSurface?: "knob" | "aperture";
  fitment: string;
  fitmentYears: string;
  chassis: string[];
  oemRef: string | null;
  oemNote: string;
  material: string;
  materialNote: string | null;
  color: string | null;
  description: string[];
  features: string[];
  installNote: string | null;
  keywords: string[];
  art: string;
  sortOrder: number;
};

const products = (data.products as Product[]).slice().sort((a, b) => a.sortOrder - b.sortOrder);

export function getAllProducts(): Product[] {
  return products;
}

export function getAvailableProducts(): Product[] {
  return products.filter((p) => p.status === "available");
}

export function getComingSoonProducts(): Product[] {
  return products.filter((p) => p.status === "coming-soon");
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/*
 * The price of one unit of a specific configuration.
 *
 * This is the ONLY place allowed to decide what a line costs. Colour and glyph
 * never move it — same resin, same print time — so the only inputs are the
 * product and which variant was chosen. Everything that charges money (cart
 * subtotal, cart line, Stripe unit_amount) calls this rather than reading
 * `priceCents` directly, so a variant price can never be honoured in one place
 * and silently dropped in another.
 *
 * An unknown variant id falls back to the base price instead of throwing. A
 * stale cart line from before a variant was renamed should cost the base
 * price, not break checkout.
 */
export function unitPriceCents(
  product: Pick<Product, "priceCents" | "variants">,
  variantId?: string | null
): number | null {
  const variant = variantId
    ? product.variants?.find((v) => v.id === variantId)
    : undefined;
  return variant?.priceCents ?? product.priceCents;
}

/** True when the variants are a price ladder rather than a handing choice. */
export function hasPriceLadder(product: Product): boolean {
  return Boolean(product.variants?.some((v) => v.priceCents != null));
}

/** Lowest and highest unit price across variants, for grid and header display. */
export function priceRangeCents(product: Product): [number, number] | null {
  if (product.priceCents == null) return null;
  const prices = (product.variants ?? [])
    .map((v) => v.priceCents)
    .filter((p): p is number => p != null);
  if (prices.length === 0) return [product.priceCents, product.priceCents];
  return [Math.min(...prices), Math.max(...prices)];
}

/** "$19" when flat, "$19 – $59" when the product is a ladder. */
export function formatPriceRange(product: Product): string {
  const range = priceRangeCents(product);
  if (!range) return "";
  const [lo, hi] = range;
  return lo === hi ? formatPrice(lo) : `${formatPrice(lo)} – ${formatPrice(hi)}`;
}
