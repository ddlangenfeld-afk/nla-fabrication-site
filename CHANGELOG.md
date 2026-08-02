# Build Log — NLA Fabrication Website

Running log of the overnight build session. Newest entries at the bottom.

---

## 2026-08-02 · 07:25 — Session start, scaffold

- Read full brief. Empty repo; scaffolded Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + ESLint, `src/` layout, `@/*` alias.
- Installed `stripe` and `resend` SDKs.
- **Note:** `npm audit` reports 3 high-severity findings, all in Next's own bundled `postcss`/`sharp`. The proposed "fix" downgrades Next to 9.x — not a real fix. Not actionable at app level; tracking upstream is a launch-checklist item.

## 2026-08-02 · 07:35 — Foundation

- **Design tokens** in `globals.css` via Tailwind v4 `@theme`: named surfaces (`bg`, `bg-raised`, `bg-overlay`, `bg-inset`), line colors, three ink levels (all AA on the base background), one accent (amber), success/error. One deliberate dark theme, no toggle — see design-direction entry below for why.
- **Product data** as local JSON (`src/data/products.json`) with a typed access layer (`src/lib/products.ts`) — structured so a future headless CMS swap only replaces the lib's internals. All 3 launch products + 7 pipeline items from the brief, with real OEM references (77540-S04-003ZA), fitment phrasing kept to the trademark-safe pattern ("Fits 1996–2000 Civic (EK/EJ chassis)"), launch prices picked inside the brief's ranges: latch $22, knob set $14, bezel $18/side (LH/RH variants).
- Site constants (`src/lib/site.ts`) use clearly-fake placeholder domain/email (`*.example.com`) overridable by env vars — no fabricated business details.

## 2026-08-02 · 07:45 — Design directions (the decision entry)

Built three genuinely different mockups (`design-explorations/*.html` — open in any browser), screenshotted at 1440px, and critiqued against the brand goals:

**Direction A — "Spec Sheet."** Engineering-drawing language: hairline grid backdrop, title-block spec tables, part numbers as first-class UI, mono for data + grotesque display for headlines, amber accent. *For:* it works **with** the no-photography constraint — technical line-art placeholders are native to the aesthetic, not an apology; it showcases the founder's actual hard-surface CAD identity; it speaks the audience's language (enthusiasts search by OEM part number); no competitor in this niche looks like this. *Against:* can read cold; hairline density needs restraint on mobile.

**Direction B — "Garage Editorial."** Oversized editorial type, warm near-black, story-first hero ("The parts they stopped making."), rounded photo cards. *For:* strongest emotional voice; the founder story is genuinely good material. *Against (fatal):* the whole direction leans on photography and warm product renders that don't exist yet — every placeholder reads as a hole in the design. Right direction for a phase-2 refresh once real renders exist; wrong for launch.

**Direction C — "Industrial Catalog."** McMaster-Carr-style utilitarian dark catalog: search-forward header, dense grid, blue accent. *For:* instantly credible as "a real parts supplier"; best information density. *Against:* visually anonymous — nothing about it says "designed by someone whose actual skill is 3D design"; the brief asks for a site of Awwwards-studio caliber, and C is a template.

**Decision: Direction A**, with two borrowings — B's story-led copy voice (the "why these parts exist" narrative gets real homepage space, not a footer link) and C's information-forward product cards (part number, fitment, and status visible at grid level). Amber accent over blue: warmer against near-black, and blue+dark reads as generic SaaS.

Also decided here: **one deliberate dark theme, no light toggle.** The brand is matte black and brushed metal; a light mode would need a second full palette pass to stay AA-compliant and adds nothing for this audience. `prefers-reduced-motion` is respected instead — accessibility budget spent where it matters.

## 2026-08-02 · 08:05 — Session stopped early by request

Work stopped here at the founder's request, mid-build. **The site does not build or run yet** — this commit is a checkpoint, not a deliverable.

**Done:**
- Design tokens, product data + typed access layer, cart state (`localStorage`, React context)
- Root layout: font loading (Inter / Space Grotesk / IBM Plex Mono, `display: swap`), sitewide `Organization` JSON-LD, skip link, theme-color
- Header (with mobile menu + live cart count), Footer
- `ProductArt` — hand-drawn SVG technical line-art placeholders per part, engineering-drawing style with dimension lines
- Pages: Home, Shop, Product detail (`/products/[slug]`, SSG via `generateStaticParams`, `Product` JSON-LD, per-page metadata), About

