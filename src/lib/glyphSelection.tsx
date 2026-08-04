"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  defaultDesignFor,
  isValidForSurface,
  type GlyphSurface,
} from "@/lib/faceDesigns";

/*
 * The selected glyph, shared across the product page's two columns.
 *
 * WHY THIS EXISTS AT ALL
 *
 * The picker lives in the buy column and the artwork lives in the sticky
 * column opposite it. They are siblings under a server component, so there is
 * no prop path between them — before this, choosing a face changed the button
 * label and nothing else, and the drawing beside it kept showing the factory
 * single line whatever you picked. Lifting the selection into a context is the
 * smallest thing that lets one choice drive both.
 *
 * Deliberately not in the URL. A glyph is a cart-line attribute, not a
 * separate page: putting it in the query string would fork one product into
 * eight crawlable near-duplicate URLs competing for the same search result,
 * which is the exact problem the price ladder was collapsed into one page to
 * avoid. If a shareable "here is mine in Skull" link is ever wanted, that is a
 * deliberate SEO decision with canonical tags, not a side effect of wiring up
 * a picker.
 */

type GlyphSelection = {
  /** Always valid for `surface` — see the clamp in the provider. */
  glyphId: string;
  setGlyphId: (id: string) => void;
  surface: GlyphSurface;
};

const GlyphSelectionContext = createContext<GlyphSelection | null>(null);

export function GlyphSelectionProvider({
  surface = "knob",
  children,
}: {
  surface?: GlyphSurface;
  children: React.ReactNode;
}) {
  const [raw, setRaw] = useState(() => defaultDesignFor(surface));

  /*
   * Clamped rather than trusted. Two products use this provider — the knob set
   * and the aperture set — and they offer different halves of the library. The
   * provider sits at the same position in the tree on both pages, so a client
   * navigation between them can reconcile onto the existing state rather than
   * remounting, carrying "skull" onto a page that cannot cut a skull as a
   * light window. Validating on read fixes that for every consumer at once and
   * cannot be forgotten at a call site, which keying the provider could be.
   */
  const glyphId = isValidForSurface(raw, surface) ? raw : defaultDesignFor(surface);

  const setGlyphId = useCallback(
    (id: string) => {
      // Ignore anything not offered on this surface. Nothing in the UI can
      // send one, but this is also what stops a stale value reaching the cart.
      if (isValidForSurface(id, surface)) setRaw(id);
    },
    [surface]
  );

  const value = useMemo(
    () => ({ glyphId, setGlyphId, surface }),
    [glyphId, setGlyphId, surface]
  );

  return (
    <GlyphSelectionContext.Provider value={value}>
      {children}
    </GlyphSelectionContext.Provider>
  );
}

/**
 * The live glyph selection. Throws outside a provider rather than inventing a
 * local fallback: a picker silently editing its own private copy of the state
 * while the artwork reads another is precisely the bug this module exists to
 * remove, and it would look like it worked.
 */
export function useGlyphSelection(): GlyphSelection {
  const ctx = useContext(GlyphSelectionContext);
  if (!ctx) {
    throw new Error("useGlyphSelection must be used inside <GlyphSelectionProvider>");
  }
  return ctx;
}
