/*
 * The glyph library.
 *
 * Grounded in a real teardown: a spare 96–97 climate control unit was pulled
 * apart and the slider knobs pulled off to look at what's actually molded
 * onto the face — a single flat line, nothing else. That flat face is a free
 * canvas: the knob still has to press-fit the same lever arm and clear the
 * same bezel opening, so a different face design is a different top surface
 * on the same base geometry, not a different part.
 *
 * That is also why this costs nothing extra to produce. Unlike colour, which
 * is a genuinely separate spool and a real changeover, a glyph is the same
 * material, the same colour, the same print time to the minute — just a
 * different model loaded before hitting print. It is priced identically to
 * the classic face for exactly that reason: there is no cost difference to
 * pass on.
 *
 * WHY THIS IS ONE LIST AND NOT TWO
 *
 * There are two surfaces a glyph can land on: the flat top of a slider knob,
 * and the small backlit window on an indicator button — the square the light
 * comes through. They are physically different parts. They are NOT different
 * choices, because a panel where the knob says one thing and the button says
 * another is a worse product than either. So one pick drives both surfaces,
 * and `aperture` records whether a given design also survives being cut as a
 * light window.
 *
 * Not every design does. An aperture is a thin wall the backlight passes
 * through, so it needs a closed silhouette with enough open area to read at a
 * glance in the dark. `classic` is a single stroke — fine on a knob face,
 * meaningless as a lit window. The skull has interior detail that turns to
 * mush at 6mm. Both are knob-only, and the picker says so rather than letting
 * someone order a tier that cannot render their choice.
 *
 * See research/switch-line-strategy.md §2 for the surface split, and §6 for
 * why the length of this list is the actual moat: past ~20 units the design
 * cost of a glyph rounds to zero, so variety is nearly free to us and
 * expensive for anyone copying one design at a time.
 */

export type FaceDesign = {
  id: string;
  name: string;
  note: string;
  /** Whether this design also works cut as a backlit indicator window.
   *  False means knob-face only — see the header comment. */
  aperture: boolean;
};

export const FACE_DESIGNS: FaceDesign[] = [
  {
    id: "classic",
    name: "Classic Line",
    note: "The factory single-line marker. Exact reproduction of the original.",
    aperture: false,
  },
  {
    id: "cross",
    name: "Cross",
    note: "A clean X in place of the factory square. The most legible lit shape in the set, and the one that reads as deliberate rather than broken.",
    aperture: true,
  },
  {
    id: "chevron",
    name: "Chevron",
    note: "Stacked arrows. Directional, so it sits naturally on the airflow controls.",
    aperture: true,
  },
  {
    id: "hex",
    name: "Hex",
    note: "A hard six-sided window. Technical rather than decorative — the closest of the set to looking factory-intended.",
    aperture: true,
  },
  {
    id: "crosshair",
    name: "Crosshair",
    note: "Ring and ticks. The most open shape here, so it throws the most light of any design in the set.",
    aperture: true,
  },
  {
    id: "diamond",
    name: "Diamond",
    note: "A single rotated square. Quiet at a glance and unmistakable once you notice it.",
    aperture: true,
  },
  {
    id: "spade",
    name: "Ace of Spades",
    note: "Solid spade with the stem. Heavier than the geometric set — for interiors that are already committed.",
    aperture: true,
  },
  {
    id: "skull",
    name: "Skull",
    note: "Interior detail that only resolves at knob-face size. Knob faces only — cut as a light window at 6mm it reads as a blob.",
    aperture: false,
  },
];

/** Which surface a product's glyph lands on. Drives both which designs are
 *  offered and which one is selected by default. */
export type GlyphSurface = "knob" | "aperture";

export const DEFAULT_FACE_DESIGN_ID = "classic";
/* The aperture default is not "classic" — classic is a single stroke, which
   is not a shape you can cut as a light window. A product whose whole point
   is the lit symbol has to open on one that actually lights. */
export const DEFAULT_APERTURE_DESIGN_ID = "cross";

export function getFaceDesign(id: string | undefined): FaceDesign {
  return FACE_DESIGNS.find((d) => d.id === id) ?? FACE_DESIGNS[0];
}

export function isValidFaceDesignId(id: unknown): id is string {
  return typeof id === "string" && FACE_DESIGNS.some((d) => d.id === id);
}

/** Designs offered for a surface. Knob faces take everything; apertures only
 *  take designs that read as a cut light window. */
export function designsFor(surface: GlyphSurface = "knob"): FaceDesign[] {
  return surface === "aperture" ? FACE_DESIGNS.filter((d) => d.aperture) : FACE_DESIGNS;
}

export function defaultDesignFor(surface: GlyphSurface = "knob"): string {
  return surface === "aperture" ? DEFAULT_APERTURE_DESIGN_ID : DEFAULT_FACE_DESIGN_ID;
}

/** Valid AND available on that surface. An aperture product must never accept
 *  a knob-only design — it would be an order we cannot actually produce. */
export function isValidForSurface(id: unknown, surface: GlyphSurface = "knob"): id is string {
  return typeof id === "string" && designsFor(surface).some((d) => d.id === id);
}
