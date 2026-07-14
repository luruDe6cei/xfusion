# CLAUDE.md — project guide for AI sessions

Read this + `HANDOFF.md` before working. This file = stable conventions;
`HANDOFF.md` = current state and next steps.

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
