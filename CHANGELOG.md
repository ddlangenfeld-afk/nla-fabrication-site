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

## 2026-08-02 · 13:10 — Three.js hero, scroll motion, scroll-aware header

Founder overrode the brief's phase-2 scoping and asked for the 3D layer, a retracting header, and scroll-triggered text — referencing what award-winning WebGL sites do. Implemented the techniques those sites are built on rather than copying any particular one: sticky scroll-linked geometry, pointer parallax, rim lighting on near-black, masked line reveals, and a hide-on-scroll bar.

**The hero object is the latch, not an abstraction.** The temptation with a WebGL hero is a particle field or a floating blob. Neither says anything about this business. The object is the glove box latch modelled from primitives — the same part the 2D drawings show, in the medium the shop actually works in — rendered as matte dark plastic with CAD edges, amber on the two pieces that actually fail (pull bar, spring tab). It's the founder's hard-surface skill stated as the hero rather than described in copy.

**It lives inside the spec card.** The first attempt put a full-bleed canvas behind the whole hero. It read as mud — near-black geometry on a near-black ground — and it collided with the spec title-block card, two focal points fighting. Moving the canvas *into* the card's drawing area made it a live CAD viewport with the title block beneath: one object with its data attached, corner ticks framing it, and the existing 2D drawing as the natural fallback in the very same box.

**Motion, and what it costs:**
- `useHeaderScroll` retracts the bar going down and returns it going up, with a 6px movement threshold so trackpad jitter doesn't flicker it, an always-visible zone near the top so it can't get stuck after an anchor jump, and a hard rule never to retract while the mobile menu is open.
- Scroll reveals via one `IntersectionObserver` per element, disconnected after firing — reveals are one-way, so nothing keeps running afterwards.
- `usePrefersReducedMotion` rewritten onto `useSyncExternalStore` (the lint rule caught the effect+setState pattern again, and was right again — a media query is an external store, same as localStorage).

**The performance lesson, measured rather than assumed.** Adding the 3D dropped home from 100 to 97, LCP 0.6s → 1.1s. My first guess was the WebGL bundle. Measuring the actual LCP entry showed the element was `span.reveal-line-inner` — the headline — and the real cause was that a JS-driven reveal can't un-hide its element until hydration, so the LCP element was gated behind the whole bundle.

Fixed by splitting the two cases: **above-the-fold entrance is now CSS-only keyframes** that start at parse time, while below-the-fold content keeps the observer (it has hydrated long before anyone scrolls to it). LCP back to 0.6s.

**Final: home 97–98, every other page 100**, all four categories. The residual is ~130ms TBT from three.js parse, gated behind the `load` event and then idle. Accessibility stayed at 100 and all 18 axe scans stayed clean — the canvas is `aria-hidden` decoration and never enters the tab order.

**Not shipped to phones.** Coarse pointer under 768px skips WebGL entirely and keeps the drawing; no-WebGL browsers do the same. A continuously rendering canvas is the wrong trade for a battery, and the fallback is a real design, not a blank box.

## 2026-08-02 · 13:35 — Fixed: scroll-revealed content invisible without a live observer

Founder reported phone view broken. Root cause, found by testing rather than guessing: the scroll reveals added in the Three.js pass (`.reveal` / `.reveal-lines`) hid content by default and only showed it once an `IntersectionObserver` fired via client JS. **The live preview link redeploys a script-stripped static export** — by design, so the artifact renders without a server — which meant every one of that observer's targets stayed at `opacity: 0` forever there: the product-card grid, "Three parts you can stop hunting for," the whole story section, the pipeline heading. That's almost certainly what showed up as "broken" on a phone.

This wasn't only a preview-tool problem. The same architecture would permanently hide that content for any real visitor whose JS is slow, blocked, or throws before the observer attaches — a genuine regression versus the plain server-rendered HTML this site had until this pass.

**Fix — standard progressive-enhancement pattern:**
- `layout.tsx` gets a `next/script` `beforeInteractive` snippet that stamps `.js` on `<html>`, running synchronously before first paint.
- `globals.css`: the reveal-hiding rules now live under `.js .reveal` / `.js .reveal-line-inner` instead of applying unconditionally. No `.js` class — JS never ran, was blocked, or is a script-stripped export — and the content is simply visible, full stop.
- `useReveal` gets a 4-second fallback timer alongside the observer, so even a real JS-enabled visitor is protected against an edge case where the observer callback never fires (element inside a zero-size ancestor at observe-time, bfcache restore, browser quirk).

**Verified with the strongest test available**: a Playwright context with `javaScriptEnabled: false` — no JS runs at all, not even the flag script. Every section renders correctly. Re-ran with JS enabled and confirmed the animations still play exactly as before. Full regression suite (axe, states, flows, Lighthouse) stayed green: home 98, all other pages 100.

