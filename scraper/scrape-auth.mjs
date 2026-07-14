/**
 * Exhaustive authenticated crawl —  npm run scrape:auth   (run `npm run login` first)
 *
 * Captures the whole logged-in surface: HTML, screenshots, and every JSON/RSC payload.
 *
 * Why this is more than a link-follower: the authenticated app hangs off MENUS
 * (the avatar dropdown, the apps-grid) that only render on click. A crawler that
 * reads <a href> from the loaded DOM finds none of it — that's how an earlier run
 * missed /dashboard and /dashboard/profile entirely. So on EVERY page we click every
 * menu trigger open first, then harvest links.
 *
 * Output (all gitignored — this is xfusion's content from behind their login):
 *   snapshot/auth-html/<route>.html
 *   snapshot/auth-shots/<route>.png
 *   snapshot/_data/<url>.txt          (API + RSC payloads)
 *   snapshot/auth-routes.json         (the route inventory)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE = 'https://www.xfusion.pro';
const OUT = './snapshot';
const AUTH_FILE = 'auth.json';
const MAX_PAGES = Number(process.env.MAX_PAGES || 120);

const PUBLIC_ROUTES = ['/', '/challenges', '/explore', '/organizations', '/solutions'];

// Known app routes, seeded so we don't depend on discovery alone.
const SEED = [
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/company',
  '/dashboard/challenges',
  '/dashboard/solutions',
  '/dashboard/proposals',
  '/dashboard/business-opportunities',
  '/dashboard/team',
  '/dashboard/settings',
  '/dashboard/notifications',
  '/dashboard/messages',
];

// We already hold every challenge/solution/org via the public API — crawling all 200
// detail pages would just burn time. Keep 2 of each as layout references.
const DETAIL = /^\/(challenges|solutions|organizations)\/[^/]+$/;
const detailSeen = { challenges: 0, solutions: 0, organizations: 0 };
const detailCap = 2;

if (!existsSync(AUTH_FILE)) {
  console.error(`✗ No ${AUTH_FILE}. Run:  npm run login`);
  process.exit(1);
}

const slug = (p) => (p === '/' ? '/index' : p.replace(/\/$/, ''));
const htmlPath = (p) => join(OUT, 'auth-html', slug(p) + '.html');
const shotPath = (p) => join(OUT, 'auth-shots', slug(p).replace(/\//g, '_').replace(/^_/, '') + '.png');
const dataPath = (url) =>
  join(OUT, '_data', encodeURIComponent(url).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) + '.txt');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: AUTH_FILE,
  viewport: { width: 1440, height: 1000 },
});
const page = await ctx.newPage();

page.on('response', async (res) => {
  const ct = res.headers()['content-type'] || '';
  const url = res.url();
  if (!(ct.includes('application/json') || url.includes('/api/') || url.includes('_rsc') || ct.includes('text/x-component'))) return;
  try {
    const f = dataPath(url);
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, await res.body());
  } catch {}
});

/** Click every menu trigger so dropdown links enter the DOM, then read all hrefs. */
async function harvestLinks(p) {
  const hrefs = new Set();
  const read = async () => {
    for (const h of await p.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')))) {
      hrefs.add(h.split('#')[0].split('?')[0]);
    }
  };
  await read();
  const triggers = await p.$$('header button, [aria-haspopup], nav button, button:has(svg)');
  for (const t of triggers.slice(0, 12)) {
    try {
      await t.click({ timeout: 1200 });
      await p.waitForTimeout(350);
      await read();
      await p.keyboard.press('Escape').catch(() => {});
      await p.waitForTimeout(120);
    } catch {}
  }
  return [...hrefs].filter(Boolean);
}

// Session check: /dashboard is auth-gated, so a guest gets bounced to /auth/login.
// (Don't sniff for "Log out" — that text only exists once the avatar menu is open.)
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
if (/\/auth\/(login|signin)/.test(page.url())) {
  console.error(`✗ Session dead — /dashboard redirected to ${page.url()}\n  Re-run:  npm run login`);
  await browser.close();
  process.exit(1);
}
console.log(`✓ Session live (/dashboard reachable)\n`);
const first = await harvestLinks(page);

const seen = new Set();
const queue = [...PUBLIC_ROUTES, ...SEED, ...first];
const inventory = [];
let count = 0;

while (queue.length && count < MAX_PAGES) {
  const route = queue.shift();
  if (!route || !route.startsWith('/')) continue;
  const norm = route.replace(/\/$/, '') || '/';
  if (seen.has(norm)) continue;
  if (/\.(png|jpe?g|svg|webp|pdf|zip|ico)$/i.test(norm)) continue;

  // Cap detail pages — the API already gives us their content.
  const m = norm.match(DETAIL);
  if (m) {
    const k = m[1];
    if (detailSeen[k] >= detailCap) continue;
    detailSeen[k]++;
  }
  seen.add(norm);

  let status = 0;
  try {
    const res = await page.goto(BASE + norm, { waitUntil: 'networkidle', timeout: 30000 });
    status = res?.status() ?? 0;
    await page.waitForTimeout(1400);
  } catch (e) {
    console.warn(`  skip ${norm} — ${e.message.split('\n')[0]}`);
    continue;
  }

  if (status === 404) {
    inventory.push({ route: norm, status });
    console.log(`[--] 404  ${norm}`);
    continue;
  }

  const hf = htmlPath(norm);
  await mkdir(dirname(hf), { recursive: true });
  await writeFile(hf, await page.content());

  const sf = shotPath(norm);
  await mkdir(dirname(sf), { recursive: true });
  await page.screenshot({ path: sf, fullPage: true }).catch(() => {});

  const title = await page.evaluate(() => (document.querySelector('h1,h2')?.innerText || '').trim().slice(0, 40));
  inventory.push({ route: norm, status, title });
  count++;
  const tag = PUBLIC_ROUTES.includes(norm) ? '    ' : 'AUTH';
  console.log(`[${String(count).padStart(2)}] ${tag} ${norm}${title ? '  — ' + title : ''}`);

  for (const h of await harvestLinks(page)) {
    if (!seen.has(h.replace(/\/$/, '') || '/')) queue.push(h);
  }
}

await writeFile(join(OUT, 'auth-routes.json'), JSON.stringify(inventory, null, 2));
await browser.close();

const app = inventory.filter((i) => i.route.startsWith('/dashboard') && i.status !== 404);
console.log(`\nDone. ${count} pages → ${OUT}/auth-html, screenshots → ${OUT}/auth-shots`);
console.log(`Route inventory → ${OUT}/auth-routes.json`);
console.log(`\nAuthenticated app routes (${app.length}):`);
for (const a of app) console.log(`  ${a.route.padEnd(38)} ${a.title || ''}`);
