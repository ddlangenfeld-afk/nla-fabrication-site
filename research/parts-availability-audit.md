# Parts availability audit

**Date:** 2026-08-03
**Scope:** all 10 catalog entries in `src/data/products.json`
**Reason:** the site was making "discontinued / out of production / scarce" claims that
had never been checked against a parts catalog. Three of them are false.

A claim that a part is NLA is a factual claim about Honda's parts catalog. If a customer
can find the genuine part on Amazon in thirty seconds for less than we charge, the claim
is not just wrong — it costs us the sale and the credibility of every other claim on the
page. Scarcity is the one thing we must never assert without checking.

---

## Method and its limits

Searched OEM catalog resellers (hondapartsnow, hondafactoryparts, hondacarpartsdirect,
hondapartsonline, CMSNL, Amayama, vpartsinc, Honda Parts Center), Amazon, and general
web search for each part number and description.

**Limits, stated plainly:**

- The network policy blocks direct fetches of most parts sites (HTTP 403 at the proxy).
  Findings below come from search-result summaries and listing titles, not from reading
  the catalog pages themselves. Prices and stock counts are therefore *indicative*.
- Reseller "availability" is not the same as Honda's official status. A vendor showing
  stock may be showing old shelf inventory of a part Honda has since dropped. The
  reverse also happens — a vendor page saying "out of production" while four other
  vendors list it in stock.
- **The authoritative check is a dealer parts counter with a VIN.** Nothing below
  replaces that. What it does establish is the much weaker but sufficient claim: *these
  parts are obtainable today*, which is all that is needed to disprove "scarce".

---

## Findings

### 1. Glove Box Latch — claim is FALSE

| | |
|---|---|
| Site claimed | "confirmed discontinued by the manufacturer", "Secondary-market units are scarce", "The original component is out of production" |
| Reality | Genuine Honda **77540-S04-003ZB** (Classy Gray) and **-003ZC** listed on Amazon and hondapartsnow, indicatively **$16.50–$20** |
| Aftermarket | HUYILUN and others cross-list Civic 96-00 / Element / CR-V / Odyssey / Accord — a multi-chassis part, so aftermarket volume is high |
| Salvage | Every EK in every yard has one |

Honda's own name for it is "Lock Assy., Glove Box". Note the price: **the genuine part is
cheaper than our $22.** There is no scarcity story and no price story here.

### 2. HVAC Slider Lever & Knob Set — claim is FALSE as written

| | |
|---|---|
| Site claimed | "Individual knobs were never released as a service part. The only new option from the manufacturer is a complete climate control assembly" |
| Reality | **79601-S04-003 "Knob (A)"** is a genuine Honda service part catalogued for **1996–1998 Civic**, indicatively **$8.34–$13.70**, listed by at least six resellers, one showing 12 in stock |
| Nuance | One reseller flags it out of production. Marketplace listings describe it as a "Climate Control A/C Heater **Slider Knob**", so it is a panel knob, not an unrelated part |

The blanket "never released as a service part" is wrong — Honda catalogued at least one.
What is *probably* true, and is the defensible version, is that **not every knob and
lever on the panel has its own part number**, and the ones that do are single-knob
listings at $8–14 each, so replacing a full set from OEM sources means assembling it from
several vendors. That is a real customer problem. It is a different claim from the one
we were making, and it is the only one we can support.

The 99–00 panel is a different design (knobs, not sliders) with its own part numbers
(79602-S04-A01 rear-defogger knob, 79603-S04-A01 recirc knob). **They do not
interchange.** Our 96–98 fitment is correct and should stay narrow.

### 3. Interior Door Handle Bezel — claim is UNVERIFIED

| | |
|---|---|
| Site claimed | "New replacements are out of production", "reproduction of the discontinued interior handle bezel" |
| Found | Could not confirm a discrete OEM part number for the bezel/surround alone on the S04 chassis. `72125-S5S-E01ZD` ("Case R Front Inside") is the equivalent part on the *later* ES/EM chassis, which suggests Honda does catalogue this component as a "Case" — but not that the S04 version is available |
| Found | **Complete interior door handles** are widely available aftermarket (A-Premium, KarParts360) for 96-00, in black/charcoal/taupe, LH and RH, roughly $12–20 — replacing `72120-S04-004ZB` / `72160-S04-004ZB` |