Every other page and flow checked at 375px against the fix was unaffected — product, about, contact, cart, the mobile menu, and the header retract/reveal all worked correctly before this change too; the bug was scoped to the home page's below-the-fold sections that used the new `Reveal`/`RevealLines` components.

## 2026-08-02 · 15:40 — Vercel was deploying, just never to Production

Founder connected the repo to Vercel and got a plain `404: NOT_FOUND` — Vercel's own fallback page, not this site's styled one. Checked the deployment's source in the Vercel dashboard: it was building commit `4ec99a5`, the very first checkpoint pushed to this branch, which this very changelog documented at the time as **"the site does not build or run yet."** That commit predates `/contact`, `/cart`, and `/legal`, while the header and footer already linked to them — a genuine Next.js build failure, which is exactly why Vercel showed "No framework detected" and had nothing to serve.

Not a code bug, though — a clean-room check (fresh clone, `npm ci`, `npm run build`, identical to what Vercel runs) built the current `HEAD` without any errors. Every one of the 10 commits since that checkpoint had actually built successfully on Vercel too — each showed "Ready" in the deployments list. **The real fault: only that first commit was tagged `Production`.** All 10 since had been landing as `Preview` deployments, invisible from the live domain, because Project Settings → Environments → Production had **Branch Tracking set to `main`** — a branch that has never existed in this repo. It started empty and `claude/new-session-gc5iwg` became its default branch by necessity; Vercel's import flow guessed the conventional name instead of reading the repo's actual `HEAD` ref.

Fixed by the founder in the dashboard: Branch Tracking → `claude/new-session-gc5iwg`, saved. Every push here now promotes straight to Production instead of stacking up unpromoted Previews.

## 2026-08-02 · 17:20 — New theme, full-width layout, contained cursor control

Founder's review of the live site: not enough 3D, wanted hover scale on nav, scroll-position/opacity animation, cursor rotation confined to the NLA-001 box, a different background theme, and the desktop layout was "only utilizing the middle of the screen."

**Layout.** The old container was `max-w-6xl` — 1152px. On a 1920 display that left ~770px of empty margin, which is exactly what he was seeing. New `.shell` runs to 1600px with padding that scales to 3.5rem at xl. Running text keeps a sane measure inside it rather than stretching to 1600px, and the hero headline steps up again at 2xl. Three width-related layout faults surfaced once things were wide: a void under the hero CTAs (fixed by centring the two hero columns against each other), a half-empty story heading column (now sticky, so it holds position while the prose scrolls past), and pipeline rows so wide that "COMING SOON" floated a metre from the part name (list capped at 5xl).

**Theme.** The hairline blueprint grid is gone everywhere, including the 3D scene's backdrop and the OG card. Replaced by an atmospheric treatment: deeper ground (`#07080a`), two volumetric glows in amber and steel-blue, a vignette, and a fine SVG-noise grain so the large dark fields don't band. Surfaces became glass — translucent, blurred, with a lit top edge. The steel-blue is deliberately confined to lighting and glow so amber stays the only brand accent.

**Interaction.** Nav links and the wordmark scale and lift on hover with an underline that draws in from the left; product cards rise out of the page with a warm cast beneath; accent buttons take a travelling sheen. Scroll reveals got a longer throw and a blur-in variant.

**Cursor control, as asked.** The hero part was reading `pointermove` in window coordinates, so it reacted to the cursor anywhere on the page. It now measures against the canvas's own bounding box and only responds while the cursor is inside it, with the influence eased in and out so it settles back to its idle spin rather than snapping. It also leans very slightly toward the viewer while engaged.

**The sitewide ambient WebGL layer: built, measured, cut.** "More 3D" was read as a full-viewport particle-and-volume canvas behind every page. Built it, then measured it:

| | Performance | TBT (home) |
| --- | --- | --- |
| Ambient canvas on | 61–64 | 37,120 ms |
| Ambient canvas off | 95–100 | 180 ms |

That was *after* moving the per-particle drift out of a per-frame JS loop into a vertex shader, capping DPR to 1, and pausing the loop on tab-hide — the first CPU-driven version measured ~16s on home and ~7.5s on pages that previously had no canvas at all. The test rig has no GPU so software rasterisation inflates it, but this is a permanent every-page cost for what amounted to a faint drifting haze, and it would land hardest on exactly the low-end hardware least able to absorb it.

Cut it. The CSS atmosphere carries the depth on its own, and every page went back to 95–100. **WebGL stays where it earns the cost: the hero viewport** — one contained canvas, one page, showing the actual product. If more 3D is wanted, the place to spend it is a rotatable viewer on each product page, which needs the other two parts modelled first; a background haze was the expensive way to buy less.

Final: home 95, every other page 100, all four categories. 18/18 axe scans, interactive states, flows, and keyboard all still clean.

## 2026-08-02 · 19:05 — Motion everywhere, a living background, and synthesised sound

