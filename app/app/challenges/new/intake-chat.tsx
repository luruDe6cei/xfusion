'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { publishChallenge } from './actions';
import {
  DEPLOYMENT_OPTIONS,
  FIRST_QUESTION,
  LIMITS,
  type ChallengeFields,
  type IntakeResponse,
} from './intake-shared';

/**
 * xFUSION 2.0 (spec ch. 2) — "a conversation instead of forms".
 * Phase 1: Socratic chat (Gemini asks 3–4 guiding questions).
 * Phase 2: AI-drafted challenge form; the user only reviews, edits, confirms.
 */

interface Msg {
  role: 'user' | 'model';
  text: string;
}

export function IntakeChat({ industries }: { industries: string[] }) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'model', text: FIRST_QUESTION }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<ChallengeFields | null>(null);
  const [publishing, setPublishing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [msgs, busy, fields]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: 'user' as const, text }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/challenge-intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The hardcoded greeting is described in the server's system prompt;
        // Gemini turns must start with a user message, so it's not resent.
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = (await res.json()) as IntakeResponse;
      if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
      setMsgs((m) => [...m, { role: 'model', text: data.reply }]);
      if (data.done && data.fields) setFields(data.fields);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!fields || publishing) return;
    setPublishing(true);
    setError(null);
    try {
      const { slug } = await publishChallenge(fields);
      router.push(`/challenges/${slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publishing failed');
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-[var(--spacing-24)]">
      {/* Chat transcript */}
      <div className="flex flex-col gap-[var(--spacing-12)] p-[var(--spacing-24)] rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-12)] text-[length:var(--font-size-16)] leading-[var(--line-height-150)] whitespace-pre-wrap ${
              m.role === 'user'
                ? 'self-end bg-[var(--color-violet-3)] text-[color:var(--color-grey-black)]'
                : 'self-start bg-[var(--color-grey-1)] text-[color:var(--color-grey-black)]'
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="self-start px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-12)] bg-[var(--color-grey-1)] text-[color:var(--color-grey-5)]">
            Thinking…
          </div>
        )}
        {error && (
          <div className="self-stretch px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-8)] text-[length:var(--font-size-14)]"
            style={{ background: 'var(--gradient-error-card, var(--color-red-1))', color: 'var(--color-grey-black)' }}>
            {error}
          </div>
        )}
        <div ref={endRef} />

        {!fields && (
          <div className="flex gap-[var(--spacing-12)] pt-[var(--spacing-12)] border-t border-solid border-[var(--color-grey-2)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Write your answer… (Enter to send, Shift+Enter for a new line)"
              className="flex-1 px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] resize-none"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="self-end h-[44px] px-[var(--spacing-24)] rounded-[var(--radius-40)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-white)] disabled:opacity-50 hover:opacity-90"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* AI-drafted form — the user only reviews and confirms */}
      {fields && (
        <div className="flex flex-col gap-[var(--spacing-20)] p-[var(--spacing-24)] rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-3)] bg-[var(--color-grey-white)]">
          <div className="flex items-center justify-between flex-wrap gap-[var(--spacing-8)]">
            <h2 className="text-[length:var(--font-size-24)] font-[var(--font-weight-semibold)]">
              Review your challenge
            </h2>
            <span className="px-[var(--spacing-12)] py-[var(--spacing-4)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)]"
              style={{ background: 'var(--gradient-ai)' }}>
              drafted by AI — edit anything
            </span>
          </div>

          <Field
            label="Challenge title"
            value={fields.name}
            limit={LIMITS.name}
            onChange={(v) => setFields({ ...fields, name: v })}
          />
          <Field
            label="Challenge"
            value={fields.shortDescription}
            limit={LIMITS.shortDescription}
            rows={8}
            onChange={(v) => setFields({ ...fields, shortDescription: v })}
          />
          <Field
            label="Challenge Objectives (KPIs)"
            value={fields.objective}
            rows={5}
            onChange={(v) => setFields({ ...fields, objective: v })}
          />
          <Field
            label="Incentives"
            value={fields.rewardInformation}
            rows={3}
            onChange={(v) => setFields({ ...fields, rewardInformation: v })}
          />

          <div className="grid sm:grid-cols-2 gap-[var(--spacing-16)]">
            <label className="flex flex-col gap-[var(--spacing-4)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
              Industry
              <select
                value={fields.industry}
                onChange={(e) => setFields({ ...fields, industry: e.target.value })}
                className="h-[44px] px-[var(--spacing-12)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-black)] bg-[var(--color-grey-white)]"
              >
                {!industries.includes(fields.industry) && <option>{fields.industry}</option>}
                {industries.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-[var(--spacing-4)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
              Deployment timeline
              <select
                value={fields.requiredDeploymentTime}
                onChange={(e) => setFields({ ...fields, requiredDeploymentTime: e.target.value })}
                className="h-[44px] px-[var(--spacing-12)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-black)] bg-[var(--color-grey-white)] capitalize"
              >
                {DEPLOYMENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.replaceAll('_', ' ').toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Field
            label="Keywords (comma-separated)"
            value={fields.keywords.join(', ')}
            onChange={(v) => setFields({ ...fields, keywords: v.split(',').map((s) => s.trim()) })}
          />
          <Field
            label="Required expertise (comma-separated)"
            value={fields.requiredExpertise.join(', ')}
            onChange={(v) =>
              setFields({ ...fields, requiredExpertise: v.split(',').map((s) => s.trim()) })
            }
          />

          <div className="flex items-center gap-[var(--spacing-16)] pt-[var(--spacing-8)]">
            <button
              onClick={publish}
              disabled={publishing || !fields.name.trim()}
              className="h-[48px] px-[var(--spacing-32)] rounded-[var(--radius-40)] text-[length:var(--font-size-16)] text-[color:var(--color-grey-white)] disabled:opacity-50 hover:opacity-90"
              style={{ background: 'var(--gradient-primary)' }}
            >
              {publishing ? 'Publishing…' : 'Publish Challenge'}
            </button>
            <button
              onClick={() => setFields(null)}
              className="text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] hover:underline"
            >
              ← Back to the conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  limit,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  limit?: number;
  rows?: number;
}) {
  const over = limit !== undefined && value.length > limit;
  return (
    <label className="flex flex-col gap-[var(--spacing-4)]">
      <span className="flex justify-between text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
        {label}
        {limit !== undefined && (
          <span style={over ? { color: 'var(--color-error)' } : undefined}>
            {value.length}/{limit}
          </span>
        )}
      </span>
      {rows ? (
        <textarea
          value={value}
          maxLength={limit}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="px-[var(--spacing-16)] py-[var(--spacing-12)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)] leading-[var(--line-height-150)]"
        />
      ) : (
        <input
          value={value}
          maxLength={limit}
          onChange={(e) => onChange(e.target.value)}
          className="h-[44px] px-[var(--spacing-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-16)]"
        />
      )}
    </label>
  );
}
