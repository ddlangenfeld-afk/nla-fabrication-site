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

## 2026-08-02 · 09:30 — Visual QA + accessibility pass (first full loop)

Set up a repeatable review rig rather than eyeballing: static-export the site, screenshot all 9 routes at 375/768/1440 under Chromium, and run axe-core against every route at two widths. All three scripts live in the session scratchpad and get re-run each loop.

**Also published a live preview** the founder can open any time — the real prerendered pages with real CSS and self-hosted fonts inlined into a single page, with a route rail and a 375/768/1440 switcher. Redeployed to the same URL at each milestone.

**Design fixes found by actually looking at it:**

- **The shop page had its emphasis backwards.** Seven "coming soon" cards visually outweighed the three parts a visitor can actually buy — the pipeline occupied roughly two-thirds of the page. Worse, several pipeline items share a schematic (`clips` used twice, `bracket` twice), so the grid showed literally identical drawings side by side, which reads as a bug rather than a placeholder. Replaced the pipeline cards with a dense `PipelineList` on both home and shop. The page got 27% shorter and the three real products now lead.
- **Mobile pipeline rows truncated** four of seven part names ("Weatherstrip End Retainers & Clip…") because the per-row "Coming soon" label ate the width. The section heading already establishes the status, so that label is now hidden below `sm` and the names wrap instead.
- **Product page had a tall empty gap** on the left below the spec table at desktop. Moved the aftermarket/trademark disclaimer there — it's a statement about the part numbers directly above it, so it reads better *and* fills the void.
- **"Also available" always renders exactly two cards** (there are only three purchasable parts), which left a hole in a three-column grid. Now a constrained two-up.

**Accessibility — WCAG 2.1 AA, clean across all 9 routes at 375 and 1440:**

- axe found one real violation: **inline prose links signalled by colour alone** (amber on grey is 1.12:1, and 1.4.1 wants ≥3:1 or a non-colour cue). Added a `.link-inline` treatment — underline with a tinted decoration colour that solidifies on hover — and applied it to every link sitting inside running text. Nav, card, and button links are deliberately exempt: position already distinguishes those, and axe agrees.
- Keyboard pass caught something axe cannot: **the skip link didn't skip.** Activating it moved the hash but left focus on `<body>`, so the next Tab restarted at the top of the page — the link was decorative. Added `tabIndex={-1}` to `<main>`; focus now genuinely lands there. Verified tab order across the first 12 stops, every one with a visible amber focus ring, and confirmed the mobile menu toggles `aria-expanded` correctly and closes on navigation.

**Favicon (this loop):** `/favicon.ico` was 404ing on every page load — browsers, crawlers, and link unfurlers request it regardless of what `<link rel="icon">` says. Next won't emit a `favicon.ico` route while `icon.svg` sits beside it in `app/`, so the ICO now lives in `public/`. Generated a real 16/32/48px multi-size ICO from the SVG via sharp (830 bytes) rather than shipping a single-size stub.

## 2026-08-02 · 10:15 — Form validation, checkout confirmation route, flow testing

**Contact form had no validation at all.** It carried `noValidate` (correctly, to replace native bubbles) but never implemented a replacement — submitting an empty form just POSTed, got a 400, and showed a generic "something went wrong". The brief explicitly asks for validation states, and this was the gap.

Rewrote it with per-field validation: errors appear on blur or submit, never on the first keystroke (flagging "invalid email" while someone is still typing it is hostile), and clear as soon as the field is fixed. Each invalid field gets `aria-invalid` and an `aria-describedby` pointing at its message, and submitting an invalid form moves focus to the first problem so keyboard and screen-reader users land on it instead of hunting. Messages say what to do rather than what failed — "A few more words would help — 3 more characters minimum" over "Invalid input".

**Checkout confirmation moved to its own route.** `/cart/success` replaces `/cart?success=1`, and `cancel_url` is now plain `/cart` (returning someone to their untouched cart is self-explanatory). This drops `useSearchParams` and the Suspense boundary from the cart entirely, and gives the order a real URL — standard e-commerce shape, better for analytics. The confirmation page clears the local cart and is `noindex, nofollow`.

**Correction, recorded honestly:** I first moved this route because I believed a Suspense boundary was breaking `useSyncExternalStore` and pinning the cart on its skeleton. That diagnosis was wrong. The actual cause was my own test: `innerText` reflects CSS `text-transform`, so asserting `includes("Order summary")` failed against the rendered "ORDER SUMMARY". The cart had been working correctly the whole time. The route split is kept because it's better architecture, not because it fixed a bug — and the lesson is that two of my three "failures" this loop were the harness, not the app.

**Built a flow test suite** covering what screenshots can't: empty-form submit, bad email, too-short message, error-clearing on fix, the mailto fallback, add-to-cart with a variant, quantity adjustment, totals, persistence across reload, the empty state after removal, and checkout with no Stripe key. All pass with no page errors.

**Accessibility re-audited in interactive states**, not just at rest — contact form with validation errors visible, populated cart, order confirmation, and the mobile menu open. Clean at 375 and 1440.

## 2026-08-02 · 10:50 — Lighthouse pass: 100 across the board

Ran Lighthouse against home, shop, product detail, and contact.

**Final: Performance 100 · Accessibility 100 · Best Practices 100 · SEO 100** on all four. LCP 0.4–0.6 s, CLS 0, TBT 0 ms. The brief asked for 90+; this clears it.

