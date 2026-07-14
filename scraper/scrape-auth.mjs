/**
 * Authenticated crawl —  npm run scrape:auth   (run `npm run login` first)
 *
 * Reuses the session in auth.json to crawl the surface anonymous visitors never
 * see: the logged-in landing page, its About/Features/Contact sections, and
 * whatever the header icons open.
 *
 * Output lands in snapshot/auth-html/ — deliberately separate from snapshot/html/
 * (the anonymous crawl) so the two can be diffed rather than conflated.
 * Both are gitignored: this is xfusion's content, behind their login.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE = 'https://www.xfusion.pro';
const OUT = './snapshot';
const AUTH_FILE = 'auth.json';
const MAX_PAGES = Number(process.env.MAX_PAGES || 40);

// Routes the anonymous crawler already covered — used to flag what's NEW.
const PUBLIC_ROUTES = ['/', '/challenges', '/explore', '/organizations', '/solutions'];

if (!existsSync(AUTH_FILE)) {
  console.error(`✗ No ${AUTH_FILE}. Run:  npm run login`);
  process.exit(1);
}

const htmlPath = (url) => {
  const u = new URL(url);
  const p = u.pathname === '/' ? '/index' : u.pathname.replace(/\/$/, '');
  return join(OUT, 'auth-html', p + '.html');
};

const dataPath = (url) => {
  const key = encodeURIComponent(url).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
  return join(OUT, '_data', key + '.txt');
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: AUTH_FILE,
  userAgent: 'Mozilla/5.0 (Macintosh)',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();

// Capture JSON / API / RSC payloads — the authenticated API surface is the real
// prize here (offers, submissions, notifications, messaging).
page.on('response', async (res) => {
  const ct = res.headers()['content-type'] || '';
  const url = res.url();
  const isData =
    ct.includes('application/json') ||
    url.includes('/api/') ||
    url.includes('_rsc') ||
    ct.includes('text/x-component');
  if (!isData) return;
  try {
    const f = dataPath(url);
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, await res.body());
  } catch {}
});

// Confirm the session is actually live before crawling 40 pages as a guest.
await page.goto(BASE, { waitUntil: 'networkidle' });
const navLinks = await page.$$eval('header a[href], nav a[href]', (as) =>
  [...new Set(as.map((a) => new URL(a.href).pathname))]
);
const gated = navLinks.filter((p) => !PUBLIC_ROUTES.includes(p));
if (!gated.length) {
  console.error(
    `✗ Session looks dead — the logged-in nav isn't showing.\n` +
      `  Only found: ${navLinks.join(' ') || '(nothing)'}\n` +
      `  Re-run:  npm run login`
  );
  await browser.close();
  process.exit(1);
}
console.log(`✓ Session live. Auth-only routes: ${gated.join(' ')}\n`);

const seen = new Set();
const queue = [...PUBLIC_ROUTES, ...gated];
let count = 0;
const saved = [];

while (queue.length && count < MAX_PAGES) {
  const route = queue.shift();
  const url = route.startsWith('http') ? route : BASE + route;
  const norm = url.split('#')[0].replace(/\/$/, '') || url;
  if (seen.has(norm)) continue;
  seen.add(norm);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
  } catch (e) {
    console.warn('skip', url, e.message);
    continue;
  }

  const f = htmlPath(url);
  await mkdir(dirname(f), { recursive: true });
  await writeFile(f, await page.content());
  count++;

  const isNew = !PUBLIC_ROUTES.includes(new URL(url).pathname);
  saved.push(new URL(url).pathname);
  console.log(`[${count}] ${isNew ? 'NEW  ' : '     '}${url}`);

  const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
  for (const l of links) {
    try {
      const u = new URL(l);
      if (u.hostname.endsWith('xfusion.pro') && !/\.(png|jpg|jpeg|svg|webp|pdf|zip)$/i.test(u.pathname)) {
        if (!seen.has(u.origin + u.pathname.replace(/\/$/, ''))) queue.push(u.origin + u.pathname);
      }
    } catch {}
  }
}

await browser.close();

const fresh = saved.filter((p) => !PUBLIC_ROUTES.includes(p));
console.log(`\nDone. ${count} pages → ${OUT}/auth-html, payloads → ${OUT}/_data`);
console.log(fresh.length ? `Auth-only pages captured: ${fresh.join(' ')}` : 'No auth-only pages found.');
