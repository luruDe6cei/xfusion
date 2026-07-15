'use client';

import { useEffect, useRef, useState } from 'react';
import { useWizardDispatch, useWizardSelector } from './store';
import { applyPending, chatModelReply, chatUserMessage } from './wizard-slice';
import {
  FIRST_QUESTION,
  type AiFieldKey,
  type IntakeResponse,
} from '@/lib/wizard-shared';
import { SparkleIcon } from './improve';

// The Chat Dock (CONTEXT.md): the persistent conversational assistant in the
// wizard sidebar. Replies may carry fieldUpdates — untouched fields fill in
// automatically (reducer-side), touched fields surface here as "Apply" chips.

const FIELD_LABELS: Record<AiFieldKey, string> = {
  name: 'Challenge name',
  shortDescription: 'Short description',
  industry: 'Domain',
  category: 'Category',
  keywords: 'Keywords',
  objective: 'Objective',
  requiredExpertise: 'Required expertise',
  requiredDeploymentTime: 'Deployment time',
  rewardInformation: 'Incentives',
};

export function ChatDock() {
  const dispatch = useWizardDispatch();
  const { chat, fields, touched, step } = useWizardSelector((s) => s.wizard);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chat.length, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    dispatch(chatUserMessage(text));
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const messages = [...chat.map((m) => ({ role: m.role, text: m.text })), { role: 'user' as const, text }];
      const res = await fetch('/api/challenge-intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages, fields, touched, step }),
      });
      const data = (await res.json()) as IntakeResponse;
      if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
      dispatch(chatModelReply({ reply: data.reply, fieldUpdates: data.fieldUpdates }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] flex flex-col overflow-hidden">
      <div className="flex items-center gap-[var(--spacing-8)] px-[var(--spacing-16)] py-[var(--spacing-12)] border-b border-solid border-[var(--color-grey-2)]">
        <SparkleIcon />
        <h3 className="text-[length:var(--font-size-16)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
          AI Assistant
        </h3>
        <span className="ml-auto text-[length:var(--font-size-12)] text-[color:var(--color-grey-5)]">
          fills the form as you talk
        </span>
      </div>

      <div className="flex flex-col gap-[var(--spacing-8)] p-[var(--spacing-12)] max-h-[380px] overflow-y-auto">
        <Bubble role="model" text={FIRST_QUESTION} />
        {chat.map((m, i) => (
          <div key={i} className="flex flex-col gap-[var(--spacing-4)]">
            <Bubble role={m.role} text={m.text} />
            {m.pending && (
              <div className="self-start flex flex-wrap gap-[var(--spacing-4)] pl-[var(--spacing-8)]">
                {(Object.keys(m.pending) as AiFieldKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => dispatch(applyPending({ msgIndex: i, key }))}
                    title="You edited this field yourself — apply the AI's suggestion?"
                    className="px-[var(--spacing-8)] py-[2px] rounded-[var(--radius-40)] text-[length:var(--font-size-12)] text-[color:var(--color-violet-6)] border border-solid border-[var(--color-violet-3)] bg-[var(--color-violet-1)] hover:bg-[var(--color-violet-2)]"
                  >
                    Apply → {FIELD_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="self-start px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-12)] bg-[var(--color-grey-1)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)]">
            Thinking…
          </div>
        )}
        {error && (
          <div
            className="px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-8)] text-[length:var(--font-size-13)]"
            style={{ background: 'var(--gradient-error-card)', color: 'var(--color-grey-black)' }}
          >
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-[var(--spacing-8)] p-[var(--spacing-12)] border-t border-solid border-[var(--color-grey-2)]">
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
          placeholder="Describe your challenge… (Enter to send)"
          className="flex-1 px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-14)] resize-none outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy || !input.trim()}
          className="self-end h-[38px] px-[var(--spacing-16)] rounded-[var(--radius-40)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-white)] disabled:opacity-50 hover:opacity-90"
          style={{ background: 'var(--gradient-primary)' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: 'user' | 'model'; text: string }) {
  return (
    <div
      className={`max-w-[90%] px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-12)] text-[length:var(--font-size-14)] leading-[var(--line-height-150)] whitespace-pre-wrap ${
        role === 'user'
          ? 'self-end bg-[var(--color-violet-3)] text-[color:var(--color-grey-black)]'
          : 'self-start bg-[var(--color-grey-1)] text-[color:var(--color-grey-black)]'
      }`}
    >
      {text}
    </div>
  );
}
