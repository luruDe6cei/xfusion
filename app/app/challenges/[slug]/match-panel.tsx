'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { SolutionMatch } from '@/lib/match';

/**
 * xFUSION 2.0 demo — spec chapter 3 ("After Publishing a Challenge"):
 *   · matched solutions with Match Score + "Why this Match" breakdown
 *   · 2–3-second evaluation (three sliders)
 *   · Yes → Short List → Approve for Match; No → reason checklist
 *
 * Evaluations persist per challenge in localStorage — there's no auth or
 * write path in the app yet (HANDOFF.md roadmap), and a demo doesn't need one.
 */

type Status = 'shortlist' | 'match' | 'passed';
interface Evaluation {
  sliders: [number, number, number];
  status?: Status;
  reasons?: string[];
}
type EvalMap = Record<string, Evaluation>;

const SLIDERS: Array<{ q: string; left: string; right: string }> = [
  { q: 'How relevant is the solution to your challenge?', left: 'Not relevant', right: 'Very relevant' },
  { q: 'How new was this solution to you?', left: 'Already knew it', right: 'Completely new' },
  { q: 'How surprising or innovative is the solution?', left: 'Expected', right: 'Brilliant' },
];

const PASS_REASONS = [
  'Not relevant to our need',
  'A solution we already knew about',
  'Not innovative enough',
  'Not mature enough for implementation',
  'Not a fit for our organization',
];

const SUB_LABELS: Array<[keyof SolutionMatch['subScores'], string]> = [
  ['relevance', 'Matching'],
  ['novelty', 'Novelty'],
  ['businessPotential', 'Business Potential'],
  ['crossIndustry', 'Cross-Industry'],
];

