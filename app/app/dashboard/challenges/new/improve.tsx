'use client';

import { useState, type ReactNode } from 'react';
import { useWizardDispatch, useWizardSelector } from './store';
import { setField } from './wizard-slice';
import { DEPLOYMENT_OPTIONS, type AiFieldKey, type ImproveResponse } from '@/lib/wizard-shared';

// A labelled field with the ✨ Improve Button (ADR-006): sends the field's
// current text + wizard context to /api/field-improve and shows the result as
// a before/after preview the user Accepts or Rejects. Accepting marks the
// field touched (it's an explicit user action).

export function ImprovableField({
  target,
  label,
  required,
  counter,
  enabledWhen,
  children,
}: {
  target: AiFieldKey;
  label: string;
  required?: boolean;
  counter?: { len: number; max: number };
  // Override for the default "field must be non-empty" gate — suggestion-style
  // targets (expertise, deployment time) work off the surrounding context and
  // must be usable while the field itself is still empty.
  enabledWhen?: boolean;
  children: ReactNode;
}) {
  const dispatch = useWizardDispatch();
  const fields = useWizardSelector((s) => s.wizard.fields);
  const transcript = useWizardSelector((s) => s.wizard.chat);
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | string[] | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = fields[target];
  const empty =
    enabledWhen !== undefined
      ? !enabledWhen
      : Array.isArray(current)
        ? current.length === 0
        : !String(current).trim();

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/field-improve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fields,
          transcript: transcript.map((m) => ({ role: m.role, text: m.text })),
          target,
        }),
      });
      const data = (await res.json()) as ImproveResponse;
      if (!res.ok || data.error || data.improved === undefined) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setSuggestion(data.improved);
      setRationale(data.rationale ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const accept = () => {
    if (suggestion === null) return;
    // Keyword-style fields merge (dedup); text fields replace.
    if (Array.isArray(suggestion) && Array.isArray(current)) {
      const merged = [...current];
      for (const v of suggestion) if (!merged.includes(v)) merged.push(v);
      dispatch(setField({ key: target, value: merged }));
    } else if (typeof suggestion === 'string') {
      dispatch(setField({ key: target, value: suggestion }));
    }
    setSuggestion(null);
    setRationale(null);
  };

  // Enum values render by their human label (deployment time).
  const displayText =
    typeof suggestion === 'string' && target === 'requiredDeploymentTime'
      ? (DEPLOYMENT_OPTIONS.find((o) => o.value === suggestion)?.label ?? suggestion)
      : suggestion;

  return (
    <div className="flex flex-col gap-[var(--spacing-8)]">
      <div className="flex items-end justify-between gap-[var(--spacing-8)]">
        <label className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]">
          {label}
          {required && <span className="text-[color:var(--color-error)]">*</span>}
        </label>
        <div className="flex items-center gap-[var(--spacing-12)]">
          {counter && (
            <span
              className="text-[length:var(--font-size-13)]"
              style={{ color: counter.len > counter.max ? 'var(--color-error)' : 'var(--color-grey-5)' }}
            >
              {counter.len}/{counter.max}
            </span>
          )}
          <button
            type="button"
            onClick={run}
            disabled={busy || empty}
            title={empty ? 'Write something first — then let AI improve it' : 'Improve with AI'}
            aria-label={`Improve ${label} with AI`}
            className="flex items-center justify-center w-[32px] h-[32px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
            style={{ background: 'var(--gradient-ai)' }}
          >
            {busy ? <span className="animate-pulse text-[14px]">…</span> : <SparkleIcon />}
          </button>
        </div>
      </div>

      {children}

      {error && (
        <div
          className="rounded-[var(--radius-8)] p-[var(--spacing-16)] flex items-center justify-between gap-[var(--spacing-12)]"
          style={{ background: 'var(--gradient-error-card)' }}
        >
          <p className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)]">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {suggestion !== null && (
        <div
          className="rounded-[var(--radius-8)] p-[var(--spacing-16)] flex flex-col gap-[var(--spacing-12)]"
          style={{ background: 'var(--gradient-info-card)' }}
        >
          <span className="text-[length:var(--font-size-13)] font-[var(--font-weight-semibold)] text-[color:var(--color-violet-6)]">
            ✨ AI suggestion
          </span>
          {Array.isArray(displayText) ? (
            <div className="flex flex-wrap gap-[var(--spacing-8)]">
              {displayText.map((s) => (
                <span
                  key={s}
                  className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-4)] bg-[var(--color-grey-white)] text-[length:var(--font-size-14)]"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[length:var(--font-size-15)] leading-[var(--line-height-150)] whitespace-pre-wrap text-[color:var(--color-grey-black)] font-[var(--font-weight-medium)]">
              {displayText}
            </p>
          )}
          {rationale && (
            <p className="text-[length:var(--font-size-13)] leading-[var(--line-height-150)] text-[color:var(--color-grey-5)]">
              {rationale}
            </p>
          )}
          <div className="flex gap-[var(--spacing-12)]">
            <button
              type="button"
              onClick={accept}
              className="h-[36px] px-[var(--spacing-24)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[color:var(--color-grey-white)] text-[length:var(--font-size-14)] hover:bg-[#333]"
            >
              Accept ✓
            </button>
            <button
              type="button"
              onClick={() => {
                setSuggestion(null);
                setRationale(null);
              }}
              className="h-[36px] px-[var(--spacing-24)] rounded-[var(--radius-40)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-black)] hover:bg-[var(--color-grey-1)]"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"
        fill="var(--color-violet-6)"
      />
      <path d="M19 15l.9 2.4L22 18.3l-2.1.9L19 21.5l-.9-2.3-2.1-.9 2.1-.9L19 15z" fill="var(--color-pink-1)" />
    </svg>
  );
}
