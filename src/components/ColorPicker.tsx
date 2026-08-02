"use client";

import { COLORS, getColor, type PartColor } from "@/lib/colors";

/*
 * Swatch picker.
 *
 * Radios in a fieldset rather than a listbox or a set of buttons: colour is a
 * single choice from a fixed set, which is what a radio group is, and it gets
 * arrow-key navigation and a group label from the platform for free.
 *
 * The chip carries a visible tick and a text label as well as the fill. Colour
 * alone would fail WCAG 1.4.1 for anyone who can't distinguish the swatches —
 * which, for a control whose entire job is picking colours, is worth getting
 * right rather than waving at.
 */
export function ColorPicker({
  value,
  onChange,
  name = "color",
}: {
  value: string;
  onChange: (id: string) => void;
  name?: string;
}) {
  const selected = getColor(value);

  return (
    <fieldset>
      <legend className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
        Finish
      </legend>

      <div className="mt-3 flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <Swatch
            key={color.id}
            color={color}
            name={name}
            checked={color.id === value}
            onChange={() => onChange(color.id)}
          />
        ))}
      </div>

      {/* The note for the current choice, in a live region so a screen reader
          hears the change rather than only the name. */}
      <p aria-live="polite" className="mt-3 text-sm text-ink-secondary">
        <span className="text-ink">{selected.name}</span>
        <span className="text-ink-muted"> — {selected.note}</span>
      </p>
    </fieldset>
  );
}

function Swatch({
  color,
  name,
  checked,
  onChange,
}: {
  color: PartColor;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      /* Deliberately no `hover-lift` here. A chip that translates and scales
         as the pointer approaches is a moving target, and this is a control
         you aim at precisely — the swatches are 24px and sit next to each
         other. Colour and border carry the hover instead; nothing moves. */
      className={`relative flex cursor-pointer items-center gap-2.5 border py-2 pl-2 pr-3.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
        checked
          ? "border-accent bg-accent/10 text-ink"
          : "border-line text-ink-secondary hover:border-line-strong hover:text-ink"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={color.id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center border"
        style={{ background: color.hex, borderColor: color.ring }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.2l2.4 2.4L9.5 4"
              stroke={color.onHex}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {color.name}
    </label>
  );
}
