/*
 * The /ops gate.
 *
 * This page shows customer names, email addresses, shipping addresses and
 * order values. "It's behind a URL nobody knows" is not a control, and the
 * failure mode that actually happens in practice is not someone guessing the
 * password — it is a deploy that forgets to set one. So the case this suite
 * cares most about is the first one: with no password configured, the route
 * must be closed, not open.
 *
 * Spawns its own servers so both configurations can be tested in one run:
 *   node scripts/ops-security.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

let failures = 0;
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  failures++;
  console.log(`  ✗ ${m}`);
};

async function waitForServer(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // Any response at all means it is listening; the status is irrelevant here.
      await fetch(`http://127.0.0.1:${port}/`);
      return true;
    } catch {
      await sleep(400);
    }
  }
  return false;
}

async function withServer(env, port, run) {
  const server = spawn("npx", ["next", "start", "--port", String(port)], {
    env: { ...process.env, ...env },
    stdio: "ignore",
    detached: true,
  });

  try {
    if (!(await waitForServer(port))) throw new Error(`server on ${port} never came up`);
    await run(`http://127.0.0.1:${port}`);
  } finally {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      /* already gone */
    }
    await sleep(600);
  }
}

const basic = (user, password) =>
  `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

/* ---- 1. No password configured: the route must not exist ---------------- */
console.log("\nno OPS_PASSWORD configured");
await withServer({ OPS_PASSWORD: "" }, 3210, async (base) => {
  const res = await fetch(`${base}/ops`, { redirect: "manual" });
  if (res.status === 404) {
    pass("/ops returns 404 — fails closed rather than open");
  } else {
    fail(`/ops returned ${res.status} with no password set (expected 404)`);
  }

  const body = await res.text();
  if (!/stripe|order|margin/i.test(body)) {
    pass("no dashboard content in the body");
  } else {
    fail("dashboard content leaked in the 404 body");
  }

  const home = await fetch(`${base}/`);
  if (home.status === 200) pass("public site unaffected");
  else fail(`public site broke: ${home.status}`);
});

/* ---- 2. Password configured: the gate must actually gate ---------------- */
console.log("\nOPS_PASSWORD configured");
const SECRET = "correct-horse-battery-staple";
await withServer({ OPS_PASSWORD: SECRET }, 3211, async (base) => {
  const bare = await fetch(`${base}/ops`, { redirect: "manual" });
  if (bare.status === 401) pass("no credentials → 401");
  else fail(`no credentials returned ${bare.status} (expected 401)`);

  const challenge = bare.headers.get("www-authenticate") ?? "";
  if (challenge.startsWith("Basic ")) pass(`sends a Basic challenge (${challenge.slice(0, 22)}…)`);
  else fail(`missing or wrong WWW-Authenticate: ${challenge || "(none)"}`);

  const bareBody = await bare.text();
  if (!/stripe|margin|ship to/i.test(bareBody)) pass("401 body carries no order data");
  else fail("order data leaked in the 401 body");

  const wrong = await fetch(`${base}/ops`, {
    headers: { authorization: basic("ops", "wrong-password") },
    redirect: "manual",
  });
  if (wrong.status === 401) pass("wrong password → 401");
  else fail(`wrong password returned ${wrong.status}`);

  // A prefix of the real password must not be accepted — catches a truncating
  // or short-circuiting comparison.
  const prefix = await fetch(`${base}/ops`, {
    headers: { authorization: basic("ops", SECRET.slice(0, 8)) },
    redirect: "manual",
  });
  if (prefix.status === 401) pass("password prefix → 401");
  else fail(`password prefix returned ${prefix.status}`);

  const right = await fetch(`${base}/ops`, {
    headers: { authorization: basic("ops", SECRET) },
    redirect: "manual",
  });
  if (right.status === 200) pass("correct password → 200");
  else fail(`correct password returned ${right.status}`);

  const cache = right.headers.get("cache-control") ?? "";
  if (/no-store/.test(cache)) pass(`response is no-store (${cache})`);
  else fail(`missing no-store on an authenticated page: ${cache || "(none)"}`);

  const robotsTag = right.headers.get("x-robots-tag") ?? "";
  if (/noindex/.test(robotsTag)) pass(`X-Robots-Tag noindex (${robotsTag})`);
  else fail(`missing noindex header: ${robotsTag || "(none)"}`);

  // Sub-paths must be covered by the matcher, not just the exact route.
  const sub = await fetch(`${base}/ops/anything`, { redirect: "manual" });
  if (sub.status === 401) pass("/ops/* sub-paths are gated too");
  else fail(`/ops/anything returned ${sub.status} (expected 401)`);

  const robots = await fetch(`${base}/robots.txt`);
  const robotsBody = await robots.text();
  if (robotsBody.includes("/ops")) pass("robots.txt disallows /ops");
  else fail("robots.txt does not mention /ops");

  // And the public site still works with the gate in place.
  for (const path of ["/", "/shop", "/contact"]) {
    const res = await fetch(`${base}${path}`);
    if (res.status === 200) pass(`${path} still public`);
    else fail(`${path} returned ${res.status}`);
  }
});

console.log(failures === 0 ? "\nOps gate holds." : `\n${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