Not disproven, but not supported either. Unverified is not a licence to assert. Copy must
drop the discontinuation language until someone reads it off a dealer terminal.

### 4. Armrest Lid Latch — hedge is honest, but fitment needs a warning

Existing copy correctly says fitment verification is in progress. Nothing found to
suggest a discrete serviceable latch exists for the EK console; the armrest appears to be
sold as a complete assembly (e.g. `83401S0400`) and turns up used on eBay.

**New risk found:** the centre armrest was **not fitted to every EK trim**. Any listing
must state which cars actually have the console, or we will eat returns from people whose
car never had one.

### 5. Rear Hatch Interior Pull Handle — hedge is honest

Nothing found either way. No OEM part number confirmed. Copy already says exactly that.
Leave it alone.

### 6. Door Panel Reinforcement Bracket — no claim to audit

Our own design, correctly described as such. Fine.

### 7. Weatherstrip End Retainers & Clips — claim is FALSE, and the product is dead

| | |
|---|---|
| Site claimed | "were never supplied in serviceable quantities" |
| Reality | 20-, 40- and **72-piece assortment kits** sold on Amazon (Rexka, Woodzdon), eBay, RockAuto, CRL and clipsandfasteners.com — several listed for **exactly** "Honda Civic 1996-2000" |
| Genuine refs | `91515-SR3-000`, `91503-SP0-003`, `91560-SP0-003` |

Not scarce. Abundant, cheap, injection-moulded at volume, and sold in bulk kits. **We
cannot compete on a commodity fastener** — a 3D-printed clip is slower to make and worse
in fatigue than an injection-moulded one, and the incumbent sells 72 of them for the price
of our postage. Recommend removing from the roadmap.

### 8. Cowl, Wiper & Hood-Prop Clip Assortment — same verdict

Same suppliers, same kits, frequently the same SKUs. Remove from the roadmap.

### 9. Modern Hardware Dash Cradles — no claim to audit

Our own design. No OEM equivalent exists by definition. **This is the strongest remaining
roadmap item** and the only one on the list that shares the structural advantage of the
custom-symbol product: nobody else makes it.

### 10. K-Swap Underhood Plastic Guides — no claim to audit

Our own design. Material note (ASA/nylon, not PETG) is correct and worth keeping.

---

## What this changes

**The scarcity thesis does not survive.** Seven of ten entries either had no availability
claim or had one that is false. The catalog was built on "these parts are gone" and that
premise is wrong for the two flagship products.

What is actually defensible, and is now what the copy says:

1. **Colour and finish.** OEM is grey plastic in whatever shade Honda used in 1997, faded
   differently in every car. We make matched sets in five colours.
2. **Set completeness.** OEM sells single knobs from scattered vendors. We sell the set.
3. **Material.** PETG over aged ABS in the specific zones that fail, with build
   orientation specified. This is true and checkable.
4. **Things that do not exist at any price.** Custom symbol sets, dash cradles. No OEM
   part number, no aftermarket, no salvage. See `analysis/fleet_model.py` — the supply
   factor is the single biggest driver of addressable volume, and it is 1.0 only here.

The strategic read: **stop reproducing parts Honda still sells, start making parts Honda
never made.** The repair catalog's job is now to establish that we can hold a tolerance —
it is a credential, not the business.

---

## Follow-up required

- [ ] Dealer parts-counter check with a VIN on: door handle bezel (S04 "Case, Inside
      Handle"), full 96–98 heater control knob breakdown, armrest latch
- [ ] Confirm how many of the 96–98 panel knobs/levers have their own part numbers —
      this determines whether "assembling a set from OEM is a pain" is a strong claim or
      a weak one
- [ ] Price check our $22 latch against genuine at ~$17. Currently we are more expensive
      than the real part, which is not a position
