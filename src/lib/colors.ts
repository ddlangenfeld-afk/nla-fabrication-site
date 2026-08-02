/*
 * The colour palette, and why it is this short.
 *
 * The instinct is to pick colours by pigment price. That turns out to be the
 * wrong axis: standard opaque PETG is the same base resin with a different
 * masterbatch, so black, white, grey, red, blue, orange and green all sell for
 * the same price per kilo from the same brand. Choosing "cheap colours" saves
 * approximately nothing.
 *
 * What actually costs money, in descending order:
 *
 *  1. INVENTORY. Every colour is a spool you have bought and are holding. Five
 *     colours is five spools of working capital on a shelf, and PETG is
 *     hygroscopic — an opened spool degrades whether or not it gets printed,
 *     so slow-moving colours are a running loss, not just dead capital. This
 *     is the constraint that sets the palette size.
 *
 *  2. CHANGEOVER. Switching colour means purging the hotend: material that
 *     becomes waste plus machine time that produces nothing. It is per-switch,
 *     not per-part, which is why the ops queue batches by colour — printing
 *     six black parts then four red costs one changeover; alternating them
 *     costs nine.
 *
 *  3. ABRASIVE PIGMENTS. This is the one place cost genuinely diverges.
 *     Metallic, sparkle/glitter, glow-in-the-dark and carbon-fibre-filled
 *     grades chew through a brass nozzle and need a hardened one. That is a
 *     real consumable cost and a real failure mode, and it is why none of them
 *     are in this palette.
 *
 *  4. UV AND HEAT BEHAVIOUR. These are interior parts living under a
 *     windscreen. Dark colours hide the yellowing that PETG shows with age and
 *     sun; white and natural show it plainly. Anything sold for a dash top
 *     should be dark unless the customer specifically wants otherwise.
 *
 * Hence: five colours, all standard opaque, all the same price, biased dark.
 * Two read as factory, three are deliberate accents. `costPerKgUsd` in
 * data/costs.json is what to keep an eye on — not the colour list.
 */

export type PartColor = {
  id: string;
  name: string;
  /** Swatch fill. Approximate — filament is matte, screens are not. */
  hex: string;
  /** Border for the swatch, so near-black chips still read on a dark page. */
  ring: string;
  /** Shown under the name in the picker. Sells the choice or warns about it. */
  note: string;
  /** Ink colour that stays legible on top of `hex`. */
  onHex: string;
  /** Reads as an OEM interior tone rather than an accent. */
  factoryTone: boolean;
};

export const COLORS: PartColor[] = [
  {
    id: "black",
    name: "Matte Black",
    hex: "#17191c",
    ring: "#3a3f47",
    onHex: "#f2f4f6",
    note: "Closest to factory dash tone. Hides UV ageing best.",
    factoryTone: true,
  },
  {
    id: "graphite",
    name: "Graphite",
    hex: "#4a4f56",
    ring: "#6b717a",
    onHex: "#f2f4f6",
    note: "Mid-grey. Matches lighter factory interior trim.",
    factoryTone: true,
  },
  {
    id: "sand",
    name: "Sand",
    hex: "#b3a288",
    ring: "#cbbda6",
    onHex: "#1a1a1a",
    note: "Warm neutral for beige and tan interiors.",
    factoryTone: true,
  },
  {
    id: "red",
    name: "Signal Red",
    hex: "#b8242a",
    ring: "#d94a50",
    onHex: "#ffffff",
    note: "Accent finish. Not a factory colour.",
    factoryTone: false,
  },
  {
    id: "blue",
    name: "Deep Blue",
    hex: "#1e4b8f",
    ring: "#3a6cb8",
    onHex: "#ffffff",
    note: "Accent finish. Not a factory colour.",
    factoryTone: false,
  },
];

export const DEFAULT_COLOR_ID = "black";

export function getColor(id: string | undefined): PartColor {
  return COLORS.find((c) => c.id === id) ?? COLORS[0];
}

export function isValidColorId(id: unknown): id is string {
  return typeof id === "string" && COLORS.some((c) => c.id === id);
}

/*
 * Custom colour terms.
 *
 * Deliberately a quote, never a checkout option. A checkout button for "any
 * colour" commits us to buying a spool for a single unit — the customer pays
 * for one part and we hold 950g of a colour nobody else has ordered. The
 * minimum exists so a custom run at least consumes the spool it forces us to
 * buy, and the lead time is honest about the fact that the material has to be
 * ordered before anything can be printed.
 *
 * These numbers are the business decision, not a technical constraint — they
 * live here so they can be changed without touching the copy that renders
 * them.
 */
export const CUSTOM_COLOR = {
  minimumUnits: 4,
  leadTimeWeeks: "2–3",
  /** Covers the spool commitment and the changeover, not the parts. */
  setupFeeUsd: 25,
};
