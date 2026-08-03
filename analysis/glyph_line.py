#!/usr/bin/env python3
"""
The custom-symbol line, modelled as a product LADDER rather than one SKU.

analysis/fleet_model.py established the headline: a cosmetic symbol set beats
every repair part in the catalogue by ~9x, because it has no defect gate (every
surviving car is a candidate, not just the broken ones) and no substitute
(supply = 1.0, versus 0.12 for a glove box latch you can buy on Amazon).

This file asks the follow-up question: given that, what should actually be
BUILT? One $29 product, or a ladder? The answer matters because the fixed cost
per order is $9.23 and a single cheap item barely clears it.

Everything here reuses the fleet distributions from fleet_model.py so the two
files cannot drift apart. Cost inputs mirror src/data/costs.json.

Run:  python3 analysis/glyph_line.py
"""

import random
import statistics

N = 200_000

# ---------------------------------------------------------------------------
# FLEET — identical assumptions to fleet_model.py. See that file for sourcing.
# ---------------------------------------------------------------------------
def tri(lo, mode, hi):
    return random.triangular(lo, hi, mode)


def candidate_cars():
    """Surviving 96-98 cars whose owner would plausibly buy this.

    TWO gates, both of which fleet_model.py applies to the cosmetic product
    and both of which must be applied here or this file quietly reports ~3x
    the volume of the model it claims to agree with:

      mods    share of surviving cars whose owner modifies the interior at all
      wants   of those, the share who would want THIS specific mod
    """
    global_all = tri(3_500_000, 3_700_000, 4_000_000)
    share_96_98 = tri(0.55, 0.62, 0.68)
    us_share = tri(0.36, 0.42, 0.48)
    built = global_all * share_96_98

    survival = min(tri(0.010, 0.018, 0.030) * tri(2.0, 2.8, 3.6), 0.14)
    alive_us = built * us_share * survival
    alive_intl = built * (1 - us_share) * survival

    mods = tri(0.10, 0.19, 0.28)          # fleet_model: need
    wants = tri(0.20, 0.35, 0.50)         # fleet_model: cares
    gate = mods * wants
    return alive_us * gate, alive_intl * gate


def reach(intl):
    """In-market this year x actually found you. For a product with no
    substitute this is pure awareness — the hard part, and the only part
    that is actually under your control."""
    annual = tri(1 / 5, 1 / 3, 1 / 2)
    found = tri(0.006, 0.03, 0.10) if intl else tri(0.02, 0.07, 0.18)
    return annual * found


# ---------------------------------------------------------------------------
# UNIT ECONOMICS — mirrors src/data/costs.json
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

FIXED_PER_ORDER = (LABOUR_MIN_PER_ORDER / 60) * LABOUR_PER_HR + PACKAGING + POSTAGE_COST


# ---------------------------------------------------------------------------
# THE LADDER
# ---------------------------------------------------------------------------
# grams / print minutes are estimates in the same spirit as costs.json —
# corrigible against a kitchen scale and the slicer, not measured yet.
#
# bom  = bought-in parts (LEDs), at cost
# cad  = one-off design minutes charged into THIS order (commissions only)
TIERS = {
    "T1  Aperture set": dict(
        price=19.0, grams=8, minutes=30, bom=0.00, cad=0, mix=0.20,
        what="The 4 backlit indicator windows only. Swaps the square for "
             "whatever shape you want. Smallest, cheapest, zero legibility risk.",
    ),
    "T2  Full face set": dict(
        # 24g / 80min is the same part fleet_model.py prices at $29.
        price=34.0, grams=24, minutes=80, bom=0.00, cad=0, mix=0.55,
        what="Slider knobs + restyled function glyphs + apertures. The "
             "whole panel reads as one designed object.",
    ),
    "T3  Panel kit + LEDs": dict(
        price=59.0, grams=28, minutes=90, bom=3.50, cad=0, mix=0.25,
        what="T2 plus a matched LED set, so the glyph colour is specified "
             "rather than whatever the 28-year-old bulb does.",
    ),
}

COMMISSION = dict(
    price=85.0, grams=24, minutes=80, bom=0.00, cad=30,
    what="Customer's own shape, booleaned into the fixed knob body. "
         "The geometry is already solved; only the 2D profile changes.",
)


def net_per_order(spec, units=1):
    gross = spec["price"] * units + SHIPPING_CHARGED
    material = (spec["grams"] * (1 + FAILURE_ALLOWANCE) / 1000) * MATERIAL_PER_KG * units
    machine = (spec["minutes"] / 60) * MACHINE_PER_HR * units
    bom = spec["bom"] * units
    cad = (spec["cad"] / 60) * LABOUR_PER_HR
    fee = gross * STRIPE_PCT + STRIPE_FIXED
    return gross - fee - material - machine - bom - cad - FIXED_PER_ORDER


