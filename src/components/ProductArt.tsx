type ProductArtProps = {
  art: string;
  title: string;
  className?: string;
};

/*
 * Technical line-art placeholders in engineering-drawing style.
 * Deliberate stand-ins until real product renders exist (phase 2) —
 * drawn as schematics, not attempts at photorealism.
 */
export function ProductArt({ art, title, className = "" }: ProductArtProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={`Technical line drawing of ${title}`}
      className={className}
      fill="none"
    >
      <Drawing art={art} />
    </svg>
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

function Drawing({ art }: { art: string }) {
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
    case "sliders":
      return (
        <>
          <Frame />
          <g className="text-ink-secondary" stroke="currentColor" strokeWidth="1.25">
            {/* slider tracks */}
            <line x1="90" y1="100" x2="310" y2="100" strokeWidth="0.75" strokeDasharray="4 4" />
            <line x1="90" y1="150" x2="310" y2="150" strokeWidth="0.75" strokeDasharray="4 4" />
            <line x1="90" y1="200" x2="310" y2="200" strokeWidth="0.75" strokeDasharray="4 4" />
            {/* knobs on tracks */}
            <rect x="120" y="88" width="34" height="24" rx="5" />
            <line x1="137" y1="94" x2="137" y2="106" />
            <rect x="230" y="138" width="34" height="24" rx="5" />
            <line x1="247" y1="144" x2="247" y2="156" />
            <rect x="176" y="188" width="34" height="24" rx="5" />
            <line x1="193" y1="194" x2="193" y2="206" />
          </g>
          <DimLine x1={120} y1={68} x2={154} y2={68} label="24 mm" labelX={137} labelY={58} />
          <DimLine x1={332} y1={100} x2={332} y2={200} label="PITCH 50" labelX={352} labelY={153} />
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
