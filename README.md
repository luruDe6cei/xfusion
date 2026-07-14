# xFUSION clone

A local reconstruction of [xfusion.pro](https://www.xfusion.pro) — a business-challenge
platform where organizations post challenges and solvers submit solutions.

Two parts:

| Folder | What it is |
|--------|-----------|
| `scraper/` | Node scripts that pull the public data + assets from the live site |
| `app/` | A Next.js 15 (App Router) rebuild, backed by Postgres via Prisma |
| `docs/` | Spec documents (the files themselves are gitignored — see `docs/README.md`) |

The `app/` reads from a local Postgres DB seeded with the scraped data, so it runs
fully offline once set up.

> ⚠️ The scraped challenge/solution text and company logos are xfusion's (and their
> clients') intellectual property. This is a local dev reconstruction only. Replace
> the content with your own before publishing anything, and check their ToS.

---

## Prerequisites

- Node 20+
- Postgres running locally (this project used Homebrew `postgresql@18`)
- A database named `xfusion_clone` (see setup below)

---

## Quick start (app)

```bash
cd app
npm install
cp .env.example .env                   # then edit DATABASE_URL for your machine

# one-time DB setup (Postgres must be running)
createdb xfusion_clone                 # or: psql -d postgres -c 'CREATE DATABASE xfusion_clone;'
npm run db:push                        # create tables from prisma/schema.prisma
npm run db:seed                        # load data/*.json into Postgres

npm run dev                            # http://localhost:3007
```

`.env` is gitignored and holds the connection string:

```
DATABASE_URL="postgresql://USER@localhost:5432/xfusion_clone?schema=public"
```

Change the user/host if your Postgres differs. The seed data (`app/data/*.json`) is
committed, so a fresh clone needs no scraping — just a DB.

### App scripts

| Command | Does |
|---------|------|
| `npm run dev` | Dev server on :3007 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Sync Prisma schema → Postgres |
| `npm run db:seed` | Load `data/*.json` into the DB (idempotent upserts) |
| `npm run db:studio` | Browse the DB in Prisma Studio |

---

## Re-scraping (refresh the data)

The live site's data drifts as challenges are added. To refresh:

```bash
cd scraper
npm install
npm run refresh             # fetch + assets + sync into ../app/data/
cd ../app && npm run db:seed
```

### Scraper scripts

| Command | Does |
|---------|------|
| `npm run fetch` | Paginates the public REST API → clean JSON in `snapshot/api/` |
| `npm run assets` | Walks the JSON for asset URLs → downloads to `snapshot/assets/` |
| `npm run sync` | Copies `snapshot/api/*.json` → `../app/data/` (the seed source) |
| `npm run refresh` | All three, in order |
| `npm run scrape` | Playwright crawler, **anonymous** — renders JS, follows links, saves HTML + captures API/RSC. For HTML/visual reference. |

Only `snapshot/api/*.json` is committed. The crawler's `html/`, `assets/`, and `_data/`
output is gitignored — it's bulky, it's xfusion's content, and it's re-fetchable.

### Capturing the logged-in site

Anonymous visitors see a nav of just `/ /challenges /explore /organizations /solutions`.
**About, Features, Contact us** — and the header's apps/chat/notification icons — render
only when signed in (`/about` etc. 404 to a guest). To capture that surface:

```bash
cd scraper
npm run login        # opens a real browser — YOU log in; the script never sees your password
npm run scrape:auth  # reuses the saved session, crawls the logged-in pages
```

`login.mjs` saves cookies to `scraper/auth.json` and `scrape-auth.mjs` writes to
`snapshot/auth-html/`. **Both are gitignored** — `auth.json` is a live session token,
and the captured pages are xfusion's content from behind their login. Re-run
`npm run login` when the session expires.

---

## Routes

`/` (explore) · `/challenges` · `/challenges/[slug]` · `/solutions` ·
`/solutions/[slug]` · `/organizations` · `/organizations/[slug]`

See `HANDOFF.md` for architecture details and the roadmap of what's not yet built
(auth, submit-solution flow, matching).