def band(vals):
    v = sorted(vals)
    return v[int(0.10 * len(v))], statistics.median(v), v[int(0.90 * len(v))]


def rule(title):
    print("\n" + "=" * 76)
    print(title)
    print("=" * 76)


# ---------------------------------------------------------------------------
def main():
    random.seed(45)

    blended_price = sum(t["price"] * t["mix"] for t in TIERS.values())
    blended_net = sum(net_per_order(t) * t["mix"] for t in TIERS.values())

    rule("THE LADDER — per-order economics")
    print(f"  {'tier':<22}{'price':>8}{'net/order':>12}{'margin':>9}   mix")
    for name, t in TIERS.items():
        n = net_per_order(t)
        print(f"  {name:<22}{t['price']:>8.0f}{n:>12.2f}{n / (t['price'] + SHIPPING_CHARGED):>8.0%}"
              f"   {t['mix']:.0%}")
    c = net_per_order(COMMISSION)
    print(f"  {'--  Commission':<22}{COMMISSION['price']:>8.0f}{c:>12.2f}"
          f"{c / (COMMISSION['price'] + SHIPPING_CHARGED):>8.0%}   n/a")
    print(f"\n  Blended list price   ${blended_price:>6.2f}")
    print(f"  Blended net / order  ${blended_net:>6.2f}")
    print(f"  Fixed cost per order ${FIXED_PER_ORDER:>6.2f}  "
          f"({FIXED_PER_ORDER / blended_net:.0%} of blended net)")

    # ---- volume -----------------------------------------------------------
    units, nets = [], []
    for _ in range(N):
        us, intl = candidate_cars()
        u = us * reach(False) + intl * reach(True)
        units.append(u)
        nets.append(u * blended_net)

    rule("VOLUME — blended across the ladder")
    ulo, umid, uhi = band(units)
    nlo, nmid, nhi = band(nets)
    print(f"  {'':<26}{'P10':>12}{'P50':>12}{'P90':>12}")
    print(f"  {'orders / year':<26}{ulo:>12,.0f}{umid:>12,.0f}{uhi:>12,.0f}")
    print(f"  {'orders / month':<26}{ulo/12:>12,.0f}{umid/12:>12,.0f}{uhi/12:>12,.0f}")
    print(f"  {'NET / YEAR (USD)':<26}{nlo:>12,.0f}{nmid:>12,.0f}{nhi:>12,.0f}")

    single = net_per_order(TIERS["T2  Full face set"])
    flat29 = net_per_order(dict(price=29.0, grams=16, minutes=55, bom=0, cad=0))
    print(f"\n  Same volume, one flat $29 SKU:   ${umid * flat29:>9,.0f}/yr")
    print(f"  Same volume, the ladder:         ${umid * blended_net:>9,.0f}/yr")
    print(f"  Ladder is worth                  ${umid * (blended_net - flat29):>9,.0f}/yr "
          f"({blended_net / flat29 - 1:+.0%} per order)")
    print("\n  The ladder wins on MIX, not on price. Same buyers, same awareness")
    print("  problem — but a third of them self-select upward if you let them.")

    # ---- what moves it ----------------------------------------------------
    rule("WHAT ACTUALLY MOVES THE ANSWER")
    for label, hi_mix in (("T3 attach 25% -> 40%", 0.40), ("T3 attach 25% -> 10%", 0.10)):
        mix = dict(T1=0.20, T3=hi_mix)
        mix["T2"] = 1.0 - mix["T1"] - mix["T3"]
        b = (net_per_order(TIERS["T1  Aperture set"]) * mix["T1"]
             + net_per_order(TIERS["T2  Full face set"]) * mix["T2"]
             + net_per_order(TIERS["T3  Panel kit + LEDs"]) * mix["T3"])
        print(f"  {label:<26} net/yr ${umid * b:>9,.0f}   ({b / blended_net - 1:+.0%})")

    for label, mult in (("awareness x2 (one viral reel)", 2.0),
                        ("awareness x5 (sustained IG)", 5.0)):
        print(f"  {label:<26} net/yr ${umid * blended_net * mult:>9,.0f}   ({mult - 1:+.0%})")

    print("\n  Note the asymmetry. Doubling the upsell rate moves net by single")
    print("  digits. Doubling AWARENESS doubles the business. Every hour is")
    print("  better spent on reach than on the price ladder.")

    # ---- the design library is the asset -----------------------------------
    rule("GLYPH ECONOMICS — why this is a library, not a product")
    design_min = 45
    design_cost = (design_min / 60) * LABOUR_PER_HR
    print(f"  One new glyph: ~{design_min} min CAD = ${design_cost:.2f} of your time.")
    print(f"  It is a 2D profile booleaned into a body that is already solved.\n")
    print(f"  {'sells this many':>16}{'design cost/unit':>20}{'% of net':>12}")
    for n in (5, 20, 50, 200):
        print(f"  {n:>16}{design_cost / n:>20.2f}{design_cost / n / blended_net:>11.1%}")
    print(f"\n  Past ~20 units a glyph is free. That is the whole strategic point:")
    print(f"  the marginal cost of VARIETY is nearly zero, so variety is the moat.")
    print(f"  A competitor with a printer can copy one glyph. Copying a library")
    print(f"  of forty, and the taste that picked them, is a different problem.")

    rule("COMMISSIONS — the highest-margin thing on this list")
    print(f"  ${COMMISSION['price']:.0f} with {COMMISSION['cad']} min of CAD charged in "
          f"= ${c:.2f} net, {c / (COMMISSION['price'] + SHIPPING_CHARGED):.0%} margin.")
    print(f"  That is {c / blended_net:.1f}x a blended catalogue order for "
          f"{COMMISSION['cad']} minutes of extra work.")
    print(f"  At just 1 commission a month: ${c * 12:,.0f}/yr on top.")
    print(f"  At 1 a week:                  ${c * 52:,.0f}/yr on top.")
    print("\n  Commissions also do something the catalogue cannot: each one is a")
    print("  photograph of a car that is not yours, posted by someone who is not")
    print("  you. That is the awareness lever, bought at a profit instead of a cost.")

    # ---- chassis expansion -------------------------------------------------
    rule("CHASSIS EXPANSION — the only route past ~$10k/yr")
    print("  ASSUMPTION, not derived: each additional chassis is modelled at a")
    print("  fraction of the EK's addressable volume. Fleet sizes for EG/DC2/")
    print("  S2000 were NOT researched — treat these as scenario arithmetic, and")
    print("  size each properly before committing the modelling time.\n")
    print(f"  {'chassis added':<34}{'net / year':>14}")
    base = umid * blended_net
    for label, factor in (("EK only (today)", 1.00),
                          ("+ EG 92-95 Civic (~0.7x)", 1.70),
                          ("+ DC2 Integra (~0.5x)", 2.20),
                          ("+ S2000 (~0.35x, proven on Etsy)", 2.55),
                          ("+ EF / DA / CRX (~0.5x combined)", 3.05)):
        print(f"  {label:<34}{base * factor:>14,.0f}")
    print("\n  The design language ports even though no geometry does. Each new")
    print("  chassis re-uses the glyph library and the photography style, and")
    print("  needs only a new body — which is the part you have already proven")
    print("  you can do (design/knob_model.py).")

    rule("PLAN AGAINST THIS")
    print(f"  MODELLED — the only figures with a simulation behind them:")
    print(f"    Ladder, EK only, P10 / median / P90:")
    print(f"      ${nlo:>9,.0f}  ${nmid:>9,.0f}  ${nhi:>9,.0f}   per YEAR")
    print(f"      (${nmid/12:>9,.0f} per month at the median)")
    print()
    print(f"  SPECULATIVE — each is a scenario, NOT a forecast. Read them one at")
    print(f"  a time. They are deliberately not chained into a single total,")
    print(f"  because multiplying four optimistic assumptions compounds the")
    print(f"  optimism and produces a number that looks earned and is not.")
    print(f"    if commissions land at 1/week:      +${c * 52:>8,.0f}/yr")
    print(f"    if 4 more chassis perform like EK:  +${base * 2.05:>8,.0f}/yr  (fleet sizes NOT researched)")
    print(f"    if awareness reaches 3x:            x3        (nothing supports this)")
    print()
    print(f"  All four together would be ${(base * 3.05 + c * 52) * 3:,.0f}/yr. That is arithmetic, not a")
    print(f"  projection: it assumes a 1-in-4 commission attach rate, four")
    print(f"  unresearched fleets, and 3x awareness in four separate car")
    print(f"  communities at once, built by one person.")

    # The model charges 8 min/order of packing labour and nothing else. Every
    # other hour this business needs is invisible to it, which is why a "net
    # profit" line flatters the outcome. State the rate, not just the total.
    rule("WHAT THE MODEL DOES NOT CHARGE YOU FOR")
    unpaid_base = 200
    print(f"  Charged:     8 min/order packing @ ${LABOUR_PER_HR:.0f}/hr, and commission CAD.")
    print(f"  NOT charged: marketing, photography, chassis CAD, customer")
    print(f"               service, admin, returns.")
    print(f"\n  At the median, ~{unpaid_base} unpaid hours/yr for ${base:,.0f} is "
          f"${base/unpaid_base:,.0f}/hr.")
    print(f"  That is the honest read on the base case: not yet a business,")
    print(f"  a hobby that pays for itself and its own tooling.")


if __name__ == "__main__":
    main()
