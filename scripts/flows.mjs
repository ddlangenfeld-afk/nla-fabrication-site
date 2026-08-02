import { chromium } from "playwright";
import { chromeExecutable } from "./browser.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: chromeExecutable(),
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));

// ---------- contact form validation ----------
await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
await page.click('button[type="submit"]');
await page.waitForTimeout(300);

const afterEmpty = await page.evaluate(() => ({
  errors: [...document.querySelectorAll("p.text-error")].map((p) => p.textContent.trim()),
  invalid: document.querySelectorAll('[aria-invalid="true"]').length,
  focused: document.activeElement?.tagName + ":" + (document.activeElement?.name || ""),
}));
console.log("empty submit ->");
afterEmpty.errors.forEach((e) => console.log("   ", e));
console.log("    aria-invalid count:", afterEmpty.invalid, "| focus:", afterEmpty.focused);

// Bad email, short message.
await page.fill('input[name="name"]', "Dana");
await page.fill('input[name="email"]', "dana@nope");
await page.fill('textarea[name="message"]', "too short");
await page.click('button[type="submit"]');
await page.waitForTimeout(300);
console.log("\nbad email + short message ->");
for (const t of await page.evaluate(() =>
  [...document.querySelectorAll("p.text-error")].map((p) => p.textContent.trim())
))
  console.log("   ", t);

// Fixing a field should clear its message as you type.
await page.fill('input[name="email"]', "dana@example.com");
await page.waitForTimeout(200);
console.log(
  "\nafter fixing email, remaining errors:",
  await page.evaluate(() => document.querySelectorAll("p.text-error").length)
);

// Valid submit with no RESEND key -> mailto fallback, not a dead end.
await page.fill('textarea[name="message"]', "My glove box latch snapped, do you ship to NY?");
await page.click('button[type="submit"]');
await page.waitForTimeout(1200);
const submitted = await page.evaluate(() => document.body.innerText);
console.log(
  "\nvalid submit with no email key -> mailto fallback shown:",
  /isn.t wired up/i.test(submitted)
);

// ---------- cart: add, adjust, checkout without a Stripe key ----------
await page.goto(BASE + "/products/door-handle-bezel-96-00-civic", { waitUntil: "networkidle" });
await page.click('input[value="rh"]', { force: true });
await page.click('button:has-text("Add to cart")');
await page.waitForTimeout(400);
const badge = await page.textContent('a[href="/cart"] span:last-child');
console.log("\ncart badge after add:", badge.trim());

await page.goto(BASE + "/cart", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
console.log(
  "cart shows variant:",
  /passenger side \(rh\)/i.test(await page.innerText("body"))
);

await page.click('button[aria-label^="Increase"]');
await page.waitForTimeout(300);
const totals = await page.evaluate(() => {
  const dds = [...document.querySelectorAll("dd")].map((d) => d.textContent.trim());
  return dds;
});
console.log("cart totals after +1:", totals.join(" | "));

await page.click('button:has-text("Checkout")');
await page.waitForTimeout(1200);
console.log(
  "checkout with no Stripe key -> explains instead of erroring:",
  /checkout isn.t live yet/i.test(await page.innerText('body'))
);

// ---------- cart persistence across reload + empty state ----------
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
console.log("cart survives reload:", /order summary/i.test(await page.innerText("body")));

await page.click('button:has-text("Remove")');
await page.waitForTimeout(400);
console.log("empty state after remove:", /nothing in the cart yet/i.test(await page.innerText("body")));

console.log("\npage errors:", errs.length ? errs : "none");
await browser.close();
