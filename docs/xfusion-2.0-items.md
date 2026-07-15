# xFUSION 2.0 — spec checklist & implementation roadmap

**For a fresh AI/dev session:** read `CLAUDE.md` (conventions, hard rules) and `HANDOFF.md`
(current state) before touching anything here. This file is the working roadmap for the
"xFUSION 2.0" spec (`docs/xfusion-2.0-specification-en.pdf`, gitignored; full extracted
text in `demo/spec-full-text.txt`): what the spec asks for, what is implemented, and how
to build the next pieces **in this codebase**. The clone is a demo, not the real product.

Rules that bite on every ticket here (details in `CLAUDE.md`):

- All DB access goes through `app/lib/data.ts`; pages never import `prisma` directly.
- Style with the existing `globals.css` tokens (`--color-*`, `--spacing-*`, `--gradient-*`);
  never invent colors.
- Never run `npm run build` while `npm run dev` (port 3007) is live; restart dev after
  any `schema.prisma` change **or any `.env` change**.
- No git/gh commands, ever, unless the user explicitly asks for a specific one.

---

## 1. What is implemented: AI challenge intake (spec ch. 2) — 2026-07-14

The owner's priority is demoing **AI capability**, not UI. So the implemented feature is
the spec's flagship: **"Conversation Instead of Forms"** — submitting a challenge through
a Socratic chat powered by **Gemini**, which then drafts every field for review.

### Where it lives

