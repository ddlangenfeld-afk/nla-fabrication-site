/*
 * Small line-art glyphs for each knob face design.
 *
 * Each glyph is the knob's outline (a stylised round cap, not a literal
 * rendering of the slider lever underneath it — this is a picker icon, not a
 * manufacturing reference) with the face design inscribed in the centre,
 * drawn as thin strokes to match the technical-drawing language used
 * everywhere else on the site (ProductArt, the hero CAD viewport). `skull`
 * keeps two solid eye sockets and a solid nose, because a skull read as pure
 * outline reads as a blob at 24px — everything else stays outline-only.
 *
 * `currentColor` throughout rather than a fixed ink token: the wrapping label
 * already changes text colour on hover/selected, and the glyph should track
 * it for free rather than needing its own state.
 */
export function KnobFaceIcon({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13" />
      <Glyph id={id} />
    </svg>
  );
}

function Glyph({ id }: { id: string }) {
  switch (id) {
    case "skull":
      return (
        <>
          <path d="M11 20C9 20 8 18 8 15C8 10 11.4 6 16 6C20.6 6 24 10 24 15C24 18 23 20 21 20V22H11V20Z" />
          <circle cx="12.5" cy="14" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="19.5" cy="14" r="1.6" fill="currentColor" stroke="none" />
          <path d="M16 15L14.6 17.7H17.4L16 15Z" fill="currentColor" stroke="none" />
          <path d="M13.5 20V22M16 20V22M18.5 20V22" />
        </>
      );
    case "diamond":
      return <path d="M16 7L25 16L16 25L7 16Z" />;
    case "spade":
      return (
        <>
          <path d="M16 6C12 10 8 14.4 8 17.8C8 20.6 10.3 22.8 13 22.8C14.3 22.8 15.5 22.2 16 21.2C16.5 22.2 17.7 22.8 19 22.8C21.7 22.8 24 20.6 24 17.8C24 14.4 20 10 16 6Z" />
          <path d="M16 19L12.4 26H19.6Z" />
        </>
      );
    case "classic":
    default:
      return <path d="M9 16H23" />;
  }
}
