import { chromium } from "playwright";
import { chromeExecutable, settleReveals } from "./browser.mjs";
import fs from "node:fs";
import { createRequire } from "node:module";
const axeSource = fs.readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const b = await chromium.launch({ executablePath: chromeExecutable() });

async function scan(page, label) {
  await settleReveals(page);
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () =>
    await globalThis.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa"] } }));
  if (!r.violations.length) return console.log("  OK  ", label);
  console.log("  FAIL", label);
  r.violations.forEach(v => console.log(`    [${v.impact}] ${v.id}: ${v.help}`));
}

for (const w of [375, 1440]) {
  console.log(`--- ${w}px ---`);
  const p = await b.newPage({ viewport: { width: w, height: 900 } });

  // Contact form showing validation errors
  await p.goto(BASE + "/contact", { waitUntil: "networkidle" });
  await p.click('button[type="submit"]');
  await p.waitForTimeout(400);
  await scan(p, "contact — validation errors visible");

  // Cart with items
  await p.evaluate(() => localStorage.setItem("nla-cart-v1",
    JSON.stringify([{ slug: "door-handle-bezel-96-00-civic", variantId: "rh", qty: 2 }])));
  await p.goto(BASE + "/cart", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await scan(p, "cart — populated");

  // Order confirmation
  await p.goto(BASE + "/cart/success", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await scan(p, "cart/success");

  // Mobile menu open
  if (w === 375) {
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    await p.click('[aria-controls="mobile-nav"]');
    await p.waitForTimeout(300);
    await scan(p, "home — mobile menu open");
  }
  await p.close();
}
await b.close();
