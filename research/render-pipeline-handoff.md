# Handoff — product renders for the glyph line

Written because the Higgsfield connector dropped out mid-session and could not be
re-attached to a running session. Everything below is already committed. Pick up
from here in a fresh session with Higgsfield enabled.

---

## The blocker that is NOT about tooling

**The knob geometry is wrong and must be fixed before any render is worth making.**

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

## What was asked for, still outstanding

1. Reference image of the real 96–98 Civic HVAC slider knob
2. Studio product render (three-point lighting)
3. Orthographic views / alternate angles
4. Per-glyph variants of all of the above
5. A viewer on the product page where picking a glyph swaps the render set
6. The same treatment for the aperture (Backlit Symbol & Aperture Set) listing

Items 1–4 need either Higgsfield or corrected geometry. **Items 5 and 6 are pure
front-end and are not blocked** — the picker, the glyph library, the surface
filtering and the price ladder all already exist. The viewer can be built against
placeholder art and have real renders dropped in later.

## Site analytics

There are none. No Vercel Analytics, no GA, no Plausible — nothing is recording
visits, so "does the site have traffic yet" currently has no answer. Wiring up
`@vercel/analytics` is a two-line change and should happen before any marketing
push, or the launch produces no data.
