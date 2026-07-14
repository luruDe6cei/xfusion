import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const BASE = 'https://www.xfusion.pro';
const OUT = './snapshot';
const MAX_PAGES = Number(process.env.MAX_PAGES || 60);

// Seed routes; the crawler expands from here by following same-origin links.
const SEEDS = ['/', '/explore', '/challenges', '/solutions', '/organizations'];

const seen = new Set();
const queue = [...SEEDS];

const htmlPath = (url) => {
  const u = new URL(url);
  let p = u.pathname === '/' ? '/index' : u.pathname.replace(/\/$/, '');
  return join(OUT, 'html', p + '.html');
};

const dataPath = (url) => {
  const key = encodeURIComponent(url).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
  return join(OUT, '_data', key + '.txt');
};

// This crawler is ANONYMOUS on purpose — it captures what a logged-out visitor
// sees. For the authenticated surface use `npm run login` + `npm run scrape:auth`
// (login.mjs / scrape-auth.mjs), which never handles your password.
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh)' });

const page = await ctx.newPage();

// Capture JSON / API / RSC flight responses -> the real content data.
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
    const body = await res.body();
    const f = dataPath(url);
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, body);
  } catch {}
});

let count = 0;
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

  const html = await page.content();
  const f = htmlPath(url);
  await mkdir(dirname(f), { recursive: true });
  await writeFile(f, html);
  count++;
  console.log(`[${count}] ${url}`);

  // Discover same-origin links to crawl.
  const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
  for (const l of links) {
    try {
      const u = new URL(l);
      if (u.hostname.endsWith('xfusion.pro') && !u.pathname.match(/\.(png|jpg|jpeg|svg|webp|pdf|zip)$/i)) {
        const key = u.origin + u.pathname.replace(/\/$/, '');
        if (!seen.has(key)) queue.push(u.origin + u.pathname);
      }
    } catch {}
  }
}

await browser.close();
console.log(`\nDone. ${count} pages saved to ${OUT}/html, data to ${OUT}/_data`);
