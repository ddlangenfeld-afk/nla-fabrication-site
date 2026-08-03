#!/usr/bin/env python3
"""
NLA Fabrication | Addressable market model
96-98 Civic (EK/EJ) HVAC slider knob set

    python3 analysis/fleet_model.py

WHY THIS IS A MONTE CARLO AND NOT A SPREADSHEET
    Every input below is a range, and several of them span an order of
    magnitude. Multiplying six mid-point guesses together produces a single
    confident-looking number that is almost certainly wrong — the errors
    compound. Sampling the ranges instead gives a distribution, and the
    distribution is the honest answer: not "you will sell N per month" but
    "80% of plausible worlds fall between A and B".

    The sensitivity table at the end is the part actually worth reading. It
    says which assumption is worth spending a weekend measuring, and which
    ones do not matter.

SOURCED INPUTS (see README section at the bottom of the output)
    Global 6th-gen production   >3,500,000   Sep 1995 - Aug 2000
    Passenger car survival @20y      7.9%    NHTSA DOT HS 809 952
    Civic longevity vs segment       4.2x    iSeeCars 2025 (250k-mile basis)

ASSUMED INPUTS
    Everything else. Flagged inline. The defect rate is the weakest link and
    it is also the one with the largest leverage on the answer.
"""

import random
import statistics

random.seed(20260803)          # reproducible
N = 200_000                    # trials

CURRENT_YEAR = 2026
MODEL_YEARS = (1996, 1997, 1998)


def tri(lo, mode, hi):
    """Triangular sample. Used where we have a best guess and honest bounds."""
    return random.triangular(lo, hi, mode)


# ---------------------------------------------------------------------------
# 1. HOW MANY WERE BUILT
# ---------------------------------------------------------------------------
def production():
    # Sourced: >3.5M globally across the whole 6th gen (MY1996-2000, 5 years).
    global_all = tri(3_500_000, 3_700_000, 4_000_000)

    # 96-98 is 3 of 5 model years. Not a flat 60% — the 96 launch year ramped
    # and 99-00 tailed off before the 7th gen, so the middle years are
    # slightly over-weighted.
    share_96_98 = tri(0.55, 0.62, 0.68)

    # The US was the single largest market for this generation.
    us_share = tri(0.36, 0.42, 0.48)

    g = global_all * share_96_98
    return g * us_share, g * (1 - us_share)


# ---------------------------------------------------------------------------
# 2. HOW MANY SURVIVE, 28-30 YEARS ON
# ---------------------------------------------------------------------------
def survival_rate():
    """
    NHTSA gives 7.9% of passenger cars alive at 20 years. These cars are 28-30.
    Scrappage keeps compounding past 20, so the generic figure lands low
    single digits — modelled 1.0-3.0%.

    Then the Civic correction. iSeeCars puts the Civic at 4.2x the segment
    average for reaching 250,000 miles. That is a mileage statistic, not a
    survival statistic, so applying the full 4.2x would overstate it. Modelled
    2.0-3.6x, which also absorbs the EK's enthusiast retention (these get kept
    and rebuilt rather than scrapped) net of the fact that this generation was
    for years the most-stolen car in America.
    """
    generic = tri(0.010, 0.018, 0.030)
    civic_multiplier = tri(2.0, 2.8, 3.6)
    return min(generic * civic_multiplier, 0.14)   # hard ceiling, sanity