| File | Role |
|------|------|
| `app/lib/gemini.ts` | Server-only Gemini REST client (plain `fetch`, no SDK). Needs `GEMINI_API_KEY` in `app/.env`; model defaults to `gemini-2.5-flash`, override with `GEMINI_MODEL`. JSON output enforced via `responseSchema`. |
| `app/app/api/challenge-intake/route.ts` | POST route. Takes the chat transcript, returns `{reply, done, fields}`. System prompt encodes the spec's rules: one Socratic question per turn, max 3 follow-ups, partnership-not-budget framing for hospitals/nonprofits, field limits, bullets for KPIs, cross-industry keywords, industry chosen from the DB's 36 names. |
| `app/app/challenges/new/page.tsx` | The "Submit a Challenge" page (linked from a gradient button on `/challenges`). |
| `app/app/challenges/new/intake-chat.tsx` | Client component. Phase 1: chat (first question is hardcoded, saving one API call — the system prompt tells the model it was already asked). Phase 2: AI-drafted form, all fields editable, **1,500-char limit + live counter** on the challenge text (the ch. 2 char-limit item), industry/timeline selects. |
| `app/app/challenges/new/actions.ts` | Server Action `publishChallenge` — the app's **first write path**. |
| `app/lib/data.ts` → `createChallenge`, `getIndustries` | Creates the row (status PUBLISHED, unique slug, industry resolved by name) owned by a synthetic **"Demo Organization"** company (upserted; no auth exists yet — swap for the session user's org after XF2-01). |
| `app/app/challenges/new/intake-shared.ts` | Shared constants/types: first question, field limits, deployment-time enum (values observed in the real API data). |

### The flow

1. `/challenges/new` opens a single chat window (spec: "instead of opening dozens of
   fields, a single window will open").
2. The AI asks 3–4 guiding questions (pain point + what was tried → partnership offered
   → success criteria / sensitivity / timeline), one per turn, conversationally.
3. When it has enough, it returns `done=true` + every challenge field, and the UI swaps
   to a review form ("drafted by AI — edit anything").
4. "Publish Challenge" → Prisma create → redirect to the live `/challenges/[slug]` page;
   `/challenges` is revalidated so the new challenge appears in the list.

### Config & verification

`GEMINI_API_KEY` goes in `app/.env` (placeholder + docs in `app/.env.example`); restart
dev after setting it. Without the key, the chat surfaces a clear config error — the rest
of the site is unaffected. Verified: `tsc --noEmit` clean; `/challenges/new` renders; the
API route returns the config error cleanly when keyless. **Live end-to-end run requires
the key.** A `db:seed` rerun does not remove published demo challenges (the seed only
upserts its own rows).

### Previously built, then reverted (2026-07-14)

A Chapter-3 "Matched Solutions" panel (deterministic match scores + "Why this Match" +
slider evaluation + Short List/Match flow, with a site-wide 2.0 ON/OFF toggle) was built,
demoed, and **reverted** — the owner wants AI-capability demos, not heuristic UI. The
working code is parked in **`demo/reverted-matched-solutions/`** (`match.ts`,
`match-panel.tsx`, `v2-flag.tsx`; gitignored). To restore: move the files back to their
original paths (`app/lib/`, `app/app/challenges/[slug]/`, `app/app/`), re-add
`getSolutionMatches` to `lib/data.ts` and re-wire `<MatchPanel>` into the challenge
detail page. If restored, its scoring should be re-based on real AI via `lib/gemini.ts`.

---

## 2. Checklist by spec chapter

`XF2-nn` = ticket in section 3. `not-local` = needs real infrastructure (section 4).

### Ch. 1 — Onboarding
- [ ] LinkedIn / corporate-email-only registration, block free-mail domains → XF2-01
- [ ] Manual vs automatic approval mode per domain → not-local (admin surface), note in XF2-01
- [ ] AI auto-builds profile from email domain + LinkedIn → not-local

### Ch. 2 — Submitting a challenge
- [x] **Chat UI instead of forms; 3–4 Socratic questions; AI fills every field** — done with real Gemini, see section 1
- [x] **1,500-char limit + counter; AI aware of each field's limit** — done (system prompt + `maxLength` + live counter + server-side clamp)
- [x] Improved field prompts (short, measurable, approvable bullets) — encoded in the intake system prompt (KPI bullets, no "fluffy" text); revisit per-field later
- [ ] AI edits as Track Changes (green adds, strikethrough deletes) + Accept/Reject → XF2-04
- [ ] Undo/redo + version history for AI edits → XF2-04

### Ch. 3 — After publishing a challenge *(all reverted — see section 1; restore from `demo/reverted-matched-solutions/`)*
- [ ] Show 8 matched solutions immediately (was built with a heuristic; redo with real AI)
- [ ] Match Score + "Why this Match" explanation (same)
- [ ] 3-slider evaluation, Yes → Short List / No → reason checklist (same)
- [ ] Short List → ✓ Approve for Match (same)
- [ ] Connect / Send Message CTA, premium, human-in-the-loop → XF2-06
- [ ] Premium "Strategic Expert Discovery" deep-research offer → XF2-07

### Ch. 4 — Submitting a solution
- [ ] Submit via website URL / PDF / pitch deck, AI extracts fields → XF2-12 (now feasible: Gemini client exists)

### Ch. 5–6 — Solution-provider value & Business Opportunities
- [ ] 4 competitors + 4 potential customers after publishing, clearly separated → XF2-08 (redo with Gemini instead of heuristic)
- [ ] "Competitors Radar" dashboard area → XF2-08
- [ ] Business Opportunities Agent → partially feasible now with Gemini over local data

### Ch. 7 — Dashboard
- [ ] Central feed: new matches / opportunities / partners / customers + AI alerts → XF2-09
- [ ] Visitor-profile analytics (job titles, industries) → XF2-09 (fake data variant)

### Ch. 8 — UX
- [ ] Bullets by default; short measurable KPIs — partially covered by the intake prompt
- [ ] Matches displayed prominently (reverted with ch. 3)

### Ch. 9 — Internal discovery engine
- [ ] Rank the solution bank per challenge with explained scores → redo on Gemini (XF2-10 stores results)
- [ ] Auto-rescan when new data enters + structured match store → XF2-10

### Ch. 10 — Repository growth automation
- [ ] Auto-invite owners of externally-found solutions (after human approval) → not-local

### Ch. 11 — Security & compliance
- [ ] GDPR / ISO 27001 / SOC 2 → not-local

### Ch. 12–13 — Privacy levels & continuous rematching
- [ ] Challenge privacy: Public / Private / Anonymous (+paid), NDA teaser mode → XF2-11
- [ ] Solution privacy: Public / Private → XF2-11
- [ ] Proactive notifications ("3 new solutions were found…") → XF2-09

### AI appendix
- [ ] Per-field prompt engineering; source lists per agent → the intake system prompt is the first instance; extend per feature
- [ ] Explainability for every AI output (reverted with ch. 3; re-apply pattern to new AI features)
- [ ] 👍/👎 "Was this helpful?" on AI outputs → XF2-05 (apply to the intake chat now)
- [ ] Learning engine from user actions → not-local
- [ ] Multi-agent architecture → not-local
- [ ] Score broken into categories (reverted with ch. 3)

---

## 3. Tickets

**XF2-03 (chat-based challenge intake) is SHIPPED** — see section 1. **XF2-13 (challenge
wizard) is SHIPPED 2026-07-15** — it absorbed XF2-03's chat into the wizard's Chat Dock
(`/challenges/new` now redirects to `/dashboard/challenges/new`).
Remaining tickets, in suggested order: XF2-05 → XF2-12 → XF2-08 → XF2-09 →
XF2-01 → XF2-02 → XF2-11 → XF2-04 → XF2-10 → XF2-06/07. All AI tickets should reuse `lib/gemini.ts` (`geminiJson`
with a response schema) and follow the intake route as the reference pattern.

### XF2-01 — Auth + corporate-email gate (ch. 1)
Auth.js (NextAuth v5), Credentials provider; `User`/`Session` models; reject free-mail
domains at signup with the spec's rationale; wire session into `app/app/nav-auth.tsx`.
After this, `createChallenge` should attach the user's org instead of "Demo Organization".

### XF2-02 — Persist AI-flow state in Postgres
Originally: move the (now reverted) evaluation panel's localStorage into an `Evaluation`
model. Still relevant later for any per-user state (intake drafts, feedback thumbs).
Model sketch: `Evaluation { challengeId, solutionId, relevance Int, novelty Int,
surprise Int, status Enum(SHORTLIST|MATCH|PASSED), passReasons String[], userId?,
@@unique([challengeId, solutionId, userId]) }`.

### XF2-04 — Track-changes AI editing (ch. 2)
In the intake review form: "Improve with AI" → Gemini rewrites a field, render
word-level diff (`diff` npm package, `diffWords`) with adds green / deletes
strikethrough, Accept/Reject per hunk, undo stack in component state.

### XF2-05 — 👍/👎 feedback on AI output (appendix; smallest ticket)
"Was this helpful? 👍 👎" under each AI question and under the drafted form in
`intake-chat.tsx`; store in localStorage until XF2-02.

### XF2-06 — Connect flow (ch. 3, premium + human-in-the-loop)
Needs the ch. 3 panel restored first. Modal with drafted intro message, "Premium"
badge, human-in-the-loop notice; routes to the mailbox stub.

### XF2-07 — "Strategic Expert Discovery" upsell (ch. 3)
Needs the ch. 3 panel restored first. Static gradient card pitching the paid
deep-research service + "Schedule a call" → fake confirmation.

### XF2-08 — Competitors vs Customers for solutions (ch. 5–6)
On `/solutions/[slug]`: "Potential Customers" (challenges this solution could solve) and
"Competitors Radar" (similar solutions), max 4 each, now scored/explained by **Gemini**
(one `geminiJson` call per solution page, cached in the DB — see XF2-10 — because
per-request LLM calls on a static page are wasteful). Two visually unmistakable sections.

### XF2-09 — Dashboard feed + AI alerts (ch. 7 + ch. 13 notifications)
`getDashboardFeed()` in `lib/data.ts`: newest challenges/solutions + alert lines
("3 new solutions were found for your challenge") — can be Gemini-generated once XF2-10
stores match results. Fake visitor-analytics widget with a "demo data" caption.

### XF2-10 — Match store + rescan-on-new-data (ch. 9)
`Match { challengeId, solutionId, score, subScores Json, reasons String[], computedAt,
@@unique([challengeId, solutionId]) }` + `npm run rescan` script that asks Gemini to
score challenge↔solution pairs and upserts. This gives ch. 3/5/6/9 features a real-AI
backend without per-pageview LLM calls. Mind the pair count (151×13) — batch prompts,
or score only top keyword-overlap candidates.

### XF2-11 — Privacy levels (ch. 12–13)
`privacy` enums on Challenge/Solution (`@default(PUBLIC)`), list queries filter PUBLIC,
ANONYMOUS masks company on the detail page + "Request NDA" button; a couple of seed rows
flipped for the demo. Restart dev after `db:push`.

### XF2-12 — Submit a solution via URL/PDF (ch. 4) — **newly feasible**
`/solutions/new`: paste a website URL (server fetches the page, strips HTML) or upload a
PDF (extract text; Gemini's REST API also accepts inline PDF bytes via `inline_data`).
One `geminiJson` call extracts company profile, description, technologies, industries,
keywords, USP into the existing solution fields; review form (reuse the intake form
pattern); `createSolution` write path mirroring `createChallenge`.

### XF2-13 — Challenge Wizard: 5-step create flow + Chat Dock (ch. 2, evolves XF2-03) — **SHIPPED 2026-07-15, see ADR-006**
**Checklist (all ticked): [`docs/xf2-13-challenge-wizard-plan.md`](./xf2-13-challenge-wizard-plan.md)**
Rebuild challenge creation as the real site's wizard at `/dashboard/challenges/new`
(Splash → Basic Information → Objectives & Requirements → Incentives & Supporting Data →
AI Assistance → Review; live captures in the planning session's scratchpad, reference
screenshots of every step). `/challenges/new` becomes a redirect; the existing intake
chat is adapted into a sidebar **Chat Dock** below Tips, transcript persisted across
steps. State: Redux Toolkit `wizard` slice (step index, fields, per-step status, touched
set, chat transcript, tips cache), single route, localStorage rehydration ("Draft").
Chat replies carry `fieldUpdates` that auto-fill only untouched fields (Apply chip for
touched ones). Per-field ✨ improve buttons (name/description/keywords, objective,
incentives) render preview → Accept/Reject via one `/api/field-improve` route; step-4
"Help Me Write" mirrors the captured live UI — progress-bar generation, then Suggested
Objectives / Recommended Keywords / Suggested Expertise sections, each with its own
Accept + edit, unaccepted suggestions discarded on Next. AI Tips regenerate on step entry +
chat turns via `/api/wizard-tips`. Supporting Documents upload to local disk (max 10,
PDF/PPT/Word/XLS/JPG/PNG) with `File` rows linked on publish. Field limits per live
site: shortDescription 1300, objective 1200, incentives 650. Domain=Industry,
Category=SubIndustry (needs `getSubIndustries` + `subIndustryId`/files/status params on
`createChallenge`). All AI through `geminiJson` (ADR-003); publish per ADR-004.

---

## 4. Not demoable locally — and why

- **AI profile enrichment from email/LinkedIn (ch. 1):** needs LinkedIn OAuth / external
  enrichment data we don't have.
- **Business Opportunities Agent over external sources, learning engine, multi-agent
  architecture (ch. 6, appendix):** upstream product pipelines over web-scale sources;
  local variants over seeded data are possible but are covered by XF2-08/09/10.
- **External outreach automation (ch. 10):** sending real email is out of scope for a
  private demo clone.
- **GDPR / ISO 27001 / SOC 2 (ch. 11):** compliance programs, not features.
- **Manual-approval admin mode (ch. 1):** needs an admin role/surface; revisit after XF2-01.
