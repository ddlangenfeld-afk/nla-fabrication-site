import data from "@/data/products.json";

export type ProductVariant = {
  id: string;
  label: string;
};

export type Product = {
  slug: string;
  name: string;
  shortName: string;
  status: "available" | "coming-soon";
  priceCents: number | null;
  hasVariants?: boolean;
  variants?: ProductVariant[];
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
