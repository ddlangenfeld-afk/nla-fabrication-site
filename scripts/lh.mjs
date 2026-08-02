import lighthouse from "lighthouse";
import { chromium } from "playwright";
import { chromeExecutable } from "./browser.mjs";
import { createServer } from "node:net";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PAGES = [
  ["home", "/"],
  ["shop", "/shop"],
  ["product", "/products/glove-box-latch-96-00-civic"],
  ["about", "/about"],
  ["contact", "/contact"],
];

// A fixed debug port silently reconnects Lighthouse to a Chrome left over from
// an earlier run, which then reports every score as 0. Pick a free one.
const DEBUG_PORT = await new Promise((resolve, reject) => {
  const srv = createServer();
  srv.listen(0, "127.0.0.1", () => {
    const { port } = srv.address();
    srv.close((err) => (err ? reject(err) : resolve(port)));
  });
});

const browser = await chromium.launch({
  executablePath: chromeExecutable(),
  args: [`--remote-debugging-port=${DEBUG_PORT}`],
});

const rows = [];
for (const [label, path] of PAGES) {
  const result = await lighthouse(
    BASE + path,
    { port: DEBUG_PORT, output: "json", logLevel: "error" },
    // Desktop-ish preset; the default mobile throttle models a slow 4G phone,
    // which is useful but very noisy in a container.
    {
      extends: "lighthouse:default",
      settings: {
        formFactor: "desktop",
        screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1 },
        throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      },
    }
  );

  const c = result.lhr.categories;
  rows.push({
    page: label,
    perf: Math.round(c.performance.score * 100),
    a11y: Math.round(c.accessibility.score * 100),
    bp: Math.round(c["best-practices"].score * 100),
    seo: Math.round(c.seo.score * 100),
    lcp: result.lhr.audits["largest-contentful-paint"].displayValue,
    cls: result.lhr.audits["cumulative-layout-shift"].displayValue,
    tbt: result.lhr.audits["total-blocking-time"].displayValue,
  });

  // Surface anything that actually lost points.
  const failed = Object.values(result.lhr.audits).filter(
    (a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative"
  );
  if (failed.length) {
    console.log(`\n${label} — audits below 90:`);
    failed.forEach((a) => console.log(`   ${Math.round(a.score * 100)}  ${a.title}`));
  }
}

console.log("\n page       perf  a11y  bp   seo   LCP      CLS    TBT");
for (const r of rows) {
  console.log(
    ` ${r.page.padEnd(10)} ${String(r.perf).padEnd(5)} ${String(r.a11y).padEnd(5)} ${String(
      r.bp
    ).padEnd(4)} ${String(r.seo).padEnd(5)} ${(r.lcp || "").padEnd(8)} ${(r.cls || "").padEnd(6)} ${
      r.tbt || ""
    }`
  );
}

await browser.close();