# ---------------------------------------------------------------------------
# 3. PARTS — defect rate, and how much owners care, differ sharply by part
# ---------------------------------------------------------------------------
#
# Modelling every part with one demand curve would be the single biggest error
# available here. A glove box that will not stay shut is a FUNCTIONAL failure
# the owner is reminded of on every drive. A missing slider knob is COSMETIC —
# the HVAC still works, you just push the bare lever. The share of owners who
# ever act on those two is not remotely the same, and that difference swamps
# everything else in the model.
#
# defect  = share of surviving cars with the fault
# cares   = of those, the share who ever fix it
# price   = list price, USD
# grams / minutes = from src/data/costs.json
# supply = how much of the demand you can actually reach, given what else the
#          buyer can get instead. THIS WAS MISSING FROM THE FIRST VERSION and
#          it was the flaw that made the latch look like the best product in
#          the catalogue. Modelling demand without modelling the competing
#          supply flatters any part that is easy to buy elsewhere.
#              1.0  = nothing else exists, you are the only source
#              0.1  = genuine OEM in stock plus a cheap Prime aftermarket
PARTS = {
    "HVAC knob set": dict(
        kind="repair",
        # Weakest input in the model, and the evidence contradicts itself:
        #  + press-fit plastic on a 28-year-old dash; used singles sell at
        #    $12-15 with "only 2 left in stock", which does not happen for
        #    parts nobody needs
        #  - the authoritative common-failures writeup for this exact unit
        #    lists backlights first and the blower resistor second. Broken
        #    knobs are NOT listed as a top failure mode.
        need=(0.12, 0.25, 0.45),
        cares=(0.10, 0.22, 0.40),      # cosmetic — most owners live with it
        # No new aftermarket found for the 96-98 SLIDER knob. Used singles
        # only, thin stock. This is a genuine supply gap.
        supply=(0.55, 0.75, 0.95),
        price=14.0, grams=16, minutes=55,
    ),
    "Glove box latch": dict(
        kind="repair",
        # Documented recurring failure with a dedicated YouTube repair
        # tutorial and multiple forum threads.
        need=(0.25, 0.45, 0.65),
        cares=(0.40, 0.62, 0.85),      # functional — the box will not stay shut
        # ...but genuine Honda 77540-S04-003ZB/ZC are on Amazon TODAY, and
        # HUYILUN sell a cross-platform aftermarket handle covering Civic,
        # Element, CR-V, Odyssey and Accord. Five platforms of injection
        # moulding volume. Demand you cannot capture is not demand.
        supply=(0.04, 0.12, 0.28),
        price=22.0, grams=38, minutes=105,
    ),
    "Custom symbol set": dict(
        kind="cosmetic",
        # Not a repair. Re-cut symbols on the sliders and buttons — an X or a
        # custom glyph where the factory light window is — so the backlit
        # panel reads differently at night. Every surviving car is a
        # candidate, not just broken ones, so `need` is mod propensity on the
        # EK: a heavily-modified platform with an established interior
        # aesthetics market.
        need=(0.10, 0.19, 0.28),
        # Of interior modders, the share who would want THIS specific mod.
        cares=(0.20, 0.35, 0.50),
        # Nothing like it exists for the EK. The constraint is awareness,
        # not competition — which is what the capture range below encodes.
        supply=(1.0, 1.0, 1.0),
        # Comparables: EK gauge-face overlays ~$90; Illumaesthetic EK gauge
        # faces $200-300. The platform's interior-aesthetics market clears at
        # real money. This is a smaller, secondary mod, so priced well under.
        price=29.0, grams=24, minutes=80,
    ),
}


# ---------------------------------------------------------------------------
# 4. THE FUNNEL — WHERE ALMOST ALL OF THE LOSS HAPPENS
# ---------------------------------------------------------------------------
def funnel(cares_range, supply_range, kind, intl=False):
    cares = tri(*cares_range)

    if kind == "repair":
        # Share who become active buyers in any GIVEN YEAR rather than
        # "someday" — a backlog clearing over ~5-12 years.
        annual = tri(1 / 12, 1 / 8, 1 / 5)
        # Of those, the share who find you at all. New store, no ranking.
        reach = tri(0.002, 0.012, 0.05) if intl else tri(0.01, 0.05, 0.15)
    else:
        # Modding is continuous rather than a backlog being worked off, so a
        # larger slice of the interested population is in-market each year.
        annual = tri(1 / 5, 1 / 3, 1 / 2)
        # For a product nobody else makes, "capture" is almost purely
        # AWARENESS — if they want it and find it, there is no alternative to
        # lose them to. That is why this is not discounted by supply below.
        # It is also the hard part: nobody searches for a thing they do not
        # know exists, so this is Instagram, forums and build threads, not
        # SEO. International is less penalised than for repair — shipping a
        # small light part is easy and mod communities are global.
        reach = tri(0.006, 0.03, 0.10) if intl else tri(0.02, 0.07, 0.18)

    return cares * annual * reach * tri(*supply_range)


