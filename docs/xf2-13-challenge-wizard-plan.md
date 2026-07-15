# XF2-13 — Challenge Wizard: implementation checklist

**✅ SHIPPED 2026-07-15 — all items done, E2E-verified live** (chat autofill, touched-field
merge rule, ✨ accept, upload, Help Me Write, draft-restore on reload, publish).

Decisions behind this plan: **ADR-006** (codebase-memory). Glossary: `CONTEXT.md`.
Reference captures of the real wizard: session scratchpad `wizard-capture/` (step1–step5 PNG+HTML).
Ticket summary: `docs/xfusion-2.0-items.md` § XF2-13.

Field limits (observed on the live site): shortDescription **1300**, objective **1200**,
incentives **650**, name **90** (from the API data). Domain = `Industry`, Category = `SubIndustry`.

---

## Phase 1 — Store + wizard shell

- [x] `cd app && npm i @reduxjs/toolkit react-redux`
- [x] `app/app/dashboard/challenges/new/wizard-slice.ts` — RTK slice: `step`, per-step field
      values, per-step status (`untouched | in-progress | complete`), `touched` field set,
      `chat` transcript, `tips` cache (keyed by context hash), splash-dismissed flag
- [x] `app/app/dashboard/challenges/new/store.ts` — store factory + localStorage persistence
      (throttled `subscribe` save, rehydrate on init; versioned key so schema changes don't
      crash old drafts)
- [x] `app/app/dashboard/challenges/new/page.tsx` — async Server Component: fetch
      industries + sub-industries via `lib/data.ts`, render client `<Wizard>`
- [x] `app/app/dashboard/challenges/new/wizard.tsx` — client root: `<Provider>` scoped to this
      route (NOT the root layout), splash screen ("Let's start", "Don't show me again" →
      localStorage), stepper with green checks from step status, Back / Next Step footer,
      Next disabled until the current step validates
- [x] Step components under `app/app/dashboard/challenges/new/steps/`:
  - [x] `basic-info.tsx` — name*, short description* (1300 + counter), Domain* + Category
        comboboxes, keyword chip input + "Add Keyword"
  - [x] `objectives.tsx` — objective* (1200 + counter), Required Expertise* (pick-from-list +
        custom input + "Add Expertise" chips), Required Deployment Time* select
  - [x] `incentives.tsx` — incentives* (650 + counter), Supporting Documents dropzone (UI only
        in this phase)
  - [x] `ai-assistance.tsx` — step 4 placeholder ("Help Me Write" wired in Phase 3)
  - [x] `review.tsx` — per-section cards with edit-pencil (dispatch jump to step), live
        challenge-card preview, "Save as a Draft" (confirms local save) + "Publish"
- [x] Sidebar shell: Tips panel (static per-step content for now) + Chat Dock slot below —
      no Example panel
- [x] Verify: walk 1→5 and back; every step keeps values + status; refresh restores everything

## Phase 2 — Chat Dock (copilot contract)

- [x] Evolve `app/app/api/challenge-intake/route.ts` request to
      `{ messages, fields, touched: string[], step }`; response to
      `{ reply, fieldUpdates?: Partial<ChallengeFields> }` (drop one-shot `done`);
      keep MAX_TURNS / MAX_TOTAL_CHARS guardrails
- [x] Rewrite system prompt: same Socratic opening question, but fill fields incrementally
      as info arrives; never propose values for `touched` fields unless asked; aware of every
      field's char limit; industry list constraint stays verbatim
- [x] `app/app/dashboard/challenges/new/chat-dock.tsx` — adapt `intake-chat.tsx`: transcript
      from Redux (survives step changes + refresh), auto-scroll, busy/error states
- [x] Merge rule in the slice: `fieldUpdates` auto-apply to untouched fields (brief highlight
      animation); for touched fields render an "Apply" chip in the chat reply
- [x] Verify: chat fills step-1 fields live; hand-edit a field, confirm chat proposes an Apply
      chip for it and never overwrites; transcript intact after Back/Next and refresh