export function MatchPanel({ challengeSlug, matches }: { challengeSlug: string; matches: SolutionMatch[] }) {
  const storageKey = `xf2-eval-${challengeSlug}`;
  const [evals, setEvals] = useState<EvalMap>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEvals(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const update = (slug: string, patch: Partial<Evaluation>) => {
    setEvals((prev) => {
      const cur: Evaluation = prev[slug] ?? { sliders: [50, 50, 50] };
      const next = { ...prev, [slug]: { ...cur, ...patch } };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const shortlisted = matches.filter((m) => evals[m.slug]?.status === 'shortlist').length;
  const matched = matches.filter((m) => evals[m.slug]?.status === 'match').length;

  return (
    <section className="flex flex-col gap-[var(--spacing-24)] pb-[var(--spacing-40)]">
      <header className="flex flex-col gap-[var(--spacing-8)]">
        <div className="flex items-center gap-[var(--spacing-12)] flex-wrap">
          <h2 className="text-[length:var(--font-size-28)] font-[var(--font-weight-semibold)] leading-[var(--line-height-120)] text-[color:var(--color-grey-black)]">
            Matched Solutions
          </h2>
          <span
            className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)]"
            style={{ background: 'var(--gradient-ai)' }}
          >
            2.0 preview
          </span>
        </div>
        <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)] text-[color:var(--color-grey-5)]">
          The discovery engine scanned the solution bank and ranked the strongest matches for this
          challenge. Review each one, and build your Short List — approved solutions become Matches.
        </p>
        <p className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
          Reviewed {matches.filter((m) => evals[m.slug]?.status).length}/{matches.length} · Short List{' '}
          {shortlisted} · Match {matched}
        </p>
      </header>

      <div className="grid gap-[var(--spacing-16)]">
        {matches.map((m) => (
          <MatchCard key={m.slug} m={m} ev={evals[m.slug]} update={(p) => update(m.slug, p)} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ m, ev, update }: { m: SolutionMatch; ev?: Evaluation; update: (p: Partial<Evaluation>) => void }) {
  const [declining, setDeclining] = useState(false);
  const sliders = ev?.sliders ?? [50, 50, 50];
  const status = ev?.status;

  return (
    <div className="flex flex-col gap-[var(--spacing-16)] p-[var(--spacing-24)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]">
      {/* Header: identity + score */}
      <div className="flex items-start justify-between gap-[var(--spacing-16)] flex-wrap">
        <div className="flex items-center gap-[var(--spacing-12)] min-w-0">
          {m.companyLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.companyLogo} alt="" width={44} height={44} className="rounded-[var(--radius-4)] object-cover shrink-0" />
          )}
          <div className="min-w-0">
            <Link
              href={`/solutions/${m.slug}`}
              className="block text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] leading-[var(--line-height-130)] text-[color:var(--color-grey-black)] hover:text-[color:var(--color-primary)]"
            >
              {m.name}
            </Link>
            <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
              {m.companyName}
              {m.industryName ? ` · ${m.industryName}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-[var(--spacing-16)]">
          {status && <StatusChip status={status} />}
          <div className="flex flex-col items-center">
            <span
              className="text-[length:var(--font-size-28)] font-[var(--font-weight-bold)] leading-[var(--line-height-100)]"
              style={{ color: 'var(--color-primary)' }}
            >
              {m.score}%
            </span>
            <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">Match Score</span>
          </div>
        </div>
      </div>

      {m.shortDescription && (
        <p className="text-[length:var(--font-size-14)] leading-[var(--line-height-150)] text-[color:var(--color-grey-5)] clamp-2">
          {m.shortDescription}
        </p>
      )}

      {/* Score breakdown — "why 82 and not 67" */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--spacing-12)]">
        {SUB_LABELS.map(([key, label]) => (
          <div key={key} className="flex flex-col gap-[var(--spacing-4)]">
            <div className="flex justify-between text-[length:var(--font-size-14)]">
              <span className="text-[color:var(--color-grey-5)]">{label}</span>
              <span className="font-[var(--font-weight-medium)]">{m.subScores[key]}</span>
            </div>
            <div className="h-[6px] rounded-[var(--radius-40)] bg-[var(--color-grey-2)] overflow-hidden">
              <div
                className="h-full rounded-[var(--radius-40)]"
                style={{ width: `${m.subScores[key]}%`, background: 'var(--gradient-primary)' }}
              />
            </div>
          </div>
        ))}
      </div>

      <details className="group">
        <summary className="cursor-pointer w-fit text-[length:var(--font-size-14)] font-[var(--font-weight-medium)] text-[color:var(--color-primary)] list-none [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Why this Match? ▾</span>
          <span className="hidden group-open:inline">Why this Match? ▴</span>
        </summary>
        <ul className="mt-[var(--spacing-8)] flex flex-col gap-[var(--spacing-4)] pl-[var(--spacing-20)] list-disc text-[length:var(--font-size-14)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)]">
          {m.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>

      {/* Evaluation — hidden once decided */}
      {!status && !declining && (
        <div className="flex flex-col gap-[var(--spacing-16)] pt-[var(--spacing-16)] border-t border-solid border-[var(--color-grey-2)]">
          <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-medium)] text-[color:var(--color-grey-5)]">
            Quick evaluation (2–3 seconds)
          </span>
          {SLIDERS.map((s, i) => (
            <label key={s.q} className="flex flex-col gap-[var(--spacing-4)]">
              <span className="text-[length:var(--font-size-14)]">{s.q}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={sliders[i]}
                onChange={(e) => {
                  const next = [...sliders] as [number, number, number];
                  next[i] = Number(e.target.value);
                  update({ sliders: next });
                }}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span className="flex justify-between text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
                <span>{s.left}</span>
                <span>{s.right}</span>
              </span>
            </label>
          ))}
          <div className="flex items-center gap-[var(--spacing-12)] flex-wrap">
            <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-medium)]">
              Do you want to proceed with this solution?
            </span>
            <button
              onClick={() => update({ status: 'shortlist' })}
              className="h-[36px] px-[var(--spacing-20)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)] hover:opacity-90"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Yes → Short List
            </button>
            <button
              onClick={() => setDeclining(true)}
              className="h-[36px] px-[var(--spacing-20)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] border border-solid border-[var(--color-grey-3)] text-[color:var(--color-grey-black)] hover:bg-[var(--color-grey-1)]"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* "No" path — the reason checklist the spec asks for */}
      {!status && declining && (
        <PassReasons
          onConfirm={(reasons) => {
            update({ status: 'passed', reasons });
            setDeclining(false);
          }}
          onBack={() => setDeclining(false)}
        />
      )}

      {status === 'shortlist' && (
        <div className="flex items-center gap-[var(--spacing-12)] pt-[var(--spacing-12)] border-t border-solid border-[var(--color-grey-2)]">
          <button
            onClick={() => update({ status: 'match' })}
            className="h-[36px] px-[var(--spacing-20)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)] hover:opacity-90"
            style={{ background: 'var(--color-success, #1a9d5c)' }}
          >
            ✓ Approve for Match
          </button>
          <button onClick={() => update({ status: undefined })} className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] hover:underline">
            Undo
          </button>
        </div>
      )}

      {status === 'passed' && (
        <div className="flex items-center gap-[var(--spacing-12)] flex-wrap pt-[var(--spacing-12)] border-t border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
          <span>Passed{ev?.reasons?.length ? ` — ${ev.reasons.join('; ')}` : ''}</span>
          <button onClick={() => update({ status: undefined, reasons: [] })} className="text-[color:var(--color-primary)] hover:underline">
            Reconsider
          </button>
        </div>
      )}

      {status === 'match' && (
        <div className="flex items-center gap-[var(--spacing-12)] pt-[var(--spacing-12)] border-t border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-14)]">
          <span className="text-[color:var(--color-grey-5)]">
            Matched — next step: <strong className="text-[color:var(--color-grey-black)]">Connect</strong> with the solution owner.
          </span>
          <button onClick={() => update({ status: 'shortlist' })} className="text-[color:var(--color-grey-5)] hover:underline">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const styles: Record<Status, { label: string; bg: string; color: string }> = {
    shortlist: { label: 'Short List', bg: 'var(--color-violet-1)', color: 'var(--color-primary)' },
    match: { label: 'Match ✓', bg: 'var(--gradient-matched-card, var(--color-green-1))', color: 'var(--color-grey-black)' },
    passed: { label: 'Passed', bg: 'var(--color-grey-2)', color: 'var(--color-grey-5)' },
  };
  const s = styles[status];
  return (
    <span
      className="px-[var(--spacing-12)] py-[var(--spacing-6)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] font-[var(--font-weight-medium)]"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function PassReasons({ onConfirm, onBack }: { onConfirm: (reasons: string[]) => void; onBack: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [other, setOther] = useState('');

  const toggle = (r: string) =>
    setPicked((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  return (
    <div className="flex flex-col gap-[var(--spacing-12)] p-[var(--spacing-16)] rounded-[var(--radius-8)] bg-[var(--color-grey-1)]">
      <span className="text-[length:var(--font-size-14)] font-[var(--font-weight-medium)]">
        What is the main reason? (You can select more than one)
      </span>
      {PASS_REASONS.map((r) => (
        <label key={r} className="flex items-center gap-[var(--spacing-8)] text-[length:var(--font-size-14)] cursor-pointer">
          <input type="checkbox" checked={picked.includes(r)} onChange={() => toggle(r)} style={{ accentColor: 'var(--color-primary)' }} />
          {r}
        </label>
      ))}
      <label className="flex items-center gap-[var(--spacing-8)] text-[length:var(--font-size-14)]">
        Other:
        <input
          type="text"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          className="flex-1 h-[32px] px-[var(--spacing-8)] rounded-[var(--radius-4)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]"
        />
      </label>
      <div className="flex gap-[var(--spacing-12)]">
        <button
          onClick={() => onConfirm(other.trim() ? [...picked, other.trim()] : picked)}
          className="h-[32px] px-[var(--spacing-16)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)]"
          style={{ background: 'var(--color-grey-black)' }}
        >
          Confirm
        </button>
        <button onClick={onBack} className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] hover:underline">
          Back
        </button>
      </div>
    </div>
  );
}
