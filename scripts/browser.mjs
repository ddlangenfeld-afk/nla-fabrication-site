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
