"use client";

import { FACE_DESIGNS, getFaceDesign, type FaceDesign } from "@/lib/faceDesigns";
import { KnobFaceIcon } from "@/components/KnobFaceIcon";

/*
 * Face design picker — same shape as ColorPicker, a different axis.
 *
 * A radio group again, for the same reason colour is one: a face design is a
 * single choice from a fixed set. Kept as a separate component rather than a
 * generalised "choice picker" the two could share, because the swatch (a
 * colour fill) and the glyph (an SVG icon) render differently enough that the
 * shared part would be the fieldset/legend/live-region shell and not much
 * else — not worth the indirection for two call sites.
 */
export function FaceDesignPicker({
  value,
  onChange,
  name = "face-design",
}: {
  value: string;
  onChange: (id: string) => void;
  name?: string;
}) {
  const selected = getFaceDesign(value);

  return (
    <fieldset>
      <legend className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
        Knob face
      </legend>

      <div className="mt-3 flex flex-wrap gap-2">
        {FACE_DESIGNS.map((design) => (
          <Chip
            key={design.id}
            design={design}
            name={name}
            checked={design.id === value}
            onChange={() => onChange(design.id)}
          />
        ))}
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-ink-secondary">
        <span className="text-ink">{selected.name}</span>
        {selected.note && <span className="text-ink-muted"> — {selected.note}</span>}
      </p>
    </fieldset>
  );
}

function Chip({
  design,
  name,
  checked,
  onChange,
}: {
  design: FaceDesign;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      // No hover-lift: same reasoning as the colour swatch — this is a small
      // target you aim at, and a control that moves as the pointer arrives is
      // a worse control, not a livelier one.
      className={`relative flex cursor-pointer flex-col items-center gap-1.5 border px-3 py-2.5 text-center text-xs transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
        checked
          ? "border-accent bg-accent/10 text-ink"
          : "border-line text-ink-secondary hover:border-line-strong hover:text-ink"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={design.id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <KnobFaceIcon id={design.id} className="h-7 w-7" />
      {design.name}
    </label>
  );
}
