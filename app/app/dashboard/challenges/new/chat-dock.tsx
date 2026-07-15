'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { useWizardDispatch, useWizardSelector, type RootState } from './store';
import { applyPending, chatModelReply, chatUserMessage, goToStep, isStepComplete } from './wizard-slice';
import {
  FIRST_QUESTION,
  type AiFieldKey,
  type IntakeResponse,
} from '@/lib/wizard-shared';
import { SparkleIcon } from './improve';

// The Chat Dock (CONTEXT.md): the persistent conversational assistant in the
// wizard sidebar. Replies may carry fieldUpdates — untouched fields fill in
// automatically (reducer-side), touched fields surface here as "Apply" chips.
// Compact by default; the expand button opens a large two-column workspace:
// wide transcript + a live "filled so far" data panel (intake answers are
// long-form, the 360px sidebar is too cramped for them).

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
const FIELD_ORDER = Object.keys(FIELD_LABELS) as AiFieldKey[];

export function ChatDock() {
  const [expanded, setExpanded] = useState(false);
  // User-dragged size of the expanded window (null = default). Survives
  // collapse/expand within the visit.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dispatch = useWizardDispatch();
  const store = useStore<RootState>();
  // ChatBody owns the request machinery; it registers its "ready" routine here.
  const readyRef = useRef<(() => Promise<boolean>) | null>(null);

  // The window is anchored bottom-right, so resizing happens from the
  // top-left corner: drag toward the top-left to grow, away to shrink.
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fromX = e.clientX;
    const fromY = e.clientY;
    const move = (ev: PointerEvent) => {
      setSize({
        w: Math.min(Math.max(rect.width + (fromX - ev.clientX), 420), window.innerWidth - 32),
        h: Math.min(Math.max(rect.height + (fromY - ev.clientY), 360), window.innerHeight - 32),
      });
    };
    const stop = () => window.removeEventListener('pointermove', move);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  };

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  // "Ready": have the AI draft everything still missing, then leave the chat
  // and land on the first step that needs attention (Review when complete).
  const onReady = async () => {
    const done = await readyRef.current?.();
    if (done === false) return; // a request is already running
    setExpanded(false);
    const s = store.getState().wizard;
    for (const n of [1, 2, 3]) {
      if (!isStepComplete(s, n)) {
        dispatch(goToStep(n));
        return;
      }
    }
    dispatch(goToStep(5));
  };

  if (!expanded) {
    return (
      <div className="rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] flex flex-col overflow-hidden">
        <DockHeader
          expanded={false}
          onToggle={() => setExpanded(true)}
          onReady={onReady}
          subtitle="fills the form as you talk"
        />
        <ChatBody
          compact
          onRequestExpand={() => setExpanded(true)}
          registerReady={(fn) => (readyRef.current = fn)}
        />
      </div>
    );
  }

  return (
    <>
      {/* keep the sidebar slot occupied so the layout doesn't jump */}
      <div className="rounded-[var(--radius-12)] border border-dashed border-[var(--color-grey-3)] bg-[var(--color-grey-1)] p-[var(--spacing-16)] text-[length:var(--font-size-13)] text-[color:var(--color-grey-5)]">
        AI Assistant is open in the large view.
      </div>
      <div
        className="fixed inset-0 z-40 bg-[var(--color-grey-black-40)]"
        onClick={() => setExpanded(false)}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="AI Assistant"
        className="fixed z-50 bottom-[16px] right-[16px] w-[min(1040px,calc(100vw-32px))] h-[min(720px,calc(100vh-32px))] rounded-[var(--radius-12)] border border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-white)] shadow-2xl flex flex-col overflow-hidden"
        style={size ? { width: size.w, height: size.h } : undefined}
      >
        <div
          onPointerDown={startResize}
          title="Drag to resize"
          aria-hidden
          className="absolute top-0 left-0 w-[22px] h-[22px] cursor-nwse-resize z-10"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" className="opacity-40">
            <path d="M3 9V3h6M3 3l6 6" stroke="var(--color-grey-5)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <DockHeader
          expanded
          onToggle={() => setExpanded(false)}
          onReady={onReady}
          subtitle="fills the form as you talk — everything it learns lands in the wizard"
        />
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
          <ChatBody compact={false} registerReady={(fn) => (readyRef.current = fn)} />
          <FilledSoFar />
        </div>
      </div>
    </>
  );
}

