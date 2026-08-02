import fs from "node:fs";
import path from "node:path";

/*
 * Resolve a Chromium to drive.
 *
 * Playwright normally manages its own browser download, and when that build is
 * present we let it. But CI images and sandboxes often ship a Chromium whose
 * build number doesn't match the installed Playwright, which fails with
 * "Executable doesn't exist" even though a perfectly good browser is on disk.
 * So: honour CHROME_PATH, then look for a pre-installed build, then fall back
 * to Playwright's own.
 */
export function chromeExecutable() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean);

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const dirs = fs
      .readdirSync(root)
      .filter((d) => d.startsWith("chromium-"))
      .sort()
      .reverse();
    for (const dir of dirs) {
      const candidate = path.join(root, dir, "chrome-linux", "chrome");
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  // undefined => Playwright resolves its own managed build.
  return undefined;
}

export const launchOptions = () => ({ executablePath: chromeExecutable() });

/*
 * Reveals start at opacity 0 and take up to ~1.5s (stagger + transition) to
 * arrive. axe measures whatever colour is on screen when it runs, so scanning
 * mid-transition reports amber-at-5%-opacity as a 1.05:1 contrast failure —
 * an artefact of timing, not a defect. Snap every reveal to its end state so
 * the scan is deterministic and measures what a reader actually reads.
 */
export async function settleReveals(page) {
  /*
   * Drops the `.js` flag rather than stamping data-revealed on each element.
   * Since reveals replay, a live observer would immediately overwrite any
   * attribute this set for anything off screen. The hiding rules are all
   * scoped to `.js .reveal`, so removing the class turns the whole mechanism
   * off at the stylesheet — which is exactly the no-JS state the site is
   * already built to render correctly.
   */
  await page.evaluate(() => document.documentElement.classList.remove("js"));
  await page.waitForTimeout(1200);
}
