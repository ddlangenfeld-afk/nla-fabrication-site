"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
 * A media query is an external store, same as localStorage — subscribing to it
 * with useSyncExternalStore rather than useEffect + setState keeps it correct
 * across hydration and picks up a mid-session change to the OS setting.
 */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True when the visitor has asked for reduced motion. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    // The server can't know; assume motion is fine and correct after hydration.
    () => false
  );
}

type HeaderState = {
  /** Hide the bar entirely — scrolling down, past the intro. */
  hidden: boolean;
  /** Past the top, so the bar can take a background and a hairline. */
  stuck: boolean;
};

/*
 * Hide-on-scroll-down, reveal-on-scroll-up.
 *
 * Two details make the difference between this feeling considered and feeling
 * twitchy, and both come from watching how the good implementations behave:
 *
 *  - A movement threshold. Reacting to every pixel makes the bar flicker on
 *    trackpads and during momentum scrolling, so direction only counts once
 *    the scroll has actually travelled a few pixels.
 *  - A reveal zone at the top. Near the top the bar is always shown, so it
 *    can't get stuck hidden after an anchor jump or a bounce.
 */
export function useHeaderScroll(): HeaderState {
  const [state, setState] = useState<HeaderState>({ hidden: false, stuck: false });
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const THRESHOLD = 6;
    const ALWAYS_SHOW_ABOVE = 80;

    lastY.current = window.scrollY;

    function update() {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;

      if (Math.abs(delta) > THRESHOLD) {
        const goingDown = delta > 0;
        setState({
          hidden: goingDown && y > ALWAYS_SHOW_ABOVE,
          stuck: y > 8,
        });
        lastY.current = y;
      } else {
        setState((s) => (s.stuck === y > 8 ? s : { ...s, stuck: y > 8 }));
      }
      ticking.current = false;
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return state;
}

/**
 * Adds `data-revealed="true"` to an element the first time it enters the
 * viewport. One observer per element, disconnected after it fires — reveals
 * are a one-way trip, so nothing keeps running after the work is done.
 */
export function useReveal<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!enabled || typeof IntersectionObserver === "undefined") {
      node.dataset.revealed = "true";
      return;
    }

    // Already on screen at mount (above the fold): reveal on the next frame so
    // the transition still plays rather than snapping.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.disconnect();
        }
      },
      // Fire slightly before the element's top edge arrives, so content is
      // settled by the time it's properly in view.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