Founder's second review of the live site, point by point: hover states only exist on the home page, the scroll-in animation "is just already there" on every page, there's still blank space left and right on desktop, the background gradient should move, a brightness effect should follow the cursor, and there should be ambient music with hover and click sounds.

**"I'm not seeing the animation" — half right, and the measurement said which half.** Wrote a probe that samples computed opacity frame by frame on a below-the-fold element. Home page:

```
below fold, before scroll: { text: 'Available now', opacity: '0' }
during reveal:            0.00 → 0.54 → 0.80 → 0.90 → 0.96 → 0.99
```

So the reveals were animating — on home. The actual fault was that **about, contact, shop and the product page had no `Reveal` components at all.** They were built before the motion pass and never went back through it. That is exactly "it's just already there," and it was true for four pages out of five.

Now every page reveals. The pattern is the same one the LCP work established and is worth restating, because it's easy to get backwards: **above the fold is CSS-only keyframes, below the fold is the observer.** Each page's `h1` uses `.hero-in`/`.hero-line`, which start at parse time and can't be gated behind hydration; everything past the first screen uses `Reveal`/`RevealLines`. The throw also went from 24px to 44px over 1s, because at the previous settings the founder looked straight at a working animation and didn't see one.

**Hover states, everywhere they were missing.** About: process steps became cards that rise with a warm cast; the closing CTA lifts. Contact: form fields light their border on hover, the submit button takes the travelling sheen, and each "what helps" row shifts right with its left border lighting. Footer links draw an underline and step right. Product page: breadcrumbs, feature rows.

**Layout.** `.shell` was capped at 1600px, which is fine at 1920 and leaves a 2560 display mostly margin. It's now `min(2200px, 94vw)` — fluid, so it tracks the viewport instead of stopping at a number, with padding scaling to 3rem. About was worse than the rest: it was `max-w-3xl` centred, a reading column on a page that had room for a layout. It now uses the shell with sticky label columns and a four-across process row.

**A background that moves.** Three blurred light volumes — amber, steel-blue, amber — drifting on 34s / 42s / 50s cycles that never line up, so the field keeps recombining. They animate on `transform` only, which the compositor handles off the main thread. Measured the blur cost properly rather than assuming: home scored 88 / 88 / 89 at `blur(90px)` / `blur(70px)` / none, i.e. inside run-to-run noise, so it kept the blur.

**And a brightness that follows the cursor**, over the top of it: a radial gradient positioned from `--mx`/`--my`, written inside a `requestAnimationFrame` rather than in the `pointermove` handler — a high-polling mouse fires well above 60Hz and every write invalidates the gradient. It fades out when the pointer leaves the document, and never attaches on touch or under `prefers-reduced-motion`.

**Sound, synthesised — no audio files.** Every tone is generated by the Web Audio API at runtime:

- **Ambient pad.** Five voices on a minor-ninth A, each doubled ±6 cents so they beat against each other, each amplitude-driven by its own slow LFO, through a lowpass that sweeps over ~50 seconds. Space comes from two damped feedback delays rather than a convolver — same sense of a large room, a fraction of the CPU, and it matters because this runs the whole time the tab is open.
- **Hover.** A two-partial blip at 1864/2794Hz with a slight downward glide, rate-limited to one per 70ms so dragging across a nav doesn't machine-gun.
- **Click.** A bandpassed noise transient over a short low body — a switch closing, not a beep.

Three reasons this isn't a file: an ambient loop is 2-4 MB, which is more than the entire rest of the site; there's no stock-music licence to get wrong for a business that has to ship legally clean; and it never audibly repeats.

**It is off by default and stays off until asked for.** Browsers block autoplay anyway, but the real reason is that unsolicited audio is the most hostile thing a site can do. There's a docked toggle bottom-right, the preference persists, and nothing — not the `AudioContext`, not the oscillators — is constructed until it's switched on. Hover and click sounds ride the same switch, delegated from two document-level listeners so components that know nothing about audio (cart, contact form, product cards) don't have to.

**Bugs found and fixed in the process:**

- **The sound dock wasn't docked.** It used `.surface` for the glass plus Tailwind's `fixed`. `.surface` sets `position: relative` and lives outside Tailwind's layers, so it won the cascade and the control rendered in flow at the bottom of the document. Caught by asserting on its bounding box, not by looking at it — at the bottom of a full-page screenshot the two are indistinguishable. It has its own `.sound-dock` class now.
- **Invalid `<dl>` on contact.** Wrapping each row in both a `Reveal` and a hover div gave `dl > div > div > dt`; a description list may wrap each pair in one `div` and no more. One reveal around the whole rail instead — which also lets the rows keep fast hover transitions rather than sharing an element with a 1s staggered reveal.
- **False contrast failures in the axe runs.** Home and contact started failing colour contrast at 1.05:1. Neither was a defect: axe measures whatever is on screen when it runs, and it was running mid-reveal, on amber at 5% opacity. The scan now snaps every reveal to its end state first, so it measures what a reader actually reads. Same fix applied to the screenshot runner, where it was quietly worse — full-page shots capture sections the observer will never fire for, so everything below the fold came out blank.

