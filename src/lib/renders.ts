/*
 * Which CAD render sets the site is allowed to show.
 *
 * `node scripts/render-knobs.mjs` produces 32 PNGs — hero plus true
 * orthographic front/side/top, for all eight glyphs — into public/renders/.
 * That pipeline works today. What is NOT settled is the geometry it renders:
 * the knob is modelled at 16.50 x 20.32 x 16.50 mm, which is near enough a
 * cube and taller than it is wide for what should be a flat cap on a slider
 * lever. Rendered, it reads as a blob rather than as the part. See
 * research/render-pipeline-handoff.md.
 *
 * So the images exist and are deliberately NOT served: public/renders/ is
 * gitignored, and this module is the second lock. Publishing a set requires
 * two independent, deliberate steps —
 *
 *   1. un-ignore public/renders/ and commit the PNGs, and
 *   2. add the product slug to PUBLISHED_RENDER_SETS below
 *
 * — which is the point. Either step alone does nothing. A stray `git add -f`
 * cannot put unverified product photography on a live storefront, and this
 * file can never reference an image that was not deployed with it.
 *
 * Until then every glyph product falls back to the technical drawing, which
 * is accurate about what it is: a drawing of a reconciled envelope, not a
 * photograph of a part that has never been printed.
 *
 * TO SWITCH ON, once the envelope has been confirmed against calipers:
 *   1. correct the constants at the top of design/knob_model.py
 *   2. node scripts/render-knobs.mjs
 *   3. drop the public/renders/ line from .gitignore, commit the PNGs
 *   4. add "hvac-slider-knob-set-96-98-civic" to PUBLISHED_RENDER_SETS
 */

export type RenderView = "hero" | "front" | "side" | "top";

export const RENDER_VIEWS: { id: RenderView; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "top", label: "Top" },
];

/*
 * Product slugs cleared for published renders. EMPTY ON PURPOSE — see above.
 * This is not a stub waiting to be filled in; it is the switch, and it is off
 * because the geometry behind the images is disputed.
 */
const PUBLISHED_RENDER_SETS: readonly string[] = [];

/** Pixel dimensions the harness emits. Square, and fixed in render-knobs.mjs. */
export const RENDER_SIZE = 1100;

export type RenderImage = {
  view: RenderView;
  label: string;
  src: string;
  alt: string;
};

/**
 * The render set for a product/glyph pair, or null when that product has no
 * published renders — which is every product today. Callers must handle null
 * by falling back to the drawing rather than rendering a broken image.
 */
export function renderSet(
  slug: string,
  glyphId: string,
  productName: string
): RenderImage[] | null {
  if (!PUBLISHED_RENDER_SETS.includes(slug)) return null;
  return RENDER_VIEWS.map(({ id, label }) => ({
    view: id,
    label,
    // Matches the filename the harness writes: knob-<glyph>-<view>.png
    src: `/renders/knob-${glyphId}-${id}.png`,
    alt:
      id === "hero"
        ? `${productName} — three-quarter studio render`
        : `${productName} — orthographic ${label.toLowerCase()} view`,
  }));
}

/** Whether any product has published renders. Used to decide whether the
 *  viewer should offer a view switcher at all. */
export function hasPublishedRenders(slug: string): boolean {
  return PUBLISHED_RENDER_SETS.includes(slug);
}
