import { NextResponse, type NextRequest } from "next/server";

/*
 * Gate on /ops.
 *
 * The dashboard shows customer names, shipping addresses and order values. It
 * is not "a hidden URL" — it needs a real lock, and the three decisions here
 * are the ones that matter:
 *
 * 1. IT FAILS CLOSED. With no OPS_PASSWORD configured the route returns 404,
 *    not an open page. The tempting alternative — "no password set, so let
 *    everyone in" — means a deploy that forgets one environment variable
 *    publishes every customer's address to the open internet, and it does it
 *    silently. A 404 is loud in exactly the right way: the owner notices
 *    immediately, and nobody else learns anything.
 *
 * 2. THE COMPARISON IS CONSTANT-TIME. A plain `===` on a secret leaks its
 *    length and prefix through response timing. The margin is small over a
 *    network and free to remove, so it is removed.
 *
 * 3. IT RUNS IN MIDDLEWARE, NOT IN THE PAGE. The check happens before any
 *    route handler, so there is no way to reach the data by hitting a nested
 *    route, a prefetch, or an RSC payload request directly.
 *
 * Basic auth rather than a login form because there is one operator and no
 * user system. The browser stores the credential, the prompt is native, and
 * there is no session table to get wrong. It is only safe over HTTPS — which
 * is why the site is HSTS-eligible and Vercel terminates TLS everywhere.
 */

/** Timing-safe string compare. Not `===`: that returns early on first mismatch. */
function safeEqual(a: string, b: string): boolean {
  // Compare a fixed number of bytes so length differences don't short-circuit.
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="NLA Fabrication operations", charset="UTF-8"',
      // Nothing behind this gate should ever sit in a shared cache.
      "Cache-Control": "no-store",
    },
  });
}

export function middleware(request: NextRequest) {
  const expected = process.env.OPS_PASSWORD;

  // Fail closed. See note 1 above — this is the important line in the file.
  if (!expected) {
    return new NextResponse(null, { status: 404 });
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  // "user:pass" — the username is ignored, there is only one operator.
  const password = decoded.slice(decoded.indexOf(":") + 1);
  if (!safeEqual(password, expected)) return unauthorized();

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/ops", "/ops/:path*"],
};
