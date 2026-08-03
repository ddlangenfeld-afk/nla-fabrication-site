# The switch line — from one idea to a product line

**Date:** 2026-08-03
**Numbers:** `analysis/glyph_line.py` (ladder, commissions, chassis expansion)
**Upstream:** `analysis/fleet_model.py` (fleet size, addressable volume, why cosmetic beats repair)

---

## 1. The reframe

The idea as stated was "new symbols on the buttons, maybe an X instead of the
square where the light comes through." That parenthetical is the whole product,
and it is worth saying explicitly:

**The square is not a graphic. It is an aperture.** It is a hole that light comes
through. So this is not a decal business or a printing business — it is a
business about **the shape of the light in the cabin at night**.

That reframe matters because it tells you what the product actually competes on.
Nobody buys this in daylight. It sells on a photograph taken at night, on a dark
road, with the dash lit. Every downstream decision — material, wall thickness,
photography, channel — follows from that.

It also explains why the fleet model likes it so much. `supply = 1.0`. There is
no OEM version, no aftermarket version and no junkyard version of "your dash
lights in a shape you chose," because it is not a part that broke. It is a part
that never existed.

---

## 2. Two surfaces, two different rule sets

Do not treat the panel as one canvas. It is two, and conflating them is the one
way to make this product unsafe.

### Surface A — the indicator apertures (free canvas)

The small windows that light up to say a function is ON. A/C, rear defog,
recirculate. The shape carries **no meaning** — the meaning is the printed label
beside it. Change it to anything: X, diamond, slash, hexagon, crosshair,
chevron, split bar, notch.

Zero legibility risk. This is where the personality goes, and it is the cheapest
part to make. It should be the entry product.

### Surface B — the function glyphs (restyle, never replace)

Face, face+feet, feet, feet+defrost, defrost, fan speed, temperature. These are
**ISO-derived symbols that a driver reads at speed in the dark.** Restyle the
stroke weight, the corner treatment, the proportion. Do not substitute a
different object for the meaning.

The honest caveat: FMVSS 101 governs control identification for vehicle
manufacturers, not for aftermarket replacement parts, so this is not a
compliance question for a small maker. It is a *judgment* question. A defrost
symbol nobody recognises is a bad product regardless of what the regulation says,
and "I couldn't find defrost" is the return you do not want. Keep the silhouette
recognisable; change how it is drawn.

**The product split writes itself:** Surface A is the fun one and the cheap one.
Surface B is the craft one. Sell A alone, sell A+B together, never sell B alone.

---

## 3. How to actually make light come through — the real engineering decision

Four routes. They are not equally good, and the cheapest one has the best story.

| # | Method | Look | Cost | Printer needed |
|---|---|---|---|---|
| 1 | **Through-cut aperture** | Hard-edged, bright, unfiltered | Lowest | Any |
| 2 | **Thin-wall glow** | Solid by day, glows by night | Lowest | Any |
| 3 | **M600 filament-swap inlay** | Translucent glyph in an opaque body | Low | Any with pause-at-layer |
| 4 | **Multi-material (AMS/MMU)** | Same as 3, no manual step | Higher | AMS/MMU |

**Route 2 is the hero product.** Print the glyph region at 0.4–0.8 mm instead of
cutting through it. In daylight the panel looks solid and stock. At night the
glyph lights up from inside the plastic. Single material, single colour, no
pause, no second filament, no post-processing — it is the *cheapest thing on the
list* and it is also the best hook:

> **"Blackout"** — looks stock until the lights come on.

That is a product name, a photograph, and a reel, all from a wall-thickness
decision. Route 1 (open cut) is the loud alternative and should exist as the
"Open" variant — brighter, sharper, more aggressive. Route 3 is the premium tier
once volume justifies the pause step.

### The experiment to run before anything else

Light transmission through PETG changes enormously with pigment loading. Black at
0.6 mm is nearly opaque; natural at 0.6 mm is nearly clear. There is no way to
guess the right wall thickness per colour — it has to be measured.

**Print a step wedge.** One coupon, glyph repeated at 0.2 / 0.3 / 0.4 / 0.5 /
0.6 / 0.8 / 1.0 / 1.2 mm. Print it in all five palette colours. Backlight each
with (a) the original incandescent bulb and (b) an LED. Photograph in the dark
at fixed exposure.

That single afternoon produces:
- the spec table that makes every future glyph correct on the first print
- the answer to which colours can even do the blackout trick
- a genuinely great piece of content — a grid of glowing test coupons is exactly
  the kind of thing that gets saved and shared by the audience you need

