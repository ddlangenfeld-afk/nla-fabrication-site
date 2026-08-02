/*
 * The page's background: volumetric glows, vignette and grain, all in CSS
 * (see `.atmosphere` in globals.css). No canvas.
 *
 * A WebGL particle layer was built for this and then cut on the measurement.
 * Sitewide, always-on, full-viewport, it cost ~37s of total blocking time per
 * page and dropped Lighthouse performance from 95-100 to 61-64 — and that was
 * *after* moving the drift into a vertex shader, capping DPR to 1, and pausing
 * the loop on tab-hide. Removing it put every page back to 95-100.
 *
 * The visual difference was a faint drifting haze. The trade wasn't close, and
 * the CSS layer carries the depth on its own. WebGL stays where it earns its
 * cost: the hero viewport, which is one contained canvas on one page showing
 * the actual product.
 */
export function Atmosphere() {
  return <div className="atmosphere" aria-hidden="true" />;
}
