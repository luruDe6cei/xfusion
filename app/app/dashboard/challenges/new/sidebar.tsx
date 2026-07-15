'use client';

import { useEffect } from 'react';
import { useWizardDispatch, useWizardSelector } from './store';
import { setTips } from './wizard-slice';
import { STATIC_TIPS, type TipsResponse } from '@/lib/wizard-shared';
import { ChatDock } from './chat-dock';

export function WizardSidebar() {
  return (
    // Full column height: Tips hugs the top, the Chat Dock stretches over ALL
    // remaining space — no vertical gap, both columns end flush.
    <aside className="flex flex-col gap-[var(--spacing-16)] h-full">
      <TipsPanel />
      <div className="flex-1 min-h-0 flex flex-col">
        <ChatDock />
      </div>
    </aside>
  );
}

// Tiny stable hash of the context tips were generated from — regenerating is
// skipped while it hasn't changed (ADR-006: step entry + chat turns only).
function hashContext(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return String(h);
}

function TipsPanel() {
  const dispatch = useWizardDispatch();
  const { step, fields, chat, tips } = useWizardSelector((s) => s.wizard);

  const hasContext =
    chat.length > 0 ||
    Boolean(fields.name.trim() || fields.shortDescription.trim() || fields.objective.trim());
  // Context signature: the step + transcript length + the substance fields.
  // Typing alone changes it too, but the effect below only fires on step entry
  // and chat growth — field edits don't re-trigger it (deliberate, ADR-006).
  const hash = hashContext(
    JSON.stringify([step, chat.length, fields.name, fields.shortDescription, fields.objective, fields.keywords]),
  );

  const cached = tips[step];
  const fresh = cached?.hash === hash;

  useEffect(() => {
    if (!hasContext || fresh) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/wizard-tips', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            step,
            fields,
            transcript: chat.map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        const data = (await res.json()) as TipsResponse;
        if (!cancelled && res.ok && !data.error && data.tips?.length) {
          dispatch(setTips({ step, hash, tips: data.tips }));
        }
      } catch {
        // Static tips remain — AI tips are a bonus, never a blocker.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only step entry and chat growth re-trigger; field edits do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, chat.length]);

  const shown = cached?.tips ?? STATIC_TIPS[step] ?? [];
  const isAi = Boolean(cached);

  return (
    <div
      className="rounded-[var(--radius-12)] p-[var(--spacing-24)] flex flex-col gap-[var(--spacing-12)]"
      style={{ background: 'var(--gradient-warning-card)' }}
    >
      <h3 className="flex items-center gap-[var(--spacing-8)] text-[length:var(--font-size-18)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
        <span aria-hidden>💡</span> Tips
        {isAi && (
          <span
            className="ml-auto px-[var(--spacing-8)] py-[2px] rounded-[var(--radius-40)] text-[length:var(--font-size-12)] font-[var(--font-weight-regular)] text-[color:var(--color-grey-white)]"
            style={{ background: 'var(--gradient-primary)' }}
            title="Generated from your conversation and inputs"
          >
            AI
          </span>
        )}
      </h3>
      <ul className="flex flex-col gap-[var(--spacing-8)] list-disc pl-[var(--spacing-20)]">
        {shown.map((tip) => (
          <li
            key={tip}
            className="text-[length:var(--font-size-14)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)]"
          >
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