The first run scored 96 on accessibility and best practices, and the two audits behind that were both real — and both invisible to axe, which is a useful reminder that one tool isn't a pass:

- **WCAG 2.5.3, Label in Name.** The cart link carried `aria-label="Cart, 2 items"`, which replaced the accessible name wholesale. The visible text is "Cart" plus the badge digit, and the label doesn't contain that combination — so a voice-control user saying "click Cart 2" could fail to match. Removed the label; the badge digit is now `aria-hidden` with the count supplied as screen-reader-only text, so the name resolves to "Cart, 2 items" while still containing the visible "Cart".
- **WCAG 2.5.8, Target Size.** Header nav links, the wordmark, and every footer link were 17 px tall against a 24 px minimum — a bare text line box with no padding. Added vertical padding to take them past 24 px and traded the footer's `space-y-3` for `space-y-1.5` so the columns keep the same rhythm now that each link carries its own padding.

Also confirmed the console 500s in the first run were my own workflow, not the site: I had rebuilt while a server was still running, so it was serving HTML that referenced chunk hashes the new build had replaced. Clean on a fresh server.

Re-verified after the changes: 18/18 axe scans clean, all interactive states clean, full flow suite passing.

## 2026-08-02 · 11:20 — Contact page redesign

Reviewed the contact page at 1440 and it was the weakest page on the site: a single column of 720px-wide inputs (a first name stretched across the full column), the whole right half empty, and the hero's left edge sitting inboard of the form because the hero used `max-w-3xl` while the body used `max-w-6xl`.

- **Paired name and email** into a two-up row. Short fields at sensible widths instead of one very wide column.
- **Added a "What helps" rail** rather than just narrowing the form — space that does work instead of space that's merely empty. It asks for the chassis and year, a photo of the failure, an OEM number if they have one, and the checkout email for order questions. All four exist so the first reply can answer the question instead of asking for details, and it closes with a nudge on how to suggest a pipeline part.
- **Aligned the hero to `max-w-6xl`** so both sections share a left edge.

Re-verified after: 18/18 axe scans clean, all interactive states clean, flows passing, Lighthouse still 100/100/100/100.

## 2026-08-02 · 11:50 — QA scripts moved into the repo

The five checks driving this build lived in a session scratchpad, which meant they'd vanish with the container and the founder couldn't re-run any of the numbers in the README. Moved them to `scripts/` behind `npm run qa:*`, with `axe-core`, `lighthouse`, and `playwright` as devDependencies.

Two portability fixes were needed to make them run anywhere rather than just here:

- **Browser resolution.** The project's Playwright expects browser build 1234; this container ships 1194 pre-installed, and the environment forbids `playwright install`. `scripts/browser.mjs` now honours `CHROME_PATH`, then looks for a pre-installed build under `PLAYWRIGHT_BROWSERS_PATH`, then falls back to Playwright's own managed build — so it works in a sandbox, in CI, and on a laptop.
- **Lighthouse debug port.** It was hardcoded to 9222, which silently reconnects to a Chrome left over from a previous run and reports every score as 0. Now binds a free port per run.

Also worth recording: a Lighthouse run that reported all zeros turned out to be `CHROME_INTERSTITIAL_ERROR` because the server under test had died, not a site problem. Third time this session that a red result was the harness rather than the code — hence `scripts/README.md`, which documents each script's purpose and the `innerText`/`text-transform` trap that produced two earlier false failures.

`BASE_URL` retargets any script at a deployment.

## 2026-08-02 · 12:10 — Order confirmation given substance

The confirmation page was a lone green panel floating in space — thin treatment for the highest-trust moment in the funnel, and the one place where unset expectations turn into support email.

Added a **"What happens next"** sequence: confirmation email (now), part gets printed (3–5 business days), shipped with tracking (after printing). Numbered, because this genuinely is a sequence where each step waits on the one before — not decoration. The right-hand timing column reads as a spec-sheet table, consistent with the rest of the site.

The second step does real work: "nothing is sitting on a shelf — every part is printed to order" explains a lead time that would otherwise look like slow fulfilment, and reframes it as the thing that makes the parts good.

## 2026-08-02 · 12:25 — Attempted: custom font in the OG image (reverted)

The Open Graph card renders its headline in a generic sans rather than Space Grotesk, because `next/og` runs outside the `next/font` pipeline and `ImageResponse` needs the font handed to it as a buffer. On the site's most-shared asset that undercuts a typographic direction the brief treats as central, so it was worth a try.

It didn't work, and the attempt is recorded rather than quietly dropped:

1. Committed the Latin subset `next/font` already generates → satori rejects WOFF2 outright (`Unsupported OpenType signature wOF2`).
2. Decompressed it to TTF with `wawoff2` → satori then failed parsing it (`Cannot read properties of undefined (reading '256')`). Space Grotesk is a variable font, and satori's parser doesn't handle this subset.

Getting there properly means sourcing a static (non-variable) Space Grotesk instance rather than reusing the site's subset. That's a small, self-contained task, but not one to leave half-finished — **reverted entirely; the build is green and the card still renders correctly** in a fallback sans that is visually close and fully on-brand in colour, grid, and layout.

Logged as a nice-to-have in the README, not a defect.