function DockHeader({
  expanded,
  onToggle,
  onReady,
  subtitle,
}: {
  expanded: boolean;
  onToggle: () => void;
  onReady: () => void;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-[var(--spacing-8)] px-[var(--spacing-16)] py-[var(--spacing-12)] border-b border-solid border-[var(--color-grey-2)] shrink-0">
      <SparkleIcon />
      <h3 className="text-[length:var(--font-size-16)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
        AI Assistant
      </h3>
      <span className="hidden sm:block text-[length:var(--font-size-12)] text-[color:var(--color-grey-5)] truncate">
        {subtitle}
      </span>
      {/* Ready lives only in the large view — the compact dock sits next to
          the wizard's own Next Step button, which covers "move on". */}
      {expanded && (
        <button
          type="button"
          onClick={onReady}
          title="Done chatting — the AI drafts anything still missing and takes you to the next incomplete step"
          className="ml-auto shrink-0 h-[32px] px-[var(--spacing-16)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[color:var(--color-grey-white)] text-[length:var(--font-size-13)] hover:bg-[#333]"
        >
          Ready ✓
        </button>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={expanded ? 'Collapse chat' : 'Expand chat'}
        title={expanded ? 'Collapse (Esc)' : 'Expand — more room to write'}
        className={`${expanded ? '' : 'ml-auto '}shrink-0 flex items-center justify-center w-[32px] h-[32px] rounded-full border border-solid border-[var(--color-grey-3)] hover:bg-[var(--color-grey-1)] text-[color:var(--color-grey-black)]`}
      >
        {expanded ? <CollapseIcon /> : <ExpandIcon />}
      </button>
    </div>
  );
}

// Transcript + input. Shared by both modes; `compact` tunes the sizing.
// A fresh conversation auto-opens the large view on focus — that's the moment
// the user is about to write long-form.
function ChatBody({
  compact,
  onRequestExpand,
  registerReady,
}: {
  compact: boolean;
  onRequestExpand?: () => void;
  registerReady?: (fn: () => Promise<boolean>) => void;
}) {
  const dispatch = useWizardDispatch();
  const { chat, fields, touched, step } = useWizardSelector((s) => s.wizard);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chat.length, busy]);

  // Multiline input: grow with the content (Enter = new line) up to a cap,
  // then scroll inside the box.
  const maxInputHeight = compact ? 160 : 240;
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxInputHeight)}px`;
  }, [input, maxInputHeight]);

  const post = async (messages: { role: 'user' | 'model'; text: string }[]) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/challenge-intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Belt-and-braces over the server's own Gemini timeout (default 120s):
        // the UI must never sit on "Thinking…" forever.
        signal: AbortSignal.timeout(150_000),
        body: JSON.stringify({ messages, fields, touched, step }),
      });
      const data = (await res.json()) as IntakeResponse;
      if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
      dispatch(chatModelReply({ reply: data.reply, fieldUpdates: data.fieldUpdates }));
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === 'TimeoutError'
          ? 'The AI took too long to answer — hit "Try again".'
          : e instanceof Error
            ? e.message
            : 'Something went wrong',
      );
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    dispatch(chatUserMessage(text));
    setInput('');
    post([...chat.map((m) => ({ role: m.role, text: m.text })), { role: 'user', text }]);
  };

  // Re-send the transcript as-is — the unanswered user turn is already in it.
  // Covers both a failed request and a page reload during "Thinking…".
  const retry = () => {
    if (busy || chat[chat.length - 1]?.role !== 'user') return;
    post(chat.map((m) => ({ role: m.role, text: m.text })));
  };
  const unanswered = !busy && !error && chat.length > 0 && chat[chat.length - 1].role === 'user';

  // "Ready" (header button): if anything is still empty and there's a
  // conversation to draft from, ask the AI for a best-effort fill of the rest;
  // resolves true when done (false = a request is already running).
  const ready = async (): Promise<boolean> => {
    if (busy) return false;
    // Name the empty fields explicitly — an open-ended "fill what's missing"
    // lets the model skip the awkward ones (deployment time, incentives).
    const emptyLabels = (Object.keys(FIELD_LABELS) as AiFieldKey[])
      .filter((k) => {
        const v = fields[k];
        return Array.isArray(v) ? v.length === 0 : !String(v).trim();
      })
      .map((k) => FIELD_LABELS[k]);
    if (emptyLabels.length > 0 && chat.length > 0) {
      const text =
        `I'm ready — please draft the remaining fields based on our conversation, best effort: ` +
        `${emptyLabels.join(', ')}. Don't leave any of them empty.`;
      dispatch(chatUserMessage(text));
      await post([...chat.map((m) => ({ role: m.role, text: m.text })), { role: 'user', text }]);
    }
    return true;
  };
  // Re-register every render so the routine always sees fresh state.
  useEffect(() => {
    registerReady?.(ready);
  });

  const bubbleText = compact
    ? 'text-[length:var(--font-size-14)]'
    : 'text-[length:var(--font-size-15)]';

  return (
    <div className="flex flex-col min-h-0 min-w-0">
      <div
        className={`flex flex-col gap-[var(--spacing-8)] p-[var(--spacing-12)] overflow-y-auto ${
          compact ? 'max-h-[420px]' : 'flex-1'
        }`}
      >
        <Bubble role="model" text={FIRST_QUESTION} className={bubbleText} compact={compact} />
        {chat.map((m, i) => (
          <div key={i} className="flex flex-col gap-[var(--spacing-4)]">
            <Bubble role={m.role} text={m.text} className={bubbleText} compact={compact} />
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
        {(error || unanswered) && (
          <div
            className="flex items-center justify-between gap-[var(--spacing-8)] px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-8)] text-[length:var(--font-size-13)]"
            style={{
              background: error ? 'var(--gradient-error-card)' : 'var(--gradient-warning-card)',
              color: 'var(--color-grey-black)',
            }}
          >
            <span>{error ?? "Your last message wasn't answered."}</span>
            <button
              type="button"
              onClick={retry}
              className="shrink-0 h-[28px] px-[var(--spacing-12)] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] text-[color:var(--color-grey-white)] text-[length:var(--font-size-12)] hover:bg-[#333]"
            >
              Try again
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-[var(--spacing-8)] p-[var(--spacing-12)] border-t border-solid border-[var(--color-grey-2)] shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          autoFocus={!compact}
          onFocus={() => {
            if (compact && chat.length === 0) onRequestExpand?.();
          }}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter makes a new line; ⌘/Ctrl+Enter sends.
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={compact ? 2 : 4}
          placeholder={
            compact
              ? 'Even a few words are enough — the AI will ask the rest. (⌘/Ctrl+Enter to send)'
              : 'Describe your challenge in your own words — even a few vague words are enough, the AI will interview you. Enter for a new line, ⌘/Ctrl+Enter to send.'
          }
          className="flex-1 px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-8)] border border-solid border-[var(--color-grey-3)] text-[length:var(--font-size-14)] leading-[var(--line-height-150)] resize-none outline-none focus:border-[var(--color-primary)] overflow-y-auto"
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

// Right column of the expanded view: what the conversation has produced so far.
function FilledSoFar() {
  const { fields, touched } = useWizardSelector((s) => s.wizard);
  return (
    <div className="hidden md:flex flex-col min-h-0 border-l border-solid border-[var(--color-grey-2)] bg-[var(--color-grey-1)]">
      <div className="px-[var(--spacing-16)] py-[var(--spacing-12)] border-b border-solid border-[var(--color-grey-2)] shrink-0">
        <h4 className="text-[length:var(--font-size-14)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
          Filled so far
        </h4>
        <p className="text-[length:var(--font-size-12)] text-[color:var(--color-grey-5)]">
          Live view of the wizard fields
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-[var(--spacing-12)] flex flex-col gap-[var(--spacing-8)]">
        {FIELD_ORDER.map((key) => {
          const value = fields[key];
          const text = Array.isArray(value) ? value.join(', ') : value;
          const isEmpty = !text.trim();
          const byUser = touched.includes(key);
          return (
            <div
              key={key}
              className="rounded-[var(--radius-8)] bg-[var(--color-grey-white)] border border-solid border-[var(--color-grey-2)] px-[var(--spacing-12)] py-[var(--spacing-8)]"
            >
              <div className="flex items-center justify-between gap-[var(--spacing-8)]">
                <span className="text-[length:var(--font-size-12)] text-[color:var(--color-grey-5)]">
                  {FIELD_LABELS[key]}
                </span>
                <span
                  className="px-[var(--spacing-8)] py-[1px] rounded-[var(--radius-40)] text-[length:var(--font-size-11)]"
                  style={
                    isEmpty
                      ? { background: 'var(--color-grey-2)', color: 'var(--color-grey-5)' }
                      : byUser
                        ? { background: 'var(--color-violet-1)', color: 'var(--color-violet-6)' }
                        : { background: 'var(--gradient-ai)', color: 'var(--color-grey-black)' }
                  }
                >
                  {isEmpty ? 'empty' : byUser ? 'edited by you' : 'AI filled'}
                </span>
              </div>
              {!isEmpty && (
                <p className="mt-[var(--spacing-4)] text-[length:var(--font-size-13)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)] line-clamp-3">
                  {text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bubble({
  role,
  text,
  className,
  compact,
}: {
  role: 'user' | 'model';
  text: string;
  className?: string;
  compact: boolean;
}) {
  return (
    <div
      className={`${compact ? 'max-w-[90%]' : 'max-w-[78%]'} px-[var(--spacing-12)] py-[var(--spacing-8)] rounded-[var(--radius-12)] leading-[var(--line-height-150)] whitespace-pre-wrap ${className ?? ''} ${
        role === 'user'
          ? 'self-end bg-[var(--color-violet-3)] text-[color:var(--color-grey-black)]'
          : 'self-start bg-[var(--color-grey-1)] text-[color:var(--color-grey-black)]'
      }`}
    >
      {text}
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 4v6H4M14 20v-6h6M4 4l7 7M20 20l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
