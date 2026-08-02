/*
 * Verifies the three things a screenshot can't show: that scroll reveals
 * actually transition on every page (not just the homepage), that the cursor
 * spotlight tracks the pointer, and that the sound toggle brings up a running
 * AudioContext with real signal on the bus.
 *
 * Run against a production server: npm run start, then npm run qa:motion
 */
import { chromium } from "playwright";
import { launchOptions } from "./browser.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PAGES = ["/", "/shop", "/about", "/contact", "/products/glove-box-latch-96-00-civic"];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};
const pass = (msg) => console.log(`  ✓ ${msg}`);

const browser = await chromium.launch(launchOptions());
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

/* ---- 1. Reveals animate on every page ---------------------------------- */
for (const path of PAGES) {
  console.log(`\n${path}`);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

  const count = await page.locator(".reveal, .reveal-lines").count();
  if (count === 0) {
    fail("no reveal elements on the page at all");
    continue;
  }

  // Find one that is still below the fold and therefore still hidden.
  const hidden = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll(".reveal, .reveal-lines")];
    const below = nodes.find(
      (n) =>
        n.getBoundingClientRect().top > window.innerHeight &&
        n.dataset.revealed !== "true"
    );
    if (!below) return null;
    below.setAttribute("data-probe", "1");
    const el = below.classList.contains("reveal-lines")
      ? below.querySelector(".reveal-line-inner")
      : below;
    return getComputedStyle(el).transform;
  });

  if (hidden === null) {
    fail(`${count} reveal elements, but none were hidden below the fold`);
    continue;
  }
  if (hidden === "none") {
    fail("below-fold reveal was already in its finished state before scrolling");
    continue;
  }
  pass(`${count} reveal elements; below-fold one starts offset (${hidden})`);

  await page.evaluate(() =>
    document.querySelector("[data-probe]")?.scrollIntoView({ block: "center" })
  );
  // html has scroll-behavior:smooth, so the scroll itself takes time before
  // the observer even fires — then up to 520ms of stagger delay plus a 1s
  // transition. 3s is comfortably past all of it.
  await page.waitForTimeout(3000);

  const settled = await page.evaluate(() => {
    const node = document.querySelector("[data-probe]");
    const el = node.classList.contains("reveal-lines")
      ? node.querySelector(".reveal-line-inner")
      : node;
    const s = getComputedStyle(el);
    return { revealed: node.dataset.revealed, opacity: s.opacity, transform: s.transform };
  });

  if (settled.revealed === "true" && settled.opacity === "1" && settled.transform === "none") {
    pass("reveals to opacity 1 / transform none after scrolling into view");
  } else {
    fail(`did not settle: ${JSON.stringify(settled)}`);
  }
}

/* ---- 2. Cursor spotlight ------------------------------------------------ */
console.log("\ncursor spotlight");
await page.goto(BASE, { waitUntil: "networkidle" });
const before = await page.evaluate(() => {
  const el = document.querySelector(".spotlight");
  return el ? el.style.getPropertyValue("--spot-opacity") : "MISSING";
});
await page.mouse.move(400, 300);
await page.waitForTimeout(120);
await page.mouse.move(900, 620);
await page.waitForTimeout(120);
const after = await page.evaluate(() => {
  const el = document.querySelector(".spotlight");
  return {
    mx: el.style.getPropertyValue("--mx"),
    my: el.style.getPropertyValue("--my"),
    opacity: el.style.getPropertyValue("--spot-opacity"),
  };
});
if (before === "MISSING") fail("no .spotlight element rendered");
else if (after.mx === "900px" && after.my === "620px" && after.opacity === "1")
  pass(`follows the pointer (${after.mx}, ${after.my}), opacity ${after.opacity}`);
else fail(`did not track the pointer: ${JSON.stringify(after)}`);

const orbs = await page.locator(".orb").count();
if (orbs === 3) pass("3 drifting orbs present");
else fail(`expected 3 orbs, found ${orbs}`);

const drifting = await page.evaluate(() => {
  const orb = document.querySelector(".orb-a");
  return getComputedStyle(orb).animationName;
});
if (drifting === "drift-a") pass("orb animation is running");
else fail(`orb has no drift animation (${drifting})`);