## Phase 3 — ✨ Improve buttons + Help Me Write

- [x] `app/app/api/field-improve/route.ts` — one route: `{ fields, transcript, target }` where
      `target` = one field key or `'assist'` (step 4: returns `{ objective, keywords,
      requiredExpertise }`); per-field scoped prompts via `geminiJson` (keywords mode =
      suggest additional keywords from the description); enforce limits server-side like
      the intake route
- [x] `improve-preview.tsx` — shared before/after panel with Accept / Reject
- [x] ✨ buttons on: name, short description, keywords (step 1); objective (step 2);
      incentives (step 3) — disabled while the field is empty
- [x] Step 4 "Help Me Write" — mirror the captured real UI (`step4-generating.png`,
      `step4-results-settled.png`):
  - [x] generating state: progress bar with % over the gradient hero
  - [x] results: three suggestion sections — **Suggested Objectives**, **Recommended
        Keywords** (~10 chips), **Suggested Expertise** (bullet list) — each with its own
        Accept button + edit pencil; Accept merges into the slice and marks the field
        touched; Accept disables when the suggestion already equals the current value
  - [x] unaccepted suggestions are discarded on "Next Step" (verified on the live site);
        the step tip swaps to "Accept or edit AI suggestions… click 'Next' to continue"
        once results are shown
- [x] Verify: accept updates the field + marks it touched; ignore/Next leaves it untouched

## Phase 4 — AI Tips

- [x] `app/app/api/wizard-tips/route.ts` — `{ step, fields, transcript }` → 2–3 short tips
      via `geminiJson`
- [x] Trigger on step entry + after each chat reply; skip the call when the step's context
      hash is unchanged; cache in the slice
- [x] Static per-step fallback tips (copy from the live captures) shown until/instead of AI
      tips — never a loading hole
- [x] Verify: tips visibly change after a meaningful chat exchange; no call spam while typing

## Phase 5 — Upload + publish + cutover

- [x] `app/app/api/upload/route.ts` — multipart POST → `app/public/uploads/`; whitelist
      PDF/PPT/Word/XLS/JPG/PNG, size cap, max 10 per challenge; returns stored file metadata
- [x] Wire the step-3 dropzone: upload on drop, list with remove, file list in Redux
- [x] `lib/data.ts`: add `getSubIndustries`; extend `createChallenge` with `subIndustryId` +
      uploaded files (create `File` rows, connect via `ChallengeFiles`)
- [x] Adopt real limits in `intake-shared.ts` (1300/1200/650); map deployment labels
      ("No timeframe" ↔ `NO_TIMEFRAME`, …)
- [x] Publish → Server Action → `createChallenge` (Demo Organization per ADR-004) →
      `revalidatePath('/challenges')` → redirect `/challenges/[slug]`; verify attachments render
      on the detail page
- [x] Replace `app/app/challenges/new/page.tsx` with `redirect('/dashboard/challenges/new')`;
      move/retire `intake-chat.tsx` (absorbed by chat-dock); update the "Submit with AI" link
      on `/challenges`
- [x] Clear the localStorage draft after successful publish

## Phase 6 — Verify + docs

- [x] Stop dev server, `cd app && npm run build` (type-check + prerender) — green
- [x] `npm start` on :3007 — full end-to-end: splash → chat-fill → manual edit + Apply →
      ✨ accept → Help Me Write → upload → refresh mid-flow (draft restores) → publish →
      published page shows everything
- [x] Re-run `index_repository` (codebase-memory) — new routes + lib changes
- [x] Update `HANDOFF.md` (2.0 section) + tick XF2-13 items in `docs/xfusion-2.0-items.md`

---

**Known gap from the capture session:** only the post-publish UX remains uncaptured
(Publish / Save as a Draft were deliberately never clicked). "Help Me Write" WAS run live
(owner-authorized, 2026-07-15): it targets only the match-driving fields — objectives,
keywords, expertise — as three per-section Accept/edit cards behind a progress-bar
generating state; name/description/incentives are left to their own ✨ buttons.
