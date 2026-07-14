/**
 * Interactive login — run once, by hand:  npm run login
 *
 * Opens a real browser window at xfusion.pro's login page. YOU type your own
 * credentials into it; this script never reads, stores, or transmits them.
 * When you're in, it saves the resulting session cookies to auth.json, which
 * scrape-auth.mjs reuses.
 *
 * auth.json is a LIVE SESSION TOKEN. It is gitignored. Don't share it, and
 * re-run this when it expires.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = 'https://www.xfusion.pro';
const LOGIN_URL = `${BASE}/auth/login`;
const AUTH_FILE = 'auth.json';
const TIMEOUT_MS = 5 * 60 * 1000;

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

console.log(`
┌──────────────────────────────────────────────────────────────┐
│  A browser window is open at ${LOGIN_URL}
│
│  1. Log in there with your own account.
│  2. This script watches for the session and saves it itself.
│     (Press Enter here if it doesn't notice within a few seconds.)
│
│  Your password is typed only into that browser. Nothing reads it.
└──────────────────────────────────────────────────────────────┘
`);

/** Resolves when we look logged in: we've left /auth/login and hold a session cookie. */
const detectLogin = async () => {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    const left = !page.url().includes('/auth/login');
    const cookies = await ctx.cookies();
    const hasSession = cookies.some(
      (c) => /session|token|auth/i.test(c.name) && c.value.length > 20
    );
    if (left && hasSession) return 'detected';
    await page.waitForTimeout(1000);
  }
  throw new Error('timed out waiting for login');
};

/** Manual override, in case the cookie heuristic misses. */
const enterKey = () =>
  new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve('confirmed by Enter'));
  });

let how;
try {
  how = await Promise.race([detectLogin(), enterKey()]);
} catch (err) {
  console.error(`\n✗ ${err.message} — no session saved. Re-run and finish logging in.`);
  await browser.close();
  process.exit(1);
}

await ctx.storageState({ path: AUTH_FILE });
console.log(`\n✓ Session saved to ${AUTH_FILE} (${how}).`);

// Prove it actually worked: the logged-in nav has links the anonymous one lacks.
await page.goto(BASE, { waitUntil: 'networkidle' });
const navLinks = await page.$$eval('header a[href], nav a[href]', (as) =>
  [...new Set(as.map((a) => new URL(a.href).pathname))].sort()
);
console.log(`  Nav now visible: ${navLinks.join(' ') || '(none found)'}`);

const gated = navLinks.filter((p) => !['/', '/challenges', '/explore', '/organizations', '/solutions'].includes(p));
console.log(
  gated.length
    ? `  ✓ Auth-only routes appeared: ${gated.join(' ')}\n\n  Next:  npm run scrape:auth`
    : `  ⚠ No auth-only routes appeared — the session may not have taken. Check the browser, then re-run.`
);

await browser.close();
if (!existsSync(AUTH_FILE)) process.exit(1);
process.exit(0);
