# CLAUDE.md — project guide for AI sessions

Read this + `HANDOFF.md` before working. This file = stable conventions;
`HANDOFF.md` = current state and next steps.

## Codebase memory (MCP) — use it by default

This repo is indexed in `codebase-memory-mcp` as project
**`Users-eduard-projects-xfusion`**, with ADRs recording key decisions.

- **Session start:** call `manage_adr(mode='get')` to load the decision records, and
  `detect_changes` to see what moved since the last index.
- **Navigating code:** prefer `search_code` / `query_graph` / `get_architecture` over
  blind grepping for cross-file questions (callers, dependencies, structure).
- **After significant changes** (new routes, new lib modules, schema changes):
  re-run `index_repository(repo_path='/Users/eduard/projects/xfusion', mode='full')`.
- **When a decision is made** (or reversed): append it to the ADRs via
  `manage_adr(mode='update')` — decisions belong there, current state in `HANDOFF.md`.

## What this project is

A local clone of xfusion.pro (a business-challenge / open-innovation platform).
Data was scraped from the site's **public REST API** and now lives in local Postgres.
The `app/` is a from-scratch Next.js rebuild — NOT the original source, which we never had.

## Layout

```
xfusion/
├── README.md, CLAUDE.md, HANDOFF.md
├── .gitignore, .gitattributes
├── docs/                    # spec documents (the .pdf/.docx are gitignored)
├── scraper/                 # data acquisition (Node ESM, no framework)
│   ├── fetch-api.mjs        # ← primary: pulls public JSON API, paginated
│   ├── download-assets.mjs  # S3 logos/PDFs + SVG sprites
│   ├── scrape.mjs           # Playwright crawler (HTML/visual/auth only)
│   └── snapshot/            # output: api/*.json (tracked), assets/ html/ _data/ (ignored)
└── app/                     # Next.js 15 App Router + Prisma + Postgres
    ├── .env                 # gitignored — copy from .env.example
    ├── data/*.json          # copy of scraper/snapshot/api — seed source
    ├── prisma/schema.prisma # reconstructed from observed API shapes
    ├── prisma/seed.ts       # loads data/*.json → Postgres (idempotent)
    ├── lib/prisma.ts        # client singleton
    ├── lib/data.ts          # all DB queries live here (async, Prisma includes)
    ├── lib/types.ts         # UI-facing TS interfaces
    └── app/                 # routes + components.tsx
```

## What's tracked vs ignored

The repo tracks **source + the API JSON that seeds the DB**, nothing else:

| Tracked | Ignored (regenerable / private) |
|---------|--------------------------------|
| `scraper/*.mjs`, `app/**` source | `node_modules/`, `app/.next/`, `next-env.d.ts` |
| `scraper/snapshot/api/*.json` | `scraper/snapshot/{_data,html,assets}/` — re-fetch via `npm run refresh` |
| `app/data/*.json` (seed source) | `app/.env` — template is `app/.env.example` |
| `app/public/logos/` (3 PNGs the app serves) | `docs/*.pdf`, `docs/*.docx` — proprietary spec docs |

`app/data/*.json` is an intentional byte-identical **copy** of `scraper/snapshot/api/*.json`.
Both are tracked so the app builds and seeds without the scraper present. Refresh the
copy with `cd scraper && npm run sync` — never hand-edit `app/data/`.

## Hard rules

- **Git is OFF-LIMITS.** Do not run any `git` or `gh` command (including read-only
  ones like `git status`/`git log`) unless the user, in the current conversation,
  explicitly names that exact command and tells you to run it. A `.git/` exists but is
  empty (no commits); the user drives all git themselves. Ask first, always.
- **Prisma is pinned to v6** on purpose. Prisma 7 removed `url = env(...)` from the
  datasource block (requires driver adapters + `prisma.config.ts`). Do NOT upgrade to
  v7 without a reason — it will break `schema.prisma` and every `db:*` script.
- Don't commit secrets. `.env` is gitignored and contains only a local DB URL; keep it
  that way. Anything shareable goes in `app/.env.example`.
