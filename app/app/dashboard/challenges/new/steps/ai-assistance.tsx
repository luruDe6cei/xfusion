'use client';

import { useEffect, useRef, useState } from 'react';
import { useWizardDispatch, useWizardSelector } from '../store';
import { assistAccept, assistDone, assistError, assistStart, goToStep } from '../wizard-slice';
import type { ImproveResponse } from '@/lib/wizard-shared';
import { StepHeading } from '../controls';
import { SparkleIcon } from '../improve';

// Step 4 — "Help Me Write" (ADR-006, mirrors the live capture): a progress-bar
// generating state, then three suggestion sections — Suggested Objectives,
// Recommended Keywords, Suggested Expertise — each with its own Accept.
// Unaccepted suggestions are simply ignored when the user moves on.

export function AiAssistanceStep() {
  const dispatch = useWizardDispatch();
  const { fields, chat, assist } = useWizardSelector((s) => s.wizard);

  const run = async () => {
    if (assist.status === 'loading') return;
    dispatch(assistStart());
    try {
      const res = await fetch('/api/field-improve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fields,
          transcript: chat.map((m) => ({ role: m.role, text: m.text })),
          target: 'assist',
        }),
      });
      const data = (await res.json()) as ImproveResponse;
      if (!res.ok || data.error || !data.suggestions) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      dispatch(assistDone(data.suggestions));
    } catch (e) {
      dispatch(assistError(e instanceof Error ? e.message : 'Generation failed'));
    }
  };

  const s = assist.suggestions;
  const keywordsNew = s ? s.keywords.filter((k) => !fields.keywords.includes(k)) : [];
  const expertiseNew = s ? s.requiredExpertise.filter((e) => !fields.requiredExpertise.includes(e)) : [];

  return (
    <div className="flex flex-col gap-[var(--spacing-24)]">
      <StepHeading num={4} title="AI Assistance" optional />
      <p className="text-[length:var(--font-size-15)] text-[color:var(--color-grey-black)]">
        Based on your challenge description and the conversation so far, our AI can help
        optimize your challenge content.
      </p>

      {assist.status === 'idle' || assist.status === 'error' ? (
        <div
          className="flex flex-col items-center justify-center gap-[var(--spacing-16)] rounded-[var(--radius-12)] p-[var(--spacing-48)] min-h-[320px] text-center"
          style={{ background: 'var(--gradient-ai)' }}
        >
          <span className="scale-[2]">
            <SparkleIcon />
          </span>
          <p className="text-[length:var(--font-size-15)] text-[color:var(--color-grey-black)]">
            Click to generate suggestions based on your previous inputs
          </p>
          {assist.status === 'error' && (
            <p className="text-[length:var(--font-size-14)] text-[color:var(--color-error)]">{assist.error}</p>
          )}
          <button
            type="button"
            onClick={run}
            className="h-[48px] px-[var(--spacing-40)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] hover:bg-[#333] text-[color:var(--color-grey-white)] text-[length:var(--font-size-16)]"
          >
            {assist.status === 'error' ? 'Try again' : 'Help Me Write'}
          </button>
        </div>
      ) : assist.status === 'loading' ? (
        <GeneratingPanel />
      ) : s ? (
        <div className="flex flex-col gap-[var(--spacing-16)]">
          <SuggestionCard
            icon="🎯"
            title="Suggested Objectives"
            accepted={assist.accepted.objective}
            acceptDisabled={s.objective.trim() === fields.objective.trim()}
            onAccept={() => dispatch(assistAccept('objective'))}
            onEdit={() => dispatch(goToStep(2))}
          >
            <p className="text-[length:var(--font-size-15)] leading-[var(--line-height-150)] whitespace-pre-wrap text-[color:var(--color-grey-black)]">
              {s.objective}
            </p>
          </SuggestionCard>

          <SuggestionCard
            icon="🔍"
            title="Recommended Keywords"
            accepted={assist.accepted.keywords}
            acceptDisabled={keywordsNew.length === 0}
            onAccept={() => dispatch(assistAccept('keywords'))}
            onEdit={() => dispatch(goToStep(1))}
          >
            <div className="flex flex-wrap gap-[var(--spacing-8)]">
              {s.keywords.map((k) => (
                <span
                  key={k}
                  className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-4)] bg-[var(--color-grey-white)] border border-solid border-[var(--color-grey-2)] text-[length:var(--font-size-14)]"
                >
                  {k}
                </span>
              ))}
            </div>
          </SuggestionCard>

          <SuggestionCard
            icon="⭐"
            title="Suggested Expertise"
            accepted={assist.accepted.requiredExpertise}
            acceptDisabled={expertiseNew.length === 0}
            onAccept={() => dispatch(assistAccept('requiredExpertise'))}
            onEdit={() => dispatch(goToStep(2))}
          >
            <ul className="grid sm:grid-cols-2 gap-x-[var(--spacing-24)] gap-y-[var(--spacing-8)] list-disc pl-[var(--spacing-20)]">
              {s.requiredExpertise.map((e) => (
                <li key={e} className="text-[length:var(--font-size-15)] text-[color:var(--color-grey-black)]">
                  {e}
                </li>
              ))}
            </ul>
          </SuggestionCard>

          <button
            type="button"
            onClick={run}
            className="self-start text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] hover:underline"
          >
            ↻ Regenerate suggestions
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Purely cosmetic progress: eases toward 90% while the request runs.
function GeneratingPanel() {
  const [pct, setPct] = useState(4);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    ref.current = setInterval(() => {
      setPct((p) => Math.min(92, p + Math.max(1, Math.round((92 - p) / 12))));
    }, 350);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, []);
  return (
    <div
      className="flex flex-col items-center justify-center gap-[var(--spacing-20)] rounded-[var(--radius-12)] p-[var(--spacing-48)] min-h-[320px]"
      style={{ background: 'var(--gradient-ai)' }}
    >
      <span className="scale-[2]">
        <SparkleIcon />
      </span>
      <div className="flex items-center gap-[var(--spacing-16)] w-full max-w-[320px]">
        <div className="flex-1 h-[6px] rounded-[var(--radius-40)] bg-[var(--color-grey-white)] overflow-hidden">
          <div
            className="h-full rounded-[var(--radius-40)] transition-[width] duration-300"
            style={{ width: `${pct}%`, background: 'var(--color-violet-7)' }}
          />
        </div>
        <span className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]">{pct}%</span>
      </div>
    </div>
  );
}

function SuggestionCard({
  icon,
  title,
  accepted,
  acceptDisabled,
  onAccept,
  onEdit,
  children,
}: {
  icon: string;
  title: string;
  accepted: boolean;
  acceptDisabled: boolean;
  onAccept: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-1)] p-[var(--spacing-24)] flex flex-col gap-[var(--spacing-16)]">
      <div className="flex items-center justify-between gap-[var(--spacing-12)] flex-wrap">
        <h3 className="text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
          <span aria-hidden className="mr-[var(--spacing-8)]">{icon}</span>
          {title}
        </h3>
        <div className="flex items-center gap-[var(--spacing-12)]">
          <button
            type="button"
            onClick={onAccept}
            disabled={accepted || acceptDisabled}
            className="h-[40px] px-[var(--spacing-24)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[color:var(--color-grey-white)] text-[length:var(--font-size-14)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#333]"
          >
            {accepted ? 'Accepted ✓' : 'Accept ✓'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title} on its step`}
            title="Edit on its step"
            className="flex items-center justify-center w-[36px] h-[36px] rounded-full border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)] hover:bg-[var(--color-grey-1)]"
          >
            ✎
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
