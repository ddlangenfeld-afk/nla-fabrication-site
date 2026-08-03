/*
 * Price-ladder integrity.
 *
 * Variant pricing is the one feature in this app where a UI bug is a MONEY
 * bug: pick the $59 tier, get billed $19, and nothing on screen looks wrong.
 * The other QA scripts check that pages render and pass axe. This one checks
 * that the number the customer chose is the number that reaches the cart.
 *
 * Also guards the glyph/surface split, because offering a knob-only design on
 * an aperture product books an order that cannot be produced.
 */
import { chromium } from "playwright";
import { chromeExecutable } from "./browser.mjs";
const BASE = "http://localhost:3000";
const URL = BASE + "/products/hvac-symbol-set-96-98-civic";
const b = await chromium.launch({ executablePath: chromeExecutable() });
const page = await b.newPage();
let fails = 0;
const check = (name, got, want) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? "OK  " : "FAIL"}  ${name}: got ${JSON.stringify(got)}${ok ? "" : ` want ${JSON.stringify(want)}`}`);
};

await page.goto(URL, { waitUntil: "networkidle" });

// Header shows the range, not one price.
check("header shows range", /\$19\s*–\s*\$59/.test(await page.innerText("body")), true);

// Default rung is the middle one, not the cheapest.
check("defaults to mid tier", await page.isChecked('input[value="full"]'), true);

// Button price tracks the selected tier.
for (const [value, price] of [["apertures", "$19"], ["full", "$34"], ["kit", "$59"]]) {
  await page.click(`input[value="${value}"]`, { force: true });
  await page.waitForTimeout(150);
  const label = await page.innerText('button:has-text("Add to cart")');
  check(`button price for ${value}`, label.includes(price), true);
}

// Aperture-only glyphs: classic and skull must NOT be offered here.
const glyphs = await page.$$eval('input[name="face-design"]', (els) => els.map((e) => e.value));
check("glyph set is aperture-only", glyphs.sort().join(","), "chevron,cross,crosshair,diamond,hex,spade");
check("defaults to a lit glyph", await page.isChecked('input[value="cross"]'), true);

// The knob-set page keeps the full library including knob-only designs.
await page.goto(BASE + "/products/hvac-slider-knob-set-96-98-civic", { waitUntil: "networkidle" });
const knobGlyphs = await page.$$eval('input[name="face-design"]', (els) => els.map((e) => e.value));
check("knob page offers classic", knobGlyphs.includes("classic"), true);
check("knob page offers skull", knobGlyphs.includes("skull"), true);

// End to end: top tier into the cart at the right money.
await page.goto(URL, { waitUntil: "networkidle" });
await page.click('input[value="kit"]', { force: true });
await page.click('button:has-text("Add to cart")');
await page.waitForTimeout(400);
await page.goto(BASE + "/cart", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const cartText = await page.innerText("body");
check("cart line shows tier label", /panel kit \+ leds/i.test(cartText), true);
check("cart line priced at $59", cartText.includes("$59"), true);

// Two different tiers must be two lines, not one line of qty 2.
await page.goto(URL, { waitUntil: "networkidle" });
await page.click('input[value="apertures"]', { force: true });
await page.click('button:has-text("Add to cart")');
await page.waitForTimeout(400);
await page.goto(BASE + "/cart", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const rows = await page.$$eval("li h2", (els) => els.length);
check("distinct tiers are distinct lines", rows, 2);
const subtotal = await page.innerText("body");
check("subtotal is 59+19=78", subtotal.includes("$78"), true);

await b.close();
console.log(fails ? `\n${fails} FAILURE(S)` : "\nall ladder checks passed");
process.exit(fails ? 1 : 0);