# ---------------------------------------------------------------------------
# 5. UNIT ECONOMICS — straight from src/data/costs.json
# ---------------------------------------------------------------------------
MATERIAL_PER_KG = 22.0
FAILURE_ALLOWANCE = 0.08
MACHINE_PER_HR = 0.18
LABOUR_PER_HR = 25.0
LABOUR_MIN_PER_ORDER = 8
PACKAGING = 1.15
POSTAGE_COST = 4.75
SHIPPING_CHARGED = 6.00
STRIPE_PCT, STRIPE_FIXED = 0.029, 0.30


def net_per_order(price, grams, minutes, units=1):
    """Net profit on a single order containing `units` of one part."""
    gross = price * units + SHIPPING_CHARGED
    material = (grams * (1 + FAILURE_ALLOWANCE) / 1000) * MATERIAL_PER_KG * units
    machine = (minutes / 60) * MACHINE_PER_HR * units
    per_order = (LABOUR_MIN_PER_ORDER / 60) * LABOUR_PER_HR + PACKAGING + POSTAGE_COST
    fee = gross * STRIPE_PCT + STRIPE_FIXED
    return gross - fee - material - machine - per_order


# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------
def band(v, label, unit=""):
    v = sorted(v)
    print(f"  {label:<32} {v[int(.10*len(v))]:>11,.0f} "
          f"{v[int(.50*len(v))]:>11,.0f} {v[int(.90*len(v))]:>11,.0f} {unit}")


