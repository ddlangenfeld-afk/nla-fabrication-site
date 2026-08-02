# NLA Fabrication — Website

Storefront for **NLA Fabrication**: 3D-printed reproductions of discontinued
interior parts for the 1996–2000 Civic (EK/EJ chassis).

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · Stripe
Checkout · Resend.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

---

## What's real vs. what's stubbed

### Real and working

- **All v1 pages** — Home, Shop, Product detail (`/products/[slug]`), Cart,
  Contact, About, and three legal stubs.
- **Cart** — quantity, variants (LH/RH), persistence via `localStorage`, and
  cross-tab sync. Built on `useSyncExternalStore`, so the prerendered HTML
  shows a skeleton rather than flashing an empty cart during hydration.
- **Checkout** — real Stripe Checkout (hosted session, no custom card form) via
  `POST /api/checkout`. **Prices are re-read server-side from `products.json`;
  the client only sends slugs and quantities**, so a tampered cart payload
  can't change what gets charged.
- **Contact form** — `POST /api/contact`, server-side validation, sends through
  Resend when configured. Without a key it returns `not_configured` and the UI
  falls back to a prefilled `mailto:` link instead of failing.
- **SEO** — per-page metadata, canonical URLs, `Organization` JSON-LD sitewide,
  `Product` JSON-LD on product pages, generated `sitemap.xml` and `robots.txt`,
  generated OG image, SVG favicon.
- **Error paths** — 404, error boundary, empty cart, failed checkout, and
  failed form submission all have designed states.
- **Form validation** — per-field, on blur or submit (never on first
  keystroke), clearing as the field is fixed; `aria-invalid` +
  `aria-describedby`, and focus moves to the first problem on submit.

### Verified

| Check | Result |
| --- | --- |
| Lighthouse (home, shop, product, contact) | **100 / 100 / 100 / 100** — perf, a11y, best practices, SEO |
| Core Web Vitals | LCP 0.4–0.6 s · CLS 0 · TBT 0 ms |
| axe-core, WCAG 2.1 AA | Clean on 9 routes × 2 widths, plus interactive states |
| Keyboard | Skip link, tab order, focus rings, mobile menu |
| Flows | Validation, cart, variants, persistence, keyless checkout |

