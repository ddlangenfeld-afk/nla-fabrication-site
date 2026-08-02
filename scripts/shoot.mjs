import { chromium } from "playwright";
import { chromeExecutable, settleReveals } from "./browser.mjs";
import fs from "node:fs";

const OUT = process.env.SHOTS_DIR || "./.shots";
fs.mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL || "http://localhost:3000";
const pages = process.argv[2]
  ? [JSON.parse(process.argv[2])]
  : [
      { name: "home", path: "/" },
      { name: "shop", path: "/shop" },
      { name: "product", path: "/products/glove-box-latch-96-00-civic" },
      { name: "product-hvac", path: "/products/hvac-slider-knob-set-96-98-civic" },
      { name: "product-soon", path: "/products/armrest-lid-latch-96-00-civic" },
      { name: "about", path: "/about" },
      { name: "contact", path: "/contact" },
      { name: "cart-empty", path: "/cart" },
      { name: "success", path: "/cart/success" },
      { name: "legal", path: "/legal/privacy" },
      { name: "404", path: "/nope-not-here" },
    ];

const viewports = [
  { label: "375", width: 375, height: 812 },
  { label: "768", width: 768, height: 1024 },
  { label: "1440", width: 1440, height: 900 },
  // The wide pair exists to check the shell actually fills a real desktop —
  // a fixed max-width container looks fine at 1440 and leaves half a 2560
  // display empty.
  { label: "1920", width: 1920, height: 1080 },
  { label: "2560", width: 2560, height: 1440 },
];

const browser = await chromium.launch({ executablePath: chromeExecutable() });

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  for (const p of pages) {
    await page.goto(BASE + p.path, { waitUntil: "networkidle" });
    // A full-page screenshot captures everything at once, including sections
    // whose reveal observer will never fire because they were never scrolled
    // to. Without this the shots are mostly blank below the fold.
    await settleReveals(page);
    await page.screenshot({
      path: `${OUT}/${p.name}-${vp.label}.png`,
      fullPage: true,
    });
  }
  if (errors.length) console.log(`[${vp.label}] console errors:`, errors);
  await ctx.close();
}

await browser.close();
console.log("done");
