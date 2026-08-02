import { chromium } from "playwright";
import { chromeExecutable } from "./browser.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: chromeExecutable(),
});

// --- Desktop: skip link + focus visibility + tab order ---------------------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "networkidle" });

await page.keyboard.press("Tab");
const first = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return {
    text: el.textContent.trim().slice(0, 30),
    href: el.getAttribute("href"),
    visible: el.getBoundingClientRect().width > 0,
    outline: cs.outlineWidth + " " + cs.outlineStyle + " " + cs.outlineColor,
  };
});
console.log("1st tab (expect skip link, visible when focused):", first);

// Activate the skip link and confirm focus lands in main.
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const afterSkip = await page.evaluate(() => ({
  hash: location.hash,
  activeId: document.activeElement?.id || document.activeElement?.tagName,
}));
console.log("after skip link:", afterSkip);

// Walk the first 12 stops and confirm each has a visible focus ring.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const stops = [];
for (let i = 0; i < 12; i++) {
  await page.keyboard.press("Tab");
  stops.push(
    await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      const ring =
        (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
        cs.boxShadow !== "none";
      return {
        tag: el.tagName,
        label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28),
        ring,
      };
    })
  );
}
console.log("\ntab order + focus ring:");
stops.forEach((s, i) => console.log(`  ${i + 1}. ${s.ring ? "ring" : "NO RING"}  <${s.tag}> ${s.label}`));

// --- Mobile: menu button toggles and is operable by keyboard ---------------
const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const mpage = await mctx.newPage();
await mpage.goto(BASE + "/", { waitUntil: "networkidle" });

const before = await mpage.getAttribute('[aria-controls="mobile-nav"]', "aria-expanded");
await mpage.click('[aria-controls="mobile-nav"]');
await mpage.waitForTimeout(200);
const after = await mpage.getAttribute('[aria-controls="mobile-nav"]', "aria-expanded");
const navVisible = await mpage.isVisible("#mobile-nav");
console.log(`\nmobile menu: aria-expanded ${before} -> ${after}, nav visible: ${navVisible}`);

// Close it again, then confirm navigating via a menu link closes it too.
await mpage.click('[aria-controls="mobile-nav"]');
await mpage.waitForTimeout(200);
console.log(
  "closes again:",
  (await mpage.getAttribute('[aria-controls="mobile-nav"]', "aria-expanded")) === "false"
);

await mpage.click('[aria-controls="mobile-nav"]');
await mpage.waitForTimeout(200);
await mpage.click('#mobile-nav a[href="/shop"]');
await mpage.waitForTimeout(900);
console.log(
  "menu closed after navigation:",
  !(await mpage.isVisible("#mobile-nav")),
  "| url:",
  new URL(mpage.url()).pathname
);

await browser.close();
