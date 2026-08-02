"use client";

import { usePrefersReducedMotion, useReveal } from "@/lib/motion";

type As = "div" | "section" | "p" | "span" | "li" | "h2";

/* The rendered tag is a prop, so the ref can't be narrowed to one element
   type. This is the shape we actually pass; React 19 takes ref as a prop. */
type TagProps = {
  ref?: React.Ref<HTMLElement>;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};
/* Built once at module scope. Casting inside the component body would count
   as creating a component during render, which resets state on every pass. */
const tag = (t: string) => t as unknown as React.ComponentType<TagProps>;
const TAGS = {
  div: tag("div"),
  section: tag("section"),
  p: tag("p"),
  span: tag("span"),
  li: tag("li"),
  h1: tag("h1"),
  h2: tag("h2"),
} as const;

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. `delay` staggers siblings; keep it under ~200ms or the page starts
 * feeling like it's waiting on you.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: As;
  id?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useReveal<HTMLElement>(!reduced);
  const Tag = TAGS[as];

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

/*
 * Headline treatment: each line sits in an overflow-hidden track and slides up
 * from beneath its own mask, staggered. This is the move behind most
 * award-site hero type — the mask is what separates it from a plain fade,
 * because the text appears to be uncovered rather than to materialise.
 *
 * Splitting is by line, supplied explicitly, rather than by measuring wrapped
 * text: measuring re-runs on every resize and fights the font swap.
 */
export function RevealLines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 90,
  as = "h1",
  id,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "p";
  id?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useReveal<HTMLElement>(!reduced);
  const Tag = TAGS[as];

  return (
    <Tag ref={ref} id={id} className={`reveal-lines ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className={`reveal-line ${lineClassName}`}>
          <span
            className="reveal-line-inner"
            style={{ "--reveal-delay": `${delay + i * stagger}ms` } as React.CSSProperties}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