**New QA suite: `npm run qa:motion`.** Asserts that every page has reveals, that a below-fold one starts offset and settles to `opacity: 1 / transform: none`; that the spotlight tracks the pointer and the orbs are animating; and — by tapping the `AudioContext` through an analyser and counting oscillators — that the toggle starts off, that the pad produces real signal, that hovering a link fires a blip, that pressing one fires a click, that **body text is silent**, that the preference survives a reload, and that switching off closes the context.

**Final: home 91, every other page 100**, all four categories, LCP 0.6s and CLS 0 across the board. 18/18 axe scans, 7/7 interactive states, flows, keyboard, and 20/20 motion+audio checks clean. Screenshots now also cover 1920 and 2560 for the width work.

**Follow-up from the 2560 screenshots.** Widening the shell moved the empty space rather than removing it on shop: the pipeline list still carried a 1024px cap (added earlier so "COMING SOON" wouldn't float a metre from the part name), so that section filled a third of the screen. It's two columns past 2xl now — short rows *and* the full width. The shop header splits at xl too, with the counts beside the intro instead of stacked under it. Verified no horizontal overflow at 375 or 2560.

## 2026-08-02 · 21:40 — Reversible reveals, marketplace links, and a company voice

Three requests: replay the scroll animations instead of firing once, add Etsy/eBay storefront links, and take the copy from passion-project to established business.

### Reveals now replay

`useReveal` was built as a one-way trip — it disconnected its observer on first fire, which was the right call when the animation only had to happen once. It now stays connected and toggles `data-revealed` in both directions. That is a deliberate trade: "disconnect after first fire" is no longer available as an optimisation, and the cost is one live `IntersectionObserver` per revealed element for the life of the page. Measured on the pages with the most of them (about, 20 elements), it doesn't register.

The part that isn't obvious: **direction**. A naive reversible reveal slides everything up from below, so content that scrolled off the *top* comes back from the wrong side — the tell that a one-way animation was retrofitted. The observer now records which edge the element left by (`boundingClientRect.top < 0`) and CSS mirrors the transform, so content returns the way it went.

This broke the QA helper in a way worth recording. `settleReveals()` stamped `data-revealed="true"` on every element before scanning; with a live observer, anything off screen was immediately reset to `false`, so axe and the screenshot runner would have gone back to measuring hidden content. It now removes the `.js` class from `<html>` instead, which disables the hiding rules at the stylesheet — the same no-JS state the site already renders correctly. Simpler and it can't be raced.

### Marketplace storefronts

`NEXT_PUBLIC_ETSY_URL`, `NEXT_PUBLIC_EBAY_URL` and `NEXT_PUBLIC_AMAZON_URL` drive a block on the shop page, a footer column, and `sameAs` in the Organization structured data. All three read from one list in `lib/site.ts`.

**No placeholder URLs ship.** A plausible-looking Etsy link that 404s reads as an abandoned business faster than having no link at all, so each entry renders only when its variable is set. Verified by running the site with two of the three configured: both appeared in the shop block, the footer column and `sameAs`, with `target="_blank"` and `rel="noopener noreferrer"`; the unset third appeared nowhere; axe stayed clean at both widths with the block live.

On Amazon: it is set up but recommended against for now. Etsy and eBay accept a three-part catalog with no fixed monthly cost, and eBay in particular is where owners already search for discontinued interior parts — its parts-compatibility system is a genuine advantage for a fitment-driven catalog. Amazon charges a monthly professional plan before the first sale, applies stricter scrutiny to aftermarket parts that reference OEM numbers, and expects structured fitment data. It is worth revisiting when the catalog is deeper.

### Copy

Rewritten across every page, the product data, the OG card, the footer and the shipping policy. Out: "one-person shop", "apartment desk", "the founder restored his own Civic", "pick-a-part luck", "parts you can stop hunting for". In: failure analysis, supply verification, specification, fitment validation as a named release gate.

**Where the line was drawn.** Institutional "we" is ordinary business writing and is used throughout. Invented facts are not, and none were added: no headcount, no square footage, no years in business, no certifications, no units-shipped figures, no testing equipment. Everything the copy claims is either a process that genuinely exists (fitment validation on the chassis, material specified to the cabin environment, build orientation set to the load path) or a disclosure that was already true. The about page's "What we state up front" section keeps every disclosure the old "What this shop is honest about" section carried — aftermarket, not OEM, no manufacturer affiliation, printed ≠ moulded, interior only — because a company claiming reliability that buries its limitations is doing the opposite of what was asked.

### Fixed: four sections with no accessible name

Every `aria-labelledby` on the home page pointed at an ID that didn't exist, so those sections had no accessible name at all. Pre-existing, and the axe runner missed it because `aria-valid-attr-value` is a best-practice rule rather than one of the WCAG tags the runner filters to. The headings now carry the IDs.

### Fixed, by measuring: home page performance

Home had drifted to 87 — below the 90 bar — with 320ms of blocking time, and it was tempting to write off as a busy container. It wasn't.

`@react-three/drei` was in the bundle for exactly two components: `<Edges>` and `<Float>`. `<Edges>` renders through three-stdlib's fat-line stack (`Line2` / `LineMaterial` / `LineSegmentsGeometry`) to draw edges that are one pixel wide at this scale. Both were reproduced against three directly — `EdgesGeometry` + `LineBasicMaterial`, and three sine terms folded into the `useFrame` that was already running — and the dependency removed.

| | Chunk | TBT | Performance |
| --- | --- | --- | --- |
| With drei | 892K | 300–320 ms | 87 |
| Without | 868K | 140–190 ms | **95–97** |

The byte count barely moved; the *parse and evaluate* cost was the real charge, which is exactly the thing a bundle-size number hides. Geometry and materials also moved to module scope — they're immutable and shared, and the module only loads when the canvas mounts — and the part tree is memoised so React never re-renders it; every frame's work happens on refs.

Visual output verified identical against a captured frame of the hero.

**Final: home 95–97, every other page 100**, all four categories, LCP 0.6s, CLS 0. 18/18 axe scans, 7/7 interactive states, flows, keyboard, and 34/34 motion+audio checks including the new replay and direction assertions.

## 2026-08-02 · 23:55 — Finishes, and an operations dashboard

Two requests: sell the parts in colours without the colour range becoming a cost problem, and build somewhere to see what has been ordered, what it costs to make and what is actually left over.

### The colour research, and why it changed the answer

The brief was to find PETG colours that are cheap. Researching it properly says that is the wrong axis. Standard opaque PETG is one base resin with a different masterbatch, so black, white, grey, red, blue, orange and green all sell for the same price per kilo from the same brand. Picking "cheap colours" saves approximately nothing.

What actually costs money, in order:

1. **Inventory.** Every colour is a spool you have bought and are holding. Five colours is five spools of working capital on a shelf — and PETG is hygroscopic, so an opened spool degrades whether or not it gets printed. A slow-moving colour is a running loss, not just idle capital. **This is the constraint that sets the palette size**, and it is why the answer is five and not fifteen.
2. **Changeover.** Switching colour means purging the hotend: wasted material plus machine time producing nothing. It is charged per *switch*, not per part.
3. **Abrasive pigments.** The one place cost genuinely diverges. Metallic, sparkle, glow-in-the-dark and carbon-filled grades chew through a brass nozzle and need a hardened one. That is a real consumable cost and a real failure mode. None of them are in the palette.
4. **UV behaviour.** These parts live under a windscreen. Dark colours hide the yellowing PETG shows with age and sun; white and natural show it plainly.

Hence: **Matte Black, Graphite, Sand, Signal Red, Deep Blue.** All standard opaque, all the same price, biased dark. Two read as factory interior tones, three are deliberate accents. All five are priced identically because they cost the same to buy — charging more for red would be a markup with nothing behind it.

Point 2 is also why the production queue on `/ops` groups by colour rather than by order. Six black parts then four red costs one changeover; alternating them costs nine.

### Custom colours: yes, but as a quote

Asked whether this is a logistics nightmare. Unbounded, yes — a checkout button for "any colour" commits us to buying a full spool for a single unit, and the customer pays for one part while 950g of a colour nobody else wants sits on the shelf. Bounded, no.

So custom finishes are a **quote, never a checkout option**: minimum 4 units, $25 setup covering the spool commitment and the changeover, 2–3 weeks while the material is sourced. The product page states those terms next to the picker and deep-links to a contact form that arrives pre-filled with the part, so an enquiry comes in with the facts needed to quote it instead of "do you do other colours". Terms live in `lib/colors.ts` — they are a business decision, not a technical constraint, and should be changed without touching copy.

Colour is now a third axis of line identity alongside part and side: a black bezel and a red bezel are two cart lines, not one line with quantity two. Carts saved before finishes existed migrate to black rather than being dropped.

### `/ops`

**Stripe is the database.** It already holds every fact the dashboard needs — what was bought, for how much, when, by whom, where it ships, the actual processing fee, whether it was refunded. A local orders table would have to be kept in sync with all of that through webhooks, and the first missed webhook is the moment the dashboard starts lying about money. Not worth taking on to save an API call.

The one thing Stripe cannot know is production cost. That is `src/data/costs.json` — grams, print minutes, filament price, failure allowance, purge, machine time, labour, packaging, postage — joined to Stripe orders by product slug. Every number in it is an estimate, the page says so in as many words, and correcting them against a kitchen scale and a real filament invoice is the single highest-value thing to do with it.

Three sections, in the order the questions get asked on a working day:

- **Production queue** — unfulfilled paid orders, grouped by colour, largest batch first, with units, machine hours, and the changeover count and purge cost the ordering saves.
- **Margin** — 7/30/all-time. Gross from Stripe, fees from Stripe's actual balance transaction where available rather than an estimate, then material, machine time and the per-order block, then net.
- **Orders** — every order with date, customer, items with colour chips, shipping address, gross, fees, cost, net and status.

Checkout now writes a `slug:variant:colour:qty` manifest onto the Stripe session. Parsing that is exact; parsing the human-readable line item name would break the first time a product is renamed.

### The security decision

The dashboard shows customer names, email addresses and shipping addresses. "It's behind an unguessable URL" is not a control.

Basic auth in `middleware.ts`, constant-time comparison, `no-store`, `X-Robots-Tag: noindex`, sub-paths covered by the matcher. But the decision that matters is this: **with no `OPS_PASSWORD` configured the route returns 404, not an open page.** The realistic failure mode is not someone guessing a password, it is a deploy that forgets to set one — and "no password set, so let everyone in" publishes every customer's address to the open internet, silently. A 404 is loud in exactly the right way: the owner notices immediately and nobody else learns anything.

`npm run qa:ops` spawns its own servers to test both configurations. 16 assertions, including that a *prefix* of the real password is rejected — which is what catches a comparison that truncates or short-circuits.

### Two bugs found by building the dashboard and looking at it

- **Refunds showed a profit.** A refunded order rendered a positive net. It is a loss: the revenue goes back, Stripe does not return the processing fee, and the part was already printed, packed and posted. Refunded orders now show net as the fee plus full production cost, negative, and no margin percentage — a percentage of returned revenue is meaningless.
- **The dashboard wore shop chrome.** It inherited the site header, the marketing footer and the ambient-sound toggle, which floated over the margin table. Marketing pages moved into a `(site)` route group with that chrome; `/ops` sits outside it and renders bare. URLs are unchanged — a route group's folder name never appears in a path.

Also fixed while in the product UI: the colour swatches had `hover-lift`, so a 24px chip translated and scaled as the pointer approached it. Fine on a nav link, wrong on a control you aim at precisely — a moving target. Hover is carried by colour and border now; nothing moves.

**Final: home 95, every other page 100**, all four categories, LCP 0.6s, CLS 0. 18/18 axe scans with the new controls, 7/7 states, flows, keyboard, 34/34 motion+audio, 16/16 ops gate.

## 2026-08-03 · 00:40 — Knob face designs

Grounded in an actual teardown: a spare 96–97 climate control unit was pulled apart and the slider knobs pulled off to look at what's actually on the face — a single flat molded line, nothing else. That's a free canvas, and it's specific to this one part: the latch and bezel have no equivalent flat surface, which is why this ships only on the HVAC Slider Lever & Knob Set.

**Why it costs nothing, and colour does.** Colour is a real changeover — a different spool, a hotend purge, inventory sitting on a shelf. A face design is none of that: same material, same colour, same print time to the minute, just a different model loaded before hitting print. It's priced identically to Classic Line because there is no cost difference to charge for. This is the one place "customisable" doesn't fight the small-batch cost model in `costs.json`, because the customisation is geometry, not inventory.

**Four designs to start: Classic Line, Skull, Diamond, Ace of Spades.** Each renders as the knob's own circular outline with the design inscribed in the centre — a small technical-drawing glyph, not a literal photo, consistent with how every other schematic on this site is drawn. `src/lib/faceDesigns.ts` holds the list; `KnobFaceIcon.tsx` holds the glyphs. Adding a fifth is two edits, no cost-model change.

**One design for the whole set, not per-knob.** The set has three physical knobs (fan, temperature, mode); this assumption treats the set as one themed purchase — "the skull set" — rather than a per-knob mix-and-match builder. Matches how colour already works and is the sellable interpretation of "people could buy them." Flagged as an assumption, not a decision made silently.

**Cart identity gained a fourth axis, and that's where the API got refactored.** `addItem`/`removeItem`/`setQty` took slug, then +variant, then +colour as positional arguments; a fifth positional parameter (face design) was the point where that stopped being readable and started being a place to transpose two arguments by mistake. They now take a single `LineKey` object (`{ slug, variantId, colorId, faceDesignId }`) instead. Every call site — `AddToCart`, `CartView` — updated to match. Carts saved before face designs existed migrate to Classic Line on read, same pattern as the colour migration before it.

**Checkout manifest went from 4 fields to 5** (`slug:variant:color:face:qty`), with the parser reading either shape — a 4-field entry (any order placed before this shipped) is read as `face: "-"`, which resolves to Classic Line for a product that has designs and to nothing for a product that doesn't. A real order from last week doesn't fall out of the queue because the schema grew a column.

**Ops queue groups by colour only, and now demonstrates why in one screenshot.** The sample data has Skull and Ace of Spades both in the Matte Black group — merged for the changeover count — while Diamond sits in a genuinely separate Graphite group. That's the whole point made visible: two design switches cost nothing, one colour switch costs a purge, and the queue's grouping already reflected that correctly the moment `line.name` started carrying the design label — no changes needed to the changeover math itself.

Verified: two different designs of the same part, same colour, land as two distinct cart lines (not one line, quantity two); the product spec sheet states the design count; the ledger and queue both show the correct face icon per line; axe clean on the HVAC page specifically (now a permanent line in `qa:a11y` rather than trusting the latch page to stand in for every product); ops gate still 16/16 after `orders.ts` changed.

## 2026-08-03 · 02:15 — Dimensioned drawing for the HVAC slider knob

Founder measured a spare 96–97 climate control unit and supplied a five-view hand sketch with calliper dimensions. Turned into a proper third-angle orthographic drawing (`design/hvac-slider-knob-orthographic.svg`), and the site's schematic for that product replaced with the same geometry.

**The dimensions did not agree with each other, so the reconciliation is documented on the sheet rather than hidden.** Three findings:

- **Depth had three independent readings** — 16.46 (bottom view), 16.12 (top view), and 16.81 (implied by closing the side profile through the 16.85 top edge, 8.40 rear face and 11.48 diagonal). Their mean is 16.46 exactly. Adopted **16.50**, which squares the base footprint with the 16.50 width and sits 0.04 off the bottom-view reading.
- **Top face width had two readings**, 8.87 (front) and 9.11 (back), 0.24 apart. Averaged to **9.00**.
- **The 11.48 side diagonal is longer than the straight line it spans.** Within the adopted envelope that chord is 9.25. A measured value exceeding its own chord is what happens when a rule follows a curved surface instead of a calliper spanning it, so 11.48 is recorded as a contour length and flagged VERIFY rather than being used to stretch the envelope.

Width (16.50) and height (20.32) needed no reconciliation — both agreed exactly across two views each, which is why they anchor everything else.

The sheet carries all five views, hidden-line detail for the internal shell and lever socket, a third-angle projection symbol, a title block marked REV A / SKETCH-DERIVED / NOT FOR PRODUCTION, and the reconciliation notes. Geometry is drawn 1 SVG unit = 1 mm and split into `geometry` and `annotations` groups so the annotations can be deleted after import, leaving clean profile curves.

**It lives in `design/`, not `public/`.** A fully dimensioned drawing of a part whose whole business case is that nobody else reproduces it does not belong on a public URL — that is a competitor's CAD starting point served for free. The website gets front and side elevations with three headline dimensions, matching the density of the other product schematics.

The site art and the drawing share one envelope; a comment in `ProductArt.tsx` points at the sheet so the two stay in step.

## 2026-08-03 · 03:30 — 3D model generated from the reconciled envelope

Founder supplied two photographs of the real knob and asked for the model itself. Built `design/knob_model.py` — a parametric, dependency-free generator that emits OBJ and STL from the same reconciled envelope as the orthographic sheet.

**The photographs corrected two things the sketch had implied.**

- **The indicator line is a contrasting cream stripe moulded across the top face, not an open groove.** That is a second material, not geometry. Modelled as a shallow channel so it can be printed and filled, or used as the layer marker for a filament change. `--no-line` emits the blank body for the skull / diamond / spade faces, which is the variant the face-design product feature actually needs.
- **The socket is a keyed T-slot in a separate cream insert (marked "15"), not the two parallel slots the bottom-view sketch implied.** The 3.00 blade thickness from the sketch survives as the crossbar thickness; the rest of the T is read off the photograph and is flagged in the file as the least trustworthy dimension in it.

**A geometric constraint caught a real bug on the first pass.** At y=0 the part is only 12.86 deep, so the cavity at the base is 12.86 − 2×2.50 = 7.86 mm front-to-back. The first socket was 11.2 mm deep and pushed straight out through the rear wall — visible immediately in the verification render as boxes floating outside the shell. The socket is now derived from the cavity at the base rather than positioned by hand, and raises `SystemExit` if the T will not fit. Re-checked by walking every vertex against the profile envelope: one vertex outside, the crown apex, 0.28 mm proud, which is the rounded tip.

**Verified by rendering, not by inspection.** The generated OBJ is loaded into three.js headless (the project already ships three) and rendered from four angles with a wireframe overlay. That is what caught the escaped socket, and a shading seam across the flank where the cross-section spacing stepped from 1.2 mm to 0.4 mm — the levels are now a single graded curve, and the seam is gone.

Envelope verified on every build: X 16.500, Y 20.320, Z 16.494 against targets 16.50 / 20.32 / 16.50.

The socket is a rectangular block with a T-shaped through-slot, tiled as six convex boxes rather than cut with a boolean, so each piece stays trivially watertight and their union is the socket.

`design/.gitignore` keeps the STLs out of the repo — 1.2 MB of binary that regenerates in under a second from the committed script. The OBJ is committed because it is text and imports straight into Blender.

## 2026-08-03 · 05:10 — Fleet survival and addressable market model

Founder asked how many 96-98 Civics still exist and what share plausibly need this part. Built `analysis/fleet_model.py`, a 200k-trial Monte Carlo. Monte Carlo rather than a spreadsheet because several inputs span an order of magnitude, and multiplying six mid-point guesses together produces a confident-looking number that is almost certainly wrong.

**Sourced inputs.** Global 6th-gen production >3.5M (Sep 1995 – Aug 2000). NHTSA DOT HS 809 952: 7.9% of passenger cars survive 20 years. iSeeCars 2025: the Civic reaches 250k miles at 4.2× the segment average — applied at a discounted 2.0–3.6× because that is a mileage statistic, not a survival statistic.

**Result: ~122,000 cars still on the road worldwide** (P10 86k, P90 167k), implying a 5.3% survival rate at 28-30 years. **51,000 US, 71,000 international** — the international fleet is the larger half, which validates the instinct to sell abroad even though capture there is modelled far worse.

**The finding that matters is the part comparison.** Modelling every part with one demand curve would have been the biggest available error. A glove box that will not stay shut is a functional failure the owner meets on every drive; a missing slider knob is cosmetic and the HVAC still works. Modelled separately:

| | units/yr | net/yr |
| --- | --- | --- |
| HVAC knob set | 40 | $378 |
| Glove box latch | 179 | $2,943 |

**The latch is 7.8× the knob**, on defect rate, on owners actually acting, and on price. That matches the earlier research finding — the latch has a dedicated repair tutorial and multiple forum threads; the knob has neither, and the authoritative common-failures writeup for that HVAC unit lists backlights and the blower resistor ahead of it.

**Sensitivity says the funnel dominates** (r=+0.666 against sales, versus +0.43 for survival and +0.43 for defect rate). Fleet size and failure rate are facts that cannot be changed. The funnel — being found, and being chosen over a junkyard pull — is entirely marketing and channel, and it is where effort returns the most.

**Bundling is worth more than any of it.** Fixed cost per order is $9.23 in labour, packaging and postage. A knob alone nets $9.34; a knob and a latch in *one* order nets $29.49. The second item costs $1.22 to add and carries no new fixed cost, so it is nearly triple the profit for one more part in the box. The model's implication is that basket size, not per-part demand, is the lever — free shipping over a threshold, bundle pricing, and cross-sell on the product page.

## 2026-08-03 · 06:20 — Supply factor added; cosmetic upgrade modelled

Two changes, one of which corrects a real error in yesterday's model.

**The model had no supply variable, and that flattered the glove box latch badly.** It modelled how many cars have the fault and how many owners act, but never asked what else the buyer could buy instead. Verification against Honda's own catalogue: **77540-S04-003ZA is not discontinued.** Genuine 77540-S04-003ZB/ZC are on Amazon, and HUYILUN sell a cross-platform aftermarket handle covering Civic 96-00, Element 03-07, CR-V 97-06, Odyssey 95-04 and Accord 94-97 — five platforms of injection-moulding volume. Adding a `supply` term collapsed the latch from **179 units/yr to 25**. Demand you cannot capture is not demand.

**This also means the live product copy is false.** The latch page claims "confirmed discontinued by the manufacturer", "secondary-market units are scarce" and "the original component is out of production". None of that survives verification. Flagged for the founder; the fix is a positioning decision, not a wording one, so it is not being made unilaterally.

**Cosmetic upgrade modelled as a third product.** Re-cut symbols on the sliders and buttons — an X or a custom glyph where the factory light window is — so the backlit panel reads differently at night. It inverts every constraint the repair parts run into:

| | units/yr | net/yr |
| --- | --- | --- |
| HVAC knob set (repair) | 30 | $283 |
| Glove box latch (repair) | 25 | $415 |
| **Custom symbol set (cosmetic)** | **166** | **$3,923** |

The reason is structural, not optimism. A repair part is gated on the fault existing (25-45% of cars) and on beating an existing supply channel. A cosmetic part is gated on neither: every surviving car is a candidate, and **nothing like it exists for the EK**, so nobody is competing for the sale. Modding is also continuous rather than a backlog being worked off, so more of the interested population is in-market in any year.

Comparables support the price: EK gauge-face overlays sell ~$90, and Illumaesthetic's EK gauge faces are $200-300. The platform's interior-aesthetics market clears at real money.

**The price ladder is nearly flat between $19 and $59** — modelled at constant elasticity e=1.2, net lands within 5% of $3,900 across that whole range, peaking around $29. That is what a product with no substitute looks like: pricing is not the lever. Volume comes from awareness, which is why the sensitivity table puts the funnel top again. This is a demand-*creation* product — nobody searches for a thing they don't know exists — so the channel is Instagram, forums and build threads, not SEO.
