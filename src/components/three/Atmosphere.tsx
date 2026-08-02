"use client";

import { useEffect, useRef } from "react";

/*
 * The page's background: three drifting light volumes, a cursor-following
 * brightness, a vignette and grain — all in CSS (see `.atmosphere` in
 * globals.css). No canvas.
 *
 * A WebGL particle layer was built for this and then cut on the measurement.
 * Sitewide, always-on, full-viewport, it cost ~37s of total blocking time per
 * page and dropped Lighthouse performance from 95-100 to 61-64 — and that was
 * *after* moving the drift into a vertex shader, capping DPR to 1, and pausing
 * the loop on tab-hide. Removing it put every page back to 95-100.
 *
 * The drift is now three blurred divs animated on `transform` alone, which the
 * compositor runs off the main thread for free. WebGL stays where it earns its
 * cost: the hero viewport, one contained canvas on one page showing the part.
 */
export function Atmosphere() {
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = spot.current;
    if (!node) return;

    // Nothing to follow on a touch screen, and the OS setting means don't.
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    /* Writing the custom properties inside a rAF, not in the event handler:
       pointermove can fire well above 60Hz on a high-polling mouse, and each
       write invalidates the gradient. One write per painted frame. */
    const paint = () => {
      frame = 0;
      node.style.setProperty("--mx", `${x}px`);
      node.style.setProperty("--my", `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      node.style.setProperty("--spot-opacity", "1");
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => node.style.setProperty("--spot-opacity", "0");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div ref={spot} className="spotlight" />
    </div>
  );
}