Re-run them yourself — see [Testing](#testing).

### Stubbed — needs real input before launch

| Item | Status |
| --- | --- |
| **Legal pages** | Structural placeholders, clearly marked on-page and `noindex`. **Need a lawyer before real orders.** |
| **Domain** | `NEXT_PUBLIC_SITE_URL` defaults to `https://nla-fabrication.example.com`. |
| **Contact inbox** | `CONTACT_EMAIL` defaults to an `example.com` address. |
| **Product imagery** | Hand-drawn SVG technical line art (`ProductArt.tsx`), deliberately schematic — not fake renders. Replace once real parts are photographed. |
| **Shipping rates** | Stripe collects a US address; no rates configured. |
| **Business details** | No address, phone, or tax ID anywhere — intentionally. Don't invent them. |

### Product dimensions are placeholders

The `ProductArt` drawings carry dimension callouts (`148 mm`, `62 mm`,
`PITCH 50`). **These are illustrative, not measured.** Replace them with real
figures — or drop the callouts — before launch, since publishing wrong
dimensions on a fitment-critical part is worse than publishing none.

---

## API keys needed

**No keys are set, and none were fabricated.** Copy `.env.example` to
`.env.local` and fill in:

| Variable | Needed for | Without it |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Checkout | Checkout button shows "Checkout isn't live yet" instead of erroring |
| `RESEND_API_KEY` | Contact form | Form falls back to a prefilled `mailto:` link |
| `CONTACT_FROM_EMAIL` | Contact form sender | Falls back to Resend's `onboarding@resend.dev` |
| `CONTACT_EMAIL` | Where mail is delivered | Placeholder `example.com` address |
| `NEXT_PUBLIC_SITE_URL` | Canonicals, sitemap, OG, Stripe redirects | Placeholder domain in metadata |
| `NEXT_PUBLIC_ETSY_URL` | Etsy storefront link | Etsy is not shown anywhere |
| `NEXT_PUBLIC_EBAY_URL` | eBay storefront link | eBay is not shown anywhere |
| `NEXT_PUBLIC_AMAZON_URL` | Amazon storefront link | Amazon is not shown anywhere |
| `OPS_PASSWORD` | The `/ops` dashboard | **`/ops` returns 404.** Fails closed on purpose — see below |
| `OPS_SAMPLE` | Set to `1` to fill `/ops` with synthetic orders | `/ops` reads real Stripe data |

Use Stripe **test-mode** keys (`sk_test_…`) until the store is genuinely ready
to take money.

### Marketplace storefronts

The three `NEXT_PUBLIC_*_URL` variables above are the only thing standing
between the site and a "Also available through" block on the shop page, a
"Where to buy" column in the footer, and `sameAs` entries in the Organization
structured data. Set one and all three appear; leave one unset and it renders
nowhere. Nothing is hard-coded, and no placeholder URL ships — a 404 on a
storefront link reads as an abandoned business faster than no link at all.

```bash
NEXT_PUBLIC_ETSY_URL=https://www.etsy.com/shop/YourShopName
NEXT_PUBLIC_EBAY_URL=https://www.ebay.com/str/your-store-name
```

On Vercel these go in Project Settings → Environment Variables. They are
`NEXT_PUBLIC_`, so they are inlined at build time: a redeploy is required
after changing them.

### The `/ops` dashboard

`/ops` is the operations panel: the day's production queue batched by colour,
every order with its date, cost and margin, and rolling revenue. It reads
**straight from the Stripe API** — there is no orders database, because Stripe
already is one and a second copy would only ever drift out of sync with it.
The one thing Stripe cannot know is what a part costs to produce; that comes
from `src/data/costs.json` and is joined by product slug.

**It shows customer names, email addresses and shipping addresses.** Treat the
password accordingly:

```bash
OPS_PASSWORD=<a long random string>
```

Log in with any username and that password. Two things worth knowing:

- **With no `OPS_PASSWORD` set, `/ops` returns 404.** That is deliberate. The
  realistic failure is not someone guessing the password, it is a deploy that
  forgets to set one — and "no password configured, so let everyone in" would
  publish every customer's address silently. It fails closed instead.
- Use a **restricted** Stripe key. The dashboard only reads, so give it read
  access to Checkout Sessions, Payment Intents and Charges and nothing else.
  It never needs a key that can move money.

Run `npm run qa:ops` to verify both behaviours; it spins up its own servers and
checks the locked and unlocked configurations.

Set `OPS_SAMPLE=1` to populate the dashboard with synthetic orders. Useful
before the first real sale, when a working dashboard and a broken one both look
like an empty page. It is opt-in, never a fallback for a missing Stripe key,
and the page carries a loud banner while it is on.

### Finishes

Five standard PETG colours, defined in `src/lib/colors.ts`. The palette is
short for a reason that is documented in that file: pigment barely changes the
price of PETG, so the real constraint is how many spools you want to own and
hold. Custom colours are handled as a quote with a minimum order rather than a
checkout option — the terms live in the same file.

### Knob face designs

The HVAC Slider Lever & Knob Set additionally offers a choice of knob face —
Classic Line, Skull, Diamond, Ace of Spades — defined in
`src/lib/faceDesigns.ts`. Unlike colour, this genuinely costs nothing extra:
it's the same material and the same print time, just a different model
loaded before hitting print. `hasFaceDesigns: true` on a product in
`products.json` is what turns the picker on; no other product has a flat face
suited to it, so it isn't offered anywhere else. Add a design by appending to
the array in that file and adding a matching glyph case in
`src/components/KnobFaceIcon.tsx`.

---

## Architecture

```
src/
  app/
    layout.tsx              Fonts, Organization JSON-LD, skip link, theme-color
    page.tsx                Home
    shop/                   Catalog
    products/[slug]/        Product detail — SSG + Product JSON-LD
    cart/                   Cart
    cart/success/           Order confirmation (Stripe success_url)
    contact/                Contact form
    legal/                  Privacy · Terms · Shipping & Returns (placeholders)
    api/checkout/           Stripe Checkout session
    api/contact/            Resend, with mailto: fallback
    not-found.tsx           404
    error.tsx               Error boundary
    sitemap.ts robots.ts    Generated
    icon.svg                Favicon
    opengraph-image.tsx     Generated OG image
  components/               Header, Footer, ProductCard, ProductArt, forms
  data/products.json        Single source of truth for the catalog
  lib/products.ts           Typed access layer over the JSON
  lib/cart.tsx              localStorage-backed cart store
  lib/site.ts               Site constants, env-overridable
```

**Product data** lives in one JSON file behind a typed access layer
(`lib/products.ts`). Moving to a headless CMS means reimplementing that
module's four functions — no page or component needs to change.

**Design tokens** are defined once in `globals.css` under Tailwind v4's
`@theme`: named surfaces, lines, three ink levels, one accent, success/error.
Components reference tokens (`text-ink-secondary`, `border-line`), never raw
hex.

---

## Testing

The checks above are scripts in `scripts/`, driving a real browser against a
running build. Start one, then run them:

```bash
npm run build && npx next start -p 3000

# in another shell
npm run qa:a11y        # axe-core, WCAG 2.1 AA, 9 routes at 375 and 1440
npm run qa:states      # axe against interactive states (form errors, full cart)
npm run qa:keyboard    # skip link, tab order, focus rings, mobile menu
npm run qa:flows       # validation, cart, variants, keyless checkout
npm run qa:lighthouse
npm run qa:shots       # full-page screenshots at 375/768/1440 -> ./.shots
```

`BASE_URL` points them at a deployment instead; `CHROME_PATH` overrides browser
resolution. See `scripts/README.md` for why each one exists — briefly, axe alone
was not enough: the skip link failure came from the keyboard script, and both
WCAG 2.5.x failures came from Lighthouse.

## Trademark rules (non-negotiable)

The brand name of the vehicle manufacturer, its emblem, and its model/trim
marks (`Type R`, `VTEC`, `Si/SiR`, `Mugen`, `Spoon`) **must never appear** on
this site. Chassis codes (`EK`, `EJ`, `EK9`, `EM1`) are enthusiast shorthand,
not trademarks, and are used freely.

Compatibility is expressed as *"Fits 1996–2000 Civic (EK/EJ chassis)"*. OEM
part numbers (e.g. `77540-S04-003ZA`) appear only to identify what a part
replaces — a disclaimer to that effect sits on every product page and in the
footer.

---

## Phase 2 roadmap

Deliberately **not** built in v1:

1. **`/guides` content section** — the highest-value fast-follow. Short posts
   ("Why EK Civic glove box latches keep breaking") targeting long-tail search
   no competitor is covering. Ship this before any 3D work.
2. **React Three Fiber + drei** — real product renders behind hero sections,
   once actual parts exist to render.
3. **`MeshTransmissionMaterial`** frosted/refractive accents.
4. **Cursor-reactive magnetic elements** (GSAP or Framer Motion).
5. **Lenis smooth scroll.**
6. **Headless CMS** once the catalog outgrows a hand-edited JSON file.

The Three.js layer is gated on real assets on purpose: an empty 3D scene looks
worse than good technical line art.

---

## Pre-launch checklist

- [ ] Replace placeholder dimensions in `ProductArt.tsx` with measured values
- [ ] Legal review of all three `/legal` pages
- [ ] Real domain → `NEXT_PUBLIC_SITE_URL`
- [ ] Real inbox → `CONTACT_EMAIL`, verified sending domain in Resend
- [ ] Stripe live keys + shipping rates + tax settings
- [ ] Product photography to replace line art
- [ ] *Nice-to-have:* set the OG card headline in Space Grotesk. `next/og`
      runs outside the `next/font` pipeline, and satori rejects both the WOFF2
      subset and its TTF conversion because Space Grotesk is a variable font.
      Needs a static instance committed to the repo. The card renders correctly
      in a fallback sans today — cosmetic, not broken.
- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Validate JSON-LD in Google's Rich Results Test
- [ ] `npm audit` — 3 high-severity advisories sit in Next's bundled
      dependencies; the suggested "fix" downgrades Next to 9.x, so track
      upstream rather than applying it