- **Never ask the user for their xfusion.pro password**, and never write a script that
  takes it as an env var. `npm run login` opens a headed browser so the user types it
  themselves; the session lands in `scraper/auth.json` (gitignored — it's a live token).
- **The scraped content isn't ours.** Challenge/solution text and company logos belong to
  xfusion and their clients. Keep the repo private; don't add more of their assets to it.

## Conventions

- **All DB access goes through `lib/data.ts`.** Pages never call `prisma` directly.
  Functions are `async` and return the `lib/types.ts` interfaces (cast with
  `as unknown as X` — the Prisma `include`s reproduce the nested shape).
- Pages are **async Server Components**; list/detail pages use `generateStaticParams`
  (also async) so they prerender at build. Per-item async work (e.g. org counts) uses
  `Promise.all`.
- Styling is plain CSS in `app/globals.css` + inline styles. Tailwind v4 is installed
  but the components mostly use the CSS-var classes (`.card`, `.chip`, `.badge`,
  `.grid-cards`, `.muted`, `.clamp-*`).
- **The design tokens in `globals.css` are lifted verbatim from the real site's
  stylesheet** (`https://www.xfusion.pro/_next/static/chunks/*.css`) and keep upstream's
  names (`--color-primary` = violet `#5d448d`, `--color-secondary` = pink `#ed4376`,
  `--color-grey-1` = page bg `#fbfbfb`, …). It is a **light** theme; the font is Poppins.
  Do NOT invent colors — check the upstream CSS for an existing token first. Our
  `--bg/--panel/--text/--muted/--accent` vars are thin aliases onto those tokens, so
  re-theming happens in one place and no component holds a hardcoded color.
- Dev server runs on **port 3007** (not 3000).
- Node scripts are ESM (`.mjs`); the app is TS.

## Data model notes (learned from the real API)

- IDs are CUIDs → upstream is Prisma + Postgres. Assets are on S3
  (`tamitan-app-public.s3.eu-central-1.amazonaws.com`).
- API envelope keys differ per endpoint: challenges use `data`, solutions use
  `solutions`, companies use `companies`. All have `total/skip/take`.
- 3 companies have `null` slugs upstream; the seed falls back to `slug ?? id`, and the
  org list/params filter to valid slugs.
- `sub-industries` only appear nested inside challenges (no standalone endpoint); the
  seed derives their `industryId` from the parent challenge.
- **There is no `description` field on a challenge or a solution.** The API returns
  `shortDescription` only. The real detail pages render the *organization's* blurb
  (`company.description`) under the heading "Background", and `shortDescription` under
  "Challenge" / "The Solution". Don't re-add a `description` column — an earlier schema
  had one and it was always `null`.
- **The seed must carry `createdAt`/`updatedAt` from the JSON.** Prisma's
  `@default(now())` otherwise stamps every row with the seed date, and every published
  date in the UI silently becomes "today" — it looks plausible, so it hides well.
- Solutions carry `implementationMethodology`, `requiredResources`,
  `previousImplementations`, `timeToImplement`, `estimatedCost`. An earlier schema
  omitted all of them and the seed dropped them on the floor.
- We only have the **public read** surface. Auth, offers/submissions, messaging,
  and the matching algorithm (`averageMatchScore` is exposed but not its logic) are
  NOT visible and must be designed, not scraped.

## Verifying changes

After edits: `cd app && npm run build` (type-checks + prerenders all routes). Then
`npm start` and curl/screenshot a few routes. A `db:seed` is safe to re-run anytime.

- **Never run `npm run build` while `npm run dev` is live.** They share `.next/`, and
  the production build clobbers the dev server's chunks — every asset then 404s
  (`layout.css`, `main-app.js`), so the page renders as unstyled HTML and looks like a
  CSS bug that isn't one. Stop dev first, or `rm -rf .next` and restart dev afterwards.
- **Hand-written rules in `globals.css` must live in `@layer base`.** Unlayered CSS
  beats ALL of Tailwind's layered utilities regardless of specificity — an unlayered
  `a { color: inherit }` silently killed every `text-[color:…]` utility on links
  (invisible white-on-black button text). Also: Tailwind can't type a bare
  `text-[var(--x)]` — write `text-[color:var(--x)]` / `text-[length:var(--x)]`.
- **Restart `next dev` after every `schema.prisma` change.** `db:push` regenerates the
  client on disk, but the running server keeps the old one in memory and queries columns
  that no longer exist (`P2022: The column X does not exist`). The stack trace blames
  `lib/data.ts`, so it reads as a query bug when it's really a stale process. The
  browser's error overlay also survives the fix — reload before believing it.
