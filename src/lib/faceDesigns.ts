/*
 * Knob face designs.
 *
 * Grounded in a real teardown: a spare 96–97 climate control unit was pulled
 * apart and the slider knobs pulled off to look at what's actually molded
 * onto the face — a single flat line, nothing else. That flat face is a free
 * canvas: the knob still has to press-fit the same lever arm and clear the
 * same bezel opening, so a different face design is a different top surface
 * on the same base geometry, not a different part.
 *
 * That is also why this costs nothing extra to produce. Unlike colour, which
 * is a genuinely separate spool and a real changeover, a face design is the
 * same material, the same colour, the same print time to the minute — just a
 * different model loaded before hitting print. It is priced identically to
 * the classic face for exactly that reason: there is no cost difference to
 * pass on.
 *
 * This is the one place in this catalog where "customisable" doesn't fight
 * the small-batch cost model, because the customisation is geometry, not
 * inventory.
 */

export type FaceDesign = {
  id: string;
  name: string;
  note: string;
};

export const FACE_DESIGNS: FaceDesign[] = [
  {
    id: "classic",
    name: "Classic Line",
    note: "The factory single-line marker. Exact reproduction of the original.",
  },
  {
    id: "skull",
    name: "Skull",
    note: "",
  },
  {
    id: "diamond",
    name: "Diamond",
    note: "",
  },
  {
    id: "spade",
    name: "Ace of Spades",
    note: "",
  },
];

export const DEFAULT_FACE_DESIGN_ID = "classic";

export function getFaceDesign(id: string | undefined): FaceDesign {
  return FACE_DESIGNS.find((d) => d.id === id) ?? FACE_DESIGNS[0];
}

export function isValidFaceDesignId(id: unknown): id is string {
  return typeof id === "string" && FACE_DESIGNS.some((d) => d.id === id);
}
