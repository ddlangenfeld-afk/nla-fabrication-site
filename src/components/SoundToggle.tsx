"use client";

import { useEffect } from "react";
import { playClick, playHover, resumeIfEnabled, useSound } from "@/lib/audio";

/* Anything that behaves like a control gets a sound. Deliberately not "every
   element": a delegated listener on the document is one listener for the whole
   page, and this selector is what keeps it from chirping at paragraphs. */
const CONTROLS = 'a[href], button, [role="button"], summary, input, select, textarea';

/**
 * The sound control, plus the delegated hover/click sounds it gates.
 *
 * One listener pair on the document rather than handlers on every button:
 * this has to cover components that don't know sound exists (the cart, the
 * contact form, product cards), and threading a callback through all of them
 * to play a blip would be the wrong kind of coupling.
 */
export function SoundToggle() {
  const { on, toggle } = useSound();

  useEffect(() => {
    if (!on) return;

    /* A preference restored from a previous visit can't start the context on
       load — autoplay policy wants a gesture first. This is that gesture. */
    const wake = () => resumeIfEnabled();
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });

    const canHover = window.matchMedia("(hover: hover)").matches;
    let last: Element | null = null;

    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.(CONTROLS) ?? null;
      // pointerover bubbles from descendants too, so an icon inside a button
      // would re-trigger on every child crossing without this.
      if (target === last) return;
      last = target;
      if (target) playHover();
    };

    // pointerdown, not click: the sound should land with the press, and click
    // fires after the browser has already decided a navigation is happening.
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.(CONTROLS)) playClick();
    };

    if (canHover) document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerdown", onDown);

    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [on]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className="sound-dock bottom-4 right-4 flex items-center gap-2.5 px-3 py-2 font-mono text-2xs uppercase tracking-widest text-ink-secondary hover:text-ink sm:bottom-6 sm:right-6"
    >
      <span aria-hidden="true" className={`eq ${on ? "eq-on" : ""}`}>
        <span />
        <span />
        <span />
        <span />
      </span>
      {/* aria-pressed carries the state for assistive tech; the bars carry it
          visually. A second sr-only "on" would just be announced twice. */}
      Sound
    </button>
  );
}
