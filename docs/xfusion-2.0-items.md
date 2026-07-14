# xFUSION 2.0 — requested items (distilled from the spec)

Source: `xfusion-2.0-specification-en.pdf` (gitignored; this distilled list is tracked).
Effort ratings are for demoing on the local clone, not for the real product.

## Item list by chapter

| # | Item | Chapter | Demo effort |
|---|------|---------|-------------|
| 1 | Registration via LinkedIn / corporate email only (block Gmail etc.); manual-vs-auto approval mode per domain | 1.1 | Medium — needs auth first |
| 2 | AI auto-builds profile from corporate email + LinkedIn; user only confirms | 1.2 | High — external data |
| 3 | Chat UI replaces the challenge form; AI asks 3–4 Socratic questions, then fills all fields for confirmation | 2 | Medium — scripted chat is doable |
| 4 | Better field prompts: KPIs / incentives / success criteria as short, measurable, approvable bullets | 2 | Low (with LLM key) |
| 5 | Field character limit 1,500 + counter + AI-aware auto-shortening | 2 | Low |
| 6 | AI edits shown as Track Changes (adds green, deletes strikethrough) + undo/redo + version history | 2 | Medium |
| 7 | **After publishing: show 8 matched solutions with Match Score + "Why this Match" explanation** | 3 | **Low — ✅ demoed** |
| 8 | **Solution evaluation (3 sliders, 2–3s) → Yes = Short List / No = reason checklist → Approve for Match** | 3 | **Low — ✅ demoed** |
| 9 | Connect button / direct contact with solution owner (premium, human-in-the-loop before any email) | 3 | Low (UI only) |
| 10 | Premium "Strategic Expert Discovery" deep-research service (analyst call → presentation) | 3 | Low (UI only) |
| 11 | Submit solution via website URL / PDF / pitch deck — AI extracts all fields | 4 | High |
| 12 | After publishing a solution: show 4 competitors + 4 potential customers/partners, kept clearly separate ("Competitors Radar") | 5–6 | Low–medium |
| 13 | Business Opportunities Agent: collaborations, new markets, cross-industry connections ("I wouldn't have thought of this") | 6 | High |
| 14 | Dashboard: new matches/opportunities/partners/customers/challenges + AI alerts + visitor profile breakdown (job titles, industries) | 7 | Low–medium (static) |
| 15 | UX: bullets by default, short measurable KPIs, matches displayed prominently | 8 | Low |
| 16 | Internal discovery engine: semantic scan of the whole solution bank per challenge, ranked with explained scores, auto-rerun on new data | 9 | **Low as heuristic — ✅ demoed (deterministic stand-in)** |
| 17 | Automation to invite owners of externally-found solutions (after human approval) | 10 | High |
| 18 | GDPR compliance: consent, delete user/data, permissions, audit log, encryption; later ISO 27001 / SOC 2 | 11 | High |
| 19 | Challenge privacy levels: Public / Private (AI-only) / Anonymous (+ paid), plus NDA-gated "teaser" mode | 12 | Medium |
| 20 | Solution privacy levels: Public / Private (AI-matching only) | 13 | Medium |
| 21 | Continuous rescan on every new challenge/solution/company + proactive notifications ("3 new solutions were found…") | 13 | Medium (fake feed is low) |
| 22 | Prompt engineering pass: per-field purpose/style/length/tone/format, cross-industry instructions, allowed source lists per agent | AI appendix | N/A here |
| 23 | Explainability for every AI output ("Why did I suggest this?") | AI appendix | Low — pattern demoed in #7 |
| 24 | Feedback loop on AI answers (👍/👎 "Was this helpful?") | AI appendix | Low |
| 25 | Learning engine: learn from select/reject/connect/shortlist/match actions | AI appendix | High |
| 26 | Multi-agent architecture (challenge/solution/matching/opportunity/research/intel/discovery agents) | AI appendix | N/A here |
| 27 | Scoring broken into categories: Matching / Novelty / Business Potential / Cross-Industry (+ ease of implementation, time to value) | AI appendix | **Low — ✅ demoed** |

## What the demo implements (items 7, 8, 16-lite, 23, 27)

On every challenge detail page (`/challenges/[slug]`), a **"Matched Solutions — 2.0 preview"**
section now shows the top 8 solutions ranked by a deterministic heuristic
(`app/lib/match.ts`: keyword/expertise/industry overlap + stable hash), each with:

- overall Match Score + 4-way breakdown (Matching / Novelty / Business Potential / Cross-Industry)
- an expandable **"Why this Match?"** list citing the actual overlapping signals
- the spec's 3-slider quick evaluation, **Yes → Short List → ✓ Approve for Match**,
  **No →** the spec's exact reason checklist; state persists in `localStorage`

No schema change, no auth, no LLM calls — it demos the flow, not the algorithm.
