'use client';

import { useState } from 'react';
import { useWizardDispatch } from './store';
import { dismissSplash } from './wizard-slice';

export const SKIP_SPLASH_KEY = 'xfusion-wizard-skip-splash';

// The intro screen shown before step 1 (captured from the live wizard).
// Six feature cards; "Privacy" is upstream's "Coming soon" and stays that way.
const CARDS = [
  {
    title: 'Keep it concise',
    body: "Whenever you see the ✨ icon, that's where xFUSION AI helps you turn your problem into a clear, well-structured challenge.",
    bar: 'var(--color-orange-1)',
    tint: 'var(--gradient-warning-card)',
  },
  {
    title: 'Use strong keywords',
    body: 'Start with one relevant keyword — xFUSION AI will suggest more once your description is complete.',
    bar: 'var(--color-pink-1)',
    tint: 'var(--gradient-error-card)',
  },
  {
    title: 'Drafts',
    body: 'Your progress is saved on this device — leave and get back to your challenge whenever you want.',
    bar: 'var(--color-green-1)',
    tint: 'var(--gradient-success-card)',
  },
  {
    title: 'Edit',
    body: "You'll be able to edit your challenge at any point.",
    bar: 'var(--color-violet-6)',
    tint: 'var(--gradient-info-card)',
  },
  {
    title: 'Attachments',
    body: 'You can upload relevant documents to support your idea.',
    bar: 'var(--color-violet-4)',
    tint: 'var(--gradient-matched-card)',
  },
  {
    title: 'Privacy',
    body: 'You can publish your challenge as Public, Limited, or Private.',
    bar: 'var(--color-blue-1)',
    tint: 'var(--gradient-draft-card)',
    soon: true,
  },
] as const;

export function Splash() {
  const dispatch = useWizardDispatch();
  const [dontShow, setDontShow] = useState(false);

  const start = () => {
    if (dontShow) {
      try {
        localStorage.setItem(SKIP_SPLASH_KEY, '1');
      } catch {}
    }
    dispatch(dismissSplash());
  };

  return (
    <div className="py-[var(--spacing-48)] grid gap-[var(--spacing-40)] items-center lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="flex flex-col gap-[var(--spacing-24)]">
        <h1 className="text-[56px] font-[var(--font-weight-bold)] leading-[var(--line-height-120)]">
          <span className="text-[color:var(--color-grey-black)]">Create a</span>
          <br />
          <span className="text-[color:var(--color-orange-1)]">Challenge</span>
        </h1>
        <p className="text-[length:var(--font-size-16)] leading-[var(--line-height-150)] text-[color:var(--color-grey-black)] max-w-[440px]">
          Answer a few quick questions so we can understand your need and match you with the
          most relevant solutions. The more specific you are, the better the matches.
        </p>
        <button
          type="button"
          onClick={start}
          className="w-[280px] h-[52px] rounded-[var(--radius-40)] bg-[var(--color-grey-black)] hover:bg-[#333] text-[color:var(--color-grey-white)] text-[length:var(--font-size-16)] flex items-center justify-between px-[var(--spacing-24)]"
        >
          <span className="flex-1 text-center">Let&apos;s start</span>
          <span aria-hidden>›</span>
        </button>
        <label className="flex items-center gap-[var(--spacing-8)] text-[length:var(--font-size-14)] text-[color:var(--color-grey-5)] cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
          />
          Don&apos;t show me again
        </label>
      </div>

      <div className="grid gap-[var(--spacing-16)] sm:grid-cols-2">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="relative rounded-[var(--radius-8)] p-[var(--spacing-24)] flex flex-col gap-[var(--spacing-8)] min-h-[150px]"
            style={{ background: c.tint, borderLeft: `4px solid ${c.bar}` }}
          >
            {'soon' in c && c.soon && (
              <span className="absolute top-[12px] right-[12px] px-[var(--spacing-8)] py-[2px] rounded-[var(--radius-4)] text-[length:var(--font-size-12)] text-[color:var(--color-grey-white)] bg-[var(--color-blue-1)]">
                Coming soon
              </span>
            )}
            <h2 className="text-[length:var(--font-size-16)] font-[var(--font-weight-semibold)] text-[color:var(--color-grey-black)]">
              {c.title}
            </h2>
            <p className="text-[length:var(--font-size-14)] leading-[var(--line-height-150)] text-[color:var(--color-grey-5)]">
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
