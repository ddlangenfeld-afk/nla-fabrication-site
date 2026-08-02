import { chromium } from "playwright";
import { chromeExecutable } from "./browser.mjs";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const axeSource = fs.readFileSync(axePath, "utf8");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PAGES = [
  "/",
  "/shop",
  "/products/glove-box-latch-96-00-civic",
  "/products/armrest-lid-latch-96-00-civic",
  "/about",
  "/contact",
  "/cart",
  "/legal/privacy",
  "/nope-not-here",
];

const browser = await chromium.launch({
  executablePath: chromeExecutable(),
});

for (const width of [375, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  console.log(`\n=========== ${width}px ===========`);

  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async () => {
      return await globalThis.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });
    });

    if (results.violations.length === 0) {
      console.log(`  OK   ${path}`);
    } else {
      console.log(`  FAIL ${path}`);
      for (const v of results.violations) {
        console.log(`    [${v.impact}] ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 3)) {
          console.log(`        ${n.target.join(" ")}`);
          const msg = (n.failureSummary || "").split("\n").filter(Boolean).slice(1, 3);
          msg.forEach((m) => console.log(`          ${m.trim()}`));
        }
      }
    }
  }
  await ctx.close();
}

await browser.close();
