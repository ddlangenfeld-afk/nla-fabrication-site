"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ProductArt } from "@/components/ProductArt";
import { usePrefersReducedMotion } from "@/lib/motion";

/*
 * The WebGL bundle is loaded only in the browser, only after mount, and only
 * when the device can actually use it. The hero's headline is server-rendered
 * text and stays the LCP element — the canvas fades in behind it afterwards,
 * so the 3D never sits on the critical path.
 */
const LatchScene = dynamic(() => import("@/components/three/LatchScene"), {
  ssr: false,
});

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export function HeroCanvas() {
  const reduced = usePrefersReducedMotion();
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supportsWebGL()) return;

    // Coarse pointer + narrow viewport: phones get the drawing instead. A
    // continuously rendering canvas is the wrong trade for a battery.
    const smallScreen = window.matchMedia("(max-width: 767px)").matches;
    if (smallScreen) return;

    // Three's parse and compile cost lands on the main thread, so it waits for
    // the load event and then for idle. Parsing it any earlier shows up
    // directly as blocking time while the page is still becoming interactive.
    let idleId: number | undefined;

    const scheduleMount = () => {
      const schedule =
        window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idleId = schedule(() => setMount(true)) as unknown as number;
    };

    if (document.readyState === "complete") {
      scheduleMount();
    } else {
      window.addEventListener("load", scheduleMount, { once: true });
    }

    return () => {
      window.removeEventListener("load", scheduleMount);
      if (window.cancelIdleCallback && idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  useEffect(() => {
    if (!mount) return;
    // One frame after mount, so the fade actually plays.
    const t = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(t);
  }, [mount]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Fallback, and what phones and no-WebGL browsers keep: the drawing. */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        <ProductArt
          art="latch"
          title="the glove box latch replacement"
          className="h-auto w-full p-6"
        />
      </div>

      {mount && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <LatchScene reduced={reduced} />
        </div>
      )}

      {/* Viewport corner ticks, the way a CAD window frames its content. */}
      <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-line-strong" />
      <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-line-strong" />
      <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-line-strong" />
      <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-line-strong" />

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        NLA-001 · {ready ? "live view" : "technical drawing"}
      </p>
    </div>
  );
}
