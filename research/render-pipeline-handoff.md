# Handoff — product renders for the glyph line

Live state of the render work. Everything below is committed.

---

## The blocker that is NOT about tooling

**The knob geometry is wrong and must be fixed before any render is published.**

`design/knob_model.py` currently builds the part at:

| | mm |
|---|---:|
| width (X) | 16.50 |
| height (Y) | 20.32 |
| depth (Z) | 16.50 |

That is near enough a cube, and **taller than it is wide**, for a component that
should be a flat cap pressed onto a slider lever. The numbers came from averaging
a hand sketch whose views did not reconcile — the model is watertight, holds its
envelope, and is the wrong shape. Every automated check passes on it, which is
why this went unnoticed until a render was looked at.

**This has now been confirmed by looking, not inferred.** The full set was
regenerated and inspected: the carving, the lighting rig and the framing are all
doing their job — the glyph reads cleanly, the three-point rig separates a
near-black part from a transparent background — and the object underneath is a
rounded rectangular lump closer to a jerry can than to a knob. Nothing about the
pipeline needs changing. The mesh does.

**Required input:** caliper measurements off the real knob (one was pulled from a
spare 96–97 climate unit). Width, height, depth. Then update the constants at the
top of `knob_model.py` and everything downstream regenerates.

No image generator fixes this. A generated image produces a plausible knob, not
this knob, and the part still has to press onto the lever.

---

## What already works

```bash
# every glyph, print resolution, with envelope + inside-out guards
python3 design/knob_model.py --all --res 96 --out /tmp/k

# one variant, printable STL
python3 design/knob_model.py --glyph cross --res 96

# studio renders: hero + orthographic front/side/top, per glyph, to public/renders/
node scripts/render-knobs.mjs
```

Last run: 32 renders, all eight glyphs, clean. ~3.6 g of PETG per part.

- `_glyph_sd()` in `knob_model.py` holds the SDF for each design. Ids match
  `src/lib/faceDesigns.ts` exactly — keep them in sync or picker and render drift.
- The renders are **gitignored on purpose**. `public/` is served at a live URL and
  these are pictures of the disputed geometry.
- Guards that will fail the build rather than warn: signed volume (catches
  inside-out), and envelope drift (catches a glyph that changes outside dims).

## Two bugs already found and fixed here, worth not reintroducing

1. **Inside-out mesh.** Signed volume was −2,873 mm³; every exported STL had
   inverted normals. One reversal in `Mesh.tri` fixed loft, cavity and socket
   together because all three shared the same consistent inward winding.
2. **Anisotropic sampling.** `--res` raised vertical sections only, while ring
   density stayed pinned to a module constant. At res=260 that was 0.09 mm
   vertical against 0.81 mm horizontal — a 9× mismatch that turned every glyph
   into horizontal banding. Ring points are now derived from `res`.

---

## Publishing a render set (the two-lock design)

Renders reaching the site requires two independent, deliberate steps. Either one
alone does nothing:

1. drop the `public/renders/` line from `.gitignore` and commit the PNGs
2. add the product slug to `PUBLISHED_RENDER_SETS` in `src/lib/renders.ts`

So a stray `git add -f` cannot put unverified product photography on a live
storefront, and `renders.ts` can never point at an image that was not deployed
alongside it. The viewer already handles both branches — switching on is a data
change, not a build.

Order of operations once calipers exist: correct `knob_model.py` → re-run the
harness → **look at the output** → then the two steps above.

---

## What was asked for, and where each item stands

1. ~~Reference image of the real 96–98 Civic HVAC slider knob~~ — **see below**
2. Studio product render (three-point lighting) — **built, not published**
3. Orthographic views / alternate angles — **built, not published**
4. Per-glyph variants of all of the above — **built, not published**
5. Viewer on the product page where picking a glyph swaps the art — **done**
6. Same treatment for the aperture listing — **done**

### On item 1

This one should not be generated, and it is the only item where that matters.
A reference image is a thing you measure against. An image model asked for "a
96–98 Civic HVAC slider knob" returns a confident, plausible, wrong part — and
its whole failure mode is looking exactly like the thing it is not. Feeding that
back into `knob_model.py` would launder a guess into a dimension, which is the
same failure the current envelope already came from (averaging a sketch whose
views did not reconcile).

What actually closes item 1, in order of preference: **calipers on the spare
unit** (which also closes the real blocker), a real photograph of the part on a
scale reference, or an OEM listing photo used strictly as an internal shape
reference and never as site imagery.

## Site analytics

Wired. `@vercel/analytics` mounts in the root layout via
`src/components/SiteAnalytics.tsx`; pageviews and referrers start recording on
the next deploy. `/ops` is filtered out in `beforeSend` — it is the internal
margin dashboard, its visitors are us, and on a site whose real traffic is
currently near zero a handful of admin sessions would be most of the graph
rather than noise in it.

Note there is still **no historical data**: this answers "does the site have
traffic" from the next deploy forward, not retroactively.