This is the highest-value four hours available anywhere in this project.

---

## 4. The LED, and why it belongs in the box

The factory panel bulb is a small wedge incandescent: dim, warm, and 28 years
old. Enthusiasts already swap these for LEDs. An LED is brighter and far more
directional, which changes how a thin-wall glyph diffuses — meaning **the look of
your product depends on a bulb you do not control.**

Two reasons to sell a matched LED with the kit:

1. **Control of the result.** You specify the light, so the photograph the
   customer takes matches the photograph that sold it to them.
2. **It fixes the order-economics problem.** Fixed cost per order is $9.23 —
   labour, packaging, postage. A single $19 item barely clears it. A second item
   costs ~$1 marginal and carries no new fixed cost. The LED is the natural
   attach, and it is why the top tier nets $49 against the entry tier's $14.

---

## 5. The ladder

Per-order economics from `analysis/glyph_line.py`:

| Tier | What | Price | Net/order | Margin |
|---|---|---:|---:|---:|
| T1 Aperture set | Surface A only — the 4 indicator windows | $19 | $14.46 | 58% |
| T2 Full face set | A + B + slider knobs, the whole panel | $34 | $28.50 | 71% |
| T3 Panel kit | T2 + matched LEDs | $59 | $49.15 | 76% |
| Commission | Customer's own shape | $85 | $65.52 | 72% |

At the modelled mix (20 / 55 / 25) the blended order is **$37.25 list, $30.85
net**. Against a single flat $29 SKU at the same volume, the ladder is worth
**+29% per order** — about **$1,100/yr** at median volume.

Median volume, EK only: **165 orders/yr, $5,084 net — PER YEAR.** P10 $2,609,
P90 $9,371. At the median that is **~$424 a month**, on ~14 orders a month.

Stated that plainly because every figure in this document is annual, and an
annual figure misread as monthly is a 12× planning error.

Note this is *not* the $14,900 an earlier draft of the model produced. That
version had dropped one of the two demand gates and reported roughly 3× the
correct volume. Corrected, `glyph_line.py` now reconciles with
`fleet_model.py` at 165 vs 166 units — they use the same fleet and the same
funnel, and they must agree.

---

## 6. Why this is a library, not a product

A new glyph is ~45 minutes of CAD — a 2D profile booleaned into a body that is
already solved (`design/knob_model.py`). That is $18.75 of your time, amortised:

| Sells | Design cost/unit | % of net |
|---:|---:|---:|
| 5 | $3.75 | 12.1% |
| 20 | $0.94 | 3.0% |
| 50 | $0.38 | 1.2% |
| 200 | $0.09 | 0.3% |

**Past ~20 units a glyph is free.** The marginal cost of variety is nearly zero,
which means variety is the moat. Anyone with a printer can copy one glyph.
Copying a library of forty — and the taste that selected them — is a different
problem, and it is the only defensible position available in a business where the
manufacturing method is a consumer appliance.

Concretely: the site already has the machinery for this. `src/lib/faceDesigns.ts`
and `src/components/KnobFaceIcon.tsx` were built for classic/skull/diamond/spade.
A glyph library is that data structure with more rows.

---

## 7. Commissions are the best line on the sheet

$85 with 30 minutes of CAD charged in nets **$65.52** — 2.1× a blended catalogue
order for 30 minutes of extra work. One a month is $789/yr. One a week is
$3,421/yr, which nearly doubles the EK-only business on its own.

But the money is the smaller half. **Every commission is a photograph of a car
that is not yours, posted by someone who is not you.** It is the awareness lever,
acquired at a profit instead of a cost. That inverts the fundamental problem
below.

Guard rails: fixed body, customer supplies a silhouette, you reserve refusal
(trademarks, hate symbols, anything illegible). Quote a bounded turnaround. The
existing custom-colour quote flow (`CUSTOM_COLOR`, min 4 units, 2–3 weeks, $25
setup) is the right shape to copy.

---

## 8. The fundamental problem, stated plainly

Sensitivity analysis puts the funnel at **r = +0.562** — a bigger driver than
fleet size or want-rate. For a repair part the funnel is SEO: the latch breaks,
they search, they find you. **For this, there is no search volume, because nobody
searches for a thing they do not know exists.**

The scenario table is unambiguous about what to do with that:

