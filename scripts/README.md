# QA scripts

The checks used to verify this site. They drive a real browser against a
running build, so start one first:

```bash
npm run build && npx next start -p 3000
```

Then, in another shell:

```bash
npm run qa:a11y      # axe-core, WCAG 2.1 AA, every route at 375 and 1440
npm run qa:states    # axe against interactive states axe-at-rest misses
npm run qa:keyboard  # skip link, tab order, focus rings, mobile menu
npm run qa:flows     # form validation, cart, variants, keyless checkout
npm run qa:motion    # scroll reveals, cursor spotlight, and the audio engine
npm run qa:lighthouse
npm run qa:shots     # full-page screenshots at 375/768/1440/1920/2560 -> ./.shots
```

Point them somewhere else with `BASE_URL`:

```bash
BASE_URL=https://staging.example.com npm run qa:a11y
```

Playwright resolves its own Chromium by default. Override with `CHROME_PATH`
if you need a specific binary.

## Why these five

`qa:a11y` alone is not an accessibility pass. Two of the real WCAG failures
found while building this site were invisible to it:

- **The skip link didn't skip.** It moved the hash but left focus on `<body>`,
  so the next Tab restarted at the top. Only `qa:keyboard` catches that.
- **Label in Name and Target Size** (WCAG 2.5.3 / 2.5.8) came from Lighthouse,
  not axe.

And `qa:states` exists because a form is most likely to be inaccessible in the
state axe never sees at rest — showing validation errors.

One caveat learned the hard way: `innerText` reflects CSS `text-transform`, so
assertions against uppercased UI must be case-insensitive. Two "failures" in an
early run were this bug in the test, not the site.

## `qa:motion`, and why sound needs a test at all

Audio is the one feature you cannot verify by looking at a screenshot, and
"the toggle flipped" proves nothing — the graph can be built and silent. So
this suite taps the `AudioContext`: it patches `GainNode.connect` to splice an
`AnalyserNode` in front of `destination` and reads the actual peak sample off
the master bus, and it counts oscillators to tell a hover blip apart from the
pad already playing underneath it.

It also asserts the negative: **hovering body text must be silent.** A
delegated listener that fires on the wrong selector turns a whole page into a
chirping hazard, and that failure is invisible to every other check here.

The reveal half exists because "the animation isn't working" was reported once
and was half true — the home page animated and four other pages had no reveal
components at all. Asserting per page that a below-the-fold element *starts*
offset and *then* settles is what distinguishes "animating" from "already
there," which is what was actually wrong.