def main():
    print("=" * 76)
    print("96-98 CIVIC (EK/EJ) — ADDRESSABLE MARKET")
    print(f"{N:,} Monte Carlo trials · cars are "
          f"{CURRENT_YEAR - MODEL_YEARS[2]}-{CURRENT_YEAR - MODEL_YEARS[0]} years old")
    print("=" * 76)

    # ---- fleet is shared by every part ------------------------------------
    us_built, intl_built, alive_us, alive_intl, surv = [], [], [], [], []
    for _ in range(N):
        u, i = production()
        s = survival_rate()
        us_built.append(u); intl_built.append(i)
        alive_us.append(u * s); alive_intl.append(i * s)
        surv.append(s)

    print(f"\n{'':34}{'P10':>11}{'P50':>11}{'P90':>11}")
    print("\nBUILT, MODEL YEARS 96-98")
    band(us_built, "United States")
    band(intl_built, "Rest of world")
    band([a + b for a, b in zip(us_built, intl_built)], "TOTAL")
    print("\nSTILL ON THE ROAD IN 2026")
    band(alive_us, "United States")
    band(alive_intl, "Rest of world")
    band([a + b for a, b in zip(alive_us, alive_intl)], "TOTAL SURVIVORS")
    sv = sorted(surv)
    print(f"\n  implied survival rate          {sv[int(.1*N)]*100:>10.1f}% "
          f"{sv[int(.5*N)]*100:>10.1f}% {sv[int(.9*N)]*100:>10.1f}%")

    # ---- per part ---------------------------------------------------------
    summary = {}
    for pname, p in PARTS.items():
        broken, sales, profit = [], [], []
        fun_rec, def_rec = [], []
        for k in range(N):
            d = tri(*p["need"])
            fu = funnel(p["cares"], p["supply"], p["kind"], intl=False)
            fi = funnel(p["cares"], p["supply"], p["kind"], intl=True)
            bu, bi = alive_us[k] * d, alive_intl[k] * d
            n = bu * fu + bi * fi
            broken.append(bu + bi)
            sales.append(n)
            profit.append(n * net_per_order(p["price"], p["grams"], p["minutes"]))
            fun_rec.append(fu); def_rec.append(d)

        summary[pname] = dict(sales=sales, profit=profit, broken=broken,
                              fun=fun_rec, defect=def_rec)

        unit_net = net_per_order(p["price"], p["grams"], p["minutes"])
        print("\n" + "=" * 76)
        print(f"{pname.upper()}  [{p['kind']}]  —  ${p['price']:.0f}, net "
              f"${unit_net:.2f} per single-item order")
        print("=" * 76)
        print(f"{'':34}{'P10':>11}{'P50':>11}{'P90':>11}")
        band(broken, "candidate cars")
        band(sales, "UNITS SOLD / YEAR")
        band([s / 12 for s in sales], "units / month")
        band(profit, "NET PROFIT / YEAR", "USD")

    # ---- the comparison that actually matters -----------------------------
    print("\n" + "=" * 76)
    print("HEAD TO HEAD (median)")
    print("=" * 76)
    for pname in PARTS:
        s = sorted(summary[pname]["sales"])[N // 2]
        pr = sorted(summary[pname]["profit"])[N // 2]
        print(f"  {pname:<20} {s:>6.0f} units/yr   ${pr:>8,.0f}/yr net")
    best = max(PARTS, key=lambda n: sorted(summary[n]["profit"])[N // 2])
    print(f"\n  Best median net: {best}")

    # ---- sensitivity ------------------------------------------------------
    print("\n" + "=" * 76)
    print("SENSITIVITY — what moves the answer (Custom symbol set)")
    print("=" * 76)
    ks = summary["Custom symbol set"]
    for label, series in (("survival rate", surv),
                          ("defect rate", ks["defect"]),
                          ("funnel: cares x timing x capture", ks["fun"])):
        r = correlation(series, ks["sales"])
        print(f"  {label:<34} r={r:+.3f}  {'#' * int(abs(r) * 46)}")
    print("\n  The funnel dominates. Fleet size and failure/desire rate are facts\n"
          "  you cannot change; the funnel is entirely marketing and channel.")

    # ---- price ladder for the cosmetic product ------------------------------
    print("\n" + "=" * 76)
    print("PRICE LADDER — Custom symbol set")
    print("=" * 76)
    print("  Demand falls as price rises. Modelled with constant elasticity")
    print("  e=1.2 around the $29 reference: a niche mod with NO substitute is")
    print("  fairly inelastic, but it is discretionary, so not free to price.")
    print(f"\n  {'price':>7} {'elast.':>8} {'units/yr':>10} {'net/unit':>10} "
          f"{'NET/YEAR':>11}")
    base_units = sorted(summary["Custom symbol set"]["sales"])[N // 2]
    cp = PARTS["Custom symbol set"]
    for price in (19, 24, 29, 35, 45, 59):
        elasticity = (price / cp["price"]) ** -1.2
        units = base_units * elasticity
        per = net_per_order(price, cp["grams"], cp["minutes"])
        print(f"  ${price:>6} {elasticity:>8.2f} {units:>10.0f} "
              f"${per:>9.2f} ${units * per:>10,.0f}")
    print("\n  For comparison: EK gauge-face overlays sell ~$90 and")
    print("  Illumaesthetic's EK gauge faces are $200-300.")

    # ---- order bundling ---------------------------------------------------
    print("\n" + "=" * 76)
    print("WHY BUNDLING IS THE WHOLE GAME")
    print("=" * 76)
    per_order_fixed = (LABOUR_MIN_PER_ORDER / 60) * LABOUR_PER_HR + PACKAGING + POSTAGE_COST
    print(f"  Fixed cost per ORDER (labour + packaging + postage): "
          f"${per_order_fixed:.2f}")
    knob = PARTS["HVAC knob set"]
    latch = PARTS["Glove box latch"]
    solo = net_per_order(knob["price"], knob["grams"], knob["minutes"])
    both_gross = knob["price"] + latch["price"] + SHIPPING_CHARGED
    both_mat = sum((p["grams"] * 1.08 / 1000) * MATERIAL_PER_KG for p in (knob, latch))
    both_mach = sum((p["minutes"] / 60) * MACHINE_PER_HR for p in (knob, latch))
    both = both_gross - (both_gross * STRIPE_PCT + STRIPE_FIXED) - both_mat - both_mach - per_order_fixed
    print(f"  Knob alone, one order                      ${solo:>7.2f}")
    print(f"  Knob + latch, ONE order                    ${both:>7.2f}  "
          f"(+${both - solo:.2f} for ${latch['price']:.0f} more revenue)")
    print(f"  The second item costs ~${latch['grams']*1.08/1000*MATERIAL_PER_KG + (latch['minutes']/60)*MACHINE_PER_HR:.2f} to add "
          f"and carries no new fixed cost.")


def correlation(a, b):
    ma, mb = statistics.fmean(a), statistics.fmean(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    da = sum((x - ma) ** 2 for x in a) ** 0.5
    db = sum((y - mb) ** 2 for y in b) ** 0.5
    return num / (da * db) if da and db else 0.0


if __name__ == "__main__":
    main()