**Not done — required before this runs:**
- `/contact`, `/cart`, `/legal/privacy`, `/legal/terms`, `/legal/shipping-returns` pages. These are **linked from the header and footer but don't exist**, so the build will fail on typed routes.
- `/api/checkout` (Stripe hosted session) and `/api/contact` (Resend + mailto fallback)
- `sitemap.xml`, `robots.txt`, OG image, favicon, 404 page
- Every polish pass: accessibility audit, responsive QA at 375/768/1440, empty/error states, Lighthouse
- README

**No API keys were set or fabricated.** Stripe and Resend keys are still needed before checkout or the contact form can work.

## 2026-08-02 · 08:20 — Push blocked, then unblocked

`git push` failed with HTTP 403 from the git proxy on all retries; a fallback push through the GitHub API failed identically (`403 Resource not accessible by integration`) on the first file. Same root cause, not a network problem: the GitHub App install had read but not write access to this repo. Founder fixed the repository scope, and the retry pushed clean on the first attempt. No partial or corrupt state was written in the meantime — the repo had zero branches throughout.

## 2026-08-02 · 08:50 — v1 feature-complete

**Pages finished:** `/contact` (validated form), `/cart`, and the three `/legal` stubs — the routes that were linked but missing, which is exactly what had been breaking the build. Plus `not-found.tsx` (404) and `error.tsx` (error boundary).

**Commerce:**
- `POST /api/checkout` creates a Stripe hosted Checkout session. **Security decision:** the client sends only slugs, variant IDs, and quantities — never prices. The route re-reads every price from `products.json` server-side and drops any line that isn't an available product. A tampered cart payload therefore can't change what gets charged. Quantities clamp to 1–99.
- `POST /api/contact` validates server-side, then sends via Resend. With no `RESEND_API_KEY` it returns `not_configured` (HTTP 200, not an error) and the client renders a **prefilled `mailto:` link** carrying whatever the visitor already typed — the brief's required fallback, and it means an unconfigured deploy still lets someone make contact.
- Same principle for Stripe: with no key, the cart explains that checkout isn't live rather than throwing an error at the buyer.

**SEO:** generated `sitemap.ts` (available parts priority 0.8, pipeline 0.4) and `robots.ts` (`/cart` and `/api/` disallowed — one is per-visitor, the other returns JSON). Generated OG image via `next/og` reusing the site's blueprint grid and amber palette. SVG favicon: corner brackets + amber crosshair — "NLA" is illegible at 16px, a technical-drawing mark isn't. Deleted the `create-next-app` default favicon.

**Cart rewritten on `useSyncExternalStore`.** React 19's `react-hooks/set-state-in-effect` rule flagged the original `useEffect` + `setState` hydration pattern, and it was right to: localStorage is an external store, not React state. The rewrite gives a correct server snapshot (empty) and a real post-hydration one, **plus free cross-tab sync** through the `storage` event — edit the cart in two tabs and both stay honest. Dropped `CartProvider` entirely; the store is module-level, so its mutators are referentially stable and safe as effect dependencies.

Three further set-state-in-effect errors fixed at the source rather than suppressed: the header now closes its mobile menu on link click (the actual triggering event) instead of watching `pathname` in an effect, and the cart reads Stripe's return params via `useSearchParams` at render time behind a Suspense boundary, which keeps `/cart` prerenderable.

**Verified:** `npm run lint` clean, `npm run build` green — 26 routes, product pages SSG via `generateStaticParams`.

**README** written: real-vs-stubbed table, the five env vars and what degrades without each, architecture map, trademark rules, phase-2 roadmap, pre-launch checklist. `.env.example` committed (with a `.gitignore` exception) so required keys are self-documenting.

**Flagged honestly:** the dimension callouts in the technical drawings (`148 mm`, `62 mm`, `PITCH 50`) are illustrative, not measured. On a fitment-critical part a wrong published dimension is worse than no dimension — these need real figures or removal before launch. Called out in the README's pre-launch checklist.