/* ---- 3. Audio ----------------------------------------------------------- */
console.log("\naudio");
// Tap the running AudioContext so the test can measure real output rather than
// trusting that the graph was built.
await page.addInitScript(() => {
  const Original = window.AudioContext;
  window.__ctx = null;
  window.AudioContext = class extends Original {
    constructor(...args) {
      super(...args);
      window.__ctx = this;
      // Count one-shot voices so the hover/click sounds can be told apart
      // from the pad, which is already producing signal on the same bus.
      window.__osc = 0;
      window.__buf = 0;
      const co = this.createOscillator.bind(this);
      this.createOscillator = () => (window.__osc++, co());
      const cb = this.createBufferSource.bind(this);
      this.createBufferSource = () => (window.__buf++, cb());

      const analyser = this.createAnalyser();
      analyser.fftSize = 2048;
      window.__analyser = analyser;
      const realConnect = GainNode.prototype.connect;
      // The master gain is the only node connected straight to destination.
      const dest = this.destination;
      GainNode.prototype.connect = function (target, ...rest) {
        if (target === dest) realConnect.call(this, analyser);
        return realConnect.call(this, target, ...rest);
      };
    }
  };
});
await page.goto(BASE, { waitUntil: "networkidle" });

const toggle = page.getByRole("button", { name: /sound/i });
if ((await toggle.count()) === 0) {
  fail("no sound toggle rendered");
} else {
  if ((await toggle.getAttribute("aria-pressed")) === "false") pass("starts off (aria-pressed=false)");
  else fail("sound is not off by default");

  await toggle.click();
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => window.__ctx?.state ?? "no-context");
  if (state === "running") pass("AudioContext running after the toggle");
  else fail(`AudioContext state is "${state}"`);

  const level = await page.evaluate(() => {
    const a = window.__analyser;
    if (!a) return -1;
    const data = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(data);
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    return peak;
  });
  if (level > 0.0005) pass(`ambient pad is producing signal (peak ${level.toFixed(4)})`);
  else fail(`no signal on the master bus (peak ${level})`);

  if ((await toggle.getAttribute("aria-pressed")) === "true") pass("toggle reports pressed");
  else fail("toggle did not flip aria-pressed");

  // Hover a control: two oscillators (the blip's two partials).
  const link = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Shop" });
  const oscBefore = await page.evaluate(() => window.__osc);
  await link.hover();
  await page.waitForTimeout(200);
  const oscAfter = await page.evaluate(() => window.__osc);
  if (oscAfter - oscBefore >= 2) pass(`hover fires a blip (+${oscAfter - oscBefore} voices)`);
  else fail(`hovering a link produced no sound (+${oscAfter - oscBefore} voices)`);

  // Press: a noise burst plus a low body. Release away from the link so the
  // page doesn't navigate mid-test.
  const bufBefore = await page.evaluate(() => window.__buf);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const bufAfter = await page.evaluate(() => window.__buf);
  await page.mouse.move(10, 500);
  await page.mouse.up();
  if (bufAfter - bufBefore >= 1) pass("press fires a click transient");
  else fail("pressing a link produced no click sound");

  // And nothing chirps at a paragraph.
  const quietBefore = await page.evaluate(() => window.__osc);
  await page.locator("p").first().hover();
  await page.waitForTimeout(200);
  const quietAfter = await page.evaluate(() => window.__osc);
  if (quietAfter === quietBefore) pass("plain text is silent");
  else fail(`hovering body text made a sound (+${quietAfter - quietBefore})`);

  // Preference survives a reload.
  await page.reload({ waitUntil: "networkidle" });
  const persisted = await page
    .getByRole("button", { name: /sound/i })
    .getAttribute("aria-pressed");
  if (persisted === "true") pass("preference persists across a reload");
  else fail(`preference did not persist (aria-pressed=${persisted})`);

  // And turning it off closes the context.
  await page.getByRole("button", { name: /sound/i }).click();
  await page.waitForTimeout(1200);
  const closed = await page.evaluate(() => window.__ctx?.state ?? "no-context");
  if (closed === "closed" || closed === "no-context") pass(`context released on off (${closed})`);
  else fail(`context still ${closed} after switching sound off`);
}

await browser.close();
console.log(failures === 0 ? "\nAll motion + audio checks passed." : `\n${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
