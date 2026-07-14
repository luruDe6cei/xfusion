# HANDOFF.md — current state & next steps

Last updated: 2026-07-14. Read `CLAUDE.md` first for conventions/rules.

## TL;DR

A working local clone of xfusion.pro. Data scraped from the site's public REST API
(151 challenges, 13 solutions, 46 companies, 196 countries, 36 industries), seeded
into local Postgres (`xfusion_clone`), served by a Next.js 15 app on **:3007**.
`npm run build` passes; all 207 pages prerender from the DB.

## How it was built (chronology)

1. Recon of xfusion.pro → identified **Next.js App Router on Vercel** with a clean
   **public REST API** (`/api/challenges`, `/api/solutions`, `/api/company/search`,
   `/api/countries/public`, `/api/industries/public/domains`) and S3 assets.
2. Built `scraper/` — `fetch-api.mjs` (paginated pull), `download-assets.mjs`,
   `scrape.mjs` (Playwright, for HTML/auth if needed).
3. Built `app/` — Next.js 15, initially reading JSON directly.
4. Wired to Postgres via Prisma: schema reconstructed from API shapes, `seed.ts`
   loads `data/*.json`, `lib/data.ts` rewritten to Prisma queries, pages made async.

## Layout fidelity — how it's done

The real site is **Tailwind v4 with every value as a CSS variable**, and we run Tailwind
v4 too. So matching it is a *transplant*, not a redesign: the upstream design tokens live
in `app/globals.css` (lifted verbatim from their stylesheet), and components reuse their
actual class strings (`text-[length:var(--font-size-18)]`, `bg-[var(--color-violet-3)]`)
bound to our Prisma data. Their DOM is in `scraper/snapshot/html/` — read it before
inventing markup.

One deliberate deviation: upstream's glyphs come from a proprietary icon font
(`.icon-check:before{content:""}`); we use inline SVG instead of vendoring it.

Done: landing page, cards, challenge + solution detail. Still ours, not theirs:
org detail, the list pages' search/filter chrome, and the authed header icons.

## Current state — DONE ✅

- Scraper works; full dataset + assets in `scraper/snapshot/`.
- Postgres `xfusion_clone` created, schema pushed, data seeded (idempotent).
- App is fully DB-backed. Routes: `/`, `/challenges`, `/challenges/[slug]`,
  `/solutions`, `/solutions/[slug]`, `/organizations`, `/organizations/[slug]`.
- `npm run build` green; runtime smoke-tested (all routes 200).

Verified DB counts: Challenge 151 · Solution 13 · Company 46 · File 16 · Country 196 ·
Industry 36 · SubIndustry 16.

## NOT built yet — roadmap 🔨

These are the non-public parts of the real product; they need design decisions, not
scraping. Suggested order:

### 1. Auth (next up)
- Add `User`, `Session`, `Account`, `VerificationToken` models to `schema.prisma`.
- Use **Auth.js (NextAuth v5)** — email/password (Credentials) or OAuth.
- Add sign-in/sign-up routes + session in the nav.
- `npm run db:push` after schema changes.

### 2. Create-challenge / submit-solution flows
- Server Actions or route handlers that WRITE via Prisma (first write paths in the app).
- Forms for posting a challenge and submitting a solution.
- File upload: pick a target — local disk, Vercel Blob, or real S3. Original uses S3.
- Likely need an `Offer`/`Submission` model linking a solver's solution to a challenge.

### 3. Matching
- `averageMatchScore` is exposed by the API but the algorithm isn't. Design our own
  (e.g. keyword/industry/expertise overlap) if this feature is wanted.

### 4. Nice-to-haves
- Search & industry filters on list pages.
- `next/image` for logos (currently plain `<img>` from S3 URLs; remotePattern for the
  S3 host is already in `next.config.mjs`).
- Pagination on `/challenges` (currently renders all 151).

## Gotchas / decisions already made

- **Prisma pinned to v6** — see CLAUDE.md. Don't bump to v7.
- **Port 3007**, not 3000.
- 3 companies have null slugs upstream → seed uses `slug ?? id`; list/params filter valid slugs.
- Sub-industries derived from nested challenge data (no standalone endpoint).
- `lib/data.ts` casts Prisma results `as unknown as <Type>`; the `include`s guarantee
  the runtime shape matches `lib/types.ts`.
- The `app/data/*.json` files are the seed source, and are a deliberate copy of
  `scraper/snapshot/api/*.json`. Refresh with `cd scraper && npm run refresh`.
- Repo is organized for git: `.gitignore` keeps `node_modules/`, `.next/`, `.env`, the
  bulky scrape output (`snapshot/{_data,html,assets}/`) and the spec docs out. `.git/`
  exists but is **empty — no commits yet**.

## Environment specifics (this machine)

- macOS, Postgres via Homebrew `postgresql@18` (already running), superuser `eduard`.
- `psql` at `/opt/homebrew/opt/postgresql@18/bin` — prepend to PATH if `psql` not found.
- `DATABASE_URL="postgresql://eduard@localhost:5432/xfusion_clone?schema=public"`.
- The xFUSION 2.0 spec docs now live in `docs/` (renamed to ASCII filenames). They're
  gitignored as proprietary — see `docs/README.md`. They define the 2.0 roadmap.

## How to resume quickly

```bash
cd ~/projects/xfusion/app
npm install            # if deps missing
npm run db:seed        # if DB empty/reset
npm run dev            # http://localhost:3007
```

If the DB is gone: `createdb xfusion_clone && npm run db:push && npm run db:seed`.
