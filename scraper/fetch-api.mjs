// Pulls the full public dataset directly from xfusion.pro's JSON API.
// No browser needed — these are public GET endpoints. Paginates to the end.
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://www.xfusion.pro';
const OUT = './snapshot/api';
const PAGE = 20;

const headers = {
  'user-agent': 'Mozilla/5.0 (Macintosh)',
  accept: 'application/json',
  // If an endpoint needs auth, paste your session cookie here:
  // cookie: process.env.XF_COOKIE || '',
};

async function getJSON(path) {
  const res = await fetch(BASE + path, { headers });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

// Paginate an endpoint whose response envelope holds the array under `key`.
async function paginate(pathFor, key) {
  let skip = 0;
  const all = [];
  for (;;) {
    const j = await getJSON(pathFor(skip));
    const batch = j[key] || [];
    all.push(...batch);
    const total = j.total ?? all.length;
    process.stdout.write(`\r  ${key}: ${all.length}/${total}   `);
    if (batch.length < PAGE || all.length >= total) break;
    skip += PAGE;
  }
  process.stdout.write('\n');
  return all;
}

await mkdir(OUT, { recursive: true });

const jobs = {
  challenges: () =>
    paginate((s) => `/api/challenges?status=PUBLISHED&skip=${s}&take=${PAGE}&orderBy=desc`, 'data'),
  solutions: () =>
    paginate((s) => `/api/solutions?skip=${s}&take=${PAGE}&orderBy=desc`, 'solutions'),
  companies: () =>
    paginate((s) => `/api/company/search?skip=${s}&take=${PAGE}`, 'companies'),
  countries: () => getJSON('/api/countries/public'),
  industries: () => getJSON('/api/industries/public/domains'),
};

for (const [name, fn] of Object.entries(jobs)) {
  try {
    console.log(`Fetching ${name}…`);
    const data = await fn();
    await writeFile(`${OUT}/${name}.json`, JSON.stringify(data, null, 2));
    const n = Array.isArray(data) ? data.length : '(object)';
    console.log(`  saved ${OUT}/${name}.json  (${n} records)`);
  } catch (e) {
    console.warn(`  ! ${name} failed: ${e.message}`);
  }
}
console.log('\nDone.');
