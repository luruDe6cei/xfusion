// Walks the fetched API JSON, collects every image URL (S3 logos, thumbnails,
// challenge/solution files) plus the site's own /sprites, and downloads them.
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const API = './snapshot/api';
const OUT = './snapshot/assets';
const SITE = 'https://www.xfusion.pro';

const urls = new Set();

// Recursively collect http(s) URLs from any JSON structure.
function walk(node) {
  if (!node) return;
  if (typeof node === 'string') {
    if (/^https?:\/\/.+\.(png|jpe?g|svg|webp|gif|pdf|woff2?)(\?|$)/i.test(node)) urls.add(node);
    return;
  }
  if (Array.isArray(node)) return node.forEach(walk);
  if (typeof node === 'object') return Object.values(node).forEach(walk);
}

for (const f of await readdir(API)) {
  if (f.endsWith('.json')) walk(JSON.parse(await readFile(join(API, f), 'utf8')));
}

// The site's own SVG sprites (seen in the network log).
for (const s of [
  'published-challenges', 'solutions', 'companies', 'team-members', 'footer-logo',
]) urls.add(`${SITE}/sprites/${s}.svg`);

console.log(`Collected ${urls.size} asset URLs.`);

// Map a URL to a local path: keep S3 key structure, group by host.
function localPath(u) {
  const url = new URL(u);
  return join(OUT, url.hostname, decodeURIComponent(url.pathname));
}

let ok = 0, fail = 0;
const list = [...urls];
const CONCURRENCY = 8;

async function fetchOne(u) {
  try {
    const res = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const f = localPath(u);
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, buf);
    ok++;
  } catch (e) {
    fail++;
    console.warn('  !', u.slice(0, 80), e.message);
  }
}

for (let i = 0; i < list.length; i += CONCURRENCY) {
  await Promise.all(list.slice(i, i + CONCURRENCY).map(fetchOne));
  process.stdout.write(`\r  downloaded ${ok}/${list.length}  (${fail} failed)   `);
}
console.log(`\nDone. Assets in ${OUT}`);
