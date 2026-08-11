import { GlyphMarks } from "@/components/KnobFaceIcon";
import {
  defaultDesignFor,
  getFaceDesign,
  type GlyphSurface,
} from "@/lib/faceDesigns";

type ProductArtProps = {
  art: string;
  title: string;
  className?: string;
  /** The chosen face design, on products that offer one. Carved into the
   *  drawing so the picker changes what you are looking at. Omitted (or
   *  undefined) keeps the factory face, which is what the catalog grid and
   *  the cart thumbnails want. */
  glyphId?: string;
  /** Whether that glyph is engraved into a knob face or cut as a backlit
   *  window. Changes how it is drawn, not just where. */
  glyphSurface?: GlyphSurface;
};

/*
 * Technical line-art in engineering-drawing style.
 *
 * These are not placeholders standing in for photography that is about to
 * arrive — see src/lib/renders.ts for why the CAD renders are built but not
 * served. They are drawings, they are labelled as drawings, and they are
 * accurate about the one thing they claim: the reconciled envelope and the
 * face design you selected. A drawing that says "16.5 mm" is a weaker
 * promise than a photograph, and right now it is the only one that can be
 * kept.
 */
export function ProductArt({
  art,
  title,
  className = "",
  glyphId,
  glyphSurface = "knob",
}: ProductArtProps) {
  const design = glyphId ? getFaceDesign(glyphId) : null;
  const label = design
    ? `Technical line drawing of ${title}, ${design.name} ${
        glyphSurface === "aperture" ? "symbol" : "face"
      }`
    : `Technical line drawing of ${title}`;

  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={label}
      className={className}
      fill="none"
    >
      <Drawing art={art} glyphId={glyphId} />
    </svg>
  );
}

/*
 * A face design placed into a drawing.
 *
 * GlyphMarks is authored in a 32x32 box, so it is scaled to `size` about
 * (cx, cy). Stroke weight is divided back out by that same scale — otherwise
 * a 46-unit glyph would come in at 1.3 x 1.44 = 1.9, heavier than the 1.25
 * outline it sits inside, and the face would read as the primary form.
 */
function FaceGlyph({
  id,
  cx,
  cy,
  size,
  lit = false,
}: {
  id: string;
  cx: number;
  cy: number;
  size: number;
  lit?: boolean;
}) {
  const k = size / 32;
  const stroke = (lit ? 1.5 : 1.05) / k;

  return (
    <g transform={`translate(${cx} ${cy}) scale(${k}) translate(-16 -16)`}>
      <g
        className={lit ? "text-accent" : "text-ink-secondary"}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <GlyphMarks id={id} />
      </g>
    </g>
  );
}

function DimLine({
  x1,
  y1,
  x2,
  y2,
  label,
  labelX,
  labelY,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  labelX: number;
  labelY: number;
}) {
  const vertical = x1 === x2;
  return (
    <g className="text-ink-muted" stroke="currentColor" strokeWidth="0.75">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - 4} y1={y1} x2={x1 + 4} y2={y1} />
          <line x1={x2 - 4} y1={y2} x2={x2 + 4} y2={y2} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} />
          <line x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} />
        </>
      )}
      <text
        x={labelX}
        y={labelY}
        stroke="none"
        fill="currentColor"
        fontSize="9"
        fontFamily="var(--font-mono)"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

function Corner({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <g className="text-line-strong" stroke="currentColor" strokeWidth="1">
      <line x1={x} y1={y} x2={x + 12 * d} y2={y} />
      <line x1={x} y1={y} x2={x} y2={y + 12} />
    </g>
  );
}

function Frame() {
  return (
    <>
      <Corner x={12} y={12} />
      <Corner x={388} y={12} flip />
      <g className="text-line-strong" stroke="currentColor" strokeWidth="1">
        <line x1={12} y1={288} x2={24} y2={288} />
        <line x1={12} y1={288} x2={12} y2={276} />
        <line x1={388} y1={288} x2={376} y2={288} />
        <line x1={388} y1={288} x2={388} y2={276} />
      </g>
    </>
  );
}

/*
 * No `glyphSurface` here on purpose. Which treatment a glyph gets — engraved
 * into a face, or cut as a lit window — is decided by which drawing it lands
 * in, and each product names its own (`sliders` vs `aperture`). Threading the
 * surface through as well would create a second, independent way to ask the
 * same question, and the two could disagree.
 */