| Change | Net/yr | Δ |
|---|---:|---:|
| T3 attach 25% → 40% | $5,594 | +10% |
| T3 attach 25% → 10% | $4,573 | −10% |
| **Awareness ×2** | **$10,168** | **+100%** |
| **Awareness ×5** | **$25,419** | **+400%** |

Doubling the upsell rate moves the business by single digits. Doubling awareness
doubles it. **Do not spend another hour on pricing.** The price ladder is
essentially flat between $19 and $59 — this product has no substitute, so
customers are insensitive, and that cuts both ways: you cannot price your way
into volume either.

The channel is night photography on Instagram and Honda-Tech / ClubCivic /
civicforumz build threads. The format that works is the one the product
generates for free: **dash at night, before and after, same exposure.**

---

## 9. The thing repair parts can never do

You can test taste for free. Post four glyph concepts as a poll. Count saves and
comments. Print the winner. Zero inventory risk, zero tooling risk, one afternoon
of CAD at stake.

A repair part requires you to *guess* which component breaks and then commit
modelling time before you learn anything. This product line has a demand-sensing
loop built into its marketing. That is a structural advantage worth more than the
margin difference.

---

## 10. Expansion: the only route past ~$10k/yr

**Assumption, not derived — fleet sizes for these chassis were not researched.
Size each properly before committing modelling time.**

| Chassis added | Net/yr |
|---|---:|
| EK only (today) | $5,084 |
| + EG 92–95 Civic | $8,643 |
| + DC2 Integra | $11,185 |
| + S2000 | $12,964 |
| + EF / DA / CRX | $15,506 |

The S2000 is the interesting one: 3D-printed climate knobs for it **already sell
on Etsy**, which is direct proof of the product form in an adjacent market. The
design language and the photography style port completely; only the body geometry
changes, and body geometry is the part already proven in `design/knob_model.py`.

### Do not chain these

Ladder + a commission a week + four more chassis + 3× awareness multiplies out
to **$56,738/yr**. That number is arithmetic, not a projection, and it should
not be planned against. It stacks four separate optimistic assumptions:

| Step | Status |
|---|---|
| Base $5,084 | **Modelled** — 200k trials, though already a 3.6× P10–P90 spread |
| + 52 commissions/yr | **Assumed** — that is 1 bespoke order in every 4. No evidence. |
| × 3.05 chassis | **Assumed** — fleet sizes above were never researched |
| × 3 awareness | **Assumed** — and applied *after* the chassis step, so it silently assumes 3× awareness in four separate car communities at once, built by one person |

Read the multipliers **one at a time** as scenarios. Multiplying four optimistic
assumptions compounds the optimism and produces a figure that looks earned and
is not.

### And the hours the model never charges

The cost model charges 8 minutes of packing per order at $25/hr, plus
commission CAD. It charges **nothing** for marketing, photography, CAD for new
chassis, customer service, returns or admin.

At the median that is roughly 200 unpaid hours a year for $5,084 — about
**$25/hr**. Which is the honest read on the base case: not yet a business, a
hobby that pays for itself and its own tooling. The reason to build it is the
ceiling and the optionality, not year one's number.

**Plan against $2,600–$9,400 for year one.** That is the only range with a
simulation behind it.

---

## 11. Risks, honestly

- **Legibility.** Covered in §2. Restyle Surface B, never re-mean it.
- **Fitment is narrow.** 96–98 slider panel only. The 99–00 panel is a different
  design with rotary knobs and does not interchange. This must be loud on the
  listing or it becomes the return reason.
- **Colour fade.** These live on a sunlit dash. PETG is specified for it, but a
  bright red glyph will not age like a black one. Say so.
- **Demand creation is slow.** Year one will underperform the model because the
  model assumes a steady-state awareness level you have not built yet. Year two
  is where 165 orders is realistic.
- **The photographs are the product.** If the night shots are mediocre, none of
  the above happens. This is a real dependency on a skill that is not CAD.

---

## 12. Build order

1. **Step-wedge light test** (§3). Four hours. Everything else depends on it.
2. **Blackout aperture set, one glyph** — the X. Smallest viable product,
   entry tier, proves the manufacturing route.
3. **Photograph it properly at night.** Before/after, fixed exposure.
4. **Post four concepts, count saves, print the winner.** Start the taste loop.
5. **Extend `faceDesigns.ts` into a glyph library** with the winners.
6. **Add the LED attach** — fixes order economics, controls the look.
7. **Open commissions** once the library proves the body geometry is stable.
8. **Second chassis** only after the EK line has sold through a full quarter.
