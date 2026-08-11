/*
 * Curated product photography, per glyph.
 *
 * Separate from the CAD render pipeline in lib/renders.ts and not gated by
 * it — these are not renders of the disputed envelope, they are images
 * chosen and ordered by hand for one specific face. The classic face is the
 * first one photographed; the rest of the glyph library gets its own set
 * here the same way as it becomes available. An id with no entry below
 * falls through to the CAD render set (if published) or the technical
 * drawing, same as before this module existed.
 */

export type ProductPhoto = {
  label: string;
  src: string;
  alt: string;
};

function classicGallery(productName: string): ProductPhoto[] {
  return [
    {
      label: "Front",
      src: "/product-photos/classic/front-view.png",
      alt: `${productName} — front view`,
    },
    {
      label: "Top",
      src: "/product-photos/classic/top-view.png",
      alt: `${productName} — top view`,
    },
    {
      label: "Angle",
      src: "/product-photos/classic/side-angle.png",
      alt: `${productName} — three-quarter angle`,
    },
    {
      label: "Side",
      src: "/product-photos/classic/side-view.png",
      alt: `${productName} — side profile`,
    },
    {
      label: "Features",
      src: "/product-photos/classic/emission-with-text-2.png",
      alt: `${productName} — material and fit detail`,
    },
    {
      label: "Installed",
      src: "/product-photos/classic/in-unit.png",
      alt: `${productName} — installed in dash`,
    },
  ];
}

const GALLERIES: Record<string, (productName: string) => ProductPhoto[]> = {
  classic: classicGallery,
};

/** The photo gallery for a glyph, or null when that glyph has none yet. */
export function productPhotos(
  glyphId: string,
  productName: string
): ProductPhoto[] | null {
  return GALLERIES[glyphId]?.(productName) ?? null;
}