function Drawing({ art, glyphId }: { art: string; glyphId?: string }) {
  switch (art) {
    case "latch":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            {/* latch body plan view */}
            <rect x="100" y="90" width="200" height="110" rx="10" />
            {/* handle recess */}
            <path d="M130 118 h140 a8 8 0 0 1 8 8 v28 a8 8 0 0 1 -8 8 h-140 a8 8 0 0 1 -8 -8 v-28 a8 8 0 0 1 8 -8Z" />
            {/* pull handle */}
            <path d="M150 140 h100 a6 6 0 0 1 6 6 v0 a6 6 0 0 1 -6 6 h-100 a6 6 0 0 1 -6 -6 v0 a6 6 0 0 1 6 -6Z" />
            {/* spring tab */}
            <path d="M200 90 v-22 m-14 22 v-14 h28 v14" strokeWidth="1" />
            {/* screw holes */}
            <circle cx="118" cy="106" r="5" />
            <circle cx="282" cy="106" r="5" />
            <line x1="114" y1="102" x2="122" y2="110" strokeWidth="0.75" />
            <line x1="278" y1="102" x2="286" y2="110" strokeWidth="0.75" />
          </g>
          {/* centerline */}
          <line
            x1="200"
            y1="56"
            x2="200"
            y2="232"
            className="text-line-strong"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="10 4 2 4"
          />
          <DimLine x1={100} y1={224} x2={300} y2={224} label="148 mm" labelX={200} labelY={240} />
          <DimLine x1={324} y1={90} x2={324} y2={200} label="62 mm" labelX={348} labelY={148} />
        </>
      );
    /*
     * Front and right-side elevation of a single slider knob, drawn from the
     * measured part rather than as a schematic of the panel it sits in. The
     * geometry here is the same reconciled envelope as the full orthographic
     * sheet in design/hvac-slider-knob-orthographic.svg — 16.50 W x 20.32 H
     * x 16.50 D, tapering to a 9.00 top face — scaled 7:1 into this viewBox.
     * Keep the two in step if either changes.
     */
    case "sliders":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            {/* front elevation */}
            <path
              d="M62.25 222 L62.25 131
                 C62.25 105.8 71.7 87.6 88.5 85.15
                 C101.8 83.05 110.9 79.76 120 79.76
                 C129.1 79.76 138.2 83.05 151.5 85.15
                 C168.3 87.6 177.75 105.8 177.75 131
                 L177.75 222 Z"
            />
            {/* recessed front panel */}
            <path
              d="M85 213.6 C85 155.5 96.2 111.4 120 100.2
                 C143.8 111.4 155 155.5 155 213.6 Z"
              strokeWidth="0.9"
            />
            {/*
             * The face. `classic` is the factory single-line marker and is
             * drawn as what it physically is — a full-length moulded stripe
             * down the front face, not a short dash — so it keeps the slot
             * rather than borrowing the picker's 32px icon, which shortens it
             * to stay legible at chip size. Every other design is carved into
             * the same panel.
             */}
            {!glyphId || glyphId === "classic" ? (
              <rect x="116.5" y="113.5" width="7" height="91" strokeWidth="0.9" />
            ) : (
              <FaceGlyph id={glyphId} cx={120} cy={158} size={50} />
            )}

            {/* right-side elevation */}
            <path
              d="M215 222 L215 91.8
                 C215 83.4 223.4 79.76 236 79.76
                 C265.4 79.76 300.4 91.1 330.5 103.7
                 L330.5 162.5
                 C329.8 190.5 321.4 213.6 305.02 222 Z"
            />
            {/* lever socket, hidden */}
            <path
              d="M232.5 222 L232.5 114 C232.5 107 240.2 104.2 252.8 104.2
                 C275.2 104.2 294.8 112.6 313 121.4 L313 160.4
                 C312.3 182.8 306 200.3 294.8 207.3 L294.8 222"
              strokeWidth="0.75"
              strokeDasharray="5 3"
            />
          </g>
          {/* centrelines */}
          <g
            className="text-line-strong"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="10 4 2 4"
          >
            <line x1="120" y1="66" x2="120" y2="236" />
          </g>
          <DimLine x1={62.25} y1={240} x2={177.75} y2={240} label="16.5 mm" labelX={120} labelY={256} />
          <DimLine x1={48} y1={79.76} x2={48} y2={222} label="20.32" labelX={30} labelY={154} />
          <DimLine x1={215} y1={240} x2={330.5} y2={240} label="16.5 mm" labelX={272} labelY={256} />
        </>
      );
    /*
     * The backlit symbol set — a different part from the slider knob, and
     * until now it borrowed the knob's drawing, which showed a solid cap to
     * sell a cut window.
     *
     * Two views, because the product is the relationship between them: the
     * elevation shows the symbol, the section shows it as an opening with a
     * light behind it. 6.00 mm across is the only dimension stated, because
     * it is the only one sourced — it is the window size the glyph library
     * already reasons about, and the reason `classic` and `skull` are not
     * offered on this surface at all (see lib/faceDesigns.ts). Everything
     * else here is drawn to that scale rather than dimensioned: the button's
     * own outside dimensions have not been measured, and inventing a plausible
     * "34 mm" for a drawing that people order parts from is exactly the kind
     * of number that gets believed.
     */
    case "aperture":
      return (
        <>
          <Frame />
          {/* front elevation of the indicator button */}
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <rect x="66" y="86" width="128" height="128" rx="7" />
            <rect x="78" y="98" width="104" height="104" rx="4" strokeWidth="0.9" />
          </g>
          {/* The aperture. Drawn lit because that is the state it is bought
              for — an unlit window is just a hole and says nothing about the
              product. */}
          <FaceGlyph
            id={glyphId ?? defaultDesignFor("aperture")}
            cx={130}
            cy={150}
            size={58}
            lit
          />
          {/* section cut line A-A through the window */}
          <g
            className="text-line-strong"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="10 4 2 4"
          >
            <line x1="52" y1="150" x2="208" y2="150" />
          </g>
          {/* section: the wall, cut through the window. The 58-unit gap is the
              same 58 units the glyph spans in the elevation — one scale across
              both views, so the opening reads as the same hole twice. */}
          <clipPath id="nla-aperture-wall">
            <rect x="296" y="86" width="12" height="35" />
            <rect x="296" y="179" width="12" height="35" />
          </clipPath>
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <rect x="296" y="86" width="12" height="35" />
            <rect x="296" y="179" width="12" height="35" />
          </g>
          {/* section hatching, clipped to the two cut faces */}
          <g
            className="text-line-strong"
            stroke="currentColor"
            strokeWidth="0.5"
            clipPath="url(#nla-aperture-wall)"
          >
            {/* A uniform ladder across the whole height — the clip above is
                what makes it stop at the opening, so the spacing stays even
                across both cut faces instead of being hand-fitted twice. */}
            <path d="M288 64 L316 92 M288 76 L316 104 M288 88 L316 116 M288 100 L316 128 M288 112 L316 140 M288 124 L316 152 M288 136 L316 164 M288 148 L316 176 M288 160 L316 188 M288 172 L316 200 M288 184 L316 212 M288 196 L316 224" />
          </g>

          {/* backlight: in from the lamp behind, out through the opening */}
          <g className="text-accent" stroke="currentColor" strokeWidth="0.75">
            <path d="M340 150 L308 150" strokeDasharray="4 3" />
            <path d="M296 150 L244 150" />
            <path d="M296 134 L248 116" />
            <path d="M296 166 L248 184" />
            {/* lamp */}
            <circle cx="346" cy="150" r="6" />
            <path d="M346 138 L346 132 M346 168 L346 162 M355 150 L361 150" strokeWidth="0.6" />
          </g>

          <DimLine x1={101} y1={228} x2={159} y2={228} label="6.00 mm" labelX={130} labelY={244} />

          <g
            className="text-ink-muted"
            fill="currentColor"
            stroke="none"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            <text x="46" y="153" textAnchor="end">
              A
            </text>
            <text x="214" y="153">
              A
            </text>
            <text x="130" y="268" textAnchor="middle">
              ELEVATION
            </text>
            <text x="302" y="268" textAnchor="middle">
              SECTION A—A
            </text>
          </g>
        </>
      );
    case "bezel":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            {/* bezel outline */}
            <path d="M120 80 h130 a30 30 0 0 1 30 30 v80 a30 30 0 0 1 -30 30 h-130 a12 12 0 0 1 -12 -12 v-116 a12 12 0 0 1 12 -12Z" />
            {/* inner cup */}
            <path d="M138 100 h104 a24 24 0 0 1 24 24 v52 a24 24 0 0 1 -24 24 h-104 a8 8 0 0 1 -8 -8 v-84 a8 8 0 0 1 8 -8Z" />
            {/* handle slot */}
            <path d="M158 132 h60 a10 10 0 0 1 0 20 h-60 a10 10 0 0 1 0 -20Z" />
            {/* reinforced corner hatching */}
            <g strokeWidth="0.75" className="text-accent" stroke="currentColor">
              <path d="M250 84 l18 18M258 82 l20 20M266 80 l20 20M274 82 l16 16" />
            </g>
          </g>
          <DimLine x1={108} y1={244} x2={280} y2={244} label="118 mm" labelX={194} labelY={260} />
          <text
            x={318}
            y={96}
            fill="currentColor"
            fontSize="9"
            fontFamily="var(--font-mono)"
            className="text-accent"
          >
            R+
          </text>
        </>
      );
    case "console":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <rect x="120" y="110" width="160" height="70" rx="8" />
            <path d="M170 110 v-20 h60 v20" />
            <path d="M188 90 v-12 h24 v12" strokeWidth="1" />
            <line x1="120" y1="145" x2="280" y2="145" strokeWidth="0.75" strokeDasharray="4 4" />
            <circle cx="200" cy="162" r="7" />
          </g>
          <DimLine x1={120} y1={204} x2={280} y2={204} label="VERIFYING" labelX={200} labelY={220} />
        </>
      );
    case "handle":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <path d="M110 170 a90 60 0 0 1 180 0" />
            <path d="M130 170 a70 44 0 0 1 140 0" />
            <line x1="110" y1="170" x2="130" y2="170" />
            <line x1="270" y1="170" x2="290" y2="170" />
            <circle cx="140" cy="188" r="6" />
            <circle cx="260" cy="188" r="6" />
          </g>
          <DimLine x1={110} y1={214} x2={290} y2={214} label="CONFIRMING P/N" labelX={200} labelY={230} />
        </>
      );
    case "bracket":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <path d="M130 90 h140 v40 h-50 v80 h-40 v-80 h-50 Z" />
            <circle cx="152" cy="110" r="6" />
            <circle cx="248" cy="110" r="6" />
            <circle cx="200" cy="188" r="6" />
            <g strokeWidth="0.75" strokeDasharray="4 4">
              <line x1="130" y1="110" x2="270" y2="110" />
              <line x1="200" y1="90" x2="200" y2="210" />
            </g>
          </g>
          <DimLine x1={130} y1={234} x2={270} y2={234} label="REPAIR AID" labelX={200} labelY={250} />
        </>
      );
    case "clips":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            {/* push clip */}
            <path d="M120 120 h44 l-6 14 h-32 Z" />
            <line x1="142" y1="134" x2="142" y2="168" />
            <path d="M134 168 h16 l-8 14 Z" />
            {/* christmas tree clip */}
            <line x1="222" y1="112" x2="222" y2="180" />
            <path d="M210 124 h24 M212 138 h20 M214 152 h16 M216 166 h12" />
            <rect x="212" y="102" width="20" height="10" rx="2" />
            {/* end retainer */}
            <path d="M282 120 a16 16 0 1 0 0 32 h20 v-32 Z" />
          </g>
          <DimLine x1={120} y1={214} x2={302} y2={214} label="ASSORTED" labelX={211} labelY={230} />
        </>
      );
    case "cradle":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <rect x="140" y="96" width="120" height="84" rx="10" />
            <rect x="152" y="108" width="96" height="52" rx="4" strokeWidth="0.75" />
            <path d="M170 180 l-16 34 h92 l-16 -34" />
            <line x1="154" y1="214" x2="246" y2="214" />
            <circle cx="200" cy="170" r="3" />
          </g>
          <DimLine x1={280} y1={96} x2={280} y2={180} label="ADJ." labelX={300} labelY={141} />
        </>
      );
    default:
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            <rect x="140" y="100" width="120" height="100" rx="8" />
            <line x1="140" y1="150" x2="260" y2="150" strokeWidth="0.75" strokeDasharray="4 4" />
            <line x1="200" y1="100" x2="200" y2="200" strokeWidth="0.75" strokeDasharray="4 4" />
          </g>
        </>
      );
  }
}
