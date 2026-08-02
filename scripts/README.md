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
npm run qa:lighthouse
npm run qa:shots     # full-page screenshots at 375/768/1440 -> ./.shots
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
